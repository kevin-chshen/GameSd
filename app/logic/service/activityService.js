/**
 * @description 游戏内活动管理
 * @author chshen
 * @date 2020/05/22
 */
const bearcat = require('bearcat');
const util = require('@util');
const code = require('@code');
const assert = require('assert');

const ActivityService = function(){
    this.$id = 'logic_ActivityService';
    this.app = null;

    this.runInterval = null;
    
    this.activityList = {}; // 在线活动ID列表
    this.timers = [];    // {time:触发时间, id:xxx, isStart:xxx, startMs:xxx, stopMs:xxx, noticeId: 公告ID}]
};
module.exports = ActivityService;
bearcat.extend('logic_ActivityService', 'logic_BaseService');


ActivityService.prototype.shutdown = function () {
    clearInterval(this.runInterval);
};

ActivityService.prototype.afterStartUp = function() {
    // 开启计时，每秒检测活动开启
    this.runInterval = setInterval(() => {
        this._run();
    }, 1000);
};

ActivityService.prototype._run = function() {
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
ActivityService.prototype.initTimer = function(id, nowMs) {
    const cfg = this.app.Config.ActivityTime.get(id);
    const timer = this.app.Helper.ActivityTimer.initTimer(cfg.Type, nowMs, cfg.StartTime, cfg.EndTime);
    if (timer.time > 0) {
        this._registerTimer(cfg.Id, timer.time, timer.isStart, timer.startMs, timer.stopMs, cfg.NoticeId);
    }
    return timer;
}; 

/**
 * 在线活动Id列表
*/
ActivityService.prototype.onlineActivityIds = function() {
    return Object.keys(this.activityList);
};

/**
 * 判断活动是否开启
 */
ActivityService.prototype.isActivityOpen = function(id) {
    if(Object.keys(this.activityList).indexOf(id.toString())>=0){
        return true;
    }
    return false;
};

/**
 * 在线活动列表
 * @return {Id:timer}
*/
ActivityService.prototype.onlineActivityList = function () {
    return this.activityList;
};

/**
 * 获取活动ID 对应的计时器信息
*/
ActivityService.prototype.findTimer = function(id) {
    return this.app.Helper.ActivityTimer.findTimer(id, this.timers);
};

/**
 * 开启运营活动
*/
ActivityService.prototype.dealStart = function (id) {
    const timer = this.app.Helper.ActivityTimer.findTimer(id, this.timers);
    assert(timer, `ActivityService dealStart ${id} not found timer`);
    this._registerTimer(timer.id, timer.stopMs, false, timer.startMs, timer.stopMs, timer.noticeId);
    // 公告跑马灯
    if (timer.noticeId > 0) {
        // 公告 跑马灯
        this.app.Chat.bannerSysTpltChat(timer.noticeId);
    }
    this.activityList[id] = timer;
    this.app.Event.emit([code.eventServer.ACTIVITY_START_TIMER.name, id], timer);
    const info = {
        id: id,
        startMs: util.time.ms2s(timer.startMs),
        stopMs: util.time.ms2s(timer.stopMs),
    };
    // 通知活动开启
    this.app.Notify.broadcast('onSyncActivityStartNotify', {
        info: info
    });
};

/**
 * 关闭运营活动
*/
ActivityService.prototype.dealStop = function (id) {
    const timer = this.app.Helper.ActivityTimer.findTimer(id, this.timers);
    this.initTimer(id, util.time.nowMS());
    delete this.activityList[id];
    const info = {
        id: id,
        startMs: util.time.ms2s(timer.startMs),
        stopMs: util.time.ms2s(timer.stopMs),
    };
    // 通知活动关闭
    this.app.Notify.broadcast('onSyncActivityStopNotify', {
        info: info
    });
    // 关闭活动事件
    this.app.Event.emit([code.eventServer.ACTIVITY_STOP_TIMER.name, id], timer);
};

/**
 * 注册定时器
 * @api public
 * @param {Integer} id
 * @param {Integer} time
 * @param {Boolean} isStart true 开始 false 结束
 * @param {Integer} startMs
 * @param {Integer} stopMs
 * @param {Integer} noticeId 
*/
ActivityService.prototype._registerTimer = function (id, time, isStart, startMs, stopMs, noticeId) {
    const timer = {
        id: id,
        time: time,
        isStart: isStart,
        startMs: startMs,
        stopMs: stopMs,
        noticeId: noticeId,
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
ActivityService.prototype._unregisterTimer = function (id) {
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