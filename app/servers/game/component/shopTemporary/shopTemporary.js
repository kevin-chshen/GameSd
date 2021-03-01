/**
 * @description 临时商店
 * @author chshen
 * @date 2020/05/11
*/
const code = require('@code');
const assert = require('assert');
/**
/**
 * 数据结构 数据库
 * data : {
 *     shopId：xxx             // 商店ID
 *     goods: {                // 商品列表
 *         goodsUid:goodsId    // {商品UID： 商品ID
 *     },
 *     buys:[]                 // 已购买uid列表
 * }
 * 临时数据
 * shopUid 商店uid
 * shopId 商店ID
*/
const ShopTemporary = function (app, player, shopUid, shopId, data) {
    this.$id = 'game_ShopTemporary';
    this.$scope = "prototype";
    this.app = app;
    this.player = player;

    this.shopUid = Number(shopUid);
    this.shopId = Number(shopId);

    // 初始化数据化
    data = data || {};
    data.goods = data.goods || {};
    data.buys = data.buys || [];
    data.shopId = Number(shopId);
    this.data = data;
};
module.exports = ShopTemporary;

/**
 * 商店数据
*/
ShopTemporary.prototype.getData = function() {
    return this.data;
};

/**
 * 创建商店
 * @api public
 * @param {Integer} count 商品数量
*/
ShopTemporary.prototype.create = function(count) {
    assert(count > 0, `ShopTemporaryComponent createShop count:${count}, player:${this.player.uid}`);

    // 刷新商店数据
    const lv = this.player.lv;
    const res = this.app.Config.MysteryShop.extractGoods(count, this.shopId, lv);
    // 设置商品
    this.data.goods = {};
    res.goods.map((goodsId) => {
        const goodsUid = this.app.Id.genNext(code.id.KEYS.JACKPOT_SHOP);
        this.data.goods[goodsUid] = goodsId;
    });
    // 清理购买次数
    this.data.buys = [];

    // 不做通知
    // const goods = [];
    // for (const [uid, id] of Object.entries(this.data.goods)) {
    //     goods.push({
    //         k: String(uid),
    //         v: Number(id)
    //     });
    // }
    // const detail = {
    //     shopUid: String(this.shopUid),
    //     shopId: this.shopId,
    //     goods: goods,
    //     buyUids: []
    // };
    // this.player.Notify.notify('onCreateShopInstanceNotify', {
    //     detail: detail
    // });
};

/**
 * 删除实例商店
*/
ShopTemporary.prototype.destroy = function() {
    // 不做通知
    // this.player.Notify.notify('onDestroyShopInstanceNotify', {
    //     shopUid: String(this.shopUid)
    // });
};

/**
 * 获取商店
 * @param {Integer | String} shopUid 
 * @return {Object} 商店实例
*/
ShopTemporary.prototype.getShop = function(shopUid) {
    return this.shopMgr[shopUid];
};

/**
 * 商品是否已购买
 * @param {String | Integer} goodsUid
 * @return {Boolean}
*/
ShopTemporary.prototype.hasBuy = function(goodsUid) {
    return this.data.buys.indexOf(goodsUid) > -1;
};

/**
 * 添加已购买商品
 * @param {String | Integer} goodsUid
 * @return {Void}
*/
ShopTemporary.prototype.addBuys = function (goodsUid) {
    this.data.buys.push(goodsUid);
};

/**
 * 获取商品ID
*/
ShopTemporary.prototype.getGoodId = function (goodsUid) {
    return this.data.goods[goodsUid] || 0;
};