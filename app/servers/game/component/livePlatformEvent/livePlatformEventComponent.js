/**
 * @description 直播平台事件组件
 * @author chshen
 * @data 2020/03/23
 */
const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const bearcat = require('bearcat');
const code = require('@code');
const util = require('@util');
/**
 * 唯一uid 为当前的时间戳,因为同一时间戳不能产生两个事件
 * 数据结构
 * {
 *    ver : 1.0 // 当前数据版本1.0
 *    platforms:{
 *      [平台ID]:{
 *          thanks:{uid:感谢事件ID},
 *          // 当前事件
 *          otherEvent:{uid:唯一ID, type:事件类型, id 事件ID }
 *          discount:{uid:唯一ID, type:事件类型, id 事件ID, startMS: 开始事件毫秒， remainMS:推销事件剩余时间毫秒}
 *      }
 *    }
 *    thanksTriggerMS: 感谢事件触发时间（毫秒）
 *    othersEventTriggerMS: 其他事件触发时间（毫秒）
 *    discountEventTriggerMS: 推销事件触发时间（毫秒）
 * }
 */
/** 缓存数据 不入库
 * {
 *    // 总感谢事件
 *    thanks: {
 *      [uid]:{
 *          platformId:平台
 *          eventId: 事件UId
 *      }
 *    }
 *    // 总销售事件
 *    discounts: {
 *       [uid]: platformId:平台
 *    },
 *    //已有事件的平台列表
 *    eventPlatforms: {事件UID:平台ID},
 * }
*/
const LivePlatformEventComponent = function(app, player) {
    this.$id = 'game_LivePlatformEventComponent';
    this.$scope = 'prototype';

    this.app = app;
    this.player = player;

    this.thanksProcessor = null;
    this.eventsProcessor = null;
    this.discountProcessor = null;

    this.data = {};
    this.pfMgr = {};

    // 总感谢事件
    this.thanks = {};
    this.thanksLimit = 20;  // 默认值

    // 销售事件数量
    this.discounts = {};
    this.discountLimit = 2; // 默认值

    // 已有事件的平台列表
    //this.eventPlatforms = {};
};
bearcat.extend('game_LivePlatformEventComponent', 'game_Component');
module.exports = LivePlatformEventComponent;

/**
 * 加载数据
 * @api override public
*/
LivePlatformEventComponent.prototype.onLoad = function() {
    // 初始化数据
    this.dataInit();
    const values = this.platforms();
    for (const [platId, obj] of Object.entries(values)) {
        this.pfMgr[platId] = this.__createEventObj(platId, obj);
    }
    this.thanksLimit = Math.floor(this.app.Config.Global.get(code.live.GLOBAL_ALL_THANKS_LIMIT).GlobalFloat);
    this.discountLimit = Math.floor(this.app.Config.Global.get(code.live.GLOBAL_ALL_DISCOUNTS_EVENT_LIMIT).GlobalFloat);

    // 启动平台
    for (const [platId, plat] of Object.entries(this.pfMgr)) {
        plat.start();

        // plat 数据初始化后重新赋值
        this.data.platforms[platId] = plat.getData();
    }

    // 感谢事件流程器
    const thanksCD = Math.floor(this.app.Config.Global.get(code.live.GLOBAL_THANKS_CD).GlobalFloat) || 60000;
    this.thanksProcessor = bearcat.getBean('game_LivePlatformEventProcessor',
        this.app, this.player, code.live.PROCESSOR_TYPE.THANKS, thanksCD);
    this.thanksProcessor.start();
    // 其他时间流程器
    const othersCD = Math.floor(this.app.Config.Global.get(code.live.GLOBAL_OTHER_EVENT_CD).GlobalFloat) || 180000;
    this.eventsProcessor = bearcat.getBean('game_LivePlatformEventProcessor',
        this.app, this.player, code.live.PROCESSOR_TYPE.OTHERS, othersCD);
    this.eventsProcessor.start();
    // 推销事件流程器
    this.discountProcessor = bearcat.getBean('game_LivePlatformEventProcessor',
        this.app, this.player, code.live.PROCESSOR_TYPE.DISCOUNT, othersCD);
    this.discountProcessor.start();
    
    // 重新对数据赋值，防止局部数据初始化后没有加入 LivePlatformEvent缓存
    this.player.LivePlatformEvent = this.data;
    // 平台激活事件， 平台激活后触发 事件
    this.player.Event.on(code.event.LIVE_PLATFORM_ACTIVE.name, (...params) => { this.__platformActive(...params); });
};

/**
 * 清除玩家缓存
 * @api override public
*/
LivePlatformEventComponent.prototype.onClean = function () {
    // 关闭平台
    for (const plat of Object.values(this.pfMgr)) {
        plat.close();
    }
    // 关闭感谢事件流程器
    this.thanksProcessor.close();
    // 关闭其他事件流程器
    this.eventsProcessor.close();
    // 关闭推销事件流程器
    this.discountProcessor.close();
};

/**
 * 数据初始化
 * @api private
*/
LivePlatformEventComponent.prototype.dataInit = function () {
    // 初始化数据
    const data = this.player.livePlatformsEvents;
    // 空数
    if (!data || Object.values(data).length == 0) {
        const platforms = {
            platforms: {},
            thanksTriggerMS: 0,
            othersEventTriggerMS: 0,
            discountEventTriggerMS: 0,
        };
        this.player.livePlatformsEvents = platforms;
    }
    this.data = this.player.livePlatformsEvents;
};

/**
 * 获取各个平台的事件数据
 * @api public
*/
LivePlatformEventComponent.prototype.platforms = function () {
    return this.data.platforms;
};


/**
 * 获取各个平台的事件数据
 * @api public
*/
LivePlatformEventComponent.prototype.PfMgr = function () {
    return this.pfMgr;
};

/**
 * 获取平台对象
 * @api public
 * @param {Integer} platformId
 * @return {Object}
*/
LivePlatformEventComponent.prototype.getPlatform = function(platformId){
    return this.pfMgr[platformId];
};

/**
 * 添加初始化感谢数据
 * @param {Object} event {uid, id}
 * @param {Integer} platformId
 * @return {Void}
*/
LivePlatformEventComponent.prototype.addThanksData = function (platformId, event) {
    if (!platformId || !event || !event.uid || !event.id) {
        logger.error(`LivePlatformEventComponent addThanksData param error, platformId:${platformId}, event:${event}, player:${this.player.uid}`);
        return;
    }
    this.thanks[event.uid] = { platformId: Number(platformId), eventId: event.id };
};

/**
 * 添加初始化其他事件数据
 * @param {Object} event {uid, id}
 * @param {Integer} platformId
 * @return {Void}
*/
LivePlatformEventComponent.prototype.addOthersEventData = function (_platformId, _event) {
    // if (!platformId || !event || !event.uid || !event.id || !event.type) {
    //     logger.debug(`LivePlatformEventComponent addOthersEventData params failed, player"${this.player.uid}`);
    //     return;
    // }
    //this.eventPlatforms[event.uid] = platformId;
};

/**
 * 添加初始化打折事件数据
 * @param {Object} event {uid, id}
 * @param {Integer} platformId
 * @return {Void}
*/
LivePlatformEventComponent.prototype.addDiscountEventData = function (platformId, event) {
    if (!platformId || !event || !event.uid || !event.id || !event.type || event.remainMS == null) {
        logger.debug(`LivePlatformEventComponent addOthersEvent params failed, player"${this.player.uid}`);
        return;
    }
    // 统计打折事件
    this.discounts[event.uid] = platformId;

    //this.eventPlatforms[event.uid] = platformId;
};

/**
 * 添加感谢数据
 * @param {Object} event {uid, id}
 * @param {Integer} platformId
 * @return {Void}
*/
LivePlatformEventComponent.prototype.addThanks = function (platformId, event) {
    if (!platformId || !event || !event.uid || !event.id) {
        logger.error(`LivePlatformEventComponent addThanks param error, platformId:${platformId}, event:${event}, player:${this.player.uid}`);
        return;
    }
    this.addThanksData(platformId, event);
    this.data.thanksTriggerMS = util.time.nowMS();
};
/**
 * 移除感谢数据
 * @param {Integer} eventUid
 * @return {Void}
*/
LivePlatformEventComponent.prototype.removeThanks = function (eventUid) {
    if (eventUid == null) {
        logger.error(`LivePlatformEventComponent removeTotalsThanks eventUid null, player:${this.player.uid}`);
        return;
    }
    delete this.thanks[eventUid];
};

/**
 * 检测事件满
 * @api public
 * @param {Integer} type
 * @return {Boolean}
*/
LivePlatformEventComponent.prototype.checkEventsFullByProcessor = function(type) {
    if (code.live.PROCESSOR_TYPE.THANKS == type) {
        return Object.values(this.thanks).length >= this.thanksLimit;
    }
    else if (code.live.PROCESSOR_TYPE.OTHERS == type) {
        return false;
    }
    else if (code.live.PROCESSOR_TYPE.DISCOUNT == type) {
        return Object.values(this.discounts).length >= this.discountLimit;
    } else {
        // 其他类型默认满
        return true;
    }
};

/**
 * 添加其他事件数据
 * @param {Object} event {uid, id, type}
 * @param {Integer} platformId
 * @return {Void}
*/
LivePlatformEventComponent.prototype.addOthersEvent = function (platformId, event) {
    if (!platformId || !event || !event.uid || !event.id || !event.type) {
        logger.debug(`LivePlatformEventComponent addOthersEvent params failed, player"${this.player.uid}`);
        return;
    }
    //this.addOthersEventData(platformId, event);
    this.data.othersEventTriggerMS = util.time.nowMS();
};

/**
 * 添加推销事件数据
 * @param {Object} event {uid, id, type}
 * @param {Integer} platformId
 * @return {Void}
*/
LivePlatformEventComponent.prototype.addDiscountEvent = function (platformId, event) {
    if (!platformId || !event || !event.uid || !event.id || !event.type || !event.remainMS) {
        logger.debug(`LivePlatformEventComponent addDiscountEvent params failed, player"${this.player.uid}`);
        return;
    }
    this.addDiscountEventData(platformId, event);
    this.data.discountEventTriggerMS = util.time.nowMS();
};

/**
 * 移除其他事件数据
 * @param {Integer} eventUid
 * @return {Void}
*/
LivePlatformEventComponent.prototype.removeOtherEvent = function (_eventUid) {
    // if (eventUid == null) {
    //     logger.error(`LivePlatformEventComponent removeDiscounts eventUid null, player:${this.player.uid}`);
    //     return;
    // }
    //delete this.eventPlatforms[eventUid];
};

/**
 * 移除打折事件数据
 * @param {Integer} eventUid
 * @return {Void}
*/
LivePlatformEventComponent.prototype.removeDiscountEvent = function (eventUid) {
    if (eventUid == null) {
        logger.error(`LivePlatformEventComponent removeDiscounts eventUid null, player:${this.player.uid}`);
        return;
    }
    delete this.discounts[eventUid];
    //delete this.eventPlatforms[eventUid];
};

/**
 * 移除感谢数据
 * @return {Boolean}
*/
LivePlatformEventComponent.prototype.checkDiscountFull = function () {
    return Object.keys(this.discounts).length >= this.discountLimit;
};

/**
 * 随机事件触发时间
 * @api public
 * @param {Integer} processorType
 * @return {Object} event
*/
LivePlatformEventComponent.prototype.getTriggerTime = function (processorType) {
    // 随机触发事件{event:{uid, type, id}}
    if (code.live.PROCESSOR_TYPE.THANKS == processorType) {
        return this.data.thanksTriggerMS;
    } else if (code.live.PROCESSOR_TYPE.OTHERS == processorType) {
        return this.data.othersEventTriggerMS;
    } else if (code.live.PROCESSOR_TYPE.DISCOUNT == processorType) {
        return this.data.discountEventTriggerMS;
    } else {
        logger.error(`LivePlatformEventComponent process type not defined, player:${this.player.uid}`);
        return 0;
    }
};

/**
 * 所有子平台ID
 * @api public
*/
LivePlatformEventComponent.prototype.allPlatformIds = function () {
    const platformIds = [];
    for (const platId of Object.keys(this.pfMgr)) {
        platformIds.push(Number(platId));
    }
    return platformIds;
};

/**
 * 剩余次数
 * @api public
 * @param {Integer} type
 * @return {Integer} 剩余数量
*/
// LivePlatformEventComponent.prototype.remainCount = function(type) {
//     let count = 0;
//     if (code.live.PROCESSOR_TYPE.THANKS == type) {
//         count = this.thanksLimit - Object.values(this.thanks).length;
//     } else if (code.live.PROCESSOR_TYPE.OTHERS == type) {
//         const platformIds = this.allPlatformIds();
//         count = platformIds.length - Object.keys(this.eventPlatforms).length;
//     } else {
//         count = 0;
//     }
//     return Math.max(count, 0);
// };


/**
 * 平台激活
 * @api private
 * @param {Integer} platformId
*/
LivePlatformEventComponent.prototype.__platformActive = function (platformId) {

    // 添加平台数据
    if (!this.getPlatform(platformId)) {
        const obj = this.__createEventObj(platformId, null);
        this.pfMgr[platformId] = obj;
        obj.start();
        this.data.platforms[platformId] = obj.getData();
    }
};

/**
 * 生成事件uid
 * @api private
*/
LivePlatformEventComponent.prototype.__genEventUid = function() {
    return (Date.now() * 10000 + Math.floor(Math.random()*10000)).toString();
};

/**
 * 创建平台事件对象
 * @api private
*/
LivePlatformEventComponent.prototype.__createEventObj = function (platId, data) {
    return bearcat.getBean('game_LivePlatformEvent', this.app, this.player, platId, data);
};

/**
 * 添加指定事件
 * @api public
*/
LivePlatformEventComponent.prototype.addSpecialEvent = function (eventType) {
    switch (eventType) {
    case code.live.EVENT_TYPE.THANKS:
        this.thanksProcessor.trigger(eventType);
        break;
    case code.live.EVENT_TYPE.DISCOUNT:
        this.discountProcessor.trigger(eventType);
        break;
    case code.live.EVENT_TYPE.DISPATCH:
    case code.live.EVENT_TYPE.CHOOSE:
        this.eventsProcessor.trigger(eventType);
        break;
    default:
        break;
    }
};
