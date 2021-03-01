/**
 * @description 直播平台事件
 * @author chshen
 * @data 2020/05/15
 */
const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const code = require('@code');
const util = require('@util');

/**
 * 事件对象，由于需求原因，推销事件
*/
const LivePlatformEvent = function (app, player, platformId, data) {
    this.$id = 'game_LivePlatformEvent';
    this.$scope = 'prototype';
    this.app = app;
    this.player = player;

    this.platformId = Number(platformId);

    this.data = data || { thanks: {}, otherEvent:{} };
    this.data.thanks = this.data.thanks || {};    // {eventUid:eventId}
    this.data.otherEvent = this.data.otherEvent || {};
    this.data.discount = this.data.discount || {};
    this.limitThanks = 3;   // 默认值

    this.timer = null;
};
module.exports = LivePlatformEvent;

/**
 * 平台事件数据
 * @api public
*/
LivePlatformEvent.prototype.getData = function() {  
    return this.data;
};

/**
 * 启动
 * @api public
*/
LivePlatformEvent.prototype.start = function() {
    // 感谢事件加入总感谢列表
    for (const [eventUid, eventId] of Object.entries(this.data.thanks)) {
        this.player.LivePfEvent.addThanksData(this.platformId, {uid:eventUid, id:eventId});
    }
    // 推销事件
    if (Object.keys(this.data.discount).length > 0) {
        if (this.data.discount.remainMS <= 0) {
            this.data.discount = {};
        }
        this.data.discount.startMS = util.time.nowMS();
        this.timer = setTimeout((eventUid) => {
            this.removeDiscountEvent(eventUid);
        }, this.data.discount.remainMS, this.data.discount.uid);
        this.player.LivePfEvent.addDiscountEventData(this.platformId, this.data.discount);
    }
    // 其他事件
    if (Object.keys(this.data.otherEvent).length > 0) {
        // TODO 这个移除操作要删除，做成版本迭代
        if (this.data.otherEvent.remainMS) {
            this.data.otherEvent = {};
        }
        // 添加事件
        this.player.LivePfEvent.addOthersEventData(this.platformId, { uid: this.data.otherEvent.uid, id: this.data.otherEvent.id, type: this.data.otherEvent.type });
    }
    this.limitThanks = Math.floor(this.app.Config.Global.get(code.live.GLOBAL_SINGLE_THANKS_LIMIT).GlobalFloat);
};

/**
 * 关闭
 * @api public
*/
LivePlatformEvent.prototype.close = function() {
    // 计算推销剩余时间
    if (this.timer) {

        if (this.data.otherEvent.remainMS) {
            const durTime = Math.max(0, (util.time.nowMS() - this.data.otherEvent.startMS) || 0);
            const remain = Math.max(this.data.otherEvent.remainMS - durTime, 0);
            this.data.otherEvent.remainMS = isNaN(remain) ? 0 : remain;
        }
        // 删除定时器
        clearTimeout(this.timer);
    }
};

/**
 * 获取感谢事件列表
*/
LivePlatformEvent.prototype.thankEntries = function() {
    return Object.entries(this.data.thanks);
};

/**
 * 其他事件
*/
LivePlatformEvent.prototype.otherEvent = function() {
    return this.data.otherEvent;
};

/**
 * 推销事件
*/
LivePlatformEvent.prototype.discountEvent = function () {
    return this.data.discount;
};

/**
 * 添加感谢事件
 * @param {Object} event 事件列表 {uid:唯一ID, id: 事件ID, type: 事件类型}
 * @api private
*/
LivePlatformEvent.prototype.addEvent = function(event) {
    if (event == null || !event.uid || !event.id || !event.type) {
        logger.info(`LivePlatformEvent addThanksEvent event null, uid:${this.player.uid}`);
        return;
    }
    // 通知事件
    const notifyData = {
        eventUid: event.uid,
        platformId: this.platformId,
        type: event.type,
        id: event.id,
    };
    switch (event.type) {
    case code.live.EVENT_TYPE.THANKS:
        {
            this.data.thanks[event.uid] = event.id;
            // 添加全局感谢
            this.player.LivePfEvent.addThanks(this.platformId, event);
        }
        break;
    case code.live.EVENT_TYPE.DISCOUNT:
        {
            event.startMS = util.time.nowMS();
            event.remainMS = Math.floor(this.app.Config.Global.get(code.live.GLOBAL_DISCOUNT_EVENT_DOWN_TIME).GlobalFloat) || 3600000;
            this.data.discount = { uid: event.uid, id: event.id, type: event.type, startMS: event.startMS, remainMS: event.remainMS || 0 };
            // 设置超时计时器
            if (this.timer) {
                clearTimeout(this.timer);
            }
            this.timer = setTimeout((eventUid) => {
                this.removeDiscountEvent(eventUid);
            }, event.remainMS, event.uid);
            this.player.LivePfEvent.addDiscountEvent(this.platformId, event);
            notifyData.endTime = util.time.ms2s(event.startMS + event.remainMS);
        }
        break;
    case code.live.EVENT_TYPE.DISPATCH:
    case code.live.EVENT_TYPE.CHOOSE:
        {
            this.data.otherEvent = { uid: event.uid, id: event.id, type: event.type };
            this.player.LivePfEvent.addOthersEvent(this.platformId, event);
        }
        break;
    default:
        break;
    }
    // 通知事件触发
    this.player.Notify.notify('onSyncLivePlatformEventNotify', notifyData);
};

/**
 * 删除感谢事件
 * @param {Integer} eventUid 事件ID列表
 * @api public
*/
LivePlatformEvent.prototype.removeThanksEvent = function (eventUid) {
    if (eventUid == null) {
        logger.info(`LivePlatformEvent addThanksEvents eventId null, uid:${this.player.uid}`);
        return;
    }
    delete this.data.thanks[eventUid];

    // 删除感谢事件
    this.player.LivePfEvent.removeThanks(eventUid);
};

/**
 * 获取感谢事件
 * @api public
 * @param {Integer} eventUid
 * @return {Integer} eventId
*/
LivePlatformEvent.prototype.getThankEventId = function(eventUid) {
    return this.data.thanks[eventUid] || 0;
};

/**
 * 单个平台内事件满
 * @api public
*/
LivePlatformEvent.prototype.checkEventFullByProcessor = function (type) {
    if (code.live.PROCESSOR_TYPE.THANKS == type) {
        return Object.keys(this.data.thanks).length >= this.limitThanks;
    } else if (code.live.PROCESSOR_TYPE.DISCOUNT == type) {
        return this.data.discount.type != null;
    } else {
        return this.data.otherEvent.type != null;
    }
};

/**
 * 删除其他事件
 * @param {Integer} eventUid 事件uid
 * @api public
*/
LivePlatformEvent.prototype.removeOtherEvent = function (eventUid) {
    if (eventUid == null) {
        logger.info(`LivePlatformEvent addThanksEvents eventUid null, uid:${this.player.uid}`);
        return;
    }
    if (this.data.otherEvent.uid != eventUid) {
        logger.info(`LivePlatformEvent addThanksEvents eventUid not find, uid:${this.player.uid}`);
        return;
    }

    // 移除事件
    this.data.otherEvent = {};
    this.player.LivePfEvent.removeOtherEvent(eventUid);
};

/**
 * 删除推销事件
 * @param {Integer} eventUid 事件uid
 * @api public
*/
LivePlatformEvent.prototype.removeDiscountEvent = function (eventUid) {
    if (eventUid == null) {
        logger.info(`LivePlatformEvent addThanksEvents eventUid null, uid:${this.player.uid}`);
        return;
    }
    if (this.data.discount.uid != eventUid) {
        logger.info(`LivePlatformEvent addThanksEvents eventUid not find, uid:${this.player.uid}`);
        return;
    }

    // 移除事件
    this.data.discount = {};

    // 移除定时器
    if (this.timer) {
        clearTimeout(this.timer);
    }
    this.player.LivePfEvent.removeDiscountEvent(eventUid);
};