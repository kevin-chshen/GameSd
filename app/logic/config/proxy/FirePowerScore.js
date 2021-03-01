/**
 * @description 火力全开评分
 * @author chshen
 * @date 2020/04/21
 **/

const BaseConfig = require('../baseConfig');
const util = require('@util');

class FirePowerScore extends BaseConfig {
    constructor() {
        super();
    }

    reload(app, name) {
        super.reload(app, name);
    }
    /**
     * 抽取id
     * @return {Object} {配置表ID， 分数}
    */
    extractId(vip) {
        const weights =[];
        for (const data of this.values()) {
            if (data.Vip <= vip) {
                weights.push({ id: data.Id, w: data.ExtractWeight, score: data.Score });
            }
        }
        const data = util.weight.randomByWeight(weights);
        if (data){
            return { id: data.id, score: Number(data.score) };
        }
        else
            return { id:0, score:0 };
    }
}
module.exports = FirePowerScore;