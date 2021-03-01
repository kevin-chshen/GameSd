/**
 * @description 充值付费
 * @author chshen
 * @date 2020/05/13
 */

const MongoDataBase = require('../../logic/mongo/mongoDataBase');

class MongoPay extends MongoDataBase {
    constructor(data) {
        super(data);
    }
}

module.exports = MongoPay;

MongoPay.prototype._collectionName = 'pay';
MongoPay.prototype._columns = {
    orderId: { type: "string", default: '0' },      // 订单号
    gameId: { type: "string", default: '0' },       // 
    serverId: { type: "number", default: 0 },       // 1001
    platform: { type: "string", default: '0' },     // 平台数字(兼容account的平台所以用string)
    account: { type: "string", default: '0' },      // 账号ID
    uid: { type: "number", default: 0 },            // 玩家uid
    payWay: { type: "number", default: 0 },         // 支付通道编码
    amount: { type: "number", default: 0 },         // 支付金额
    callbackInfo: { type: "string", default: '0' }, // 客户端透传参数
    orderStatus: { type: "string", default: '0' },  // 订单状态
    isHandled: { type: "number", default: 0 },      // 是否处理 0: 已处理  1：未处理
    logTime: { type: "number", default: 0 },        // 时间戳(毫秒)
};
MongoPay.prototype._index = 'orderId';