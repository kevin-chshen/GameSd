/**
 * @description 运营活动模块-累计充值
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
 * 查询累计充值数据
*/
Handler.prototype.query = function (msg, session, next) {
    const player = session.player;
    const actId = msg.actId;
    const op = player.Operate.checkAndGet(actId, code.activity.OPERATE_TYPE.ADD_UP_PAY);
    if (!op) {
        next(null, { code: code.err.ERR_OPERATE_ADD_UP_PAY_NOT_OPEN });
        return;
    }
    const data = op.getData();
    next(null, { code: code.err.SUCCEEDED, actId: actId, fetchIds: data.fetchIds, pay: data.rmb });
};


/**
 * 领取奖励
*/
Handler.prototype.fetch = function (msg, session, next) {
    const player = session.player;
    const actId = msg.actId;
    const id = msg.id;

    // 活动开启
    if (!this.app.Operate.actIdOnline(actId)) {
        logger.debug(`operateAddUpPayHandler fetch activity not open, player:${player.uid}`);
        next(null, { code: code.err.ERR_OPERATE_ADD_UP_PAY_NOT_OPEN });
        return;
    }
    const operateCfg = this.app.Config.OperateBaseActivity.get(actId);
    if (!operateCfg || operateCfg.Type != code.activity.OPERATE_TYPE.ADD_UP_PAY) {
        logger.debug(`operateAddUpPayHandler fetch actId:${actId} not exist ,player:${player.uid}`);
        next(null, { code: code.err.ERR_CLIENT_PARAMS_WRONG });
        return;
    }
    const cfgId = id;
    const cfg = this.app.Config.OperateTotalPay.get(cfgId);
    if (!cfg || operateCfg.CallId != cfg.CallId) {
        logger.debug(`operateAddUpPayHandler fetch OperateTotalPay id:${cfgId} not exist ,player:${player.uid}`);
        next(null, { code: code.err.ERR_CLIENT_PARAMS_WRONG });
        return;
    }
    const op = player.Operate.get(actId);
    if (op.hadFetch(cfgId)) {
        logger.debug(`operateAddUpPayHandler fetch id:${cfgId} had fetch, player:${player.uid}`);
        next(null, { code: code.err.ERR_OPERATE_ADD_UP_PAY_HAD_FETCH });
        return;
    }
    const rmb = op.getRmb();
    if (rmb < cfg.PayValue) {
        logger.debug(`operateAddUpPayHandler fetch rmb not enough, id:${cfgId}, player rmb:${rmb} not exist ,player:${player.uid}`);
        next(null, { code: code.err.ERR_OPERATE_ADD_UP_PAY_RMB_NOT_ENOUGH });
        return;
    }

    op.setFetchId(cfgId);
    const award = util.proto.encodeConfigAward(cfg.Reward);
    player.Item.addItem(award, code.reason.OP_OPERATE_ADD_UP_DAY_GET);
    next(null, { code: code.err.SUCCEEDED, actId: actId, id: id, award: util.proto.encodeAward(award) });
};
