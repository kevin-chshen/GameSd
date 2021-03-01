/**
 * @description 运营活动模块-幸运转盘
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
 * 查询幸运转盘数据
*/
Handler.prototype.query = function (msg, session, next) {
    const player = session.player;
    const actId = msg.actId;
    const op = player.Operate.checkAndGet(actId, code.activity.OPERATE_TYPE.TURNTABLE);
    if (!op) {
        next(null, { code: code.err.ERR_OPERATE_LUCKY_TURNTABLE_NOT_OPEN });
        return;
    }
    next(null, { code: code.err.SUCCEEDED, actId: actId, drawCount: op.drawsSize() });
};

/**
 * 抽奖
*/
Handler.prototype.draw = function (msg, session, next) {
    const player = session.player;
    const actId = msg.actId;

    // 活动开启
    if (!this.app.Operate.actIdOnline(actId)) {
        logger.debug(`operateHandler luckyDraw turntable activity not open, player:${player.uid}`);
        next(null, { code: code.err.ERR_OPERATE_LUCKY_TURNTABLE_NOT_OPEN });
        return;
    }
    const operate = player.Operate.get(actId);
    if (!operate) {
        logger.debug(`operateHandler luckyDraw turntable activity not open, player:${player.uid}`);
        next(null, { code: code.err.ERR_OPERATE_LUCKY_TURNTABLE_NOT_OPEN });
        return;
    }
    const operateBaseCfg = this.app.Config.OperateBaseActivity.get(actId);
    if (!operateBaseCfg || operateBaseCfg.Type != code.activity.OPERATE_TYPE.TURNTABLE) {
        logger.debug(`operateLuckyTurntableHandler luckyDraw turntable cfg not found:${actId}, player:${player.uid}`);
        next(null, { code: code.err.ERR_CLIENT_PARAMS_WRONG });
        return;
    }
    // 获取转盘档次配置
    const index = operate.drawsSize() + 1;
    const callId = operateBaseCfg.CallId;
    const cfg = this.app.Config.OperateLuckyTurntable.getCfg(callId, index);
    if (!cfg) {
        logger.debug(`operateLuckyTurntableHandler luckyDraw OperateLuckyTurntable not found,call:${callId} index:${index}, player:${player.uid}`);
        next(null, { code: code.err.FAILED });
        return;
    }
    // 消耗检测
    const cost = util.proto.encodeConfigAward(cfg.Cost);
    if (!player.Item.isEnough(cost)) {
        logger.debug(`operateLuckyTurntableHandler turntable diamond not enough:%j, player:${player.uid}`, cost);
        next(null, { code: code.err.ERR_OPERATE_LUCKY_TURNTABLE_COST_NOT_ENOUGH });
        return;
    }

    const res = this.app.Config.OperateLuckyTurntable.randomRewards(callId, index);
    // 扣钱
    player.Item.deleteItem(cost, code.reason.OP_OPERATE_LUCKY_TURNTABLE_COST);
    // 加钻石
    player.Currency.add(code.currency.CURRENCY_ID.DIAMOND, res.diamond, code.reason.OP_OPERATE_LUCKY_TURNTABLE_GET);
    operate.addDraw(cfg.Id);

    // 2倍及以上 或者 最后一档 才有跑马灯
    if (res.multi >= 200 || this.app.Config.OperateLuckyTurntable.getCfg(callId, index+1) == null) {
        // 跑马灯
        this.app.Chat.bannerSysTpltChat(301, [player.name, String(cost[0].itemNum), String(res.multi / 100), String(res.diamond)]);
    }

    next(null, { code: code.err.SUCCEEDED, id: actId, cost: util.proto.encodeAward(cost), addDiamond: res.diamond, multi: res.multi });
};