/**
 * @description 公告数据
 * @author chshen
 * @date 2020/06/18
 */

const MongoDataBase = require("../../logic/mongo/mongoDataBase");

class MongoAnnouncement extends MongoDataBase {
    constructor(data) {
        super(data);
    }
}

module.exports = MongoAnnouncement;

MongoAnnouncement.prototype._collectionName = "announcement";
MongoAnnouncement.prototype._columns = {
    id: { type: "number", default: 0 },
    expirationTime: { type: "number", default: 0 },
    data: { type: "object", default: 0 },
};
MongoAnnouncement.prototype._index = 'id';