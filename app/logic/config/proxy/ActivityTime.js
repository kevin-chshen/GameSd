/**
 * @description 运营活动
 * @author chshen
 * @date 2020/05/25
 */

const BaseConfig = require('../baseConfig');

class ActivityTime extends BaseConfig {
    constructor() {
        super();

        this.activityIds = [];

        this.activity = {};

        this.activityId2Type = {};
    }

    reload(app, name) {
        super.reload(app, name);

        this.activityIds = [];
        this.activity = {};
        this.activityId2Type = {};
        for (const data of this.values()) {
            const actId = data.Id;
            const type = data.ActivityId;

            this.activityIds.push(actId);

            if (!this.activity[type]) {
                this.activity[type] = [];
            }
            this.activity[type].push(data.Id);

            this.activityId2Type[actId] = type;
        }
    }

    getType(actId) {
        return this.activityId2Type[actId];
    }
    /**
     * 取运营活动ID,列表
     * @param {type} 活动类型
    */
    getIdsByType(type) {
        return this.activity[type];
    }

    /**
     * 取运营活动ID,列表
    */
    getIds() {
        return this.activityIds;
    }
}
module.exports = ActivityTime;