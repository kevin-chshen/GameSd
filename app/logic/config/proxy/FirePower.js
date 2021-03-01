/**
 * @description 火力全开评分
 * @author chshen
 * @date 2020/04/21
 **/

const BaseConfig = require('../baseConfig');

class FirePower extends BaseConfig {
    constructor() {
        super();
        this.scores = [];
    }

    reload(app, name) {
        super.reload(app, name);

        this.scores = [];
        for (const data of this.values()) {
            this.scores.push({ Id: data.Id, });
        }
    }

    /**
     * 获取收益
     * @return {Integer} 配置
     */ 
    earn(score, lv) {
        let max = 0;
        let cfg;
        for (const data of this.values()) {
            if (lv >= data.Vip && data.ScoreInterval[0] <= score && max < data.ExpectProfitValue) {
                max = data.ExpectProfitValue;
                cfg = data;
            }
        }
        return cfg;
    }
}
module.exports = FirePower;

