/**
 * @description 直接交易的商店
 * @author chshen
 * @date 2020/04/23
 */

const ShopDirectSale = function (app, player, data) {
    this.$id = 'game_ShopDirectSale';
    this.$scope = 'prototype';
    this.app = app;
    this.player = player;

    this.goods = data || {};
};
module.exports = ShopDirectSale;

/**
 * 开启商店
 * @api public
*/
ShopDirectSale.prototype.start = function() {
};

/**
 * 关闭商店
 * @api public
*/
ShopDirectSale.prototype.close = function () {

};

/**
 * 获取商品数据
 * @api public
*/
ShopDirectSale.prototype.getGoods = function () {
    return this.goods;
};

/**
 * 跨天
 * @api public
*/
ShopDirectSale.prototype.onDayChange = function() {

    const delGoods = [];
    for (const goodsId of Object.keys(this.goods)) {
        const cfg = this.app.Config.Shop.get(goodsId);
        if (cfg && cfg.DailyLimit > 0) {
            delGoods.push(cfg.Id);
        }
    }
    
    // 删除购买次数
    delGoods.map((key) => {
        delete this.goods[key];
    });
};

/**
 * 跨周
 * @api public
*/
ShopDirectSale.prototype.onWeekChange = function () {
    const delGoods = [];
    for (const goodsId of Object.keys(this.goods)) {
        const cfg = this.app.Config.Shop.get(goodsId);
        if (cfg && cfg.WeeklyLimit > 0) {
            delGoods.push(cfg.Id);
        }
    }

    // 删除购买次数
    delGoods.map((key) => {
        delete this.goods[key];
    });
};

/**
 * 获取已购买次数
 * @api public
*/
ShopDirectSale.prototype.getHadBuyCount = function (goodsId) {
    return this.goods[goodsId] || 0;
};

/**
 * 添加已购买次数
 * @api public
 * @param {Integer} goodsId
 * @param {Integer} num
*/
ShopDirectSale.prototype.addBuy = function (goodsId, num) {
    this.goods[goodsId] = (this.goods[goodsId]) ? this.goods[goodsId] + num : num;
    
    return this.goods[goodsId];
};