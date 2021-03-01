/**
 * @description 团建
 * @author jzy
 * @date 2020/04/29
 */

// const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const utils = require("@util");
const BaseConfig = require('../baseConfig');

class Friendship extends BaseConfig {
    constructor() {
        super();
    }

    /**
     * 获取基础奖励
     * @param {Number} id
     * @param {Number} lv 
     */
    getBaseGrowReward(id, lv){
        const order = this.get(id).GrowRewardOrder;
        if(order==0){
            return [];
        }
        const lvOrder = this.app.Config.Prestige.get(lv).Order;
        const allReward = this.app.Config.FriendshipReward.get(lvOrder).GrowReward;
        if(order-1>=allReward.length){
            return [];
        }
        return utils.proto.encodeConfigAward(allReward[order-1]);
    }

    /**
     * 获取固定奖励
     * @param {Number} id 
     * @param {Number} lv 
     */
    getFixReward(id,lv){
        const order = this.get(id).FixedRewardOrder;
        if(order==0){
            return [];
        }
        const lvOrder = this.app.Config.Prestige.get(lv).Order;
        const allReward = this.app.Config.FriendshipReward.get(lvOrder).FixedReward;
        if(order-1>=allReward.length){
            return [];
        }
        return utils.proto.encodeConfigAward(allReward[order-1]);
    }

}

module.exports = Friendship;