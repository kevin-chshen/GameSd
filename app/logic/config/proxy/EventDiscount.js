/**
 * @description 直播平台感谢事件
 * @author chshen
 * @date 2020/04/13
 **/
const BaseConfig = require('../baseConfig');
const util = require('@util');

class EventDiscount extends BaseConfig {
    constructor() {
        super();

        this.pool = {};
    }

    reload(app, name) {
        super.reload(app, name);

        this.pool = {};
        for (const event of this.values()) {
            for (const platId of event.PlatformTypeArr) {
                this.pool[platId] = this.pool[platId] || [];
                this.pool[platId].push(event);
            }
        }
    }

    /**
     * 获取平台对应的事件池
     * @param {Integer} platformId
     * @return {Object} 事件池
    */
    getPool(platformId) {
        return this.pool[platformId] || [];
    }
    /**
     * 获取平台对应的事件池
     * @param {Integer} platformId
     * @param {Integer} lv 头衔等级
     * @return {Object} 事件池
    */
    randomEvent(platformId, lv) {
        const pool = this.getPool(platformId);
        const poolTemp = [];
        for (const data of pool) {
            if (data.PrestigeLimits[0] <= lv && lv <= data.PrestigeLimits[1]) {
                poolTemp.push({ id: data.Id, w: data.ExtractWeight });
            }
        }
        const data = util.weight.randomByWeight(poolTemp);
        return !data ? 0 : data.id;
    }
}

module.exports = EventDiscount;