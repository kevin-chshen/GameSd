/**
 * @description game服商店
 * @author chshen
 * @date 2020/04/23
 */

const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const code = require('@code');
const util = require('@util');

module.exports = function (app) {
    return new Handler(app);
};

const Handler = function (app) {
    this.app = app;
};

/**
 * 领取特权礼包
*/
Handler.prototype.query = function (msg, session, next) {
    const player = session.player;
    const reply = { receivePrivilegeGifts: player.vipHadPrivilegeGifts, payIds: player.payIds };
    next(null, reply);
};

/**
 * 领取特权礼包
*/
Handler.prototype.receivePrivilegeGift = function (msg, session, next) {
    const player = session.player;
    const vipLv = msg.vipLv;

    if (vipLv == null) {
        logger.debug(`vipHandler receivePrivilegeGift vipLv param failed, player: ${player.uid}`);
        next(null, {code : code.err.ERR_CLIENT_PARAMS_WRONG });
        return;
    }

    if (player.vip < vipLv) {
        logger.debug(`vipHandler receivePrivilegeGift vipLv:${vipLv} not enough, player: ${player.uid}`);
        next(null, { code: code.err.FAILED });
        return;
    }

    // 奖励已领取
    const index = player.vipHadPrivilegeGifts.indexOf(vipLv);
    if (index > -1) {
        logger.debug(`vipHandler receivePrivilegeGift vipLv:${vipLv} reward already receive, player: ${player.uid}`);
        next(null, {code: code.err.FAILED });
        return;
    }
    const cfg = this.app.Config.Vip.get(vipLv);
    if (!cfg) {
        logger.debug(`vipHandler receivePrivilegeGift vipLv:${vipLv} cfg not found, player: ${player.uid}`);
        next(null, { code: code.err.FAILED });
        return;
    }

    player.vipHadPrivilegeGifts.push(vipLv);

    // 发放奖励
    const award = (player.sex == code.player.SexType.MALE) ? cfg.GiftBoy : cfg.GiftGirl;
    
    const reward = util.proto.encodeConfigAward(award);
    player.Item.addItem(reward, code.reason.OP_VIP_GIFT_GET, ()=>{
        next(null, { code: code.err.SUCCEEDED, vipLv: vipLv, award: util.proto.encodeAward(reward)});
    });
};