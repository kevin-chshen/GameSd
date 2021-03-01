/**
 * @description game服充值
 * @author chshen
 * @date 2020/05/13
 */
const logger = require('pomelo-logger').getLogger('pomelo', __filename);

module.exports = function (app) {
    return new Remote(app);
};

const Remote = function (app) {
    this.app = app;
};

/**
 * 付费
 * @param {Integer} uid 角色id
 * @param {String} orderId 订单ID
 * @param {String} amount 金额
 * @param {Object} payId 付费Id
 * @param {Object} payWay 付费途径
 * @param {Function} cb
 */
Remote.prototype.pay = async function (uid, orderId, amount, payId, payWay, serialId, cb) {
    logger.info(`Pay Remote pay orderId uid:${uid} orderId ${orderId}, amount ${amount}, payId :${payId}, payWay :${payWay}, serialId:${serialId}`);
    const player = this.app.Player.getPlayerByUid(uid);
    if (player) {
        if (serialId != 'gm') {
            // 通知累计充值金额
            logger.info(`Pay Remote notify onNotifyPlayerPaySucceed serialId orderId:${orderId}`);
            player.Notify.notify('onNotifyPlayerPaySucceed', {
                serialId: Number(serialId)
            });
        }
        const ok = await player.Pay.pay(orderId, amount, payId, payWay);
        cb(null, ok);
        return;
    } 
    cb(null, true);
};
