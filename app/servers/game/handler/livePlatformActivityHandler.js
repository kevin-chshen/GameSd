/**
 * @description 直播平台运营活动（活力全开）
 * @author chshen
 * @data 2020/04/23
 */
const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const code = require("@code");

module.exports = function (app) {
    return new Handler(app);
};

const Handler = function (app) {
    this.app = app;

    this.data = {};
};

/**
 * 活力全开（运营活动）
*/
Handler.prototype.operate = function(msg, session, next) {

    const player = session.player;

    // 火力是否足够
    const coin = player.Currency.get(code.currency.CURRENCY_ID.FIRE_POWER);
    const cost = this.app.Config.Global.get(code.live.GLOBAL_FIRE_POWER_NEED_COST).GlobalFloat;
    if (coin < cost) {
        logger.debug(`livePlatformActivityHandler operate cost not enough, own coin:${coin}, player:${player.uid}`);
        next(null, { code: code.err.ERR_LIVE_PLATFORM_ACTIVITY_COST_NOT_ENOUGH });
        return; 
    }

    // 计算评分
    let totalScore = 0;
    const scoreIds = [];
    const count = Math.floor(this.app.Config.Global.get(code.live.GLOBAL_FIRE_POWER_EXTRACT_COUNT).GlobalFloat);
    for (let index = 0; index < count; ++index) {
        const res = this.app.Config.FirePowerScore.extractId(player.vip);
        scoreIds.push(res.id);
        totalScore += res.score;
    }

    // 奖励系数
    const coefficient= Math.floor(this.app.Config.Global.get(code.live.GLOBAL_FIRE_POWER_REWARD_PARAM).GlobalFloat);
    const cfg = this.app.Config.FirePower.earn(totalScore, player.lv);
    if (!cfg) {
        logger.error(`livePlatformActivityHandler score:${totalScore}, not found cfg, player:${player.uid}`);
        next(null, {code: code.err.FAILED});
        return;
    }
    const earn = BigInt(Math.floor(coefficient * totalScore)) * BigInt(player.cashPerSecond);

    const key = this.app.Id.genNext(code.id.KEYS.LIVE_PLATFORM_OPERATE).toString();
    this.data[key] = { earn, cost };

    // 通知前端
    next(null, { code: code.err.SUCCEEDED, scoreIds: scoreIds, retId: cfg.Id, earn: String(earn), key: key });
};


/**
 * 活力全开（运营活动）
*/
Handler.prototype.operateAward = function (msg, session, next) {
    const player = session.player;
    const key = msg.key;
    const earn = this.data[key].earn;
    const cost = this.data[key].cost;
    logger.info(`live platform activity operateAward, cost:${cost} earn:${earn} player:${player.uid}`);

    // 火力是否足够
    const coin = player.Currency.get(code.currency.CURRENCY_ID.FIRE_POWER);
    if (coin < cost) {
        logger.debug(`livePlatformActivityHandler operate cost not enough, own coin:${coin}, player:${player.uid}`);
        next(null, { code: code.err.ERR_LIVE_PLATFORM_ACTIVITY_COST_NOT_ENOUGH });
        return;
    }

    // // 扣消耗
    player.Currency.delete(code.currency.CURRENCY_ID.FIRE_POWER, cost, code.reason.OP_FIRE_POWER_COST);

    // 获取收益
    player.Currency.add(code.currency.BIG_CURRENCY_ID.CASH, earn, 0);

    player.Event.emit(code.event.POWER_FULL_OPERATE.name);

    // 通知前端
    next(null, { code: code.err.SUCCEEDED });
};

