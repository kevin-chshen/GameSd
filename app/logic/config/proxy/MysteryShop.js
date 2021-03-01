/**
 * @description 神秘商店配置（刷新商店）
 * @author chshen
 * @date 2020/03/23
 */
const assert = require('assert');
const BaseConfig = require('../baseConfig');
const util = require('@util');

class MysteryShop extends BaseConfig {
    constructor() {
        super();

        this.shops = {}; // [商店ID] {}
    }
    reload(app, name) {
        super.reload(app, name);

        this.shops = {}; // [商店ID] {}
        // 奖池数据
        for (const data of this.values()) {
            const shopId = data.ShopId;
            if (!this.shops[shopId]) {
                this.shops[shopId] = [];
            }
            this.shops[shopId].push(data);
        }
    }

    /**
     * 获取奖池ID
     * @param {Integer} shopId
     * @param {Integer} lv
     * @param {Object} extracts
     * @return {Object}
    */
    initJackpotExtractCount(shopId, lv, extracts) {
        extracts = extracts || {};
        const jackpot = this.shops[shopId];
        if (jackpot) {
            // 获取权重数据
            jackpot.map((data) => {
                if (data.PrestigeLv <= lv) {
                    // 检测奖池失败次数
                    const id = data.Id;
                    extracts[id] = extracts[id] || 1; // 没有值则默认为1
                }
            });
            return extracts;
        }
        return extracts;
    }

    /**
     * 获取奖池ID
     * @param {Integer} shopId
     * @param {Integer} lv
     * @param {Object} extracts
     * @return {Object}
    */
    getJackpotId(shopId, lv, extracts) {
        const jackpot = this.shops[shopId];
        if (jackpot) {
            // 获取权重数据
            const weights = [];
            jackpot.map((data)=>{
                if (data.PrestigeLv <= lv) {
                    const id = data.Id;
                    // 检测奖池失败次数
                    const extract = extracts[id] || 1; // 没有值则默认为1
                    const w = data.SuccessValue * (Math.max(0, extract - data.MinTimes));
                    weights.push({ id: id, w: w });
                }
            });
            const res = util.weight.randomByWeight(weights);
            return res? res.id: 0;
        }
        return 0;
    }


    /**
     * 抽取商品
     * @param {Integer} count
     * @param {Integer} shopId
     * @param {Integer} lv
     * @param {Object} myExtracts
    */
    extractGoods(count, shopId, lv, myExtracts) {
        const res = {
            goods: [],
            extracts: []
        };

        res.extracts = this.app.Config.MysteryShop.initJackpotExtractCount(shopId, lv, myExtracts);
        for (let index = 0; index < count; ++index) {
            const jackpotId = this.app.Config.MysteryShop.getJackpotId(shopId, lv, res.extracts);
            assert(jackpotId != 0, `extractGoods shopId:${shopId} lv:${lv} res.extracts:${res.extracts}`);
            if (jackpotId == 0) {
                return res;
            }
            // 设置失败次数
            for (const id of Object.keys(res.extracts)) {
                res.extracts[id] += 1;
            }
            res.extracts[jackpotId] = 1;

            // 获取商品
            const goodsId = this.app.Config.MysteryShopJackpot.randomGoodsId(jackpotId, lv);
            if (goodsId != 0)
                res.goods.push(goodsId);
        }

        return res;
    }
}
module.exports = MysteryShop;