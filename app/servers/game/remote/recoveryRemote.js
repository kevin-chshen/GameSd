/**
 * @description game服恢复相关的远程调用
 * @author chenyq
 * @date 2020/06/01
 */

// const logger = require('pomelo-logger').getLogger('pomelo', __filename);
// const code = require('@code');

module.exports = function (app) {
    return new Remote(app);
};

const Remote = function (app) {
    this.app = app;
};
/**
 * 扣除恢复次数
 * @param {Number} id
 * @param {Number} num
 */
Remote.prototype.deductRecovery = async function (uid, id, num, cb) {
    const player = this.app.Player.getPlayerByUid(uid);
    if (!player) {
        cb(null);
        return;
    }
    /**
     * 判断恢复次数
     */
    if(!player.Recovery.judgeRecoveryNum(id, num)){
        cb(null, false);
        return;
    }
    player.Recovery.deductRecovery(id, num);
    cb(null, true);
};
/**
 * 增加恢复次数
 * @param {Number} id
 * @param {Number} num
 */
Remote.prototype.addRecovery = async function (uid, id, num, cb) {
    const player = this.app.Player.getPlayerByUid(uid);
    if (!player) {
        cb(null);
        return;
    }
    player.Recovery.addRecovery(id, num);
    cb(null);
};
/**
 * 获取恢复信息
 * @param {Number} id
 */
Remote.prototype.getRecoveryInfo = async function(uid, id, cb){
    const player = this.app.Player.getPlayerByUid(uid);
    if (!player) {
        cb(null);
        return;
    }
    const recoveryInfo = player.Recovery.getRecoveryInfo(id);
    cb(null, recoveryInfo);
};
/**
 * 获取恢复信息
 * @param {Number} id
 */
Remote.prototype.recoveryInfoNotify = async function(uid, id, cb){
    const player = this.app.Player.getPlayerByUid(uid);
    if (!player) {
        cb(null);
        return;
    }
    player.Recovery.sendRecoveryNotify(id);
    cb(null);
};

/**
 * 补满恢复次数
 * @param {Number} id
 */
Remote.prototype.recoveryFullUp = async function(uid, id, cb){
    const player = this.app.Player.getPlayerByUid(uid);
    if (!player) {
        cb(null);
        return;
    }
    player.Recovery.fullUpRecovery(id);
    cb(null);
};