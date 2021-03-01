/**
 * @description 创建角色表管理器
 * @author chshen
 * @date 2020/03/23
 **/
const BaseConfig = require('../baseConfig');
const logger = require('pomelo-logger').getLogger('pomelo', __filename);

class RecruitStaffCost extends BaseConfig {
    constructor() {
        super();
    }

    reload(app, name) {
        super.reload(app, name);
    }

    /**
     * 招募超管消耗
     * @param {Integer} begin
     * @param {Integer} size
     * @return {Object} {itemID, itemNum}
    */
    cost(begin, size) {
        const cal = [];
        const end = size + begin;
        for (let index = begin; index < end; ++index) {
            const config = this.get(index);
            if (!config) {
                logger.error("recruit staff cost error, num:${index}");
                return [];
            }
            const costs = config.Cost;
            for (const [key, val] of Object.entries(costs)) {
                if (cal[key] == null) {
                    cal[key] = 0;
                }
                cal[key] += Number(val);
            }
        }
        let items = [];
        for (const key in cal){
            items = items.concat([{ itemID: Number(key), itemNum: cal[key]}]);
        }
        return items;
    }
}

module.exports = RecruitStaffCost;