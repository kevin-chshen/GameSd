/**
 * @description 全局邮件表
 * @author linjs
 * @date 2020/04/09
 */

const MongoDataBase = require('../../logic/mongo/mongoDataBase');

class MongoGlobalMail extends MongoDataBase {
    constructor(data) {
        super(data);
    }
}

module.exports = MongoGlobalMail;

MongoGlobalMail.prototype._collectionName = 'globalMail';
MongoGlobalMail.prototype._columns = {
    id: { type: "number", default: 0 },
    title: { type: "string", default: "" },
    content: { type: "string", default: "" },
    item: { type: "object", default: [] },
    type: { type: "number", default: 1 },
    sendTime: { type: "number", default: 0 },
    expirationTime: { type: "number", default: 0 },
    received: { type: "object", default: {} },          // 已领取
    vipType: { type: "number", default: 0 },            // vip限制
    noReceived: { type: "object", default: {} },        // 不发送记录 防止vip变化
};
MongoGlobalMail.prototype._index = 'id';