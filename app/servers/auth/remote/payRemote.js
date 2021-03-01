/**
 * @description 充值服务
 * @author chshen
 * @date 2020/05/12
 */
module.exports = function (app) {
    return new Remote(app);
};

const Remote = function (app) {
    this.app = app;
};

// 模拟充值
Remote.prototype.simulatePay = async function(params, cb) {

    const ret = await this.app.Pay.backendPay(params);

    cb(null, ret);
};
