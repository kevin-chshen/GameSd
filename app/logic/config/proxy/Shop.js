/**
 * @description 创建角色表管理器
 * @author chshen
 * @date 2020/03/23
 **/
const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const BaseConfig = require('../baseConfig');
const code = require('@code');

class Shop extends BaseConfig {
    constructor() {
        super();
    }

    reload(app, name) {
        super.reload(app, name);
    }
    /**
     * 限购次数 
     * @param {Integer} goodsId
     * @return {Integer} 最大可购买次数
    */
    getMaxBuy(goodsId) {
        const cfg = this.get(goodsId);
        if (cfg.DailyLimit > 0) {
            return cfg.DailyLimit;
        } else if (cfg.WeeklyLimit > 0) {
            return cfg.WeeklyLimit;
        } else if (cfg.TotalLimit > 0) {
            return cfg.TotalLimit;
        } else {
            return 0;
        }
    }
    /**
     * 添加是否合适
    */
    async conditionSuit(goodsId, player) {
        const cfg = this.get(goodsId);
        if (!cfg) {
            logger.debug(`shop config conditionSuit cfg:${goodsId} null`);
            return false;
        }
        switch (cfg.LimitType) {
        case code.shop.LIMIT_TYPE.NONE:
            return true;
        case code.shop.LIMIT_TYPE.VIP:
            return player.vip >= cfg.LimitValue;
        case code.shop.LIMIT_TYPE.LV:
            return player.lv >= cfg.LimitValue;
        case code.shop.LIMIT_TYPE.KIND_OF_TRAFFIC_RANK:
            return await new Promise((resolve, _reject) => {
                const ret = (async (uid) =>{
                    return await this.app.rpcs.global.flowRateRemote.getFlowRateRank({}, uid);
                })(player.uid);
                resolve(ret);
            }).then(rank => {
                return (cfg.LimitValue <= 0 || rank.res <= cfg.LimitValue) ? true : false;
            });
        case code.shop.LIMIT_TYPE.GUILD_LV:
            return cfg.LimitValue <= (player.guildLv || 0);
        default:
            return false;
        }
    }
}
module.exports = Shop;