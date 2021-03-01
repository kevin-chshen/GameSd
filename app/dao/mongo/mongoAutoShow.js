/**
 * @description 车展数据
 * @author jzy
 * @date 2020/05/20
 */

const MongoDataBase = require("../../logic/mongo/mongoDataBase");

class MongoAutoShow extends MongoDataBase {
    constructor(data){
        super(data);
    }
}

module.exports = MongoAutoShow;

MongoAutoShow.prototype._collectionName = "autoShow";
MongoAutoShow.prototype._columns = { 
    uid: { type: "number", default: 0 },
    type: { type: "number", default: 0 },
    rewardTypeIndex: { type: "number", default: 0 },
    startTime: { type: "number", default: 0 },
    beAttackedTimes: { type: "number", default: 0 },
    beAttackedRecord: { type: "object", default: [] },
};