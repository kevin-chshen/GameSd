/**
 * @description 定时器组件
 * @author chshen
 * @date 2020/04/29
 */
const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const code = require('@code');
const bearcat = require('bearcat');
const util = require('@util');
/**
 * {
        timers: {
            [timerId]:上传触发时间
        }
 * }
*/

const TimerComponent = function (app, player) {
    this.$id = 'game_TimerComponent';
    this.$scope = 'prototype';
    this.app = app;
    this.player = player;

    this.recurTimer = null;
    this.event = {};
};
module.exports = TimerComponent;
bearcat.extend('game_TimerComponent', 'game_Component');

/**
 * 初始化数据
*/
TimerComponent.prototype.dataInit = function () {
    this.recurTimer = this.player.recurTimer;
    if (!this.recurTimer || Object.values(this.recurTimer).length == 0) {
        this.recurTimer = {};
    }
    // 数据重新写入
    this.player.recurTimer = this.recurTimer;
};

/**
 * 加载
 * @api override public
*/
TimerComponent.prototype.onLoad = function () {
    this.dataInit();

    // 跨天触发定时器事件
    this.register(code.player.DAILY_DEFAULT_TIMER_ID, (...args)=>{
        this.player.dayChange(args[0].isOnTime, args[0].count);
    });
    // 跨周定时器
    this.register(code.player.WEEKLY_DEFAULT_TIMER_ID, (...args) => {
        this.player.weekChange(args[0].isOnTime, args[0].count);
    });
};

/**
 * 登录后
 * @api override public
*/
TimerComponent.prototype.onAfterLogin = function() {
    // 是否触发事件
    for (const [timerId, lastTriggerMs] of Object.entries(this.recurTimer)) {
        const serverLastTriggerMs = this.app.Timer.getLastTriggerMs(timerId);
        if (lastTriggerMs > 0 && serverLastTriggerMs > 0 && lastTriggerMs < serverLastTriggerMs) {
            const count = this.app.Timer.calTriggerCount(timerId, lastTriggerMs, serverLastTriggerMs);
            // 触发定时器事件
            const isOnTime = this.app.Timer.isOnTime(lastTriggerMs, serverLastTriggerMs);
            this.player.Event.emit([code.event.RECUR_TIMER.name, timerId], { timerId: timerId, isOnTime: isOnTime, count: count });
        }
    }
};


/**
 * 清除缓存
 * @api override public
*/
TimerComponent.prototype.onClean = function() {
    this.event = [];
};

/**
 * 触发定时器事件
 * @api public
*/
TimerComponent.prototype.emit = function (obj) {
    const timerId = obj.timerId;
    const serverLastTriggerMs = this.app.Timer.getLastTriggerMs(timerId);
    if (this.recurTimer[timerId] < serverLastTriggerMs && typeof listener == 'function') {
        this.eventEmitter.emit(event);
        this.recurTimer[timerId] = util.time.nowMS();
    }
    
};

/**
 * 注册
 * @api public
 * 离线状态下会触发则注册，这里只触发最近一次
*/
TimerComponent.prototype.register = function (timerId, listener) {
    if (!listener || !timerId) {
        logger.error(`TimerComponent register failed timerId:${timerId}, listener:${listener}`);
        return;
    }

    // 不存在则初始化定时器
    if (!this.recurTimer[timerId]) {
        this.recurTimer[timerId] = util.time.nowMS();
    }
    if (!this.event[timerId]) {
        this.event[timerId] = [];

        this.player.Event.on([code.event.RECUR_TIMER.name, timerId], (...args) => {
            this.tryDoListener(listener, timerId, ...args);
        });
    }

    this.event[timerId].push(listener);
};

/**
 * 注销
 * @api public
*/
TimerComponent.prototype.unRegister = function (timerId, listener) {
    if (!listener || !timerId) {
        logger.error(`TimerComponent unRegister failed timerId:${timerId}, listener:${listener}`);
        return;
    }

    if (!this.event[timerId]) {
        return;
    }

    const index = this.event[timerId].indexOf(listener);
    if (index > -1) {
        this.event[timerId].splice(index, 1);
    }

    if (this.event[timerId].length == 0) {
        delete this.event[timerId];

        this.player.Event.removeListener([code.event.RECUR_TIMER.name, timerId], );
    }
};

/**
 * 检测是否能触发
 * @param {Integer} timerId
*/
TimerComponent.prototype.tryDoListener = function (listener, timerId,  ...args) {
    const serverLastTriggerMs = this.app.Timer.getLastTriggerMs(timerId);
    if (this.recurTimer[timerId] < serverLastTriggerMs && typeof listener == 'function') {
        this.event[timerId].map((listener) =>{
            listener(...args);
        });
        this.recurTimer[timerId] = util.time.nowMS();
        this.player.Notify.notify('onSyncTimerNotify', { id: timerId });
    }
};


/**
 * 注册ID列表
 * @api public
 * 离线状态下会触发则注册，这里只触发最近一次
*/
TimerComponent.prototype.registerList = function (timerIds, listener) {
    if (Array.isArray(timerIds)) {
        timerIds.map((timerId)=>{
            this.register(timerId, listener);
        });
    } else {
        logger.error(`TimerComponent registerList timerIds not array, player:${this.player.uid}`);
    }
};






