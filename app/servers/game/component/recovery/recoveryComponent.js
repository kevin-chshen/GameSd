/* eslint-disable indent */
/**
 * @description 恢复次数管理模块
 * @author chenyq
 * @data 2020/04/21
 */

// const logger = require('pomelo-logger').getLogger('pomelo', __filename);

const bearcat = require('bearcat');
const code = require('@code');
const util = require('@util');

const RecoveryComponent = function (app, player) {
    this.$id = 'game_RecoveryComponent';
    this.$scope = 'prototype';
    this.app = app;
    this.player = player;
    this.recoveryTimerCache = {};
    this.recoveryItemToId = {};
};

bearcat.extend('game_RecoveryComponent', 'game_Component');
module.exports = RecoveryComponent;

/**
 * 数据
 recoveryInfo{
    1:{ num:0, lastTime:0 },
    2:{ num:0, lastTime:0 },
    3:{ num:0, lastTime:0 }
}
 */

/**
 * 登录加载所有恢复次数
 */
RecoveryComponent.prototype.onLoad = function () {
    for (const config of this.app.Config.CounterRecovery.values()) {
        if (config.ItemId > 0) {
            this.recoveryItemToId[config.ItemId] = config.Id;
        }
    }
    const nowTime = util.time.nowSecond();
    const recoveryInfo = this.player.recoveryInfo || {};
    for (const [id, config] of this.app.Config.CounterRecovery.entries()) {
        // 计算已恢复次数
        this.getRecovery(id, config, nowTime, util.object.deepClone(recoveryInfo[id]));
    }
    // 注册恢复扣除监听事件
    this.player.Event.on(code.event.RECOVERY_DEDUCT.name, (...params) => { this.onRecoveryDeduct(...params); });
    // 注册恢复增加监听事件
    this.player.Event.on(code.event.RECOVERY_ADD.name, (...params) => { this.onRecoveryAdd(...params); });
    // 注册恢复次数上限变化监听事件
    this.player.Event.on(code.event.RECOVERY_MAX_CHANGE.name, (...params) => { this.onRecoveryMaxChange(...params); });

};

RecoveryComponent.prototype.onClean = function(){
    // 玩家退出游戏关闭相应计时器
    for (const id of this.app.Config.CounterRecovery.keys()) {
        // 计算已恢复次数
        this.closeTimeout(id);
    }
};

RecoveryComponent.prototype.onDayChange = function (isOnTime, count) {
    // 按天恢复的
    this.timerRecovery(code.recovery.TYPE.DAY, count);
};

RecoveryComponent.prototype.onWeekChange = function (isOnTime, count) {
    // 按周恢复的
    this.timerRecovery(code.recovery.TYPE.WEEK, count);
};

/**
 * 到点恢复
 */
RecoveryComponent.prototype.timerRecovery = function (type, count) {
    for (const [id, config] of this.app.Config.CounterRecovery.entries()) {
        if (config.Type == type) {
            const recoveryInfo = this.player.recoveryInfo || { num: 0 };
            const maxNum = this.getMaxNum(config);
            if (recoveryInfo[id] && recoveryInfo[id].num < maxNum) {
                let addNum = count * config.EveryNum;
                if (addNum + recoveryInfo[id].num > maxNum) {
                    addNum = maxNum - recoveryInfo[id].num;
                }
                if (config.ItemId > 0) {
                    this.player.Item.addItem([{ itemID: config.ItemId, itemNum: addNum }], code.reason.OP_RECOVERY_GET);
                }
                else {
                    this.recoveryAdd(id, addNum);
                }
            }
        }
    }
};

RecoveryComponent.prototype.recoveryProcess = function (id) {
    const config = this.app.Config.CounterRecovery.get(id);
    if (config) {
        this.closeTimeout(id);
        const recoveryInfo = this.player.recoveryInfo || {};
        if (recoveryInfo[id]) {
            // 开启恢复计时器
            recoveryInfo[id].lastTime = util.time.nowSecond();
            if (config.ItemId > 0) {
                this.player.Item.addItem([{ itemID: config.ItemId, itemNum: config.EveryNum }], code.reason.OP_RECOVERY_GET);
            }
            else {
                this.recoveryAdd(id, config.EveryNum);
            }
            const maxNum = this.getMaxNum(config);
            if (recoveryInfo[id].num < maxNum && !this.recoveryTimerCache[id]) {
                this.openTimeout(id, config.Cd);
            }
        }
    }
};

/**
 * 登录获取最新恢复信息
 */
RecoveryComponent.prototype.getRecovery = function (id, config, nowTime, curInfo) {
    const maxNum = this.getMaxNum(config);
    if (!curInfo) {
        curInfo = { num: maxNum, lastTime: 0 };
    }
    const itemMgr = this.player.Item;
    if (config.ItemId > 0) {
        curInfo.num = itemMgr.getItemNum(config.ItemId);
    }
    let newNumInfo = util.object.deepClone(curInfo);
    if (config.Type == code.recovery.TYPE.CD) {
        // 计算已恢复次数
        newNumInfo = this.RecoveryNum(curInfo, nowTime, config);

        // 开启恢复计时器
        if (newNumInfo.num < maxNum && !this.recoveryTimerCache[id]) {
            const remainTime = (config.Cd + newNumInfo.lastTime) - nowTime;
            this.openTimeout(id, remainTime);
        }
    }
    else if (curInfo.lastTime <= 0) {
        // 定点恢复，初始化次数
        newNumInfo.num = curInfo.num > maxNum ? curInfo.num : maxNum;
        newNumInfo.lastTime = nowTime;
    }
    const info = this.player.recoveryInfo || {};
    info[id] = newNumInfo;
    this.player.recoveryInfo = info;
    if (config.ItemId > 0) {
        // 增加回復的物品
        const addNum = newNumInfo.num - curInfo.num;
        if (addNum > 0) {
            itemMgr.addItem([{ itemID: config.ItemId, itemNum: addNum }], code.reason.OP_RECOVERY_GET);
        }
    }
};
/**
 * 处理已恢复次数
 */
RecoveryComponent.prototype.RecoveryNum = function (curInfo, nowTime, config) {
    let num = curInfo.num || 0;
    // 最后恢复时间
    let lastTime = curInfo.lastTime || 0;
    // 修正错误数据
    if(lastTime > nowTime){
        // 最后一次恢复时间不应大于当前时间
        lastTime = nowTime;
    }
    const maxNum = this.getMaxNum(config);
    // 下次恢复时间
    let nextTime = lastTime + config.Cd;
    while (num < maxNum && nextTime <= nowTime) {
        num += config.EveryNum;
        nextTime = (num >= maxNum ? nowTime : nextTime) + config.Cd;
    }
    return { num: num, lastTime: nextTime - config.Cd };
};


/**
 * 获取信息
 */
RecoveryComponent.prototype.getRecoveryInfo = function (id) {
    const config = this.app.Config.CounterRecovery.get(id);
    if (!config) {
        return { id: id, num: 0, remainTime: 0 };
    }
    const recoveryInfo = this.player.recoveryInfo || {};
    if (recoveryInfo[id]) {
        const nowTime = util.time.nowSecond();
        const info = recoveryInfo[id];
        let remainTime = 0;
        if (config.Type == code.recovery.TYPE.CD) {
            remainTime = config.Cd - (nowTime - info.lastTime);
        }
        else {
            let timerId = 0;
            if (config.Type == code.recovery.TYPE.DAY) {
                timerId = 1;
            }
            else if (config.Type == code.recovery.TYPE.WEEK) {
                timerId = 2;
            }
            if (timerId > 0) {
                const nextTime = util.time.ms2s(this.app.Timer.getNextTriggerMS(timerId));
                if (nextTime && nextTime > nowTime) {
                    remainTime = nextTime - nowTime;
                }
            }
        }
        const maxNum = this.getMaxNum(config);
        if (info.num >= maxNum || remainTime < 0) {
            remainTime = 0;
        }
        let nextRecoveryTime = info.lastTime + config.Cd;
        if(nextRecoveryTime < nowTime){
            nextRecoveryTime = 0;
        }
        return { id: id, num: info.num, remainTime: remainTime, nextTime: nextRecoveryTime };
    }
};
/**
 * 判断次数是否足够
 * @param {Number} id 
 * @param {Number | Object} num 数量 或者 物品格式{106:10}
 */
RecoveryComponent.prototype.judgeRecoveryNum = function (id, num) {
    const config = this.app.Config.CounterRecovery.get(id);
    if (!config) {
        return false;
    }
    if (config.ItemId > 0) {
        // 以背包物品为准
        const costList = typeof (num) != "object"
            ? [{ itemID: config.ItemId, itemNum: num }]
            : util.proto.encodeConfigAward(num);
        if (this.player.Item.isEnough(costList)) {
            return true;
        }
    }
    else {
        const info = this.getRecoveryInfo(id);
        if (info.num >= num) {
            return true;
        }
    }
    return false;
};
/**
 * 外部调用 扣除恢复次数
 */
RecoveryComponent.prototype.deductRecovery = function (id, num = 1, reason = code.reason.OP_RECOVERY_DEDUCT_COST) {
    const config = this.app.Config.CounterRecovery.get(id);
    if (config) {
        if (config.ItemId > 0) {
            this.player.Item.deleteItem([{ itemID: config.ItemId, itemNum: num }], reason);
        }
        else {
            this.recoveryDeduct(id, num);
        }
    }
};
/**
 * 外部调用 增加恢复次数
 */
RecoveryComponent.prototype.addRecovery = function (id, num = 1, reason = code.reason.OP_RECOVERY_GET) {
    const config = this.app.Config.CounterRecovery.get(id);
    if (config) {
        if (config.ItemId > 0) {
            this.player.Item.addItem([{ itemID: config.ItemId, itemNum: num }], reason);
        }
        else {
            this.recoveryAdd(config.Id, num);
        }
    }
};
/**
 * 补满次数
 */
RecoveryComponent.prototype.fullUpRecovery = function(id){
    const config = this.app.Config.CounterRecovery.get(id);
    if (config) {
        const recoveryInfo = this.player.recoveryInfo || {};
        if (recoveryInfo[id]) {
            const nowTime = util.time.nowSecond();
            const maxNum = this.getMaxNum(config);

            const isFull = recoveryInfo[id].num >= maxNum ? true : false;
            if (!isFull && config.Type == code.recovery.TYPE.CD) {
                recoveryInfo[id].num = maxNum;
                recoveryInfo[id].lastTime = nowTime;
                // 超过上限 关闭计时器
                this.closeTimeout(id);
            }
            this.player.recoveryInfo = recoveryInfo;
            const info = this.getRecoveryInfo(id);
            this.recoveryNotify(info);
        }
    }
};
/**
 * 扣除次数
 */
RecoveryComponent.prototype.recoveryDeduct = function (id, num = 1) {
    const config = this.app.Config.CounterRecovery.get(id);
    if (config) {
        const recoveryInfo = this.player.recoveryInfo || {};
        if (recoveryInfo[id]) {
            const nowTime = util.time.nowSecond();
            const maxNum = this.getMaxNum(config);
            const isFull = recoveryInfo[id].num >= maxNum ? true : false;
            recoveryInfo[id].num -= num;
            if (isFull && recoveryInfo[id].num < maxNum && config.Type == code.recovery.TYPE.CD) {
                recoveryInfo[id].lastTime = nowTime;
                // 不足上限 开启恢复计时器
                this.openTimeout(id, config.Cd);
            }
            this.player.recoveryInfo = recoveryInfo;
            const info = this.getRecoveryInfo(id);
            this.recoveryNotify(info);
            return info;
        }
    }
    return {};
};
/**
 * 增加次数
 */
RecoveryComponent.prototype.recoveryAdd = function (id, num = 1) {
    const config = this.app.Config.CounterRecovery.get(id);
    if (config) {
        const recoveryInfo = this.player.recoveryInfo || {};
        if (recoveryInfo[id]) {
            const nowTime = util.time.nowSecond();
            const maxNum = this.getMaxNum(config);
            const isFull = recoveryInfo[id].num >= maxNum ? true : false;
            recoveryInfo[id].num += num;
            if (!isFull && recoveryInfo[id].num >= maxNum && config.Type == code.recovery.TYPE.CD) {
                recoveryInfo[id].lastTime = nowTime;
                // 超过上限 关闭计时器
                this.closeTimeout(id);
            }
            this.player.recoveryInfo = recoveryInfo;
            const info = this.getRecoveryInfo(id);
            this.recoveryNotify(info);
            return info;
        }
    }
    return {};
};
RecoveryComponent.prototype.onRecoveryDeduct = function (itemInfoList) {
    const dict = {};
    // 获取相关物品
    for (const i in itemInfoList) {
        const itemID = itemInfoList[i].itemID;
        const itemNum = itemInfoList[i].itemNum;
        const id = this.recoveryItemToId[itemID];
        if (id) {
            dict[id] = (dict[id] || 0) + itemNum;
        }
    }
    if (!util.object.isNull(dict)) {
        for (const [id, num] of Object.entries(dict)) {
            this.recoveryDeduct(id, num);
        }
    }
};
RecoveryComponent.prototype.onRecoveryAdd = function (itemInfoList) {
    const dict = {};
    // 获取相关物品
    for (const i in itemInfoList) {
        const itemID = itemInfoList[i].itemID;
        const itemNum = itemInfoList[i].itemNum;
        const id = this.recoveryItemToId[itemID];
        if (id) {
            dict[id] = (dict[id] || 0) + itemNum;
        }
    }
    if (!util.object.isNull(dict)) {
        for (const [id, num] of Object.entries(dict)) {
            this.recoveryAdd(id, num);
        }
    }
};
/**
 * 上限变化触发
 */
RecoveryComponent.prototype.onRecoveryMaxChange = function(){
    for (const config of this.app.Config.CounterRecovery.values()) {
        if (config.UpperLimit <= 0) {
            const recoveryInfo = this.player.recoveryInfo || {};
            const id = config.Id;
            if (recoveryInfo[id]) {
                const nowTime = util.time.nowSecond();
                const maxNum = this.getMaxNum(config);
                if (recoveryInfo[id].num < maxNum && config.Type == code.recovery.TYPE.CD) {
                    recoveryInfo[id].lastTime = nowTime;
                    // 不足上限 开启恢复计时器
                    this.openTimeout(id, config.Cd);

                    this.player.recoveryInfo = recoveryInfo;
                    const info = this.getRecoveryInfo(id);
                    this.recoveryNotify(info);
                }
            }
        }
    }
};

/**
 * 重置当前定时器
 */
RecoveryComponent.prototype.resetTimeout = function(id){
    const config = this.app.Config.CounterRecovery.get(id);
    if(config){
        if(this.recoveryTimerCache[id]){
            this.closeTimeout(id);
            this.openTimeout(id, config.Cd);
            const nowTime = util.time.nowSecond();
            const recoveryInfo = this.player.recoveryInfo || {};
            recoveryInfo[id].lastTime = nowTime;
            this.player.recoveryInfo = recoveryInfo;
            const info = this.getRecoveryInfo(id);
            this.recoveryNotify(info);
        }
    }
};

/**
 * 开启计时器
 * @param {Number} id
 * @param {Number} remainTime 秒
 */
RecoveryComponent.prototype.openTimeout = function (id, remainTime) {
    if (remainTime > 0 && !this.recoveryTimerCache[id]) {
        this.recoveryTimerCache[id] = setTimeout((id) => {
            this.recoveryProcess(id);
        }, remainTime * 1000, id);
    }
};
/**
 * 关闭计时器
 * @param {Number} id
 */
RecoveryComponent.prototype.closeTimeout = function (id) {
    if (this.recoveryTimerCache[id]) {
        clearTimeout(this.recoveryTimerCache[id]);
        delete this.recoveryTimerCache[id];
    }
};

/**
 * 获取恢复上限
 */
RecoveryComponent.prototype.getMaxNum = function (config) {
    let maxNum = 0;
    if (config) {
        if (config.UpperLimit > 0) {
            maxNum = config.UpperLimit;
        }
        else {
            if (config.Id == code.recovery.RECOVERY_TYPE.INVEST) {
                const fameNum = this.player.Fame.GetFameData(code.fame.FAME_CONFIG_DATA.INVEST_TIMES) || 0;
                const vipNum = this.player.Fame.GetVIPData(code.fame.VIP_CONFIG_DATA.INVEST_TIMES) || 0;
                maxNum = fameNum + vipNum;
            }
        }
    }
    return maxNum;
};
/**
 * 恢复次数广播
 */
RecoveryComponent.prototype.sendRecoveryNotify = function(id){
    const info = this.getRecoveryInfo(id);
    this.recoveryNotify(info);
};
RecoveryComponent.prototype.recoveryNotify = function(info){
    this.player.Notify.notify('onRecoveryInfoNotify', { recoveryInfo: info });
};