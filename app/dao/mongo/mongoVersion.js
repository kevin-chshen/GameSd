/**
 * @description 版本数据
 * @author chshen
 * @date 2020/04/25
 */

const MongoDataBase = require('../../logic/mongo/mongoDataBase');

class MongoVersion extends MongoDataBase {
    constructor(data) {
        super(data);
    }
}
module.exports = MongoVersion;

MongoVersion.prototype._collectionName = 'version';
MongoVersion.prototype._columns = {
    ver: { type: "string", default: "" },
};