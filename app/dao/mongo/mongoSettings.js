/**
 * @description 设置
 * @author jzy
 * @date 2020/05/26
 */

const MongoDataBase = require('../../logic/mongo/mongoDataBase');
class MongoSettings extends MongoDataBase {
    constructor(data) {
        super(data);
    }
}

module.exports = MongoSettings;

MongoSettings.prototype._collectionName = "settings";
MongoSettings.prototype._columns = {
    uid: { type: "number", default: 0 },
    type: { type: "number", default: 0 },
    message: { type: "string", default: "" },
    time: { type: "number", default: 0 },
};
MongoSettings.prototype._index = 'uid';