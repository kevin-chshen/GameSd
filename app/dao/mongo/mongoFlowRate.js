/**
 * @description 全局流量为王表
 * @author chenyq
 * @date 2020/05/07
 */

const MongoDataBase = require('../../logic/mongo/mongoDataBase');

class MongoFlowRate extends MongoDataBase {
    constructor(data) {
        super(data);
    }
}

module.exports = MongoFlowRate;

MongoFlowRate.prototype._collectionName = 'flowRate';
MongoFlowRate.prototype._columns = {
    uid: { type: "number", default: 0 },                // 玩家编号
    rank: { type: "number", default: 0 },               // 当前排位
    maxRank: { type: "number", default: 0 },            // 最大排位
    lastGetOfflineTime: { type: "number", default: 0 }, // 上次领取离线奖励(时间戳 秒)
    rivalList: {type: "object", default: []},           // 对手排行列表
    battleRecord: {type: "object", default: {}},        // 战报记录
    buyNum: { type: "number", default: 0 },             // 已购买次数
    lastBuyTime: { type: "number", default: 0 },        // 最后购买时间
};
MongoFlowRate.prototype._index = 'uid';
