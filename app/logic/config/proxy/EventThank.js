/**
 * @description 直播平台感谢事件
 * @author chshen
 * @date 2020/04/13
 **/
const BaseConfig = require('../baseConfig');

class EventThank extends BaseConfig {
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
                this.pool[platId].push(event.Id);
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
     * @return {Object} 事件池
    */
    randomEvent(platformId) {
        const pool = this.getPool(platformId);
        const size = pool.length;
        if (size > 0){
            if (size == 1) 
                return pool[0];
            else 
                return pool[Math.floor(Math.random()*size)];
        }
        return 0;
    }
}

module.exports = EventThank;