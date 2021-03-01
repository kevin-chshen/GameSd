/**
 * @description 直播平台感谢事件流程图
 * @author chshen
 * @data 2020/04/15
 */
const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const code = require('@code');
/**
 * 机制 间隔时间固定触发
*/

/**
 * 感谢事件流程器
 * @api constructor public
 * @param {Integer} type 流程器类型
*/
const LivePlatformEventProcessor = function(app, player, type, intervalTimeMS) {
    this.$id = 'game_LivePlatformEventProcessor';
    this.$scope = 'prototype';
    this.app = app;
    this.player = player;

    this.processorType = type;
    this.intervalTimeMS = intervalTimeMS;
    this.timer = null;
};
module.exports = LivePlatformEventProcessor;

/**
 * 初始化
 * @api public
*/
LivePlatformEventProcessor.prototype.start = function() {
    // 补偿离线的事件
    const lastTriggerTime = this.player.LivePfEvent.getTriggerTime(this.processorType);
    const durTriggerTime = this.player.RoleBase.offlineRevenueDurByTimeMS(lastTriggerTime); 
    const count = Math.floor(durTriggerTime / this.intervalTimeMS);
    // const remainCount = this.player.LivePfEvent.remainCount(this.processorType);
    // count = Math.min(count, remainCount);
    for (let index = 0; index < count; index++) {
        // 触发事件
        if (!this.trigger()) {
            break;
        }
    }
    // 无论是否满，直接开启定时器
    this.timer = setInterval(() => {
        this.trigger();
    }, this.intervalTimeMS);
};

/**
 * 触发
 * @api private
 * @param {Boolean} 是否开启触发器
 * @return {Boolean} 是否触发
*/
LivePlatformEventProcessor.prototype.trigger = function (eventType = code.live.EVENT_TYPE.NONE) {
    // 挂起事件
    if (this.player.LivePfEvent.checkEventsFullByProcessor(this.processorType)) {
        logger.debug(`LivePlatformEventProcessor thanks full hangup player:${this.player.uid}`);
        return false;
    }
    // 随机触发事件{event:{uid, type, id}}
    const event = this.app.LivePfs.randomEvent(this.player, this.processorType, eventType);
    if (!event || event.id == 0) {
        logger.debug(`LivePlatformEventProcessor trigger random failed, event null, player:${this.player.uid}`);
        return false;
    }
    const platformId = event.platformId;
    const platform = this.player.LivePfEvent.getPlatform(platformId);
    // 随机不到时间默认挂起,随机不到平台，表示已有平台已满
    if (!platform) {
        logger.debug(`LivePlatformEventProcessor trigger random failed, platform null, player:${this.player.uid}`);
        return false;
    }
    platform.addEvent(event);
    return true;
};


/**
 * 关闭流程器
*/
LivePlatformEventProcessor.prototype.close = function () {
    clearInterval(this.timer);
    this.timer = null;
};

