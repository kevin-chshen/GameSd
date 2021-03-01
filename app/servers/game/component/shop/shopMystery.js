/**
 * @description 神秘商店
 * @author chshen
 * @date 2020/04/23
 */
const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const code = require('@code');
const util = require('@util');
const assert = require('assert');

const ShopMystery = function (app, player, shopId, data) {
    this.$id = 'game_ShopMystery';
    this.$scope = 'prototype';
    this.app = app;
    this.player = player;

    this.shopId = shopId;
    if (data) {
        data.hadFirstRefresh = data.hadFirstRefresh || false;
        data.hadFreeRefreshCount = data.hadFreeRefreshCount || 0;
        data.hadPayRefreshCount = data.hadPayRefreshCount || 0;
        data.goods = data.goods || {};  // {goodUid:goodId}
        data.buys = data.buys || [];    // [goodUid]
        //奖池抽取失败次数列表
        data.extracts = data.extracts || {};    // {奖池ID: 失败次数}
    } else {
        data = {
            hadFirstRefresh: false,
            hadFreeRefreshCount: 0,
            hadPayRefreshCount: 0,
            //已购物品列表
            goods: {},  // {goodUid:goodId}
            buys: [],   // [goodUid]
            //奖池抽取失败次数列表
            extracts: {}   // {奖池ID: 失败次数}
        };
    }
    this.data = data;

};
module.exports = ShopMystery;

/**
 * 打开商店
*/
ShopMystery.prototype.start = function() {
    const cfg = this.app.Config.ShopList.get(this.shopId);
    const timerIds = cfg.TimerId;
    this.player.Timer.registerList(timerIds, (..._args) => { this.refresh(true); });

    // 系统未开启则添加 系统开启事件
    if (!this.player.SysOpen.check(cfg.OpenId)){
        // 系统开启
        this.player.Event.on([code.event.SYSTEM_OPEN.name, cfg.OpenId], () => {
            this.refresh(true);
        });
    } else {
        // 系统已开启
        // 登录检测商店商品
        if (Object.keys(this.data.goods).length == 0) {
            this.refresh(true);
        }
    }
};

/**
 * 关闭商店
*/
ShopMystery.prototype.close = function () {
    // 关闭计时器
};

ShopMystery.prototype.getData = function() {
    return this.data;
};

/**
 * 重置次数
 * @api public
*/
ShopMystery.prototype.onDayChange = function() {
    this.data.hadFreeRefreshCount = 0;
    this.data.hadPayRefreshCount = 0;
};

/**
 * 获取商品ID
 * @api public
 * @param {Integer} goodsUid
 * @return {Integer} 0 表示没有商品
*/
ShopMystery.prototype.getGoodsId = function(goodsUid) {
    return this.data.goods[goodsUid];
};

/**
 * 商品是否已被购买
 * @api public
 * @param {Integer} goodsUid
 * @return {Boolean}
*/
ShopMystery.prototype.hadBuy = function (goodsUid) {
    return this.data.buys.indexOf(goodsUid) > -1;
};

/**
 * 添加已购买商品uid
 * @api public
 * @param {Integer} goodsUid
 * @return {Void}
*/
ShopMystery.prototype.addBuys = function (goodsUid) {
    this.data.buys.push(goodsUid);
};

/**
 * 获取免费已经刷新次数
 * @api public
 * @return {Integer}
*/
ShopMystery.prototype.getHadFreeRefreshCount = function () {
    return this.data.hadFreeRefreshCount;
};

/**
 * 添加免费已经刷新次数
 * @api public
 * @return {Integer}
*/
ShopMystery.prototype.addOneHadFreeRefresh = function () {
    return this.data.hadFreeRefreshCount += 1;
};

/**
 * 获取付费已经刷新次数
 * @api public
 * @return {Integer}
*/
ShopMystery.prototype.getHadPayRefreshCount = function () {
    return this.data.hadPayRefreshCount;
};

/**
 * 获取付费已经刷新次数
 * @api public
 * @return {Integer}
*/
ShopMystery.prototype.addOneHadPayRefresh = function () {
    return this.data.hadPayRefreshCount += 1;
};

/**
 * 刷新
 * @api public
 * @param {Integer} doSelf 自己手动刷新
 * @return {Void}
*/
ShopMystery.prototype.refresh = function(doSelf) {
    logger.info(`ShopMystery refresh shop:${this.shopId} refresh ,player:${this.player.uid}, doSelf${doSelf}`);
    // 商店是否存在
    const shopListCfg = this.app.Config.ShopList.get(this.shopId);
    if (!shopListCfg) {
        logger.debug(`ShopMystery refresh shopId:${this.shopId} failed, player:${this.player.uid}`);
        return;
    }
    // 是否开启
    if (!this.player.SysOpen.check(shopListCfg.OpenId)) {
        logger.info(`ShopMystery refresh shop:${this.shopId} not open ,player:${this.player.uid}`);
        return;
    }
    // 抽取次数默认6次
    const lv = this.player.lv;
    const res = this.app.Config.MysteryShop.extractGoods(code.shop.NUM_REFRESH_SHOW_GOODS, this.shopId, lv, Object.assign({}, this.data.extracts));

    // 重置抽取次数
    for (const [id, count] of Object.entries(res.extracts)) {
        this.data.extracts[id] = count;
    }
    // 设置商品
    this.data.goods = {};

    // 首次手动刷新必出物品, 给引导用
    if (doSelf && !this.data.hadFirstRefresh) {
        this.data.hadFirstRefresh = true;
        const goodId = this.app.Config.ShopList.get(this.shopId).FirstRefreshGoods;
        if (goodId > 0) {
            res.goods[0] = goodId;
        }
    }
    res.goods.map((goodsId) => {
        const goodsUid = this.app.Id.genNext(code.id.KEYS.JACKPOT_SHOP);
        this.data.goods[goodsUid] = goodsId;
    });
    // 清理购买次数
    this.data.buys = [];

    const buyUids = [];   
    const vipCfg = this.app.Config.Vip.get(this.player.vip);
    const goodsData = [];
    for (const [uid, id] of Object.entries(this.data.goods)) {
        goodsData.push({
            k:String(uid),
            v:Number(id)
        });
    }
    assert(vipCfg, `ShopMystery refresh vipCfg:${this.player.vip} error , player:${this.player.uid}`);

    const freeCount = vipCfg.ShopRefreshFree[this.shopId] || 0;
    const payCount = vipCfg.ShopRefreshPay[this.shopId] || 0;
    const timeMs = this.player.Shop.calNextAutoRefreshTime(this.shopId) || 0;
    const info = {
        shopId: this.shopId,
        remainFreeCount: Math.max(0, freeCount - this.data.hadFreeRefreshCount),
        remainPayCount: Math.max(0, payCount - this.data.hadPayRefreshCount),
        buyUids: buyUids,
        showGoods: goodsData,
        nextRefreshTime: util.time.ms2s(timeMs)
    };
    this.player.Notify.notify('onAutoRefreshMysteryShopNotify', {
        mystery: info
    });
};
