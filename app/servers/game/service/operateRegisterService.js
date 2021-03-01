/**
 * @description 运营活动注册服务
 * @author chshen
 * @date 2020/05/28
 */

const bearcat = require('bearcat');
const code = require('@code');

const OperateRegisterService = function () {
    this.$id = 'game_OperateRegisterService';
    this.app = null;
};

module.exports = OperateRegisterService;
bearcat.extend('game_OperateRegisterService', 'logic_BaseService');

/**
 * 初始化
*/
OperateRegisterService.prototype.init = function() {
    // game服注册运营活动
    const operateTypes = code.activity.OPERATE_TYPE;
    for (const type of Object.values(operateTypes)) {
        const ids = this.app.Config.OperateBaseActivity.getIdsByType(type);
        if (ids && Array.isArray(ids)) {
            ids.map((id) => {
                this.app.Operate.initTimer(id);
            });
        }
    }
};