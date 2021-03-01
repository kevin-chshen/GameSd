/**
 * @description 定时活动管理
 * @author chshen
 * @date 2020/05/21
 */
const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const bearcat = require('bearcat');
const util = require('@util');
const code = require('@code');
const assert = require('assert');

const ActivityTimerHelper = function() {
    this.$id = 'logic_ActivityTimerHelper';
    this.name = 'ActivityTimer';
    this.app = null;
};

bearcat.extend('logic_ActivityTimerHelper', 'logic_BaseHelper');
module.exports = ActivityTimerHelper;


/**
 * 活动计时器Id列表
 * @return {Array}
*/
ActivityTimerHelper.prototype.getActivityTimerIds = function()  {
    logger.debug(`ActivityTimerHelper ${this.$id} getActivityTimerIds`);
    return [];
};

/**
 * 获取活动参数
 * @api virtual
 * @param {Integer} cfgType
 * @param {Integer} id
 * @return {Object}
*/
ActivityTimerHelper.prototype.getActivityParams = function (id) {
    logger.debug(`ActivityTimerHelper ${this.$id} getActivityParams id:${id}`);
    return null;
};

/**
 * 初始化计时器
 * @api public
 * @param {Integer} cfgType
 * @param {Integer} id
 * @param {Integer} nowMs
 * @param {Integer} startTs // 毫秒
 * @param {Integer} stopTs  // 毫秒
 * return {Object} timer {time:,isStart:, startMs:,stopMs:}
*/
ActivityTimerHelper.prototype.initTimer = function (type, nowMs, startTime, stopTime) {
    nowMs = nowMs || util.time.nowMS();
    if (!type || !startTime || !stopTime) {
        logger.debug(`ActivityTimerHelper initTimer param error, type:${type}, start:${startTime}, stop:${stopTime}`);
        return;
    }
    const timer = {
        time: -1,
        isStart: true,
        startMs: 0,
        stopMs: 0
    };
    // 每日
    switch (type) {
    case code.activity.TYPE.DAILY: {
        let startMs = util.time.calTodayMs(startTime[0], startTime[1], startTime[2], 0);
        let stopMs = util.time.calTodayMs(stopTime[0], stopTime[1], stopTime[2], 0);
        // 22:00~1:00
        if (startMs > stopMs) {
            stopMs += code.global.ONE_DAY_MS;
        }
        if (nowMs < startMs) {
            timer.time = startMs;
        } else if (startMs <= nowMs && nowMs <= stopMs) {
            timer.time = nowMs;
        } else {
            startMs += code.global.ONE_DAY_MS;
            stopMs += code.global.ONE_DAY_MS;
            timer.time = startMs;
        }
        timer.startMs = startMs;
        timer.stopMs = stopMs;
    }break;

    case code.activity.TYPE.WEEKLY:{
        let startMs = util.time.weekDayOffsetTodayMs(startTime[0], startTime[1], startTime[2]);
        let stopMs = util.time.weekDayOffsetTodayMs(stopTime[0], stopTime[1], stopTime[2]);
        // 22:00~1:00
        if (startMs > stopMs) {
            stopMs += code.global.ONE_WEEK_MS;
        }
        if (nowMs < startMs) {
            timer.time = startMs;
        } else if (startMs <= nowMs && nowMs <= stopMs) {
            timer.time = nowMs;
        } else {
            startMs += code.global.ONE_WEEK_MS;
            stopMs += code.global.ONE_WEEK_MS;
            timer.time = startMs;
        }
        timer.startMs = startMs;
        timer.stopMs = stopMs;
    }break;
    case code.activity.TYPE.OPEN_DAY: {
        const openServerStr = this.app.SystemConfig.getServerOpenStr();
        const d = new Date(openServerStr);
        // 策划默认1表示开服当天
        const stopMs = d.setHours(stopTime[1], stopTime[2], stopTime[3]) + (stopTime[0] -1) * code.global.ONE_DAY_MS;
        const startMs = d.setHours(startTime[1], startTime[2], startTime[3]) + (startTime[0]-1) * code.global.ONE_DAY_MS;
        if (nowMs < startMs) {
            timer.time = startMs;
        } else if (nowMs >= startMs && nowMs <= stopMs) {
            timer.time = nowMs;
        } else {
            // 过期
        }
        timer.startMs = startMs;
        timer.stopMs = stopMs;
    }break;
    case code.activity.TYPE.TIME_REGION:{
        const startStr = `${startTime[0]}-${startTime[1]}-${startTime[2]} ${startTime[3]}:${startTime[4]}:${startTime[5]}`;
        const stopStr = `${stopTime[0]}-${stopTime[1]}-${stopTime[2]} ${stopTime[3]}:${stopTime[4]}:${stopTime[5]}`;
        const startMs = (new Date(startStr)).getTime();
        const stopMs = (new Date(stopStr)).getTime();
        if (nowMs < startMs) {
            timer.time = startMs;
        } else if (startMs <= nowMs && nowMs <= stopMs) {
            timer.time = nowMs;
        } else {
            // 已过期
        }
        timer.startMs = startMs;
        timer.stopMs = stopMs;
    }break;
    default:
        break;
    }

    return timer;
};

/**
 * 查找定时器
*/
ActivityTimerHelper.prototype.findTimer = function(id, timers) {
    for (let index = 0, len = timers.length; index < len; ++index) {
        const mod = timers[index];
        if (mod.id == id) {
            return timers[index];
        }
    }
};

/**
 * 修改活动周期
 * @api public
 * @param {Integer} cfgType 配置表类型
 * @param {Integer} id 活动ID
 * @param {Integer} type 时间类型
 * @param {Array} startDate 开启时间    2020|5|10|10|20|30
 * @param {Array} stopDate 关闭时间     2020|5|10|10|21|30
*/
ActivityTimerHelper.prototype.modifyPeriod = function(id, startDate, stopDate) {

    const cfg = this.getActivityParams(id);
    assert(cfg, `ActivityTimerHelper modifiedPeriod cfg error`);

    const { cfgType: cfgType, type: type, start: startTime, stop: stopTime } = cfg;
    if (!cfgType || !type || !startTime || !stopTime || !startDate || !stopDate) {
        logger.debug(`ActivityTimerHelper modifiedPeriod param error cfgType"${cfgType}, type:${type}, start:${startTime}, stop:${stopTime}`);
        return;
    }

    const timer = this.findTimer(id);
    const nowMs = util.time.nowMS();
    // 已过期
    if (nowMs >= timer.stopMs) {
        logger.info(`ActivityTimerHelper modifiedPeriod activity pass`);
    } else {
        // 未过期
        const startStr = `${startTime[0]}-${startTime[1]}-${startTime[2]} ${startTime[3]}:${startTime[4]}:${startTime[5]}`;
        const stopStr = `${stopTime[0]}-${stopTime[1]}-${stopTime[2]} ${stopTime[3]}:${stopTime[4]}:${stopTime[5]}`;
        const startMs = (new Date(startStr)).getTime();
        const stopMs = (new Date(stopStr)).getTime();
        this.unregister(id);
        this.initTimer(id, nowMs, startMs, stopMs);
    }
};
