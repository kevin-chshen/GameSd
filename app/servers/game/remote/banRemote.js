/**
 * @description game服封禁
 * @author chshen
 * @date 2020/04/28
 */

// const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const code = require('@code');

module.exports = function (app) {
    return new Remote(app);
};

const Remote = function (app) {
    this.app = app;
};

// 禁言
Remote.prototype.banChat = async function(uid, timestamp, param, cb) {
    const player = this.app.Player.getPlayerByUid(uid);
    if (player) {
        player.Ban.banChat(timestamp, param.reason);
        player.Notify.notify('onSyncChatBanEndTime', {
            banChatEndTime: timestamp
        });
    } else {
        this.app.rpcs.global.offlineRemote.addOfflineBanChat({}, uid, param);
    }
    cb(null);
};


// 被踢下线，用于通知
Remote.prototype.kickByForbid = async function (uid, timestamp, cb) {
    const player = this.app.Player.getPlayerByUid(uid);
    if (player) {
        // 封禁
        player.Notify.notify('onSyncForbidEndTime', {
            forbidEndTime: timestamp
        });
    }
    cb(null);
};

// 后台发起踢人
Remote.prototype.kickByBackend = async function (uid, cb) {
    const player = this.app.Player.getPlayerByUid(uid);
    if (player) {
        // 封禁
        player.Notify.notify('onSyncKickUser', {});
    }
    cb(null);
};
