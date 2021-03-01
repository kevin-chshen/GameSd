/**
 * @description 运营活动
 * @author chshen
 * @date 2020/05/25
 */

const BaseConfig = require('../baseConfig');

class OperateTotalPay extends BaseConfig {
    constructor() {
        super();

        this.operate = {};  // [callId]:{[id]:cfg}
    }

    reload(app, name) {
        super.reload(app, name);

        this.operate = {};
        for (const data of this.values()) {
            const actId = data.Id;
            const callId = data.CallId;

            if (!this.operate[callId]) {
                this.operate[callId] = {};
            }
            this.operate[callId][actId] = data;
        }
    }

    /**
     * 取运营活动
    */
    getCfg(callId, id) {
        if (this.operate[callId]) {
            return this.operate[callId][id];
        }
        return null;
    }
}
module.exports = OperateTotalPay;