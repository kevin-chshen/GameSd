/**
 * @description 幸运转盘活动
 * @author chshen
 * @date 2020/05/25
 */

const BaseConfig = require('../baseConfig');

class OperateLuckyTurntable extends BaseConfig {
    constructor() {
        super();

        this.probability = {};
    }

    reload(app, name) {
        super.reload(app, name);

        this.probability = {};        
        for (const data of this.values()) {
            const id = data.Id;
            if (!this.probability[id]) {
                this.probability[id] = [];
            }
            let rate = 0;
            for (let index = 0, len = data.Probability.length; index < len; ++index) {
                const p = data.Probability[index];
                const d = data.Diamond[index];
                const m = data.Multiple[index];
                this.probability[id].push({ min: rate, max: rate + p, diamond: d, multi: m});
                rate += p;
            }
        }
    }
    /**
     * 获取配置表数据
    */
    getCfg(callId, index) {
        const id = callId * 100 + index;
        return this.get(id);
    }
    /**
     * 幸运转盘中奖栏和钻石数
     * @return {diamond:xxx, multi:xxx}
    */
    randomRewards(callId, idx) {
        const id = callId * 100 + idx;
        const rate = Math.random()*10000;
        const data = this.probability[id];
        for (const r of data) {
            if (r.min <= rate && rate < r.max) {
                return {diamond :r.diamond, multi: r.multi};
            }
        }
        return {diamond:0,  multi: 0};
    }
}
module.exports = OperateLuckyTurntable;