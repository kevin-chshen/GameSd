/**
 * @description 运营活动模块-每日充值
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
 * 查询每日充值数据
*/
Handler.prototype.query = function (msg, session, next) {
    const player = session.player;
    const actId = msg.actId;
    const op = player.Operate.checkAndGet(actId, code.activity.OPERATE_TYPE.DAILY_PAY);
    if (!op) {
        next(null, { code: code.err.ERR_OPERATE_DAILY_PAY_NOT_OPEN });
        return;
    }
    const data = op.getData();
    next(null, { code: code.err.SUCCEEDED, actId: actId, fetchIds: data.fetchIds, todayPay: data.rmb });
};


/**
 *  领取奖励
*/
Handler.prototype.fetch = function (msg, session, next) {
    const player = session.player;
    const actId = msg.actId;
    const id = msg.id;

    // 活动开启
    if (!this.app.Operate.actIdOnline(actId)) {
        logger.debug(`operateDailyPayHandler fetch not open, player:${player.uid}`);
        next(null, { code: code.err.ERR_OPERATE_DAILY_PAY_NOT_OPEN });
        return;
    }
    const operateCfg = this.app.Config.OperateBaseActivity.get(actId);
    if (!operateCfg || operateCfg.Type != code.activity.OPERATE_TYPE.DAILY_PAY) {
        logger.debug(`operateDailyPayHandler fetch actId:${actId} not exist ,player:${player.uid}`);
        next(null, { code: code.err.ERR_CLIENT_PARAMS_WRONG });
        return;
    }
    const cfgId = id;
    const cfg = this.app.Config.OperateEveryDayPay.get(cfgId);
    if (!cfg || operateCfg.CallId != cfg.CallId) {
        logger.debug(`operateDailyPayHandler fetch OperateEveryDayPay id:${cfgId} not exist ,player:${player.uid}`);
        next(null, { code: code.err.ERR_CLIENT_PARAMS_WRONG });
        return;
    }
    const op = player.Operate.get(actId);
    if (op.hadFetch(cfgId)) {
        logger.debug(`operateDailyPayHandler fetch id:${cfgId} had fetch, player:${player.uid}`);
        next(null, { code: code.err.ERR_OPERATE_DAILY_PAY_HAD_FETCH });
        return;
    }
    const rmb = op.getRmb();
    if (rmb < cfg.PayValue) {
        logger.debug(`operateDailyPayHandler fetch rmb not enough, id:${cfgId}, player rmb:${rmb} not exist ,player:${player.uid}`);
        next(null, { code: code.err.ERR_OPERATE_DAILY_PAY_RMB_NOT_ENOUGH });
        return;
    }

    op.setFetchId(cfgId);
    const award = util.proto.encodeConfigAward(cfg.Reward);
    player.Item.addItem(award, code.reason.OP_OPERATE_DAILY_PAY_GET);
    next(null, { code: code.err.SUCCEEDED, actId: actId, id: id, award: util.proto.encodeAward(award) });
};