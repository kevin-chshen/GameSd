/**
 * @description 运营活动管理
 * @author chshen
 * @date 2020/05/22
 */
//const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const bearcat = require('bearcat');
const util = require('@util');
const code = require('@code');

const OperateService = function () {
    this.$id = 'logic_OperateService';
    this.app = null;

    this.runInterval = null;
    this.activityList = {}; // 在线活动ID:timer
    // isStart true：表示时间到则触发开始， false 表示 时间到触发结束
    this.timers = [];    // {time:触发时间, id:xxx, isStart:xxx, startMs:xxx, stopMs:xxx}]
    this.isBroadcast = {};  // 是否需要广播
};
module.exports = OperateService;
bearcat.extend('logic_OperateService', 'logic_BaseService');


OperateService.prototype.shutdown = function () {
    clearInterval(this.runInterval);
};

OperateService.prototype.afterStartUp = function () {
    // 开启计时，每秒检测活动开启
    this._run();
    this.runInterval = setInterval(() => {
        this._run();
    }, 1000);
    this.app.Event.emit(code.eventServer.OPERATE_INIT_FINISH.name);
};

/**
 * 运行
 */
OperateService.prototype._run = function () {
    // 检测活动是否开始
    const nowMs = util.time.nowMS();
    for (; ;) {
        const mod = this.timers[0];
        if (mod && nowMs >= mod.time) {
            const id = mod.id;
            if (mod.isStart) {
                this.dealStart(id);
            } else {
                this.dealStop(id);
            }
            this.timers.splice(0, 1);
        } else {
            break;
        }
    }
};

/**
 * 初始化计时器
 */
OperateService.prototype.initTimer = function (id, nowMs) {
    const cfg = this.app.Config.OperateBaseActivity.get(id);
    const timer = this.app.Helper.ActivityTimer.initTimer(cfg.SwitchType, nowMs, cfg.OpenDate, cfg.CloseDate);
    if (timer.time > 0) {
        this._registerTimer(cfg.Id, timer.time, timer.isStart, timer.startMs, timer.stopMs);
    }
    return timer;
};

/**
 * 活动Id是否在线
*/
OperateService.prototype.actIdOnline = function (actId) {
    return this.activityList[actId] != null;
};

/**
 * 在线活动Id列表
*/
OperateService.prototype.onlineActivityIds = function () {
    return Object.keys(this.activityList);
};

/**
 * 在线活动列表
*/
OperateService.prototype.onlineActivityList = function () {
    return this.activityList;
};

/**
 * 获取活动ID 对应的计时器信息
*/
OperateService.prototype.findTimer = function(id) {
    return this.app.Helper.ActivityTimer.findTimer(id, this.timers);
};

/**
 * 开启运营活动
*/
OperateService.prototype.dealStart = function (id) {
    const timer = this.app.Helper.ActivityTimer.findTimer(id, this.timers);
    this._registerTimer(timer.id, timer.stopMs, false, timer.startMs, timer.stopMs);
    this.activityList[id] = timer; 
    // 开启活动事件
    this.app.Event.emit([code.eventServer.OPERATE_START_TIMER.name, id], timer);
};

/**
 * 关闭运营活动
*/
OperateService.prototype.dealStop = function (id) {
    const timer = this.app.Helper.ActivityTimer.findTimer(id, this.timers);
    this.initTimer(id, util.time.nowMS());
    delete this.activityList[id];
    // 关闭活动事件
    this.app.Event.emit([code.eventServer.OPERATE_STOP_TIMER.name, id], timer);
};

/**
 * 注册定时器
 * @api public
 * @param {Integer} id
 * @param {Integer} time
 * @param {Boolean} isStart true 开始 false 结束
 * @param {Integer} startMs
 * @param {Integer} stopMs
*/
OperateService.prototype._registerTimer = function (id, time, isStart, startMs, stopMs) {
    const timer = {
        id: id,
        time: time,
        isStart: isStart,
        startMs: startMs,
        stopMs: stopMs,
    };
    this.timers.push(timer);
    if (this.timers.length > 1) {
        this.timers.sort((lsh, rsh) => {
            return lsh.time - rsh.time;
        });
    }
};

/**
 * 注销定时器
 * @api public
 * @param {Integer} id 活动ID
*/
OperateService.prototype._unregisterTimer = function (id) {
    for (let index = 0, len = this.timers.length; index < len; ++index) {
        const mod = this.timers[index];
        if (mod.id == id) {
            this.timers.splice(index, 1);
            return;
        }
    }
    // 活动在线则关闭
    this.dealStop(id);
    delete this.activityList[id];
};