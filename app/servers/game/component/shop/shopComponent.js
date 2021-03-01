/**
 * @description 商店模块
 * @author chshen
 * @date 2020/04/23
 */
const bearcat = require('bearcat');
const util = require('@util');

/**
    {
        lastMysteryRefreshMs: 上次系统自动刷新时间
        //神秘商店列表
        mystery {
            [商店ID] ：｛
                firstRefresh: 首次刷新,
                hadFreeRefreshCount: 免费已经手动刷新次数
                hadPayRefreshCount: 付费已经手动刷新次数
                //已购物品列表
                goods:{商品UID:商品ID}
                buys：[已购买的商品UID]
                //奖池抽取失败次数列表
                extracts:{
                    [奖池]：次数
                }
            }
        },
        //直营商店列表
        directSale {
            已购买商品ID：次数
        }
    }
*/

const ShopComponent = function (app, player) {
    this.$id = "game_ShopComponent";
    this.$scope = 'prototype';
    this.app = app;
    this.player = player;

    // 数据
    this.data = null;

    // 直营店对象
    this.directSaleShop = null;
    this.mysteryMgr = {};
};
bearcat.extend('game_ShopComponent', 'game_Component');
module.exports = ShopComponent;

/**
 * 初始化数据库 
 * @api private
*/
ShopComponent.prototype.dataInit = function() {
    this.data = this.player.shop;
    if (!this.data || Object.keys(this.data).length == 0) {
        this.data = {
            mystery: {},
            directSale: {},
            lastMysteryRefreshMs: 0,
        };
    } 
    // 添加所有神秘商店数据
    const mysteryList = this.app.Config.ShopList.getMysteryList();
    for (const shop of mysteryList) {
        this.data.mystery[shop.ID] = this.data.mystery[shop.ID] || {};
    }
};

/**
 * 加载
 * @api override public
*/
ShopComponent.prototype.onLoad = function () {
    // 初始化数据
    this.dataInit();

    // 加载商店模板
    this.directSaleShop = bearcat.getBean('game_ShopDirectSale', this.app, this.player, this.data.directSale);
    // 加载神秘商店
    for (const [shopId, shop] of Object.entries(this.data.mystery)) {
        this.mysteryMgr[shopId] = bearcat.getBean('game_ShopMystery', this.app, this.player, Number(shopId), shop);
    }

    // 补充初始化数据
    // 直播商店数据
    this.data.directSale = this.directSaleShop.getGoods();
    // 神秘商店数据
    for (const [id, shop] of Object.entries(this.mysteryMgr)) {
        this.data.mystery[id] = shop.getData();
    }

    this.player.shop = this.data;

    // 开启商店
    this.directSaleShop.start();
    for (const shop of Object.values(this.mysteryMgr)) {
        shop.start();
    }
};

/**
 * 清除
 * @api override public
*/
ShopComponent.prototype.onClean = function () {
    // 关闭商店
    this.directSaleShop.close();
    for (const shop of Object.values(this.mysteryMgr)) {
        shop.close();
    }
    // 卸载商店模板
    this.directSaleShop = null;
    this.mysteryMgr = {};
};

/**
 * 跨天
 * @api override public
*/
ShopComponent.prototype.onDayChange = function () {

    this.directSaleShop.onDayChange();

    for (const mystery of Object.values(this.mysteryMgr)) {
        mystery.onDayChange();
    }
};

/**
 * 跨周
 * @api override public
*/
ShopComponent.prototype.onWeekChange = function () {
    this.directSaleShop.onWeekChange();
};

/**
 * 查询
*/
ShopComponent.prototype.query = function() {
    return this.data;
};

/**
 * 获取直营店对象
 * @api public
 * @return {Object}
*/
ShopComponent.prototype.getShopDirecSale = function() {
    return this.directSaleShop;
};

/**
 * 获取神秘商店
 * @api public
 * @param {Integer} shopId
 * @return {Object}
*/
ShopComponent.prototype.getMystery = function(shopId) {
    return this.mysteryMgr[shopId];
};


/**
 * 计算下次自动刷新时间
*/
ShopComponent.prototype.calNextAutoRefreshTime = function (shopId) {

    const shopListCfg = this.app.Config.ShopList.get(shopId);
    const timerIds = shopListCfg.TimerId;
    if (timerIds.length != 0) {
        const now = util.time.nowMS();
        for (const timerId of timerIds) {
            const cfg = this.app.Config.Timer.get(timerId);
            const refMs = this.app.Timer.getTriggerMS(cfg);
            if (refMs > now) {
                return refMs;
            }
        }
        return this.app.Timer.getNextTriggerMS(timerIds[0]);
    }
    return 0;
};