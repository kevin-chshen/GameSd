/**
 * @description 离线数据表
 * @author linjs
 * @date 2020/04/09
 */

const MongoDataBase = require('../../logic/mongo/mongoDataBase');

class MongoOfflineData extends MongoDataBase {
    constructor(data) {
        super(data);
    }
}

module.exports = MongoOfflineData;

MongoOfflineData.prototype._collectionName = 'offlineData';
MongoOfflineData.prototype._columns = {
    uid: { type: "number", default: 0 },
    mailList: { type: "object", default: [] },      // 玩家的离线邮件 [{PlayerMail}]
    privateChat: { type: "object", default: {} },   // 离线私聊信息
    banChat: { type: "object", default: {} },       // 禁言
};
MongoOfflineData.prototype._index = 'uid';