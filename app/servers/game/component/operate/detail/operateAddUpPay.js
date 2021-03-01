/**
 * @description 累计充值数据模块
 * @author chshen
 * @data 2020/05/29
 */
const bearcat = require('bearcat');
const code = require('@code');

const OperateAddUpPay = function (app, player, id, type, data) {
    this.$id = 'game_OperateAddUpPay';
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

    this.payOperateActivityFunc = (...args) => {
        this.rmbChanged(args[0]);
    };
};
bearcat.extend('game_OperateAddUpPay', 'game_OperateBase');
module.exports = OperateAddUpPay;

/**
 * 数据结构
 * {
 *      startMs: 活动开始时间
 *      rmb:     累计充值金额
 *      fetchIds: 领取奖励
 * }
*/

/**
 * 初始化
*/
OperateAddUpPay.prototype.init = function () {
    this.player.Event.on(code.event.PAY_OPERATE_ACTIVITY.name, this.payOperateActivityFunc);
};

/**
 * 重置
*/
OperateAddUpPay.prototype.reset = function (startMs) {
    this._replenishAward();
    this.data.startMs = startMs;
    this.data.fetchIds = [];
    this.data.rmb = 0;
};

/**
 * 活动关闭
*/
OperateAddUpPay.prototype.stop = function () {
    this.player.Event.removeListener(code.event.PAY_OPERATE_ACTIVITY.name, this.payOperateActivityFunc);
    this._replenishAward();
    this.data.fetchIds = [];
    this.data.rmb = 0;
};

/**
 * 充值的rmb
*/
OperateAddUpPay.prototype.getRmb = function () {
    return this.data.rmb;
};

/**
 * 奖励已领取
*/
OperateAddUpPay.prototype.hadFetch = function (id) {
    return this.data.fetchIds.indexOf(id) > -1;
};

/**
 * 设置已领取id
*/
OperateAddUpPay.prototype.setFetchId = function (id) {
    this.data.fetchIds.push(id);
};

/**
 * 补发奖励
*/
OperateAddUpPay.prototype._replenishAward = function () {
    const opCfg = this.app.Config.OperateBaseActivity.get(this.operateId);
    for (const cfg of this.app.Config.OperateTotalPay.values()) {
        if (cfg.CallId == opCfg.CallId && cfg.PayValue <= this.data.rmb && this.data.fetchIds.indexOf(cfg.Id) == -1) {
            this.data.fetchIds.push(cfg.Id);
            this.sendMail(52, cfg.Reward, cfg.PayValue);
        }
    }
};

/**
 * 充值
*/
OperateAddUpPay.prototype.rmbChanged = function (payId) {
    const cfg = this.app.Config.Pay.get(payId);
    this.data.rmb += cfg.Rmb;
    // 通知今日累计充值金额
    this.player.Notify.notify('onSyncAddUpPayNotify', {
        rmb: this.data.rmb
    });
};