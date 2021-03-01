/**
 * @description 0元礼包活动模块
 * @author chshen
 * @data 2020/05/29
 */
const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const bearcat = require('bearcat');
const code = require('@code');
const util = require('@util');

/**
 * 数据结构 玩家个人活动
 * {
 *      actId: 活动ID
 *      startMs: 活动开始时间
 *      stopMs: 活动结束时间
 *      startTs: 0,         // 配置表的开始时间
 *      stopTs: 0,          // 配置表的结束时间
 *      fetchIds: []        // 奖励领取列表,第几天
 *      payId:0             // 付费Id
 *      giftFetch: false,   // 0元礼包是否领取
 * }
*/
const OperateZeroGiftComponent = function (app, player) {
    this.$id = 'game_OperateZeroGiftComponent';
    this.$scope = 'prototype';
    this.app = app;
    this.player = player;

    this.data = null;
};
bearcat.extend('game_OperateZeroGiftComponent', 'game_Component');
module.exports = OperateZeroGiftComponent;


OperateZeroGiftComponent.prototype.getData = function() {
    return this.data;
};

/**
 * 初始化
*/
OperateZeroGiftComponent.prototype.onLoad = function () {
    if (Object.keys(this.player.operateZeroGift).length == 0) {
        this.player.operateZeroGift = {
            actId: 0,
            startMs: 0,
            stopMs: 0,
            startTs: 0,   // 配置表的开始时间(毫秒)
            stopTs: 0,   // 配置表的开始时间(毫秒)
            fetchIds: [],
            payId: 0,
            giftFetch: false,
        };
    }
    this.data = this.player.operateZeroGift;
    this.player.Event.on(code.event.PAY_ZERO_GIFT.name, (...args) => {
        this.payZeroGift(args[0]);
    });
};

OperateZeroGiftComponent.prototype.onDayChange = function() {
    this.stop();
};

OperateZeroGiftComponent.prototype.stop = function() {
    // 活动结束
    if (this.data.stopMs > 0 && this.data.stopMs <= util.time.nowMS()) {
        // 通知活动结束
        this.player.Notify.notify('onSyncOperateZeroGiftInfo', {
            actId: this.data.actId
        });

        // 重置数据
        this.reset(0, 0, 0, 0, 0);
    }
};

/**
 * 充值
*/
OperateZeroGiftComponent.prototype.payZeroGift = function (payId) {
    if (this.data.payId != 0 && this.data.stopMs > 0 && this.data.stopMs > util.time.nowMS()) {
        const cfg = this.app.Config.Pay.get(payId);
        const rmb = cfg.Rmb;
        // 1 : 10 比例返还
        this.app.Mail.sendMailRepeatPay(this.player.uid, 31, rmb * 10, cfg.Name);
    } else {
        // 重置数据
        const startMs = util.time.todayZeroMs();
        const cardId = this.app.Config.OperateMonthlyCard.getCardIdByPayId(payId);
        const cfg = this.app.Config.OperateMonthlyCard.get(cardId);
        const stopMs = startMs + cfg.Days * code.global.ONE_DAY_MS;
        // 查找0元礼包
        const operates = this.app.Operate.onlineActivityIds();
        let actId = 0;
        operates.map((id) => {
            const cfg = this.app.Config.OperateBaseActivity.get(id);
            if (cfg.Type == code.activity.OPERATE_TYPE.ZERO_GIFT) {
                actId = cfg.Id;
            }
        });
        // 找不到在线活动则发邮件补偿
        if (actId == 0) {
            logger.error(`OperateZeroGiftComponent actId 0, player:${this.player.uid}`);
            const cfg = this.app.Config.Pay.get(payId);
            const rmb = cfg.Rmb;
            // 1 : 10 比例返还
            this.app.Mail.sendMailRepeatPay(this.player.uid, 31, rmb * 10, cfg.Name);
            return;
        }
        const timer = this.app.Operate.findTimer(actId);
        this.reset(actId, startMs, stopMs, timer.startMs, timer.stopMs);
        this.player.Notify.notify('onSyncOperateZeroGiftNotify', {
            payId: payId,
            buyTime: util.time.ms2s(startMs),
            endTime: util.time.ms2s(stopMs),
        });
    }
    this.data.payId = payId;
};

/**
 * 重置
*/
OperateZeroGiftComponent.prototype.reset = function (actId, startMs, stopMs, startTs, stopTs) {
    this._replenishAward();
    this.data = {
        actId: actId,
        startMs: startMs,
        stopMs: stopMs,
        startTs: startTs,
        stopTs: stopTs,
        fetchIds: [],
        payId: 0,
        giftFetch: false,
    };
    this.player.operateZeroGift = this.data;
};

/**
* 补发奖励
*/
OperateZeroGiftComponent.prototype._replenishAward = function () {
    if (this.data.payId == 0) {
        return;
    }
    const cfgId = this.app.Config.OperateMonthlyCard.getCardIdByPayId(this.data.payId);
    const cfg = this.app.Config.OperateMonthlyCard.get(cfgId);
    // 2表示0元礼包
    if (cfg.Type != 2) {
        return;
    }
    if (!this.data.giftFetch) {
        this.app.Mail.sendOperateActivityMail(this.player.uid, 55, cfg.Reward);
    }
    for (let index = 1; index <= cfg.Days; ++index) {
        if (this.data.fetchIds.indexOf(index) == -1) {
            this.app.Mail.sendOperateActivityMail(this.player.uid, 56, cfg.EveryDayReward, index);
            this.data.fetchIds.push(index);
        }
    }
};

/**
 * 计算两个时间戳距离多少天
*/
OperateZeroGiftComponent.prototype._durDay = function (lshMs, rshMs) {
    const lshTime = (new Date(lshMs)).setHours(0, 0, 0, 0);
    const rshTime = (new Date(rshMs)).setHours(0, 0, 0, 0);
    return Math.abs(lshTime - rshTime) / code.global.ONE_DAY_MS;
};


OperateZeroGiftComponent.prototype.getPayId = function () {
    return this.data.payId;
};

/**
 * 充值次数
*/
OperateZeroGiftComponent.prototype.hadPay = function () {
    return this.data.payId != 0;
};

/**
 * 是否奖励已领取
*/
OperateZeroGiftComponent.prototype.hadFetch = function (id) {
    return this.data.fetchIds.indexOf(id) != -1;
};

/**
 * 是否奖励已领取
*/
OperateZeroGiftComponent.prototype.canFetch = function (id) {
    const day = this._durDay(this.data.startMs, util.time.nowMS()) + 1;
    return day >= id;
};


/**
 * 设置已领取id
*/
OperateZeroGiftComponent.prototype.setFetchId = function (id) {
    this.data.fetchIds.push(id);
};

/**
 * 是否已免费领取
*/
OperateZeroGiftComponent.prototype.hadGiftFetch = function () {
    return this.data.giftFetch;
};

/**
 * 设置已免费领取
*/
OperateZeroGiftComponent.prototype.setGiftFetch = function () {
    return this.data.giftFetch = true;
};