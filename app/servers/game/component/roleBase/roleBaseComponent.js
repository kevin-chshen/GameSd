/**
 * @description 角色基础数据
 * @author chshen
 * @date 2020/03/30
 */
const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const code = require('@code');
const bearcat = require('bearcat');
const util = require('@util');
const assert = require('assert');

const RoleBaseComponent = function (app, player) {
    this.$id = "game_RoleBaseComponent";
    this.$scope = 'prototype';
    this.app = app;
    this.player = player;

    this.savePlayerDataTimer = null;
};
bearcat.extend('game_RoleBaseComponent', 'game_Component');

module.exports = RoleBaseComponent;

/**
 * 登录加载
*/
RoleBaseComponent.prototype.onLoad = function () {
    // 定时保存玩家数据
    this.savePlayerDataTimer = setInterval(() => {
        this.player.update();
    }, code.player.SAVE_PLAYER_DATA_INTERVAL_MS);
};

/**
 * 登录事件
 * @api override public
*/
RoleBaseComponent.prototype.onLogin = function () {
    this.__onlineLogInfoAdd();
};

/**
 * 重登录
 * @api override public
*/
RoleBaseComponent.prototype.onReLogin = function () {
    this.__onlineLogInfoDelete();
    this.__onlineLogInfoAdd();
};

/**
 * 加载后
 * @api override public
*/
RoleBaseComponent.prototype.onAfterLoad = function () {
    // 事件
    this.player.Event.on(code.event.CASH_PER_SECOND.name, (...params) => { this.onCashPerSecond(...params); });
    this.player.Event.on(code.event.MGR_EXP_CHANGED.name, () => { this.onChangedMgrExp(); });
    this.player.Event.on(code.event.PAY_DIAMOND.name, (...args) => { 
        this.onVipExpChanged(args[0]);
        this.onRmbChanged(args[0]);
    });
    this.player.Event.on(code.event.MONTH_CARD_REWARD.name, (...args) => { 
        this.onVipExpChanged(args[0]);
        this.onRmbChanged(args[0]);
    });
    this.player.Event.on(code.event.PAY_ZERO_GIFT.name, (...args) => {
        this.onVipExpChanged(args[0]);
        this.onRmbChanged(args[0]);
    });
    this.player.Event.on(code.event.PAY_DAILY_DISCOUNT.name, (...args) => {
        this.onVipExpChanged(args[0]);
        this.onRmbChanged(args[0]);
    });
    this.player.Event.on(code.event.PAY_FIRST.name, (...args) =>{
        this.firstPay(...args);
    });
    this.player.Event.on(code.event.VIP_CHANGED.name, (...params) => {
        this.vipChanged(...params); 
    });
    this.player.Event.on(code.event.RENAME.name, (...params) => {
        this.rename(...params);
    });
};

RoleBaseComponent.prototype.onAfterLogin = function () {
    // 登录后结算离线奖励
    const [dur, offlineTime] = this.offlineRevenueDur();
    const cashPerSecond = Number(this.player.cashPerSecond);
    if (dur > 0 && cashPerSecond > 0) {
        const addMoney = BigInt(dur) * BigInt(cashPerSecond);
        if (addMoney <= 0) { return; }
        this.player.Currency.add(code.currency.BIG_CURRENCY_ID.CASH, addMoney.toString(), 0, false);
        // 广播
        this.player.Notify.notify('onOfflineRevenueNotify', {
            offlineTime: offlineTime,
            validTime: dur,
            money: addMoney.toString(),
        });
    }
};

/**
 * 登出
 * @api override public
*/
RoleBaseComponent.prototype.onLogout = async function (reason) {
    this.player.sid = null;
    this.player.lastLogoutTime = util.time.nowMS();
    this.player.Event.emit(code.event.LAST_LOGOUT_TIME_UPDATE.name);

    // 离线日志,正常退出
    this.app.Log.quitLog(this.player, 0, "");
    // 用户日志
    this.app.Log.playerLog(this.player);

    if (reason != 'shutdown') {
        this.__onlineLogInfoDelete();
    }
};

/**
 * 跨天
*/
RoleBaseComponent.prototype.onDayChange = function() {
    // 跨天记录
    this.app.Log.loginLog(this.player);
};


/**
 * 清除数据
 * @api override public
*/
RoleBaseComponent.prototype.onClean = function () {
    clearInterval(this.savePlayerDataTimer);

    this.player.sid = null;
};

/**
 * 赚钱
 * @api private
*/
RoleBaseComponent.prototype.onCashPerSecond = function () {
    const oldCashPerSecond = this.player.cashPerSecond;
    // 直播平台每秒赚钱
    const livePlatformEarn = this.player.LivePfBase.getEarnPerSec();
    this.player.cashPerSecond = livePlatformEarn;
    if (BigInt(livePlatformEarn) > BigInt(oldCashPerSecond)) {
        this.player.Event.emit(code.event.CASH_PER_SECOND_AFTER.name, oldCashPerSecond, livePlatformEarn);
        this.player.Event.emit(code.event.FAME_UP.name);
    }

    // 同步更新
    this.player.Notify.notify('onSyncCashPerSecondNotify', {
        data: this.player.cashPerSecond
    });
};

/**
 * 管理经验变化
 * @api private
*/
RoleBaseComponent.prototype.onChangedMgrExp = function () {
    // 检测管理等级是否提示
    let mgrLv = this.player.mgrLv;
    const mgrExp = this.player.Currency.get(code.currency.CURRENCY_ID.MGR_EXP);
    for (; ;) {
        const cfg = this.app.Config.ManageLevel.get(mgrLv + 1);
        if (!cfg || !cfg.Exp || cfg.Exp > mgrExp) {
            break;
        }
        mgrLv += 1;
    }
    const oldLv = this.player.mgrLv;
    if (oldLv < mgrLv) {
        this.player.mgrLv = mgrLv;
        this.player.Notify.notify('onSyncLivePlatformMgrInfoNotify', { mgrLv: mgrLv });

        // 管理等级升级事件
        this.player.Event.emit(code.event.MGR_LEVEL_UP.name, oldLv, mgrLv);
    }
};

/**
 * vip经验变化
 * @param {Integer} payId 付费ID
*/
RoleBaseComponent.prototype.onVipExpChanged = function (payId) {
    const cfg = this.app.Config.Pay.get(payId);
    if (!cfg) {
        logger.error(`RoleBaseComponent onVipExpChanged cfgId:${payId}, player:${this.player.uid}`);
        return;
    }

    const changedExp = cfg.VipExp;
    if (changedExp == 0) {
        return;
    }
    // 检测管理等级是否提示
    let vipLv = this.player.vip;
    this.player.vipExp += changedExp;
    const vipExp = this.player.vipExp;
    for (; ;) {
        const data = this.app.Config.Vip.get(vipLv + 1);
        if (!data || !data.VipExp || data.VipExp > vipExp) {
            break;
        }
        vipLv += 1;
    }

    const oldLv = this.player.vip;

    if (oldLv < vipLv) {
        this.player.vip = vipLv;
        this.player.Event.emit(code.event.VIP_CHANGED.name, oldLv, vipLv);
        this.player.Event.emit(code.event.RECOVERY_MAX_CHANGE.name);
    }
    this.player.Notify.notify('onSyncVipNotify', { vipLv: vipLv, vipExp: vipExp });
};

/**
 * rmb变化
*/
RoleBaseComponent.prototype.onRmbChanged = function(payId) {
    const cfg = this.app.Config.Pay.get(payId);
    assert(cfg, `RoleBaseComponent onRmbChanged cfgId:${payId}, player:${this.player.uid}`);

    // 首充标记
    this.player.rechargeMoney += cfg.Rmb;

    // 通知累计充值金额
    this.player.Notify.notify('onSyncPayRmbNotify', {
        rmb: this.player.rechargeMoney
    });
};

/**
 * 首充
*/
RoleBaseComponent.prototype.firstPay = function() {
    // 通知首充
    if (this.player.firstPay == 0) {
        this.player.Notify.notify('onSyncPayFirstNotify', {});
    }
    this.player.firstPay = 1;
};


/**
 * vip等级变化
*/
RoleBaseComponent.prototype.vipChanged = function (oldVip, newVip) {
    // 恢复注资次数
    const num = this.app.Config.Vip.get(newVip).InvestTimes - this.app.Config.Vip.get(oldVip).InvestTimes;
    logger.info(`RoleBaseComponent vipChanged oldVip:${oldVip}, newVip:${newVip}, num:${num}`);
    if (isNaN(num)) {
        return;
    }
    // 写死3 表示恢复注册次数
    this.player.Recovery.addRecovery(3, num);
};

/**
 * 重命名
*/
RoleBaseComponent.prototype.rename = function() {
    // 改名加入聊天监控
    const msg = {
        channelId: code.chat.CHANNEL.NONE,
        text: "",
        msgType: 0,
        targetUid: 0,
    };
    this.app.Log.chatLog(this.player, msg);
};




/**
 * @api private
*/
RoleBaseComponent.prototype.__onlineLogInfoAdd = async function () {
    // 记录平台+设备信息
    const act = this.player.accountData;
    if (act) {
        const ci = act.clientInfo;
        const platform = [act.platform, ci.fngid].join('_');
        const device = ci.device;
        // 记录平台
        this.app.Redis.hset(code.redis.ONLINE_LOG_INFO.name, platform, 1);

        // 在线人数
        this.app.Redis.zincrby([code.redis.LOG_ONLINE_PEOPLE.name, platform], 1, device);
        // 在线IP
        this.app.Redis.hget([code.redis.LOG_ONLINE_IP.name, platform], ci.device).then(({ err, res }) => {
            if (err) {
                logger.error(`RoleBaseComponent onlineLogInfoAdd uid:${this.player.uid} get ip platform:${platform} error:%j`, err);
                return;
            }
            res = (res != null) ? JSON.parse(res) : {};
            res[act.userIp] = 1;
            this.app.Redis.hset([code.redis.LOG_ONLINE_IP.name, platform], device, JSON.stringify(res));
        });
        // 在线设备
        this.app.Redis.hget([code.redis.LOG_ONLINE_DID.name, platform], ci.device).then(({ err, res }) => {
            if (err) {
                logger.error(`RoleBaseComponent onlineLogInfoAdd uid:${this.player.uid} get did platform:${platform} error:%j`, err);
                return;
            }
            res = (res != null) ? JSON.parse(res) : {};
            res[ci.did] = 1;
            this.app.Redis.hset([code.redis.LOG_ONLINE_DID.name, platform], device, JSON.stringify(res));
        });
    }
};
/**
 * @api private
*/
RoleBaseComponent.prototype.__onlineLogInfoDelete = async function () {
    // 记录平台+设备信息
    const act = this.player.accountData;
    if (act) {
        const ci = act.clientInfo;
        const platform = [act.platform, ci.fngid].join('_');
        const device = ci.device;

        // 在线人数
        this.app.Redis.zincrby([code.redis.LOG_ONLINE_PEOPLE.name, platform], -1, device);
        // 在线IP
        this.app.Redis.hget([code.redis.LOG_ONLINE_IP.name, platform], device).then(({ err, res }) => {
            if (err || !res) {
                logger.error(`RoleBaseComponent onlineLogInfoDelete uid:${this.player.uid} get ip platform:${platform} error:%j`,err);
                return;
            }
            res = JSON.parse(res);
            delete res[act.userIp];
            this.app.Redis.hset([code.redis.LOG_ONLINE_IP.name, platform], device, JSON.stringify(res));
        });

        // 在线设备
        this.app.Redis.hget([code.redis.LOG_ONLINE_DID.name, platform], device).then(({ err, res }) => {
            if (err || !res) {
                logger.error(`RoleBaseComponent onlineLogInfoDelete uid:${this.player.uid} get did platform:${platform} error:%j`, err);
                return;
            }
            res = JSON.parse(res);
            delete res[ci.did];
            this.app.Redis.hset([code.redis.LOG_ONLINE_DID.name, platform], device, JSON.stringify(res));
        });
    }
};

/**
 * 离线收益时长 秒
 * @return {Number}
*/
RoleBaseComponent.prototype.offlineRevenueDur = function () {
    const offlineTime = Math.floor((util.time.nowMS() - this.player.lastLogoutTime) / 1000);
    let maxDur = 0;
    const cfg = this.app.Config.Prestige.get(this.player.lv);
    if (cfg && cfg.OfflineTime) {
        maxDur += cfg.OfflineTime;
    }
    const vipConfig = this.app.Config.Vip.get(this.player.vip);
    if (vipConfig && vipConfig.OfflineTime) {
        maxDur += vipConfig.OfflineTime;
    }
    return [Math.min(maxDur, offlineTime), offlineTime];
};


/**
 * 离线收益时长毫秒
 * @param {Integer} timeMS
 * @return {Number}
*/
RoleBaseComponent.prototype.offlineRevenueDurByTimeMS = function (timeMS) {
    timeMS = timeMS || 0;
    const dur = util.time.nowMS() - timeMS;
    let maxDur = 0;
    const cfg = this.app.Config.Prestige.get(this.player.lv);
    if (cfg && cfg.OfflineTime) {
        maxDur += cfg.OfflineTime * 1000;
    }
    const vipConfig = this.app.Config.Vip.get(this.player.vip);
    if (vipConfig && vipConfig.OfflineTime) {
        maxDur += vipConfig.OfflineTime * 1000;
    }
    return Math.min(maxDur, dur);
};
