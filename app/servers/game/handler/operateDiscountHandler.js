/**
 * @description 运营活动模块-特惠
 * @author chshen
 * @date 2020/05/25
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
 * 查询
*/
Handler.prototype.query = function (msg, session, next) {
    const player = session.player;
    const actId = msg.actId;
    const op = player.Operate.checkAndGet(actId, code.activity.OPERATE_TYPE.DAILY_DISCOUNT);
    if (!op) {
        next(null, { code: code.err.ERR_OPERATE_DISCOUNT_PAY_NOT_OPEN });
        return;
    }
    const data = op.getData();
    const fetchIds = [];
    for (const [id, count] of Object.entries(data.fetchIds)) {
        fetchIds.push({
            k: Number(id),
            v: Number(count),
        });
    }
    const payIds = [];
    for (const [id, count] of Object.entries(data.payIds)) {
        payIds.push({
            k: Number(id),
            v: Number(count),
        });
    }
    next(null, { code: code.err.SUCCEEDED, actId: actId, fetchIds: fetchIds, payIds: payIds, freeFetch: data.freeFetch?1:0 });
};



/**
 * 领取付费特惠充值奖励
*/
Handler.prototype.check = function (msg, session, next) {
    const player = session.player;
    const actId = msg.actId;
    const id = msg.id;

    const op = player.Operate.checkAndGet(actId, code.activity.OPERATE_TYPE.DAILY_DISCOUNT);
    if (!op) {
        next(null, { code: code.err.FAILED });
        return;
    }
    const cfg = this.app.Config.OperateEveryDayDiscount.get(id);
    if (op.payCount() >= cfg.DailyLimit) {
        logger.debug(`operateDiscountHandler check can not buy daily discount:${id}, player:${player.uid}`);
        next(null, { code: code.err.FAILED });
        return;
    }

    next(null, { code: code.err.SUCCEEDED, actId: actId, id:id});
};

/**
 * 领取付费特惠充值奖励
*/
Handler.prototype.fetchPay = function (msg, session, next) {
    const player = session.player;
    const actId = msg.actId;
    const id = msg.id;

    // 活动开启
    if (!this.app.Operate.actIdOnline(actId)) {
        logger.debug(`operateDiscountHandler fetchPay not open, player:${player.uid}`);
        next(null, { code: code.err.ERR_OPERATE_DISCOUNT_PAY_NOT_OPEN });
        return;
    }
    const operateCfg = this.app.Config.OperateBaseActivity.get(actId);
    if (!operateCfg || operateCfg.Type != code.activity.OPERATE_TYPE.DAILY_DISCOUNT) {
        logger.debug(`operateDiscountHandler fetchPay actId:${actId} not exist ,player:${player.uid}`);
        next(null, { code: code.err.ERR_CLIENT_PARAMS_WRONG });
        return;
    }
    const cfgId = id;
    const cfg = this.app.Config.OperateEveryDayDiscount.get(cfgId);
    if (!cfg || cfg.PayId == 0 || operateCfg.CallId != cfg.CallId) {
        logger.debug(`operateDiscountHandler fetchPay OperateEveryDayDiscount id:${cfgId} not exist ,player:${player.uid}`);
        next(null, { code: code.err.ERR_CLIENT_PARAMS_WRONG });
        return;
    }
    const op = player.Operate.get(actId);
    const payCount = op.payCount(cfg.PayId);
    if (payCount <= 0) {
        next(null, { code: code.err.ERR_OPERATE_DISCOUNT_NOT_PAY });
        return;
    }    
    if (payCount <= op.fetchCount(cfgId)) {
        logger.debug(`operateDiscountHandler fetchPay id:${cfgId} had fetch, player:${player.uid}`);
        next(null, { code: code.err.ERR_OPERATE_DISCOUNT_PAY_HAD_FETCH_PAY });
        return;
    }

    op.setFetchId(cfgId);
    const award = util.proto.encodeConfigAward(cfg.Reward);
    player.Item.addItem(award, code.reason.OP_OPERATE_DISCOUNT_PAY_GET);
    const count = op.fetchCount(cfgId);
    next(null, { code: code.err.SUCCEEDED, actId: actId, id: id, fetchCount: count, award: util.proto.encodeAward(award) });
};

/**
 * 领取免费特惠充值奖励
*/
Handler.prototype.fetchFree = function (msg, session, next) {
    const player = session.player;
    const actId = msg.actId;
    const id = msg.id;

    // 活动开启
    if (!this.app.Operate.actIdOnline(actId)) {
        logger.debug(`operateDiscountHandler fetchPay not open, player:${player.uid}`);
        next(null, { code: code.err.ERR_OPERATE_DISCOUNT_PAY_NOT_OPEN });
        return;
    }
    const operateCfg = this.app.Config.OperateBaseActivity.get(actId);
    if (!operateCfg || operateCfg.Type != code.activity.OPERATE_TYPE.DAILY_DISCOUNT) {
        logger.debug(`operateDiscountHandler fetchPay actId:${actId} not exist ,player:${player.uid}`);
        next(null, { code: code.err.ERR_CLIENT_PARAMS_WRONG });
        return;
    }
    const cfgId = id;
    const cfg = this.app.Config.OperateEveryDayDiscount.get(cfgId);
    if (!cfg || cfg.PayId != 0 || operateCfg.CallId != cfg.CallId) {
        logger.debug(`operateDiscountHandler fetchPay OperateEveryDayDiscount id:${cfgId} not exist ,player:${player.uid}`);
        next(null, { code: code.err.ERR_CLIENT_PARAMS_WRONG });
        return;
    }
    const op = player.Operate.get(actId);
    if (op.hadFreeFetch()) {
        logger.debug(`operateDiscountHandler fetchPay id:${cfgId} had fetch, player:${player.uid}`);
        next(null, { code: code.err.ERR_OPERATE_DISCOUNT_PAY_HAD_FETCH_FREE });
        return;
    }

    op.setFreeFetch();
    const award = util.proto.encodeConfigAward(cfg.Reward);
    player.Item.addItem(award, code.reason.OP_OPERATE_DISCOUNT_FREE_GET);
    next(null, { code: code.err.SUCCEEDED, actId: actId, id: id, award: util.proto.encodeAward(award) });
};