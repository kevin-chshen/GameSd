/**
 * @description 直播平台组件
 * @author chshen
 * @data 2020/03/23
 */
const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const code = require("@code");
const bearcat = require('bearcat');
/**
 * 数据结构
 * {
 *  // 平台数据
 *   platforms:{
 *      "id 平台ID" :{
 *          id 平台ID
 *          level 平台等级
 *          num 超级管家数量
 *          // 直播平台自身的每秒收益
 *          earnPerSecond: "string"
 *          cards:{
 *                  "cardId":slot 槽位
 *          }
 *      }
 *   }
 * }
*/
const LivePlatformBaseComponent = function (app, player) {
    this.$id = "game_LivePlatformBaseComponent";
    this.$scope = 'prototype';
    this.app = app;
    this.player = player;

    // 卡片ID对应的平台数据
    this.cards2pf = {}; // 卡片ID:平台ID

    // 平台管理
    this.pfMgr = {};

    // 核心平台每秒自动点击
    this.__autoClickAddMoney = 0;
    // 设置玩家的autoClickAddMoney的getter/setter函数
    Object.defineProperty(this, 'autoClickAddMoney', {
        get: function () { return this.__autoClickAddMoney; },
        set: function (value) { this.__autoClickAddMoney = value; }
    });
};
bearcat.extend('game_LivePlatformBaseComponent', 'game_Component');

module.exports = LivePlatformBaseComponent;


/**
 * 角色数据加载完成时调用
*/
LivePlatformBaseComponent.prototype.onLoad = function()
{
    if (!this.player.livePlatforms || Object.getOwnPropertyNames(this.player.livePlatforms).length == 0) {
        // 初始化拥有基础平台
        this.player.livePlatforms = {
            platforms: {
                [code.live.PLATFORM_BASE]:{
                    id: code.live.PLATFORM_BASE,
                    level: 1,
                    num: 0,
                    cards: {},
                    earnPerSecond: '0'
                }
            }
        };
    }

    const platforms = this.platforms();
    for (const [platId, plat] of Object.entries(platforms)) {
        // 生成{卡片ID->平台} 数据
        for (const cardId in plat.cards) {
            this.cards2pf[cardId] = platId;
        }

        // 初始化平台管理数据
        this.pfMgr[plat.id] = bearcat.getBean('game_LivePlatformBase', this.app, this.player, this, plat);
    }

    // 主平台每秒自动加钱
    const basePlatform = this.getBasePlatform();
    const cfg = this.app.Config.LivePlatform.getConfig(basePlatform.id, basePlatform.level);
    if (cfg != null && cfg.Cd != 0) {
        this.autoClickAddMoney = cfg.BaseReward || 0;
    }
};

/**
 * 登入
*/
LivePlatformBaseComponent.prototype.onAfterLoad = function() {
    this.player.Event.on(code.event.MGR_LEVEL_UP.name, (...args) => {
        this.dealAndSaveEarnPerSec(...args);
    });
    this.player.Event.on(code.event.LEVEL_UP.name, () => {
        this.dealAndSaveEarnPerSec();
    });
    this.player.Event.on(code.event.CARD_RESET.name, (cardId) => {
        if (this.cards2pf[cardId]) {
            this.dealAndSaveOnePlatformEarnPerSec(this.cards2pf[cardId]);
        }
    });
    this.player.Event.on(code.event.CARD_STAR.name, (cardId) => {
        if (this.cards2pf[cardId]) {
            this.dealAndSaveOnePlatformEarnPerSec(this.cards2pf[cardId]);
        }
    });
    this.player.Event.on(code.event.POPULARITY_CHANGE.name, (cardId) => {
        if (this.cards2pf[cardId]) {
            this.dealAndSaveOnePlatformEarnPerSec(this.cards2pf[cardId]);
        }
    });
};

/**
 * 计算一个平台的每秒赚钱
 * @param {Integer} platformId
*/
LivePlatformBaseComponent.prototype.dealAndSaveOnePlatformEarnPerSec = function(platformId) {
    const platform = this.getPlatform(platformId);
    if (platform) {
        platform.dealAndSaveEarnPerSec();
    }
};


/**
 * 替换平台对象
 * @param {Integer} id
 * @param {Object} platform
*/
LivePlatformBaseComponent.prototype.replacePlatform = function(id, platform) {
    if (id == 0 || platform == null){
        logger.info(`player:${this.player.uid} add id:${id}, platform:${JSON.stringify(platform)} failed`);
        return;
    }

    this.pfMgr[id] = platform;
};

/**
 * 替换卡牌
 * @param {Integer} platformId
 * @param {Integer} cardId
*/
LivePlatformBaseComponent.prototype.replaceCard = function(platformId, cardId) {
    this.cards2pf[cardId] = platformId;
};

/**
 * 移除卡牌
 * @param {Integer} cardId
*/
LivePlatformBaseComponent.prototype.removeCard = function(cardId) {
    delete this.cards2pf[cardId];
};

/**
 * 获取卡片隐射表信息
*/
LivePlatformBaseComponent.prototype.cards2Pf = function() {
    return this.cards2pf || {};
};

/**
 * 激活平台
 * @param {Integer} platformId 平台ID
 * @return {Object} 平台数据
*/
LivePlatformBaseComponent.prototype.active = function(platformId) {
    
    const platform = { id: platformId, level: 1, num: 0, cards: {}, earnPerSecond: '0' };

    const obj = bearcat.getBean('game_LivePlatformBase', this.app, this.player, this, platform);
    this.player.livePlatforms.platforms[platformId] = platform;
    this.pfMgr[platformId] = obj;

    obj.active();
    this.player.Event.emit(code.event.PLATFORM_BUILD.name);
    return obj.values();
};

/**
 * 获取平台数据
 * @param {Integer} id 平台ID
 * @return {Object} 平台
*/
LivePlatformBaseComponent.prototype.getPlatform = function(id)
{
    return this.pfMgr[id];
};

/**
 * 直播平台所有平台数据
*/
LivePlatformBaseComponent.prototype.platforms = function () {
    return this.player.livePlatforms.platforms || {};
};

/**
 * 每秒赚钱
 * @return {String}
*/
LivePlatformBaseComponent.prototype.getEarnPerSec = function () {
    let cashPerSecond = BigInt(0);
    for (const platform of Object.values(this.platforms())) {
        cashPerSecond += BigInt(platform.earnPerSecond || 0);
    }
    return cashPerSecond.toString();
};

/**
 * 获取基地平台
*/
LivePlatformBaseComponent.prototype.getBasePlatform = function(){
    return this.pfMgr[code.live.PLATFORM_BASE];
};

/**
 * 更新数据
 * @param {Object} platform
*/
LivePlatformBaseComponent.prototype.updatePlatforms = function (platform)
{
    const id = platform.id;
    const platforms = this.player.livePlatforms.platforms;
    platforms[id] = platform;

    this.player.livePlatforms = { platforms: platforms};
};

LivePlatformBaseComponent.prototype.getBasePlatformLeaveReward = function()
{
    const basePlatform = this.getBasePlatform();

    const baseCfg = this.app.Config.LivePlatform.getConfig(basePlatform.id, basePlatform.level);
    return baseCfg ? baseCfg.LevelReward : 0;
};

/**
 * 更新所有平台的每秒赚钱速度
 * @api public
*/
LivePlatformBaseComponent.prototype.dealAndSaveEarnPerSec = function() {
    for (const plat of Object.values(this.pfMgr)) {
        if (plat.id != code.live.PLATFORM_BASE) {
            plat.dealAndSaveEarnPerSec();
        }
    }
};

/**
 * 所有子平台ID
 * @api public
*/
LivePlatformBaseComponent.prototype.allChildrenPlatformIds = function () {
    const platformIds = [];
    for (const plat of Object.values(this.pfMgr)) {
        if (code.live.PLATFORM_BASE != plat.id)
            platformIds.push(plat.id);
    }
    return platformIds;
};


