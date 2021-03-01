/**
 * @description 头衔管理模块
 * @author chenyq
 * @data 2020/04/09
 */

const logger = require('pomelo-logger').getLogger('pomelo', __filename);

// let pomelo = require('pomelo');
const bearcat = require('bearcat');
const code = require('@code');
const util = require('@util');

//  db数据
//  个性宣言    manifesto
//  每日奖励    fameDailyReward{order:最后领取阶段，lastTime:最后领取时间}

const FameComponent = function (app, player) {
    this.$id = 'game_FameComponent';
    this.$scope = 'prototype';
    this.app = app;
    this.player = player;
};

bearcat.extend('game_FameComponent', 'game_Component');
module.exports = FameComponent;

FameComponent.prototype.onAfterLoad = function () {
    // 注册头衔升阶监听事件
    this.player.Event.on(code.event.FAME_UP.name, (...params) => { this.onFameUp(...params); });

};
/**
 * 监听头衔升级
 */
FameComponent.prototype.onFameUp = function () {
    const lv = this.player.lv;
    const config = this.app.Config.Prestige.get(lv);
    const reputation = this.player.Currency.get(code.currency.CURRENCY_ID.REPUTATION);
    const cashPerSecond = this.player.cashPerSecond;
    const lvList = [];
    const newLv = lv + 1;
    // 获取可提升的阶级
    const maxLv = this.app.Config.Prestige.keyMax();
    for (let i = newLv; i <= maxLv; i++) {
        const nextConfig = this.app.Config.Prestige.get(i);
        if (!nextConfig ||
            config.Order != nextConfig.Order ||
            reputation < nextConfig.PrestigeValue ||
            cashPerSecond < nextConfig.MakeMoneySpeed) {
            break;
        }
        lvList.push(i);
    }
    this.fameUpgrade(lvList);
};
/**
 * 头衔升级
 * @param {Array} lvList 提升等级列表
 * @returns {Void}
 */
FameComponent.prototype.fameUpgrade = function (lvList) {
    if (lvList.length <= 0) {
        return;
    }
    let maxLv = this.player.lv;
    const rewardList = [];
    for (const lv of lvList) {
        const config = this.app.Config.Prestige.get(lv);
        if (config) {
            rewardList.push(config.LevelReward);
            if (lv > maxLv) {
                maxLv = lv;
            }
        }
    }
    if (maxLv != this.player.lv) {
        const oldLv = this.player.lv;
        this.player.lv = maxLv;
        this.player.Item.addItem(util.proto.encodeConfigAward(rewardList), code.reason.OP_FAME_UPGRADE_GET, ()=>{
            logger.info(`player:${this.player.uid} fameUpgrade lvList:${lvList}`);
            // 通知前端
            this.channelNotify("onFameUpgrade", { lvList: lvList });
        });

        this.player.Event.emit(code.event.LEVEL_UP.name, { oldLv: oldLv, newLv: maxLv });
        this.player.Event.emit(code.event.RECOVERY_MAX_CHANGE.name);

        const reputation = this.player.Currency.get(code.currency.CURRENCY_ID.REPUTATION);
        this.app.Log.levelUpLog(this.player, oldLv, maxLv, reputation, reputation);
    }
};
/**
 * 通知客户端信息
 * @param {String} name 通知名称
 * @param {Object} data 通知信息
 * @returns {Void}
 */
FameComponent.prototype.channelNotify = function (name, data) {
    this.app.get('channelService').pushMessageByUids(name, data,
        [{ uid: this.player.uid, sid: this.player.connectorId }]);
};

/**
 * 每日奖励是否已领取
 * @param {Object} config 配置信息
 * @returns {Bool} true已领取,false未领取
 */
FameComponent.prototype.isGetDailyReward = function (config) {
    const info = this.player.fameDailyReward || {};
    if ((info.order || 0) === config.Order && util.time.isSameDay(info.lastTime || 0)) {
        return true;
    }
    else {
        return false;
    }
};

/**
 * 修改头衔等级 TODO GM使用
 * @param {Integer} lv 变更的头衔等级
 * @returns {Void}
 */
FameComponent.prototype.AlterLv = function (lv) {
    const oldLv = this.player.lv;
    const maxLv = this.app.Config.Prestige.keyMax();
    const newLv = lv > maxLv ? maxLv : lv;
    this.player.lv = newLv;
    this.channelNotify("onFameUpgrade", { lvList: [newLv] });
    this.player.Event.emit(code.event.LEVEL_UP.name, { oldLv: oldLv, newLv: newLv });
    this.player.Event.emit(code.event.RECOVERY_MAX_CHANGE.name);

    const reputation = this.player.Currency.get(code.currency.CURRENCY_ID.REPUTATION);
    this.app.Log.levelUpLog(this.player, oldLv, this.player.lv, reputation, reputation);
};

/**
 * 获取当前头衔对应数据
 * @param {code.Fame.FAME_CONFIG_DATA} field 对应配置表字段
 * @param {Number | undefined} lv 对应头衔 默认当前角色头衔等级
 * @returns {Number | String | Object | Array | undefined}
 */
FameComponent.prototype.GetFameData = function (field, lv = this.player.lv) {
    const config = this.app.Config.Prestige.get(lv);
    if (config) {
        return config[field];
    }
    else {
        return undefined;
    }
};

/**
 * 获取当前头衔对应数据
 * @param {code.Fame.FAME_CONFIG_DATA} field 对应配置表字段
 * @param {Number | undefined} lv 对应头衔 默认当前角色头衔等级
 * @returns {Number | String | Object | Array | undefined}
 */
FameComponent.prototype.GetVIPData = function (field, vip = this.player.vip) {
    const config = this.app.Config.Vip.get(vip);
    if (config) {
        return config[field];
    }
    else {
        return undefined;
    }
};