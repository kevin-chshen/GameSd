/**
 * @description 特惠活动模块
 * @author chshen
 * @data 2020/05/29
 */
const bearcat = require('bearcat');
const code = require('@code');
const util = require('@util');

/**
 * 数据结构
 * {
 *      startMs: 活动开始时间
 *      fetchIds: {}        // 奖励领取列表 奖励ID：次数
 *      payIds:{}           // 付费Id列表 付费ID：次数
 *      freeFetch: false,   // 每日免费领取 false 未领取
 * }
*/
const OperateDiscount = function (app, player, id, type, data) {
    this.$id = 'game_OperateDiscount';
    this.$scope = 'prototype';
    this.app = app;
    this.player = player;
    this.operateId = id;
    this.type = type;

    data = data || {};
    data.startMs = data.startMs || 0;
    data.fetchIds = data.fetchIds || {};
    data.payIds = data.payIds || {};
    data.freeFetch = data.freeFetch || false;
    this.data = data;

    this.payOperateActivityFunc = (...args) => {
        this.payDiscount(args[0]);
    };
};
bearcat.extend('game_OperateDiscount', 'game_OperateBase');
module.exports = OperateDiscount;

/**
 * 初始化
*/
OperateDiscount.prototype.init = function () {
    this.player.Event.on(code.event.PAY_DAILY_DISCOUNT.name, this.payOperateActivityFunc);
};

/**
 * 充值
*/
OperateDiscount.prototype.payDiscount = function (payId) {
    if (!this.data.payIds[payId]) {
        this.data.payIds[payId] = 0;
    }
    // 超出限购次数则 直接发放等额钻石 邮件
    const limit = this.app.Config.OperateEveryDayDiscount.getPayIdLimit(payId);
    if (this.data.payIds[payId] >= limit) {
        const cfg = this.app.Config.Pay.get(payId);
        const rmb = cfg.Rmb;
        // 1 : 10 比例返还 
        this.sendMailRepeatPay(31, rmb * 10, cfg.Name);
    } else {
        this.data.payIds[payId] += 1;
        this.player.Notify.notify('onSyncOperateDiscountPayNotify', {
            payId: payId,
            count: this.data.payIds[payId]
        });
        const cfgId = this.app.Config.OperateEveryDayDiscount.getPayId2Id(payId);
        const cfg = this.app.Config.OperateEveryDayDiscount.get(cfgId);
        if (cfg) {
            this.setFetchId(cfgId);
            const award = util.proto.encodeConfigAward(cfg.Reward);
            this.player.Item.addItem(award, code.reason.OP_OPERATE_DISCOUNT_PAY_GET);
            this.player.Notify.notify('onSyncOperateDiscountPayAwardNotify', {
                award: util.proto.encodeAward(award)
            });
        }
    }
};


/**
 * 重置
*/
OperateDiscount.prototype.reset = function (startMs) {
    this._replenishAward();
    this.data.startMs = startMs;
    this.data.fetchIds = {};
    this.data.payIds = {};
    this.data.freeFetch = false;
};


/**
 * 跨天
*/
OperateDiscount.prototype.onDayChange = function() {
    this._replenishAward();
    this.data.fetchIds = {};
    this.data.payIds = {};
    this.data.freeFetch = false;
};

/**
 * 活动关闭
*/
OperateDiscount.prototype.stop = function () {
    this.player.Event.removeListener(code.event.PAY_DAILY_DISCOUNT.name, this.payOperateActivityFunc);
    this._replenishAward();
    this.data.fetchIds = {};
    this.data.payIds = {};
    this.data.freeFetch = false;
};

/**
* 补发奖励
*/
OperateDiscount.prototype._replenishAward = function () {
    const opCfg = this.app.Config.OperateBaseActivity.get(this.operateId);
    for (const cfg of this.app.Config.OperateEveryDayDiscount.values()) {
        const payId = cfg.PayId;
        if (payId != 0 && opCfg.CallId == cfg.CallId) {
            const count = (this.data.payIds[payId] || 0) - (this.data.fetchIds[cfg.Id] || 0);
            const payCfg = this.app.Config.Pay.get(payId);
            for (let index = 0; index < count; ++index) {
                this.sendMail(54, cfg.Reward, payCfg.Rmb);
            }
        }
    }
};

/**
 * 充值次数
*/
OperateDiscount.prototype.payCount = function (payId) {
    return this.data.payIds[payId] || 0;
};

/**
 * 奖励已领取次数
*/
OperateDiscount.prototype.fetchCount = function (id) {
    return this.data.fetchIds[id] || 0;
};

/**
 * 设置已领取id
*/
OperateDiscount.prototype.setFetchId = function (id) {
    if (!this.data.fetchIds[id]) {
        this.data.fetchIds[id] = 0;
    }
    this.data.fetchIds[id] += 1;
};

/**
 * 是否已免费领取
*/
OperateDiscount.prototype.hadFreeFetch = function() {
    return this.data.freeFetch;
};

/**
 * 设置已免费领取
*/
OperateDiscount.prototype.setFreeFetch = function () {
    return this.data.freeFetch = true;
};