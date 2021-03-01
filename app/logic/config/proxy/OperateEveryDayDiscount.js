/**
 * @description 幸运转盘活动
 * @author chshen
 * @date 2020/05/25
 */

const BaseConfig = require('../baseConfig');

class OperateEveryDayDiscount extends BaseConfig {
    constructor() {
        super();

        this.payId2Id = {};
        this.payId2Limit = {};
        this.operate = {};  // [callId]:{[id]:cfg}
    }

    reload(app, name) {
        super.reload(app, name);

        this.payId2Id = {};
        this.payId2Limit = {};
        this.operate = {};
        for (const data of this.values()) {
            this.payId2Id[data.PayId] = data.Id;
            this.payId2Limit[data.PayId] = data.DailyLimit;
        }
    }

    getPayId2Id(payId) {
        return this.payId2Id[payId] || 0;
    }
    getPayIdLimit(payId) {
        return this.payId2Limit[payId] || 0;
    }
    getCfg(callId, id) {
        if (this.operate[callId]) {
            return this.operate[callId][id];
        }
        return null;
    }
}
module.exports = OperateEveryDayDiscount;