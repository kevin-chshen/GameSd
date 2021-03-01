/**
 * @description 运营活动模块
 * @author chshen
 * @data 2020/05/25
 */
const bearcat = require('bearcat');
const code = require('@code');
const util = require('@util');
/**
 * 数据结构
 * {
 *      [运营活动ID] : {
 *          startMs: 开始时间，如果开始时间更新则重置数据
 *          detail: 每个活动模板有自己的数据结构定义
 *      }
 * }
 * 缓存
 * operateMgr: {
 *      [运营活动id] : 活动对象
 * }
*/
const OperateComponent = function(app, player) {
    this.$id = 'game_OperateComponent';
    this.$scope = 'prototype';
    this.app = app;
    this.player = player;

    this.operateMgr = {};
};
bearcat.extend('game_OperateComponent', 'game_Component');
module.exports = OperateComponent;

/**
 *  登入
 */
OperateComponent.prototype.onAfterLoad = function() {
    // 监听活动
    const operateTypes = code.activity.OPERATE_TYPE;
    for (const type of Object.values(operateTypes)) {
        const ids = this.app.Config.OperateBaseActivity.getIdsByType(type);
        if (ids && Array.isArray(ids)) {
            ids.map((id) => {
                this.player.Event.on([code.event.OPERATE_START_TIMER.name, id], (...args) => {
                    this.onStartEvent(args[0].id, args[0].startMs, args[0].stopMs);
                });
                this.player.Event.on([code.event.OPERATE_STOP_TIMER.name, id], (...args) => {
                    this.onStopEvent(args[0].id, args[0].startMs, args[0].stopMs);
                });
            });
        }
    }
    
    // 历史数据
    for (const [id, data] of Object.entries(this.player.operate)) {
        this.operateMgr[id] = this.create(id, data);
        this.operateMgr[id].init();
    }
    
    const operates = this.app.Operate.onlineActivityList();
    // 已关闭活动结算
    const removeIds = [];
    const onlineOperates = Object.keys(operates);
    for (const [id, op] of Object.entries(this.operateMgr)) {
        if (onlineOperates.indexOf(id) == -1) {
            op.stop();
            removeIds.push(id);
            // 运营活动开启
            this.app.Log.operateActivityLog(this.player, id, false, op.getStartMs(), util.time.nowMS());
        }
    }
    removeIds.map((id) =>{
        delete this.player.operate[id];
        delete this.operateMgr[id];
    });
    
    // 重置或创建新活动
    for (const timer of Object.values(operates)) {
        const id = timer.id;
        const startMs = timer.startMs;
        const stopMs = timer.stopMs;
        const obj = this.operateMgr[id];
        if (obj) {
            if (obj.getStartMs() != startMs) {
                obj.reset(startMs, stopMs);
                obj.start();
                this.app.Log.operateActivityLog(this.player, id, true, startMs, stopMs);
            }
        } else {
            // 创建新数据
            const op = this.create(id, null, startMs, stopMs);
            op.init();
            op.start();
            this.operateMgr[id] = op;
            this.app.Log.operateActivityLog(this.player, id, true, startMs, stopMs);
        }
    }
};

/**
 * 跨天
*/
OperateComponent.prototype.onDayChange = function (isOnTime, count) {
    for (const op of Object.values(this.operateMgr)) {
        op.onDayChange(isOnTime, count);
    }
};


/**
 * 获取运营活动对象
*/
OperateComponent.prototype.get = function(actId) {
    return this.operateMgr[actId];
};

/**
 * 检测并返回运营活动对象
*/
OperateComponent.prototype.checkAndGet = function(actId, type) {
    const operateCfg = this.app.Config.OperateBaseActivity.get(actId);
    if (!operateCfg || operateCfg.Type != type) {
        return null;
    }
    return this.player.Operate.get(actId);
};

/**
 * 开始活动
 */
OperateComponent.prototype.onStartEvent = function(id, startMs, stopMs){
    let act = this.operateMgr[id];
    if (act) {
        if (act.getStartMs() != startMs) {
            // 重置数据
            act.reset(startMs, stopMs);
        }
    } else {
        this.operateMgr[id] = this.create(id, null, startMs, stopMs);
        act = this.operateMgr[id];
        act.init();
    }
    act.start();

    // 运营活动开启
    this.app.Log.operateActivityLog(this.player, id, true, startMs, stopMs);
    
    const info = {
        id: id,
        startMs: util.time.ms2s(startMs),
        stopMs: util.time.ms2s(stopMs),
    };
    // 通知活动关闭
    this.player.Notify.notify('onSyncOperateStopNotify', {
        info: info
    });
};

/**
 * 关闭活动
 */
OperateComponent.prototype.onStopEvent = function (id, startMs, stopMs) {
    // 运营活动关闭处理
    const act = this.operateMgr[id];
    if (act) {
        act.stop();
        delete this.player.operate[id];
        delete this.operateMgr[id];
    }
    // 运营活动开启
    this.app.Log.operateActivityLog(this.player, id, false, startMs, stopMs);

    const info = {
        id: id,
        startMs: util.time.ms2s(startMs),
        stopMs: util.time.ms2s(stopMs),
    };
    // 通知活动关闭
    this.player.Notify.notify('onSyncOperateStopNotify', {
        info: info
    });
};

/**
 * 创建
 */
OperateComponent.prototype.create = function (id, data, startMs, stopMs) {
    const type = this.app.Config.OperateBaseActivity.getType(id);
    data = data || { startMs: startMs };
    let obj = null;
    switch (type) {
    // 每日充值
    case code.activity.OPERATE_TYPE.DAILY_PAY:
        obj = bearcat.getBean('game_OperateDailyPay', this.app, this.player, id, type, data);
        break;
    // 累计充值
    case code.activity.OPERATE_TYPE.ADD_UP_PAY:
        obj = bearcat.getBean('game_OperateAddUpPay', this.app, this.player, id, type, data);
        break;
    // 累天充值
    case code.activity.OPERATE_TYPE.DAYS_PAY:
        obj = bearcat.getBean('game_OperateDaysPay', this.app, this.player, id, type, data);
        break;
    // 特惠礼包
    case code.activity.OPERATE_TYPE.DAILY_DISCOUNT:
        obj = bearcat.getBean('game_OperateDiscount', this.app, this.player, id, type, data);
        break;
    // 0元礼包
    case code.activity.OPERATE_TYPE.ZERO_GIFT:
        data.stopMs = data.stopMs||stopMs;
        obj = bearcat.getBean('game_OperateZeroGift', this.app, this.player, id, type, data);
        break;
    // 每日签到
    case code.activity.OPERATE_TYPE.DAILY_SIGN:
        obj = bearcat.getBean('game_OperateDailySign', this.app, this.player, id, type, data);
        break;
    // 转盘
    case code.activity.OPERATE_TYPE.TURNTABLE:
        obj = bearcat.getBean('game_OperateTurntable', this.app, this.player, id, type, data);
        break;
    // 七日登录
    case code.activity.OPERATE_TYPE.SEVEN_DAY:
        obj = bearcat.getBean('game_OperateSevenDay', this.app, this.player, id, type, data);
        break;
    // 全民夺宝
    case code.activity.OPERATE_TYPE.TREASURE:
        obj = bearcat.getBean('game_OperateTreasure', this.app, this.player, id, type, data);
        break;
    default:
        obj = bearcat.getBean('game_OperateBase', this.app, this.player, id, type, data);
        break;
    }

    this.player.operate[id] = obj.getData();

    return obj;
};
