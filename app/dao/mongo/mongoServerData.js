/**
 * @description 服务器数据:根据主服id存储的数据
 * @author linjs
 * @date 2020/04/29
 */

const MongoDataBase = require('../../logic/mongo/mongoDataBase');

class MongoServerData extends MongoDataBase {
    constructor (data) {
        super(data);
    }
}

module.exports = MongoServerData;

MongoServerData.prototype._collectionName = 'serverData';
MongoServerData.prototype._columns = {
    uid: { type: "number", default: 0 },
    counter: { type: "object", default: {} },
};
MongoServerData.prototype._index = 'uid';
