/**
 * @description 投资计划活动模块
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
Handler.prototype.query = async function(msg, session, next) {
    const player = session.player; 

    const ret = await this.app.rpcs.global.activityRemote.getNumBuyInvestFunds({});

    const buyInvest = player.ActInvestFunds.hasInvest()? 1: 0;

    const fetches = player.ActInvestFunds.getFetches();

    next(null, { count: ret.res, buyInvest: buyInvest, fetches: fetches});
};

/**
 * 购买投资计划
*/
Handler.prototype.buy = function (msg, session, next) {
    const player = session.player;
    const vip = this.app.Config.Global.get(code.activity.GLOBAL_INVEST_PLAN_VIP).GlobalFloat;
    if (vip > player.vip) {
        logger.debug(`actInvestFundsHandler buy vip:${player.vip} not enough, player:${player.uid}`);
        next(null, { code: code.err.ERR_ACT_INVEST_FUNDS_VIP_NOT_ENOUGH });
        return;
    }

    // 已购买
    if (player.ActInvestFunds.hasInvest()){
        logger.debug(`actInvestFundsHandler buy has buy, player:${player.uid}`);
        next(null, { code: code.err.ERR_ACT_INVEST_FUNDS_HAD_BUY });
        return;
    }

    const cost = this.app.Config.Global.get(code.activity.GLOBAL_INVEST_PLAN_COST).GlobalJson;
    const retCosts = util.proto.encodeConfigAward(cost);
    if (!player.Item.isEnough(retCosts)) {
        logger.debug(`actInvestFundsHandler buy cost:%j not enough, player:${player.uid}`, retCosts);
        next(null, { code: code.err.ERR_ACT_INVEST_FUNDS_COST_NOT_ENOUGH });
        return;
    }
    // 扣钱
    player.Item.deleteItem(retCosts, code.reason.OP_OPERATE_INVEST_BUY_COST);

    player.ActInvestFunds.setInvest();

    // 全民投资人数+1
    this.app.rpcs.global.activityRemote.addNumBuyInvestFunds({});

    next(null, { code: code.err.SUCCEEDED });
};

/**
 * 领取投资奖励
*/
Handler.prototype.fetch = async function (msg, session, next) {
    const player = session.player;
    const id = msg.id;

    // 已领取
    if (player.ActInvestFunds.hasFetchId(id)) {
        logger.debug(`actInvestFundsHandler fetch not fetch:${id}, player:${player.uid}`);
        next(null, { code: code.err.ERR_ACT_INVEST_FUNDS_HAD_FETCH });
        return;
    }

    // 领取Id 错误
    const cfg = this.app.Config.OperateInvestFunds.get(id);
    if (!cfg) {
        logger.debug(`actInvestFundsHandler fetch not invest plan:${id}, player:${player.uid}`);
        next(null, { code: code.err.ERR_CLIENT_PARAMS_WRONG });
        return;
    }

    // 头衔等级
    if (cfg.Condition == 1) {
        // 未购买
        if (!player.ActInvestFunds.hasInvest()) {
            logger.debug(`actInvestFundsHandler fetch not buy, player:${player.uid}`);
            next(null, { code: code.err.ERR_ACT_INVEST_FUNDS_NOT_HAD_BUY });
            return;
        }
        if (player.lv < cfg.ConditionValue) {
            logger.debug(`actInvestFundsHandler fetch player lv ${player.lv}, not enough, player:${player.uid}`);
            next(null, { code: code.err.ERR_ACT_INVEST_FUNDS_LV_NOT_ENOUGH });
            return;
        }
    } else {
        const ret = await this.app.rpcs.global.activityRemote.getNumBuyInvestFunds({});
        if (ret.err || ret.res < cfg.ConditionValue) {
            logger.debug(`actInvestFundsHandler fetchWelfareReward player lv ${player.lv}, not enough, player:${player.uid}`);
            next(null, { code: code.err.ERR_ACT_INVEST_FUNDS_BUY_NUM_NOT_ENOUGH });
            return;
        }
    }
    player.ActInvestFunds.setFetchId(id);

    const reward = util.proto.encodeConfigAward(cfg.Reward);
    player.Item.addItem(reward, code.reason.OP_INVEST_FETCH_GET);

    next(null, { code: code.err.SUCCEEDED, id: id });
};