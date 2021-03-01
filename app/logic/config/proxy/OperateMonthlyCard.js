/**
 * @description 幸运转盘活动
 * @author chshen
 * @date 2020/05/25
 */

const BaseConfig = require('../baseConfig');

class OperateMonthlyCard extends BaseConfig {
    constructor() {
        super();

        this.payId2CardId = {};
    }

    reload(app, name) {
        super.reload(app, name);

        this.payId2CardId = {};
        for (const data of this.values()) {
            this.payId2CardId[data.PayId] = data.Id;
        }
    }

    getCardIdByPayId(payId) {
        return this, this.payId2CardId[payId]; 
    }
}
module.exports = OperateMonthlyCard;