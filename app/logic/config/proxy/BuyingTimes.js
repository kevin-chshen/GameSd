/**
 * @description 买次数表管理器
 * @author chenyq
 * @date 2020/04/24
 **/
const BaseConfig = require('../baseConfig');

class BuyingTimes extends BaseConfig {
    constructor() {
        super();
    }

    getCost(type, num) {
        const id = type * 1000 + num;
        const config = this.get(id);
        if(config){
            return config.FirstCost;
        }
        return undefined;
    }

    /**
     * 获取配置表
     * @param {Integer} type
     * @param {Integer} count
     * @return {Object}
    */
    getConfig(type, count) {
        const id = type * 1000 + count;
        return this.get(id);
    }
}
module.exports = BuyingTimes;