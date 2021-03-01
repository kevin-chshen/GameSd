/**
 * @description 运营活动注册服务
 * @author chshen
 * @date 2020/05/28
 */

const bearcat = require('bearcat');
const code = require('@code');

const ActivityRegisterService = function () {
    this.$id = 'game_ActivityRegisterService';
    this.app = null;
};

module.exports = ActivityRegisterService;
bearcat.extend('game_ActivityRegisterService', 'logic_BaseService');

/**
 * 初始化
*/
ActivityRegisterService.prototype.init = function() {
    // game服注册活动
    const ids = this.app.Config.ActivityTime.getIdsByType(code.activity.ACTIVITY_TYPE.SPECIAL_DELIVERY);
    ids.map((id) => {
        this.app.Activity.initTimer(id);
    });
};