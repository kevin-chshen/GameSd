/**
 * @description 重置数据表
 * @author chshen
 * @date 2020/04/25
 */

const MongoDataBase = require('../../logic/mongo/mongoDataBase');

class MongoTimer extends MongoDataBase {
    constructor(data) {
        super(data);
    }
}
module.exports = MongoTimer;

MongoTimer.prototype._collectionName = 'timer';
MongoTimer.prototype._columns = {
    server: { type: "string", default: "" },
    counters: { type: "object", default: {} },
};