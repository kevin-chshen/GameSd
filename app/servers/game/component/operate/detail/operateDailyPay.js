/**
 * @description 每日充值活动模块
 * @author chshen
 * @data 2020/05/28
 */
const bearcat = require('bearcat');
const code = require('@code');

/**
 * 数据结构
 * {
 *      startMs: 活动开始时间
 *      fetchIds: []        // 奖励领取列表
 *      rmb:xxx             // 今日充值金额
 * }
*/
const OperateDailyPay = function (app, player, id, type, data) {
    this.$id = 'game_OperateDailyPay';
    this.$scope = 'prototype';
    this.app = app;
    this.player = player;
    this.operateId = id;
    this.type = type;

    data = data || {};
    data.startMs = data.startMs || 0;
    data.fetchIds = data.fetchIds || [];
    data.rmb = data.rmb || 0;
    this.data = data;

    this.payOperateActivityFunc = (...args) =>{
        this.rmbChanged(args[0]);
    };
};
bearcat.extend('game_OperateDailyPay', 'game_OperateBase');
module.exports = OperateDailyPay;

/**
 * 初始化
*/
OperateDailyPay.prototype.init = function () {
    this.player.Event.on(code.event.PAY_OPERATE_ACTIVITY.name, this.payOperateActivityFunc);
};

/**
 * 重置
*/
OperateDailyPay.prototype.reset = function (startMs) {
    this.data.startMs = startMs;
    this.data.fetchIds = [];
    this.data.rmb = 0;
};

/**
 * 活动关闭
*/
OperateDailyPay.prototype.stop = function () {
    this.player.Event.removeListener(code.event.PAY_OPERATE_ACTIVITY.name, this.payOperateActivityFunc);
    this._replenishAward();
    this.data.fetchIds = [];
    this.data.rmb = 0;
};

/**
 * 充值的rmb
*/
OperateDailyPay.prototype.getRmb = function () {
    return this.data.rmb;
};

/**
 * 奖励已领取
*/
OperateDailyPay.prototype.hadFetch = function(id) {
    return this.data.fetchIds.indexOf(id) > -1;
};

/**
 * 设置已领取id
*/
OperateDailyPay.prototype.setFetchId = function (id) {
    this.data.fetchIds.push(id);
};

/**
 * 每日重置
*/
OperateDailyPay.prototype.onDayChange = function () {
    // 补发邮件
    this._replenishAward();
    // 充值每日充值金额
    this.data.fetchIds = [];
    this.data.rmb = 0;
};

/**
 * 补发奖励
*/
OperateDailyPay.prototype._replenishAward = function() {
    const opCfg = this.app.Config.OperateBaseActivity.get(this.operateId);
    for (const cfg of this.app.Config.OperateEveryDayPay.values()) {
        if (opCfg.CallId == cfg.CallId && cfg.PayValue <= this.data.rmb && this.data.fetchIds.indexOf(cfg.Id) == -1) {
            this.data.fetchIds.push(cfg.Id);
            this.sendMail(51, cfg.Reward, cfg.PayValue);
        }
    }
};

/**
 * 充值
*/
OperateDailyPay.prototype.rmbChanged = function(payId) {
    const cfg = this.app.Config.Pay.get(payId);
    this.data.rmb += cfg.Rmb;

    // 通知今日累计充值金额
    this.player.Notify.notify('onSyncDailyPayNotify', {
        todayPay: this.data.rmb
    });
};