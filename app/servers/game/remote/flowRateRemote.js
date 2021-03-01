/**
 * @description game服流量威望相关的远程调用
 * @author chenyq
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

/**
 * 通知玩家流量为王排位变更
 * @param {Integer} uid 角色id
 * @param {Integer} data { rank:1, changeRank:1}
 * @param {Function} cb
 */
Remote.prototype.flowRateRank = async function (uid, data, cb) {
    const player = this.app.Player.getPlayerByUid(uid);
    if (!player) {
        cb(null);
        return;
    }
    const beforeRank = player.flowRateRank;
    player.flowRateRank = data.rank;
    if(beforeRank != data.rank){
        player.Event.emit(code.event.FLOW_RATE_RANK_CHANGE.name);
    }
    cb(null);
};
/**
 * 通知玩家流量为王挑战
 * @param {Integer} uid 角色id
 * @param {Integer} data { isWin:0|1, isSweep:0|1}
 * @param {Function} cb
 */
Remote.prototype.flowRateChallenge = async function (uid, data, cb) {
    const player = this.app.Player.getPlayerByUid(uid);
    if (!player) {
        cb(null);
        return;
    }
    player.Event.emit(code.event.FLOW_RATE_CHALLENGE.name, data.isWin==1?true:false);
    cb(null);
};