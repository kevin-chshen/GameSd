/**
 * @description 创建角色表管理器
 * @author chshen
 * @date 2020/03/23
 **/
const BaseConfig = require('../baseConfig');

class LivePlatForm extends BaseConfig {
    constructor() {
        super();
    }

    reload(app, name) {
        super.reload(app, name);
    }

    __json2Item(json) {
        let items = [];
        for (const key in json) {
            items = items.concat([{ itemID: Number(key), itemNum: json[key] }]);
        }
        return items;
    }

    __genId(id, level){
        return id *100 + level;
    }

    /**
     * 扩建消耗数据
     * @param {Integer} platformId 平台ID
      @param {Integer} level 平台等级
     * @return {List} 物品列表
    */
    getExtendCost(platformId, level) {
        const id = this.__genId(platformId, level);
        const config = this.get(id);
        if (config && config.ExtendCost){
            return this.__json2Item(config.ExtendCost);
        }
        return undefined;
    }

    /**
     * 扩建奖励数据
     * @param {Integer} platformId 平台ID
     * @param {Integer} level 平台等级
     * @return {List} 物品列表
    */
    getExtendRewards(platformId, level) {
        const id = this.__genId(platformId, level);
        const config = this.get(id);
        if (config && config.ExtendReward) {
            return this.__json2Item(config.ExtendReward);
        }
        return undefined;
    }

    /**
     * 槽位最大值
     * @param {Integer} platformId 平台ID
     * @param {Integer} level 平台等级
     * @return {Integer} 槽位最大数
    */
    getSlotLimit(platformId, level) {
        const id = this.__genId(platformId, level);
        const config = this.get(id);
        if (config) {
            return config.PositionNum;
        }
        return 0;
    }
    /**
     * 冷却时间
     * @param {Integer} platformId 平台ID
     * @param {Integer} level 平台等级
     * @return {Integer} 冷却时间
    */
    getCD(platformId, level){
        const id = this.__genId(platformId, level);
        const config = this.get(id);
        if (config) {
            return config.Cd;
        }
        return -1;
    }
    /**
     * 获取配置
     * @param {Integer} platformId 平台ID
     * @param {Integer} level 平台等级
    */
    getConfig(platformId, level){
        const id = this.__genId(platformId, level);
        return this.get(id);
    }
}

module.exports = LivePlatForm;