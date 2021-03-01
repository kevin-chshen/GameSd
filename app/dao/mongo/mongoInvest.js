/**
 * @description 投资数据表
 * @author jzy
 * @date 2020/04/23
 */

const MongoDataBase = require('../../logic/mongo/mongoDataBase');

class MongoInvest extends MongoDataBase {
    constructor(data) {
        super(data);
    }
}

module.exports = MongoInvest;

MongoInvest.prototype._collectionName = 'invest';
MongoInvest.prototype._columns = {
    id: { type: "string", default: "0" },
    uid: { type: "number", default: 0 },
    investID: { type: "number", default: 0 },
    color: { type: "number", default: 0 },
    playerLevel: { type: "number", default: 0 },
    name: { type: "string", default: "" },
    time: { type: "number", default: 0 },
    globalFlag: { type: "boolean", default: false },
    guildId: { type: "number", default: 0 },
    friendList: { type: "object", default: [] },
    finishType: { type: "number", default: -1 },
    cooperate: { type: "object", default: {} },
};
MongoInvest.prototype._index = 'id';