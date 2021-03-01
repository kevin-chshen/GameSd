/**
 * @description 恢复消息模块
 * @author chenyq
 * @date 2020/05/07
 */
// const logger = require('pomelo-logger').getLogger('pomelo', __filename);

// let pomelo = require('pomelo');
const code = require('@code');

module.exports = function (app) {
    return new Handler(app);
};

const Handler = function (app) {
    this.app = app;
};
/**
 * 获取恢复信息
 */
Handler.prototype.recoveryGetInfo = function (msg, session, next) {
    const player = session.player;
    if (!player) { next(null); return; }
    const id = msg.id;
    const recoveryInfo = player.Recovery.getRecoveryInfo(id);
    next(null, { code: code.err.SUCCEEDED, recoveryInfo: recoveryInfo });
};