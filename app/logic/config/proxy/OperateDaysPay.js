/**
 * @description 运营活动
 * @author chshen
 * @date 2020/05/25
 */

const BaseConfig = require('../baseConfig');

class OperateDaysPay extends BaseConfig {
    constructor() {
        super();

        this.operate = {};  // [callId]:{[id]:cfg}

        this.needRmb = 0;
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

        this.needRmb = 0;
        for (const cfg of this.values()) {
            this.needRmb = cfg.PayValue;
            break;
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
    /**
     * 每日需要累计多少钱
    */
    getNeedRmb() {
        return this.needRmb;
    }

}
module.exports = OperateDaysPay;