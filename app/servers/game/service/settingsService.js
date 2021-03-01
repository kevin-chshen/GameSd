/**
 * @description 设置
 * @author jzy
 * @date 2020/05/26
 */

// const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const bearcat = require('bearcat');
const code = require('@code');
const util = require('@util');
// const mongoSettings = require('@mongo/mongoSettings');

const SettingsService = function () {
    this.$id = 'game_SettingsService';
    this.app = null;
    this.feedBackTimes = {};
};

module.exports = SettingsService;
bearcat.extend('game_SettingsService', 'logic_BaseService');

SettingsService.prototype.addFeedBackLog = async function (uid, type, msg) {
    // const data = new mongoSettings();
    // data.update({
    //     uid:uid,
    //     type:type,
    //     message:msg,
    //     time:Date.now()
    // });
    const player = this.app.Player.getPlayerByUid(uid);
    if (!player) {
        return code.err.ERR_SETTINGS_FEEDBACK_ERR;
    }
    const nowTime = util.time.nowSecond();
    const lastTime = this.feedBackTimes[uid] || 0;
    if (nowTime - lastTime < 3600) {
        return code.err.ERR_SETTINGS_FEEDBACK_TIME_ERR;
    }
    this.app.Log.complaintLog(player, type, '', msg);
    this.feedBackTimes[uid] = nowTime;

    return code.err.SUCCEEDED;
};