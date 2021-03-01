/**
 * @description 全服活动数据表
 * @author jzy
 * @date 2020/06/09
 */

const MongoDataBase = require('../../logic/mongo/mongoDataBase');

class MongoOperate extends MongoDataBase {
    constructor(data) {
        super(data);
    }
}

module.exports = MongoOperate;

MongoOperate.prototype._collectionName = 'operate';
MongoOperate.prototype._columns = {
    operateId: { type: "number", default: 0 },
    data: { type: "object", default: {} },
};
MongoOperate.prototype._index = 'operateId';
