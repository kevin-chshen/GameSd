/**
 * @description 活动远程调用
 * @author chshen
 * @date 2020/05/25
 */
const code = require('@code');

module.exports = function(app) {
    return new Remote(app);
};

const Remote = function(app) {
    this.app = app;
};

/**
 * 添加购买投资基金人数
*/
Remote.prototype.addNumBuyInvestFunds = function (cb) {
    const ID = code.activity.TOTAL_INVEST_PLAN_PEOPLE_ID;
    const counter = this.app.Counter.InvestFunds.get(ID);
    let num = 0;
    if (counter) {
        num = counter.get();
    }
    num += 1;
    this.app.Counter.InvestFunds.set(ID, num);
    
    // 广播投资基金人数
    this.app.Notify.broadcast('onSyncInvestFundsNotify', {
        count: num
    });
    cb(null, num);
};

/**
 * 获取购买投资基金人数
*/
Remote.prototype.getNumBuyInvestFunds = function(cb) {
    const ID = code.activity.TOTAL_INVEST_PLAN_PEOPLE_ID;
    const counter = this.app.Counter.InvestFunds.get(ID);
    let num = 0;
    if (counter) {
        num = counter.get();
    }
    
    cb(null, num);
};
