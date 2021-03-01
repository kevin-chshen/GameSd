/**
 * @description 充值组件
 * @author chshen
 * @data 2020/05/09
 */
const bearcat = require('bearcat');
const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const MongoPay = require('@mongo/mongoPay');
const code = require('@code');
const assert = require('assert');
const util = require('@util');


const PayComponent = function(app, player) {
    this.$id = 'game_PayComponent';
    this.$scope = 'prototype';
    this.app = app;
    this.player = player;
};
bearcat.extend('game_PayComponent', 'game_Component');

module.exports = PayComponent;

/**
 * 登录处理
 * @api override public
*/
PayComponent.prototype.onAfterLoad = async function() {
    const res = await MongoPay.query({uid: this.player.uid});
    // 是否有未处理的订单
    res.map((mongo)=>{
        const isHandled = mongo.get('isHandled');
        if (isHandled == 0) {
            const data = mongo.dbValue();
            const payId = data.callbackInfo.split("_")[0];
            this.pay(data.orderId, data.amount, payId);
        }
    });
};


/**
 * 充值
 * @param {String} orderId 订单ID
 * @param {String} amount 金额
 * @param {Integer} payId 付费ID
 * @param {Integer} payWay 来源
 * @return {Boolean}
*/
PayComponent.prototype.pay = async function (orderId, amount, payId, payWay) {
    if (!orderId || !amount || !payId) {
        logger.error(`PayComponent pay orderId:${orderId}, amount:${amount}, callbackInfo:%j error`, payId);
        return false;
    }
    orderId = String(orderId);
    amount = Number(amount);
    payId = Number(payId);
    const cfg = this.app.Config.Pay.get(payId);
    if (!cfg) {
        logger.error(`PayComponent pay cfg:${payId} not found`);
        return false;
    }
    if (cfg.Rmb != amount) {
        logger.error(`PayComponent pay rmb:${cfg.Rmb} not equal amount:${amount}`);
        return false;
    }
    logger.info(`PayComponent MongoPay query orderId:${orderId}`);
    const order = await MongoPay.query({ orderId: orderId });
    if (order.length == 0) {
        logger.error(`PayComponent pay order:${orderId} not found, player:${this.player.uid}`);
        return false;
    }
    // 修改订单状态,入库后再操作防止重复给予
    await order[0].updateImmediately({ isHandled: 1 });
    if (!this.player) {
        order[0].updateImmediately({ isHandled: 0 });
        logger.info(`PayComponent pay order:${orderId} player clean, player:${this.player.uid}`);
        return false;
    }
    // 触发首充事件
    if (cfg.FirstPayJudge) {
        this.player.Event.emit(code.event.PAY_FIRST.name, payId);
    }
    // 充值活动事件
    if (cfg.RechargeActivityJudge) {
        this.player.Event.emit(code.event.PAY_OPERATE_ACTIVITY.name, payId);
    }
    logger.info(`PayComponent payWay${payWay} orderId:${orderId}, payId:${payId}, cfg.Type${cfg.Type}`);
    // 充值及数据立即落地
    // 999 表示GM
    if (payWay == code.global.PAY_WAY_GM) {
        switch (cfg.Type) {
        case code.global.PAY_TYPE.DIAMOND:
            this.handlePayDiamond(payId, code.reason.OP_PAY_DIAMOND_GET);
            break;
        case code.global.PAY_TYPE.DAILY_PAY:
            this.handlePayDailyPay(payId);
            break;
        // 月卡
        case code.global.PAY_TYPE.MONTH_CARD:
            this.handlePayMonthCard(payId);
            break;
        // 0元礼包
        case code.global.PAY_TYPE.ZERO_GIFT:
            this.handlePayZeroGift(payId);
            break;
        default:
            break;
        }
    } else {
        switch (cfg.Type) {
        case code.global.PAY_TYPE.DIAMOND:
            this.handlePayDiamond(payId, code.reason.OP_PAY_DIAMOND_GET);
            break;
        case code.global.PAY_TYPE.DAILY_PAY:
            this.handlePayDailyPay(payId);
            break;
        // 月卡
        case code.global.PAY_TYPE.MONTH_CARD:
            this.handlePayMonthCard(payId);
            break;
        // 0元礼包
        case code.global.PAY_TYPE.ZERO_GIFT:
            this.handlePayZeroGift(payId);
            break;
        default:
            break;
        }
    }

    // 数据立即落地
    if (this.player.firstPayTime == 0){
        this.player.firstPayTime = util.time.nowSecond();
    }
    if (util.time.isSameDay(Number(this.player.lastPayTime))) {
        this.player.dayPay = (this.player.dayPay || 0) + amount;
    }
    else {
        this.player.dayPay = amount;
    }
    this.player.lastPayTime = util.time.nowSecond();
    await this.player.flush();
    // 运营日志
    this.app.Log.payLog(this.player, cfg.Type, orderId, cfg.Rmb, cfg.Diamond, payWay, cfg.Id);

    return true;
};

/**
 * 购买钻石
 * @api public
 * @param {Integer} payId
*/
PayComponent.prototype.handlePayDiamond = function (payId, actionID) {
    const cfg = this.app.Config.Pay.get(payId);
    assert(cfg, `PayComponent handlePayDiamond cfgId:${payId} not found,player:${this.player.uid}`);

    // 检测首充
    let diamond = 0;
    if (this.player.payIds.indexOf(payId) < 0) {
        this.player.payIds.push(payId);
        diamond += cfg.FirstDiamond;

        this.player.Notify.notify("onSyncPayIdsNotify", { payIds: this.player.payIds });
    }
    diamond += cfg.Diamond;

    // 发送邮件(策划不要求) 

    // 领取奖励
    this.player.Currency.add(code.currency.CURRENCY_ID.DIAMOND, Number(diamond), actionID);

    // 充值事件
    this.player.Event.emit(code.event.PAY_DIAMOND.name, payId);
};

/**
 * 每日充值
 * @api public
 * @param {Integer} payId
*/
PayComponent.prototype.handlePayDailyPay = function (payId) {

    this.player.Event.emit(code.event.PAY_DAILY_DISCOUNT.name, payId);
};

/**
 * 月卡
 * 
*/
PayComponent.prototype.handlePayMonthCard = function (payId) {
    this.player.Event.emit(code.event.PAY_MONTH_CARD.name, payId);
};

/**
 * 0元礼包
*/
PayComponent.prototype.handlePayZeroGift = function (payId) {
    
    this.player.Event.emit(code.event.PAY_ZERO_GIFT.name, payId);
};


