/**
 * @description 重置服务
 * @author chshen
 * @data 2020/04/25
 * note 时间计算全用 date
 * 
 */
const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const bearcat = require('bearcat');
const code = require('@code');
const util = require('@util');

const TimerService = function() {
    this.$id = 'logic_TimerService';
    this.app = null;

    this.mongo = null;

    this.cache = {};    // 类型ID:上次触发时间

    // 间隔定时器列表
    this.timers = {};   // 类型ID：[timer]
};
module.exports = TimerService;
bearcat.extend('logic_TimerService', 'logic_MongoBaseService');

TimerService.prototype.mongoDataClassFunc = require('@mongo/mongoTimer');
TimerService.prototype.uidKey = 'server';

/**
 * 服务初始化:
 */
TimerService.prototype.init = async function () {
    // 获取数据库数据
    this.mongo = await this.queryOrCreate(this.app.getServerId());
    this.cache = this.mongo.dbValue() ? this.mongo.dbValue().counters : {};
    this.cache = this.cache || {};
    this.isBroadcasts = {};
};

TimerService.prototype.afterStartUp = function () {
    const openServerTimeStr = this.app.SystemConfig.getServerOpenStr();
    const openServerTime = util.time.timeStr2MS(openServerTimeStr);
    // 检测触发事件
    const timers = this.app.Config.Timer.values();
    const nowMs = util.time.nowMS();
    for (const cfg of timers) {
        const cfgId = cfg.Id;
        const lastMs = this.cache[cfgId] || openServerTime;
        const refMs = this.getTriggerMS(cfg);
        if (nowMs >= refMs && refMs > lastMs) {
            const count = this.calTriggerCount(cfgId, lastMs, refMs);
            this.trigger(cfg.Id, refMs, count);
        }
    }

    // 启动定时器
    for (const cfg of timers) {
        this.doTimer(nowMs, cfg);
    }
};

/**
 * 服务关闭:由子类实现,默认什么都不做
 * @param {String} reason 关闭原因
 */
TimerService.prototype.shutdown = async function (_reason) {

    for (const timer of Object.values(this.timers)) {
        clearTimeout(timer);
    }

    // 数据立即入库
    await this.mongo.flush();
};

/**
 * 计算超时
 * @api private
*/
TimerService.prototype.doTimer = function (nowMs, data) {
    if (!data) {
        logger.error(`TimerService doTimer data: %j error:`, data);
        return;
    }

    let refMs = this.getTriggerMS(data);
    if (nowMs > refMs) {
        refMs = this.__getNextTriggerMS(refMs, data);
    }
    const timeout = refMs - nowMs;
    
    const id = data.Id;    
    if (timeout && timeout > 0 && id) {
        this.timers[id] = this.mySetTimeout((cfg) => {
            const now = util.time.nowMS();
            // 触发
            this.trigger(cfg.Id, now, 1);
            // 进入下一个定时器
            this.doTimer(now, cfg);
        }, timeout, data);
        logger.debug(`TimerService doTimer timeout:${timeout}, id:${id}`);
    }
};

/**
 * 获取下次触发时间
 * @param {Integer} timerId
*/
TimerService.prototype.getNextTriggerMS = function (timerId) {
    const cfg = this.app.Config.Timer.get(timerId);
    if (cfg) {
        const now = util.time.nowMS();
        const refMs = this.getTriggerMS(cfg);
        if (now >= refMs) {
            return this.__getNextTriggerMS(refMs, cfg);
        } else {
            return refMs;
        }
    }
};

/**
 * 获取下次触发时间
*/
TimerService.prototype.__getNextTriggerMS = function(refMs, data)  {
    switch (data.Type) {
    // 每天
    case code.global.COUNTER_RESET_TIME_TYPE.DAILY:
        return refMs + code.global.ONE_DAY_MS;
    // 每周
    case code.global.COUNTER_RESET_TIME_TYPE.WEEKLY:
        return 7 * code.global.ONE_DAY_MS + refMs;
    // 每月
    case code.global.COUNTER_RESET_TIME_TYPE.MONTHLY:{
        const hours = Math.floor(data.ResetTime / 100);
        const minutes = data.ResetTime % 100;
        refMs = util.time.calNextMonthDayMs(data.Date, hours, minutes, 0, 0);
        return refMs;
    }
    // 间隔几天
    case code.global.COUNTER_RESET_TIME_TYPE.DAY_BETWEEN:
        return refMs + (data.Date * code.global.ONE_DAY_MS);
    default:
        logger.error(`TimerService doTimer type:${data.Type} not define`);
        return refMs;
    }
};

/**
 * 间隔定时器
 * @api public
 * @param {Function} func
 * @param {Integer} interval
 * @param {Any} ...args
 * @return {Object} timer, 注意这里的timer 如果时间超过js setTimeout 所能支持的范围则timer 不准确
*/
TimerService.prototype.mySetInterval = function (func, interval, ...args) {

    const f = (func, interval, orgInterval, ...args) => {
        const time = 2000000000;
        // 倒计时
        if (interval > time) {
            interval -= time;
            return setTimeout((func, interval, orgInterval, ...args) => {
                return f(func, interval, orgInterval, ...args);
            }, time, func, interval, orgInterval, ...args);
        } else {
            return setTimeout((func, orgInterval, ...args) => {
                func(...args);
                return f(func, orgInterval, orgInterval, ...args);
            }, interval, func, orgInterval, ...args);
        }
    };
    return f(func, interval, interval, ...args);
};

/**
 * 倒计时计时器
 * @api public
 * @param {Function} func
 * @param {Integer} interval
 * @param {Any} ...args
 * @return {Object} timer, 注意这里的timer 如果时间超过js setTimeout 所能支持的范围则timer 不准确
*/
TimerService.prototype.mySetTimeout = function (func, interval, ...args) {
    const f = (func, interval, ...args) => {
        const time = 2000000000;
        // 倒计时
        if (interval > time) {
            interval -= time;
            logger.info(`TimerService mySetTimeout remain interval:${interval}, mod time:${time}`);
            return setTimeout((func, interval, ...args) => {
                return f(func, interval, ...args);
            }, time, func, interval, ...args);
        } else {
            return setTimeout((func, ...args) => {
                func(...args);
            }, interval, func, ...args);
        }
    };
    return f(func, interval, ...args);
};

/**
 * 模拟触发
 * @api public
 * @param {Integer} timerId
 * @param {Integer} count 触发次数
*/
TimerService.prototype.simulateTrigger = function(timerId, count) {
    const lastMs = this.cache[timerId] || 0;
    this.trigger(timerId, lastMs, count);
};

/**
 * 触发
 * @api private
 * @param {Integer} timerId 计时器ID
 * @param {Integer} triggerTime 触发时间
 * @param {Integer} triggerCount 触发次数
 * @param {Integer} broadcast 是否广播
*/
TimerService.prototype.trigger = function (timerId, triggerTime, triggerCount) {
    if (!timerId) {
        logger.error(`TimerService trigger timerId:%j error:`, timerId);
        return;
    }
    // 数据入库,记录的是上次应该准时触发的时间
    this.cache[timerId] = triggerTime || 0;
    this.mongo.update({counters: this.cache });
    logger.info(`TimerService trigger timerId:%j`, timerId);

    const nowMs = util.time.nowMS();
    const isOnTime = this.isOnTime(triggerTime, nowMs);
    this.app.Event.emit([code.eventServer.PLAYER_SERVICE_TIMER.name, timerId], { timerId: timerId, isOnTime: isOnTime, count: triggerCount});

    // 是否广播
    if (this.isBroadcasts[timerId]) {
        this.app.Notify.broadcast('onSyncTimerNotify', { id: timerId });
    }
};

/**
 * 检测触发
 * @api public
 * @param {Integer} curMs 当前毫秒
 * @param {Integer} lastMs 上次毫秒
 * @param {Object} data
 * @return {Boolean}
*/
TimerService.prototype.checkTrigger = function (curMs, lastMs, data) {
    if (lastMs == null || curMs == null || !data) {
        logger.error(`TimerService checkTrigger data:%j, lastMs:${lastMs}, curMs:${curMs} error:`, data);
        return false;
    }
    // 刚触发过，不再触发
    if (curMs <= lastMs) {
        return false;
    }
    const refMs = this.getTriggerMS(data);
    return lastMs < refMs && refMs <= curMs;
};

/**
 * 获取触发时间
 * @api private
 * @param {Object} data Timer 配置表数据 
 * @return {Integer}
*/
TimerService.prototype.getTriggerMS = function(data) {
    const hours = Math.floor(data.ResetTime / 100);
    const minutes = data.ResetTime % 100;
    let refMs = 0;
    switch (data.Type) {
    // 每天
    case code.global.COUNTER_RESET_TIME_TYPE.DAILY: {
        refMs = util.time.calTodayMs(hours, minutes, 0, 0);
    } break;
    // 每周
    case code.global.COUNTER_RESET_TIME_TYPE.WEEKLY: {
        refMs = util.time.weekDayOffsetTodayMs(data.Date, hours, minutes);
    } break;
    // 每月
    case code.global.COUNTER_RESET_TIME_TYPE.MONTHLY: {
        refMs = util.time.calCurMonthDayMs(data.Date, hours, minutes, 0, 0);
    } break;
    // 间隔几天
    case code.global.COUNTER_RESET_TIME_TYPE.DAY_BETWEEN: {
        const openServerStr = this.app.SystemConfig.getServerOpenStr();
        const diffDay = util.time.timeStrFormNowDay(openServerStr) + data.OffsetDate;
        const time = util.time.calTodayMs(hours, minutes, 0, 0);
        refMs = (diffDay % data.Date) * code.global.ONE_DAY_MS + time;
    } break;
    default:
        logger.error(`TimerService checkTrigger not define data `, data);
        break;
    }
    return refMs;
};

/**
 * 计算触发次数,
 * @api public
 * @param  {Integer} timerId 
 * @param  {Integer} lastTrigger 上次触发时间
 * @param  {Integer} curTrigger 当前触发时间
 * @return {Integer} 触发次数
*/
TimerService.prototype.calTriggerCount = function(timerId, lastTrigger, curTrigger) {
    const cfg = this.app.Config.Timer.get(timerId);
    if (!cfg || lastTrigger == null || curTrigger == null) {
        logger.debug(`TimerService calTriggerCount params error`);
        return 0;
    }
    if (curTrigger < lastTrigger) {
        logger.debug(`TimerService calTriggerCount curTrigger ${curTrigger} < lastTrigger :${lastTrigger}`);
        return 0;
    }
    if (lastTrigger === 0) {
        logger.debug(`TimerService calTriggerCount lastTrigger :${lastTrigger}`);
        return 1;
    }
    let count = 0;
    const errRangeMs = 1000;    // 1秒的误差
    switch (cfg.Type) {
    // 每天
    case code.global.COUNTER_RESET_TIME_TYPE.DAILY:
        count = Math.ceil((curTrigger - lastTrigger - errRangeMs)/code.global.ONE_DAY_MS);
        break;
    // 每周
    case code.global.COUNTER_RESET_TIME_TYPE.WEEKLY:
        count = Math.ceil((curTrigger - lastTrigger - errRangeMs) / code.global.ONE_WEEK_MS);
        break;
    // 每月
    case code.global.COUNTER_RESET_TIME_TYPE.MONTHLY: 
        count = util.time.durMonths(lastTrigger, curTrigger);
        break;
    // 间隔几天
    case code.global.COUNTER_RESET_TIME_TYPE.DAY_BETWEEN:
        count = Math.ceil((curTrigger - lastTrigger - errRangeMs) / (code.global.ONE_WEEK_MS * cfg.Date));
        break;
    default:
        logger.error(`TimerService checkTrigger not define data`, cfg);
        count = 0;
        break;
    }
    return count;
};

/**
 * 获取触发时间
 * @param {Integer} timerId
 * @return {Integer} 0 表示没有触发过
*/
TimerService.prototype.getLastTriggerMs = function(timerId) {
    return this.cache[timerId] || 0;
};

/**
 * 是否准时
*/
TimerService.prototype.isOnTime = function(lastMs, curMs) {
    return Math.abs(curMs - lastMs) <= code.global.TIMER_FAULT_TOLERANCE_MS;
};

/**
 * 注册
*/
TimerService.prototype.register = function (timerId, uid, broadcast, listener) {
    if (!listener || !timerId) {
        logger.error(`TimerService register failed timerId:${timerId}, listener:${listener}, ${(new Error()).stack}`);
        return;
    }
    // 不存在则初始化定时器
    if (!this.cache[timerId]) {
        this.cache[timerId] = 0;
    }
    this.isBroadcasts[timerId] = broadcast;
    this.app.Event.on([code.eventServer.PLAYER_SERVICE_TIMER.name, timerId], uid, listener);
};