/**
 * @description 运营活动模块-0元礼包
 * @author chshen
 * @date 2020/05/30
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
 * 查询0元礼包
*/
Handler.prototype.queryInfo = function (msg, session, next) {
    const player = session.player;
    const data = player.OZGCom.getData();
    next(null, { actId: data.actId, startTs: util.time.ms2s(data.startTs), stopTs: util.time.ms2s(data.stopTs)});
};

/**
 * 查询0元礼包
*/
Handler.prototype.query = function (msg, session, next) {
    const player =  session.player;
    const actId = msg.actId;
    const operateCfg = this.app.Config.OperateBaseActivity.get(actId);
    if (!operateCfg || operateCfg.Type != code.activity.OPERATE_TYPE.ZERO_GIFT) {
        next(null, { code: code.err.ERR_OPERATE_DISCOUNT_PAY_NOT_OPEN });
        return;
    }
    const data = player.OZGCom.getData();
    next(null, { code: code.err.SUCCEEDED, 
        actId: actId,
        fetchIds: data.fetchIds,
        payId: data.payId,
        giftFetch: data.giftFetch?1:0,
        buyTime: util.time.ms2s(data.startMs),
        endTime: util.time.ms2s(data.stopMs),
    });
};

/**
 * 领取每日奖励
*/
Handler.prototype.fetchDaily = function (msg, session, next) {
    const player = session.player;
    const actId = msg.actId;
    const id = msg.id;

    // 活动开启
    if (!this.app.Operate.actIdOnline(actId)) {
        logger.debug(`operateZeroGiftHandler fetchDaily not open, player:${player.uid}`);
        next(null, { code: code.err.ERR_OPERATE_DISCOUNT_PAY_NOT_OPEN });
        return;
    }
    const operateCfg = this.app.Config.OperateBaseActivity.get(actId);
    if (!operateCfg || operateCfg.Type != code.activity.OPERATE_TYPE.ZERO_GIFT) {
        logger.debug(`operateZeroGiftHandler fetchDaily actId:${actId} not exist ,player:${player.uid}`);
        next(null, { code: code.err.ERR_CLIENT_PARAMS_WRONG });
        return;
    }
    const op = player.OZGCom;
    if (!op.hadPay()) {
        logger.debug(`operateZeroGiftHandler fetchDaily id:${actId} had fetch, player:${player.uid}`);
        next(null, { code: code.err.ERR_OPERATE_ZERO_GIFT_NOT_PAY });
        return;
    }
    const cfgId = this.app.Config.OperateMonthlyCard.getCardIdByPayId(op.getPayId());
    const cfg = this.app.Config.OperateMonthlyCard.get(cfgId);
    // 2 表示0元礼包
    if (!cfg || cfg.Type != 2) {
        logger.debug(`operateZeroGiftHandler fetchDaily OperateEveryDayDiscount id:${cfgId} not exist ,player:${player.uid}`);
        next(null, { code: code.err.ERR_CLIENT_PARAMS_WRONG });
        return;
    }
    if (op.hadFetch(id)) {
        logger.debug(`operateZeroGiftHandler fetchDaily can not fetch id:${cfgId} not exist ,player:${player.uid}`);
        next(null, { code: code.err.ERR_OPERATE_ZERO_GIFT_HAD_FETCH_DAILY });
        return;
    }
    if (!op.canFetch(id)) {
        logger.debug(`operateZeroGiftHandler fetchDaily can not fetch id:${cfgId} not exist ,player:${player.uid}`);
        next(null, { code: code.err.ERR_OPERATE_ZERO_GIFT_TODAY_NOT_FETCH });
        return;
    }

    op.setFetchId(id);
    const award = util.proto.encodeConfigAward(cfg.EveryDayReward);
    player.Item.addItem(award, code.reason.OP_OPERATE_ZERO_GIFT_DAILY_GET);
    next(null, { code: code.err.SUCCEEDED, actId: actId, id: id, award: util.proto.encodeAward(award)});
};

/**
 * 领取奖励
*/
Handler.prototype.fetchGift = function (msg, session, next) {
    const player = session.player;
    const actId = msg.actId;

    // 活动开启
    if (!this.app.Operate.actIdOnline(actId)) {
        logger.debug(`operateZeroGiftHandler fetchGift not open, player:${player.uid}`);
        next(null, { code: code.err.ERR_OPERATE_DISCOUNT_PAY_NOT_OPEN });
        return;
    }
    const operateCfg = this.app.Config.OperateBaseActivity.get(actId);
    if (!operateCfg || operateCfg.Type != code.activity.OPERATE_TYPE.ZERO_GIFT) {
        logger.debug(`operateZeroGiftHandler fetchGift actId:${actId} not exist ,player:${player.uid}`);
        next(null, { code: code.err.ERR_CLIENT_PARAMS_WRONG });
        return;
    }
    if (!player.OZGCom.hadPay()) {
        logger.debug(`operateZeroGiftHandler fetchGift id:${cfgId} had fetch, player:${player.uid}`);
        next(null, { code: code.err.ERR_OPERATE_ZERO_GIFT_NOT_PAY });
        return;
    }
    const cfgId = this.app.Config.OperateMonthlyCard.getCardIdByPayId(player.OZGCom.getPayId());
    const cfg = this.app.Config.OperateMonthlyCard.get(cfgId);
    // 2 表示0元礼包
    if (!cfg || cfg.Type != 2) {
        logger.debug(`operateZeroGiftHandler fetchGift OperateEveryDayDiscount id:${cfgId} not exist ,player:${player.uid}`);
        next(null, { code: code.err.ERR_CLIENT_PARAMS_WRONG });
        return;
    }
    if (player.OZGCom.hadGiftFetch()) {
        logger.debug(`operateZeroGiftHandler fetchGift gift fetched, player:${player.uid}`);
        next(null, { code: code.err.ERR_OPERATE_ZERO_GIFT_HAD_FETCH });
        return;
    }

    player.OZGCom.setGiftFetch();
    const award = util.proto.encodeConfigAward(cfg.Reward);
    player.Item.addItem(award, code.reason.OP_OPERATE_ZERO_GIFT_GET);
    next(null, { code: code.err.SUCCEEDED, actId: actId, award: util.proto.encodeAward(award) });
};