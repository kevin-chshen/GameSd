/**
 * @description 积天充值活动模块
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
 *      fetchIds: []        // 奖励领取列表
 *      payMsJson:{}        // 充值日期，默认为当天中午12点的毫秒时间 时间：充值金额
 * }
*/
const OperateDaysPay = function (app, player, id, type, data) {
    this.$id = 'game_OperateDaysPay';
    this.$scope = 'prototype';
    this.app = app;
    this.player = player;
    this.operateId = id;
    this.type = type;

    data = data || {};
    data.startMs = data.startMs || 0;
    data.fetchIds = data.fetchIds || [];
    data.payMsJson = data.payMsJson || {};
    this.data = data;

    this.payOperateActivityFunc = (...args) => {
        this.rmbChanged(args[0]);
    };
};
bearcat.extend('game_OperateDaysPay', 'game_OperateBase');
module.exports = OperateDaysPay;

/**
 * 初始化
*/
OperateDaysPay.prototype.init = function () {
    this.player.Event.on(code.event.PAY_OPERATE_ACTIVITY.name, this.payOperateActivityFunc);
};

/**
 * 重置
*/
OperateDaysPay.prototype.reset = function (startMs) {
    this._replenishAward();
    this.data.startMs = startMs;
    this.data.fetchIds = [];
    this.data.payMsJson = {};
};

/**
 * 活动关闭
*/
OperateDaysPay.prototype.stop = function () {
    this.player.Event.removeListener(code.event.PAY_OPERATE_ACTIVITY.name, this.payOperateActivityFunc);
    this._replenishAward();
    this.data.fetchIds = [];
    this.data.payMsJson = {};
};

/**
 * 充值的rmb
*/
OperateDaysPay.prototype.getRmb = function () {
    const time = util.time.todayZeroMs();
    return this.data.payMsJson[time] || 0;
};

/**
 * 充值的rmb
*/
OperateDaysPay.prototype.payDays = function () {
    let days = 0;
    const needRmb = this.app.Config.OperateDaysPay.getNeedRmb();
    for (const rmb of Object.values(this.data.payMsJson)) {
        if (rmb >= needRmb){
            ++days;
        }
    }
    return days;
};

/**
 * 充值的rmb信息
*/
OperateDaysPay.prototype.payDaysInfo = function () {
    let dayIndex = 1;
    const needRmb = this.app.Config.OperateDaysPay.getNeedRmb();
    const payDays = {};
    const todayTs = util.time.todayZeroMs();
    for (const [time, rmb] of Object.entries(this.data.payMsJson)) {
        if (todayTs != time && rmb >= needRmb) {
            payDays[dayIndex] = rmb;
            ++dayIndex;
        }
    }
    payDays[dayIndex] = this.data.payMsJson[todayTs] || 0;
    return payDays;
};

/**
 * 奖励已领取
*/
OperateDaysPay.prototype.hadFetch = function (id) {
    return this.data.fetchIds.indexOf(id) > -1;
};

/**
 * 设置已领取id
*/
OperateDaysPay.prototype.setFetchId = function (id) {
    this.data.fetchIds.push(id);
};

/**
 * 补发奖励
*/
OperateDaysPay.prototype._replenishAward = function () {
    // 每天充值金额一样
    let pay = 0;
    const values = this.app.Config.OperateDaysPay.values();
    for (const cfg of values) {
        pay = cfg.PayValue;
        break;
    }
    let day = 0;
    for (const rmb of Object.values(this.data.payMsJson)) {
        if (pay <= rmb) {
            day += 1;
        }
    }
    const opCfg = this.app.Config.OperateBaseActivity.get(this.operateId);
    for (const cfg of values) {
        if (cfg.CallId == opCfg.CallId && cfg.PayDay <= day && this.data.fetchIds.indexOf(cfg.Id) == -1) {
            this.data.fetchIds.push(cfg.Id);
            this.sendMail(53, cfg.Reward, cfg.PayDay);
        }
    }
};

/**
 * 充值
*/
OperateDaysPay.prototype.rmbChanged = function (payId) {
    const cfg = this.app.Config.Pay.get(payId);
    const time = util.time.todayZeroMs();
    if (!this.data.payMsJson[time]) {
        this.data.payMsJson[time] = 0;
    }
    this.data.payMsJson[time] += cfg.Rmb;
    let days = 1;
    const needRmb = this.app.Config.OperateDaysPay.getNeedRmb();
    for (const rmb of Object.values(this.data.payMsJson)) {
        if (rmb >= needRmb) {
            ++days;
        }
    }
    // 今日达标 -1 回退到当天
    if (this.data.payMsJson[time] >= needRmb) {
        --days;
    }

    // 通知今日累计充值金额
    this.player.Notify.notify('onSyncDaysPayNotify', {
        day: days,
        rmb: this.data.payMsJson[time]
    });
};