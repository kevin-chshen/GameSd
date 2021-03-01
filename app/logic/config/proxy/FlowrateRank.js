/**
 * @description 流量为王表管理器
 * @author chenyq
 * @date 2020/05/07
 **/
const BaseConfig = require('../baseConfig');

const code = require('@code');
const util = require('@util');

class FlowRateRank extends BaseConfig {
    constructor() {
        super();
    }

    reload(app, name) {
        super.reload(app, name);
    }
    /**
     * 获取排名对应区间配置id
     * @param {Number}} rank 
     */
    getRankInterval(rank) {
        for (const [id, config] of this.entries()) {
            if (config.RankInterval.length >= 2) {
                const min = config.RankInterval[0];
                const max = config.RankInterval[1];
                if (rank >= min && rank <= max) {
                    return id;
                }
            }
        }
        return 0;
    }
    /**
     * 获取排名对应区间配置
     * @param {Number} rank 
     */
    getConfig(rank) {
        if (rank <= 0 || rank > code.flowRate.FLOW_RATE_MAX_RANK) {
            rank = code.flowRate.FLOW_RATE_MAX_RANK;
        }
        const id = this.getRankInterval(rank);
        return this.get(id);
    }
    /**
     * 获取排名对应浮动
     * @param {Number} rank 
     */
    getRandomRank(rank) {
        const config = this.getConfig(rank);
        if (config && config.RankRandom) {
            const min = config.RankRandom[0];
            const max = config.RankRandom[1];
            return util.random.random(min, max);
        }
        else {
            return 1;
        }
    }
    /**
     * 获取排名推荐身价
     * 排名推荐身价=基础推荐身价+每排名增长身价*（区间排名max-目标排名+1）
     * @param {Number} rank 
     */
    getRecommendPower(rank) {
        if (rank <= 0 || rank > code.flowRate.FLOW_RATE_MAX_RANK) {
            rank = code.flowRate.FLOW_RATE_MAX_RANK;
        }
        const config = this.getConfig(rank);
        if (config && config.RankRandom && config.Power) {
            const basePower = config.Power[0];
            const addPower = config.Power[1];
            const max = config.RankInterval[1];
            return [Math.floor(basePower + addPower * (max - rank + 1)), config.CardUseType, config.AttributeValue];
        }
        return [0, 0, 0];
    }
    /**
     * 获取首次排名奖励
     * @param {Number} oldRank 
     * @param {Number} newRank 
     */
    getFirstRankReward(oldRank, newRank) {
        const oldId = this.getRankInterval(oldRank);
        const newId = this.getRankInterval(newRank);
        const config = this.get(newId);
        if (oldId == newId) {
            // 排名钻石奖励=（历史排名-当前排名）*每排名钻石
            if (config) {
                return Math.floor((oldRank - newRank) * config.EveryRankDiamond);
            }
        }
        else {
            // 排名钻石奖励1=（当前排名所在区间排名max-当前排名+1）*对应区间每排名钻石
            // 排名钻石奖励2=（历史排名-历史排名所在区间排名min）*对应区间每排名钻石
            // 排名钻石奖励=排名钻石奖励1+排名钻石奖励2
            const oldConfig = this.get(oldId);
            if (config && oldConfig) {
                const max = config.RankInterval[1] || newRank;
                const min = oldConfig.RankInterval[0] || oldRank;
                const newDiamond = config.EveryRankDiamond || 0;
                const oldDiamond = oldConfig.EveryRankDiamond || 0;
                return Math.floor((max - newRank + 1) * newDiamond + (oldRank - min) * oldDiamond);
            }
        }
        return 0;
    }
    /**
     * 获取离线收益
     * @param {Number} rank 
     * @param {Number} time 离线时间
     */
    getOfflineReward(rank, time) {
        const config = this.getConfig(rank);
        if (config && time > config.Cd) {
            // 获取累积多少分钟
            const minute = Math.floor(time / config.Cd);
            // 每分钟收益=排名初始收益+（当前排名所在区间排名max-当前排名）*每排名增长收益
            const max = config.RankInterval[1] || rank;
            const curRank = rank > 0 ? rank : max;
            const minuteReward = Math.floor(config.BaseReward + (max - curRank) * config.EveryRankReward);
            const offlineReward = minute * minuteReward;
            return { offlineReward: offlineReward, cd: config.Cd };
        }
        return { offlineReward: 0, cd: 0 };
    }
}
module.exports = FlowRateRank;