/**
 * @description 战斗记录，计划是只有PvP有战斗记录，PvE不会记录
 * @author jzy
 * @date 2020/03/27
 */
const MongoDataBase = require("../../logic/mongo/mongoDataBase");

class MongoBattle extends MongoDataBase {
    constructor(data){
        super(data);
    }
}

module.exports = MongoBattle;

MongoBattle.prototype._collectionName = "battle";
//使用_id作为唯一标示符
MongoBattle.prototype._columns = {
    battleType: { type: "number", default: 0 },
    playerInfo: { type: "object", default: {} },
    playerArray: { type: "object", default: [] },
    enemyInfo: { type: "object", default: {} },
    enemyArray: { type: "object", default: [] },
    roundRecord: { type: "object", default: [] },
    playerMaxArray: { type: "object", default: [] },
    enemyMaxArray: { type: "object", default: [] },
    winUid: { type: "string", default: "0" },
    award: { type: "object", default: [] },
    createTime: { type: "number", default: 0 },
};