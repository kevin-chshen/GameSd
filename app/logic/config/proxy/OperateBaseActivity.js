/**
 * @description 运营活动
 * @author chshen
 * @date 2020/05/25
 */

const BaseConfig = require('../baseConfig');

class OperateBaseActivity extends BaseConfig {
    constructor() {
        super();

        this.operateIds = [];

        this.operate = {};

        this.operateId2Type = {};
    }

    reload(app, name) {
        super.reload(app, name);

        this.operateIds = [];
        this.operate = {};
        this.operateId2Type = {};
        for (const data of this.values()) {
            const actId = data.Id;
            const type = data.Type;

            this.operateIds.push(actId);

            if (!this.operate[type]) {
                this.operate[type] = [];
            }
            this.operate[type].push(data.Id);

            this.operateId2Type[actId] = type;
        }
    }

    getType(actId) {
        return this.operateId2Type[actId];
    }
    /**
     * 取运营活动ID,列表
     * @param {type} 活动类型
    */
    getIdsByType(type) {
        return this.operate[type];
    }

    /**
     * 取运营活动ID,列表
    */
    getIds() {
        return this.operateIds;
    }
}
module.exports = OperateBaseActivity;