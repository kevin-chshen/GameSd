/**
 * @description 全局掉落服务
 * @author linjs
 * @date 2020/04/30
 */

const bearcat = require('bearcat');
const code = require('@code');

const DropService = function () {
    this.$id = 'global_DropService';
    this.app = null;
};

module.exports = DropService;
bearcat.extend('global_DropService', 'logic_BaseService');

/**
 * 服务初始化:设置计时器,重置服务器相关的掉落计数
 */
DropService.prototype.init = async function () {
    const timerIdVec = this.app.Config.DropSign.getTimerId(code.drop.SIGN_TYPE.SERVER);
    timerIdVec.map( (id) => {
        this.app.Timer.register(id, 0, true, ({timerId}) => {
            this.onTimer(timerId);
        });
    });
};

/**
 * 全局掉落:涉及到全局计数器的掉落
 * 统一由global服管理,dropInfo的结构如下
 * @param {Integer} id DropOne表id
 * @param {Integer} times 当前该id已经掉落多少次(有特殊掉落的条目需要)
 * @param {Integer} sex 玩家性别
 * @param {Object} sign 玩家相关的掉落下标
 * @param {Integer} payLv 玩家的付费等级
 * @param {Boolean} trace 是否显示掉落信息
 * 要返回的result必须包含以下字段:
 * @param {Integer} times 完成本次掉落之后,新的掉落次数数值
 * @param {Boolean} bModify 玩家的掉落下标数值是否发生了变动
 * @param {Array} item 掉落出来的物品列表 [{itemId, itemNum}]
 * @param {Object} newSign 修改后的掉落下标数值
 * @param {Array} traceInfo 掉落信息
 */
DropService.prototype.drop = function ({id, times, sex, sign, payLv, trace}) {
    // 获取配置
    const config = this.app.Config.DropOne.get(id);
    if (config == null) {
        return {
            times: times,
            bModify: false,
            item: [],
            sign: sign,
        };
    }
    // 获取全局下标对应的数值
    const serverSign = this.app.Config.DropOne.getRelatedServerSign(id);
    const signValue = this.app.Counter.DropSign.getCounterGroup(serverSign);
    const newSign = {...sign, ...signValue};
    // 获取掉落的结果
    const result = this.app.Helper.Drop.drop({id, times, sex, sign: newSign, payLv, trace});
    // 如果下标有发生变更,全局的下标要设置到本地的数据上
    if (result.bModify) {
        this.app.Counter.DropSign.setCounterGroup(newSign);
    }
    return result;
};

/**
 * 重置计数器的时间到了之后的处理
 */
DropService.prototype.onTimer = function (timerId) {
    const signIdVec = this.app.Config.DropSign.getTimerIdToSignId(code.drop.SIGN_TYPE.SERVER, timerId);
    if (signIdVec && signIdVec.length > 0) {
        this.app.Counter.DropSign.resetCounterGroup(signIdVec);
    }
};
