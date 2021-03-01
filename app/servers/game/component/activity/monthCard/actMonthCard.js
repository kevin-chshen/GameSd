/**
 * @description 月卡模块
 * @author chshen
 * @data 2020/05/27
 */
const util = require('@util');
const code = require('@code');

const ActMonthCard = function (app, player, cardId, data) {
    this.$id = 'game_ActMonthCard';
    this.$scope = 'prototype';
    this.app = app;
    this.player = player;

    this.cardId = Number(cardId);
    // 初始化数据
    data = data || {};
    data.renewMs = data.renewMs || [];
    data.remainDays = data.remainDays || 0;
    data.isTodayFetch = data.isTodayFetch || false;
    this.data = data;
};
module.exports = ActMonthCard;

/**
 * 月卡数据结构
 * {
 *     renewMs:[],  // 续费生效时间
 *     remainDays:  // 剩余天数
 *     isTodayFetch:// 今日是否已领取
 * }
*/
/**
 * 每日重置
 * @param {Integer} count 次数
*/
ActMonthCard.prototype.onDayChange = function(count) {
    const cfg = this.app.Config.OperateMonthlyCard.get(this.cardId);

    // 今日可领取

    // 补发每日奖励
    let maxCount = count;
    if (this.data.isTodayFetch) {
        // 扣掉一天已领取
        maxCount = Math.max(0, count - 1);
    }
    maxCount = Math.min(this.data.remainDays, maxCount);    
    for (let index = 0; index < maxCount; ++index) {
        this.sendMail(41, cfg.PayId, cfg.EveryDayReward);
    }

    // 补发续费奖励
    const nowMs = util.time.nowMS();
    const removes = [];
    for (let index = 0, len = this.data.renewMs.length; index < len; ++index) {
        const time = this.data.renewMs[index];
        
        if (time <= nowMs) {
            // 生效后的月卡发放邮件奖励
            this.sendMail(42, cfg.PayId, cfg.Reward);

            this.player.Event.emit(code.event.MONTH_CARD_REWARD.name, cfg.PayId);

            removes.push(index);
        }
    }
    for (const index of removes) {
        this.data.renewMs.splice(index, 1);
    }

    const remain = Math.max(0, this.data.remainDays - count);
    
    const noticeDay = this.app.Config.Global.get(code.activity.GLOBAL_MONTH_CARD_NOTICE).GlobalFloat;
    // 月卡失效
    if (remain <= 0) {
        this.player.Event.emit(code.event.MONTH_CARD_EXPIRED.name, this.cardId);
    } else if (remain <= noticeDay) {
        // 提醒月卡快到期
        this.sendMail(43, cfg.PayId, null);
    } else {
        // TODO nothing
    }

    this.data.remainDays = remain;
    this.data.isTodayFetch = false;
};

ActMonthCard.prototype.addRenew = function() {
    const cfg = this.app.Config.OperateMonthlyCard.get(this.cardId);
    const time = util.time.nextNDayMs(this.data.remainDays);
    this.data.renewMs.push(time);
    this.data.remainDays += cfg.Days;
};

/**
 * 获取月卡数据
*/
ActMonthCard.prototype.getData = function() {
    return this.data;
};

/**
 * 获取卡片ID
*/
ActMonthCard.prototype.getCardId = function() {
    return this.cardId;
};

/**
 * 续费
*/
ActMonthCard.prototype.canRenew = function() {
    const noticeDay = this.app.Config.Global.get(code.activity.GLOBAL_MONTH_CARD_NOTICE).GlobalFloat;
    return this.data.remainDays <= noticeDay;
};

/**
 * 剩余天数
*/
ActMonthCard.prototype.remainDays = function () {
    return this.data.remainDays;
};


/**
 * 能否领取
*/
ActMonthCard.prototype.canFetch = function() {
    return !this.data.isTodayFetch;
};

/**
 * 设置最后领取时间
*/
ActMonthCard.prototype.setLastFetch = function() {
    this.data.isTodayFetch = true;
};

/**
 * 发送邮件
*/
ActMonthCard.prototype.sendMail = function(mailId, payId, reward) {
    const nodeSec = util.time.nowSecond();
    const mailConfig = this.app.Config.Mail.get(mailId);
    const name = this.app.Config.Pay.get(payId).Name;
    const mail = {
        title: util.format.format(mailConfig.Name, name) || "",
        content: util.format.format(mailConfig.Text, name) || "",
        item: reward ? util.proto.encodeConfigAward(reward) : [],
        type: code.mail.TYPE.SYSTEM,
        sendTime: nodeSec,
        expirationTime: mailConfig.ExpirationTime > 0 ? nodeSec + mailConfig.ExpirationTime : 0,
        status: reward? code.mail.STATUS.UNRECEIVED : code.mail.STATUS.UNREAD,
    };
    this.app.Mail.sendCustomMail(this.player.uid, mail);
};