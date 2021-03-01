/**
 * @description 全服共用计数器服务
 * @author linjs
 * @date 2020/04/29
 */

const bearcat = require('bearcat');
const code = require('@code');

const CounterService = function () {
    this.$id = 'global_CounterService';
    this.app = null;
    this.serverDataObj = null;      // 完整的serverData数据
    this.counterDataObj = null;     // 计数器相关的数据
};

module.exports = CounterService;
bearcat.extend('global_CounterService', 'logic_BaseService');

/**
 * 服务初始化:开服加载初始化计数器
 */
CounterService.prototype.init = async function () {
    // 加载数据
    const mainServerId = this.app.SystemConfig.getServerId();
    this.serverDataObj = this.app.ServerDataCache.getCache(mainServerId);
    this.counterDataObj = this.serverDataObj.get('counter');
    // 全服掉落计数器
    this.initContainer(code.counter.DROP_SIGN.name, (id) => { return this.dropSignIdCheck(id); });
    this.initContainer(code.counter.INVEST_FUNDS.name, (id) => { return this.investPlanPeopleIdCheck(id); });
};

/**
 * 初始化容器
 */
CounterService.prototype.initContainer = function(name, idChecker) {
    // 先检查数据库里面有没有对应名称的字段
    let dataObj = this.counterDataObj[name];
    if (dataObj == null) {
        this.counterDataObj[name] = {};
        dataObj = this.counterDataObj[name];
        this.saveData();
    }
    const container = bearcat.getBean('logic_ServerCounterMap', this.app, name, dataObj, idChecker, () => { this.saveData(); });
    Object.defineProperty(this, name, { get: function () {
        return container;
    }});
};

/**
 * 保存所有计数器
 */
CounterService.prototype.saveData = function () {
    this.serverDataObj.update({counter: this.counterDataObj});
};

/**
 * 玩家掉落下标id有效性检查器(只关心有效的个人下标)
 */
CounterService.prototype.dropSignIdCheck = function (id) {
    const config = this.app.Config.DropSign.get(id);
    if (config && config.SignType == code.drop.SIGN_TYPE.SERVER) {
        return true;
    }
    return false;
};

/**
 * 投资计划
*/
CounterService.prototype.investPlanPeopleIdCheck = function (id) {
    return id == code.activity.TOTAL_INVEST_PLAN_PEOPLE_ID;
};
