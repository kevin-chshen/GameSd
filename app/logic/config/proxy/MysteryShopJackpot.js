/**
 * @description 神秘商店配置（刷新商店）
 * @author chshen
 * @date 2020/03/23
 */

const BaseConfig = require('../baseConfig');
const util = require('@util');

class MysteryShopJackpot extends BaseConfig {
    constructor() {
        super();

        this.jackpots = {}; // [奖池ID] {}
    }

    reload(app, name) {
        super.reload(app, name);

        this.jackpots = {}; // [奖池ID] {}
        // 奖池数据
        for (const data of this.values()) {
            const jackpotId = data.JackpotId;
            if (!this.jackpots[jackpotId]) {
                this.jackpots[jackpotId] = [];
            }
            this.jackpots[jackpotId].push(data);
        }
    }

    /**
     * 随机获取商品ID
     * @param {Integer} jackpotId
     * @param {Integer} lv
     * @return {Integer}
    */
    randomGoodsId(jackpotId, lv) {
        const jackpot = this.jackpots[jackpotId];
        if (jackpot) {
            const weights = [];
            jackpot.map((data) => {
                if (data.PrestigeLimits[0] <= lv && lv <= data.PrestigeLimits[1]) {
                    weights.push({ id: data.Id, w: data.ExtractWeight });
                }
            });
            const res = util.weight.randomByWeight(weights);
            return res?res.id : 0;
        }
        return 0;
    }
}
module.exports = MysteryShopJackpot;