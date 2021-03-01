/**
 * @description 临时商店组件
 * @author chshen
 * @date 2020/05/11
*/
const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const bearcat = require('bearcat');
const code = require('@code');
const assert = require('assert');
/**
 * 数据结构 数据库
 * {
 *    [商店实例ID]: {
 *        shopId：xxx             // 商店ID
 *        goods: {                // 商品列表
 *            goodsUid:goodsId    // {商品UID： 商品ID
 *        }
 *        buys: []                // 已购买uid列表
 *    }
 * }
 * 临时数据
 * shopMgr      // 商店管理
 * shopTmpList {
 *      shopId: shopUid
 * }
*/
const ShopTemporaryComponent = function (app, player) {
    this.$id = 'game_ShopTemporaryComponent';
    this.$scope = 'prototype';
    this.app = app;
    this.player = player;

    // 数据
    this.data = null;

    // 商店模板管理,每个模板里有多个商店实例
    this.shopMgr = {};

    this.shopTmpList = {};
};
module.exports = ShopTemporaryComponent;
bearcat.extend('game_ShopTemporaryComponent', 'game_Component');

/**
 * 加载
 * @api override public
*/
ShopTemporaryComponent.prototype.onLoad = function() {
    this.data = this.player.shopTemporary;

    for (const [shopUid, shop] of Object.entries(this.player.shopTemporary)) {
        const shopId = shop.shopId;
        this.shopMgr[shopUid] = bearcat.getBean('game_ShopTemporary', this.app, this.player, shopUid, shopId, shop);
        if (!this.shopTmpList[shopId]) {
            this.shopTmpList[shopId] = [];
        }
        this.shopTmpList[shopId].push(shopUid);
    }
};

/**
 * 清除
 * @api override public
*/
ShopTemporaryComponent.prototype.onClean = function () {
    this.shopMgr = {};
    this.shopTmpList = {};
};

/**
 * 临时商店数据
 * @api public
*/
ShopTemporaryComponent.prototype.getData = function() {
    return this.data || {};
};

/**
 * 创建商店
 * @api public
 * @param {Integer} shopId 商店ID
 * @param {Integer} count 抽取商品数量
 * @return {String} 商店UID
*/
ShopTemporaryComponent.prototype.createShop = function(shopId, count) {
    const cfg = this.app.Config.ShopList.get(shopId);

    assert(cfg, `ShopTemporaryComponent createShop shopId:${shopId}, player:${this.player.uid}`);
    assert(cfg.Type == code.shop.SHOP_TYPE.TEMPORARY, `ShopTemporaryComponent createShop shopId:${shopId}, type error, player:${this.player.uid}`);

    const shopUid = this.app.Id.genNext(code.id.KEYS.TEMPORARY_SHOP);
    const shop = bearcat.getBean('game_ShopTemporary', this.app, this.player, shopUid, shopId, null);
    this.shopMgr[shopUid] = shop;
    shop.create(count);
    this.data[shopUid] = shop.getData();
    return shopUid;
};

/**
 * 移除模板商店
 * @param {Integer} shopId
 * @param {String} shopUid
*/
ShopTemporaryComponent.prototype.destroyShopId = function (shopId) {
    assert(shopId, `ShopTemporaryComponent destroyShopId shopId:${shopId}, type error, player:${this.player.uid}`);
    this.shopTmpList[shopId].map((shopUid) => {
        const shop = this.shopMgr[shopUid];
        if (shop) {
            shop.destroy();
        }
        delete this.shopMgr[shopUid];
        delete this.data[shopUid];
    });
    delete this.shopTmpList[shopId];
};

/**
 * 移除实例商店
 * @param {Integer} shopId
 * @param {String} shopUid
*/
ShopTemporaryComponent.prototype.destroyShopUid = function(shopUid) {
    const shop = this.shopMgr[shopUid];
    if (shop == null) {
        logger.error(`ShopTemporaryComponent destroyShopUid shopUid:${shopUid}, type error, player:${this.player.uid}, ${(new Error()).stack}`);
        return;
    }
    //assert(shop, `ShopTemporaryComponent destroyShopUid shopUid:${shopUid}, type error, player:${this.player.uid}`);
    const shopId = shop.shopId;
    shop.destroy();
    if (this.shopTmpList[shopId]) {
        const index = this.shopTmpList[shopId].indexOf(shopUid);
        if (index >= 0) {
            this.shopTmpList[shopId].splice(index, 1);
        }
    }
    delete this.shopMgr[shopUid];
    delete this.data[shopUid];
};

/**
 * 获取商店实例
 * @param {Integer | String} shopUid
*/
ShopTemporaryComponent.prototype.getShop = function(shopUid) {
    return this.shopMgr[shopUid];
};

/**
 * 获取指定商店模板对应的实例ID列表
 * @parm {Integer} shopId
 * @return {Array}
*/
ShopTemporaryComponent.prototype.getShopUids = function (shopId) {
    return this.shopTmpList[shopId] || [];
};
