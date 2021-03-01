/**
 * @description 直播平台随机事件
 * @author chshen
 * @data 2020/03/23
 */
const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const code = require('@code');
const bearcat = require('bearcat');
const util = require('@util');
/**
 * 触发规则 rand(平台) -> rand(事件类型) -> rand(平台事件适配池) -> rand(事件ID)
*/
const LivePlatformService = function() {
    this.$id = 'game_LivePlatformService';
    this.$scope = 'singleton';
    this.app = null;
};
module.exports = LivePlatformService;

bearcat.extend('game_LivePlatformService', 'logic_BaseService');

/**
 * 随机获取感谢事件
 * @api public
 * @param {Integer} processorType   // processorType可以指定特定类型，生成
 * @return {Object} event
*/
LivePlatformService.prototype.randomEvent = function (player, processorType, eventType = code.live.EVENT_TYPE.NONE) {
    const event = { platformId: 0, uid: this.__genEventUid(), id: 0, type: code.live.EVENT_TYPE.THANKS };
    // 随机事件类型
    if (code.live.PROCESSOR_TYPE.THANKS == processorType) {
        if (player.SysOpen.check(1301)) {
            event.type = code.live.EVENT_TYPE.THANKS;
        } else {
            event.type = code.live.EVENT_TYPE.NONE;
        }
    } else if (code.live.PROCESSOR_TYPE.DISCOUNT == processorType) {
        // 随机
        if (code.live.EVENT_TYPE.NONE == eventType) {
            event.type = this.__randomOtherEventType(player);
            // 如果不是推销事件则默认空
            if (event.type != code.live.EVENT_TYPE.DISCOUNT){
                event.type = code.live.EVENT_TYPE.NONE;
            }
        } else {
            // 指定
            event.type = eventType;
        }
    } else if (code.live.PROCESSOR_TYPE.OTHERS == processorType) {
        // 随机
        if (code.live.EVENT_TYPE.NONE == eventType) {
            event.type = this.__randomOtherEventType(player);
        } else {
            // 指定
            event.type = eventType;
        }
    } else {
        event.type = code.live.EVENT_TYPE.NONE;
    }
    // 随机平台
    let platformId = 0;
    if (event.type != code.live.EVENT_TYPE.NONE) {
        platformId = this.__randomPlatformId(player, processorType);
    }
    if (platformId == 0) {
        logger.debug(`LivePlatformService random platform Id, all full, player:${player.uid}`);
        return event;
    }
    event.platformId = platformId;
    // 随机触发事件ID
    switch (event.type) {
    case code.live.EVENT_TYPE.THANKS:
        event.id = this.app.Config.EventThank.randomEvent(platformId);
        break;
    case code.live.EVENT_TYPE.DISPATCH:
        event.id = this.app.Config.EventSend.randomEvent(platformId);
        break;
    case code.live.EVENT_TYPE.DISCOUNT:
        event.id = this.app.Config.EventDiscount.randomEvent(platformId, player.lv);
        break;
    case code.live.EVENT_TYPE.CHOOSE:
        event.id = this.app.Config.EventChoose.randomEvent(platformId);
        break;
    default:
        event.id = 0;
        break;
    }
    return event;
};

/**
 * 随机事件类型
 * @api private
 * @return {Integer} 事件类型
*/
LivePlatformService.prototype.__randomOtherEventType = function(player) {
    const weights = this.app.Config.Global.get(code.live.GLOBAL_OTHER_EVENT_WEIGHT).GlobalArray;
    const weightList = [];
    // 选择事件
    if (player.SysOpen.check(1302)) {
        weightList.push({ id: code.live.EVENT_TYPE.CHOOSE, w: weights[1] || 0 });
    }
    // 派遣事件
    if (player.SysOpen.check(1303)) {
        weightList.push({ id: code.live.EVENT_TYPE.DISPATCH, w: weights[0] || 0 });
    }
    // 推销事件
    if (player.SysOpen.check(1304) && !player.LivePfEvent.checkDiscountFull()) {
        weightList.push({ id: code.live.EVENT_TYPE.DISCOUNT, w: weights[2] || 0 });
    }
    const data = util.weight.randomByWeight(weightList);
    return !data ? 0 : data.id;
};


/**
 * 随机平台ID
 * @api private
 * @param {Object} player
 * @return {Integer} 平台ID
*/
LivePlatformService.prototype.__randomPlatformId = function(player, processorType) {
    // 随机平台
    const platformIds = player.LivePfEvent.allPlatformIds();
    const randomIndex = Math.floor(Math.random() * platformIds.length);
    let platformId = platformIds[randomIndex];
    // 平台事件满则 取下一个，所有平台检测一次都不满足则放弃随机
    const len = platformIds.length;
    let index = 0;
    do {
        platformId = platformIds[(randomIndex + index) % len];
        ++index;

        // 检测平台事件是否满
        const platform = player.LivePfEvent.getPlatform(platformId);
        if (platform && !platform.checkEventFullByProcessor(processorType)) {
            // 有一个平台能生成则 ok
            return platformId;
        }
    } while (index < len);

    return 0;
};

/**
 * 生成事件uid
 * @api private
*/
LivePlatformService.prototype.__genEventUid = function () {
    return (Date.now() * 10000 + Math.floor(Math.random() * 10000)).toString();
};