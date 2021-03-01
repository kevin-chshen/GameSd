/**
 * @description 离线邮件表
 * @author linjs
 * @date 2020/04/09
 */

const MongoDataBase = require('../../logic/mongo/mongoDataBase');

class MongoOfflineMail extends MongoDataBase {
    constructor(data) {
        super(data);
    }
}

module.exports = MongoOfflineMail;

MongoOfflineMail.prototype._collectionName = 'offlineMail';
MongoOfflineMail.prototype._columns = {
    uid: { type: "number", default: 0 },
    mailList: { type: "object", default: [] }
};
MongoOfflineMail.prototype._index = 'uid';
