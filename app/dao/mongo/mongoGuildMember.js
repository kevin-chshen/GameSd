/**
 * @description 全局公会成员表
 * @author chenyq
 * @date 2020/04/26
 */

const MongoDataBase = require('../../logic/mongo/mongoDataBase');

class MongoGuildMember extends MongoDataBase {
    constructor(data) {
        super(data);
    }
}

module.exports = MongoGuildMember;

MongoGuildMember.prototype._collectionName = 'guildMember';
MongoGuildMember.prototype._columns = {
    uid: { type: "number", default: 0 },            // 玩家编号
    guildId: { type: "number", default: 0 },        // 联盟编号
    job: { type: "number", default: 0 },            // 联盟职位
    contribute: { type: "number", default: 0 },     // 个人贡献
    leaveTime: { type: "number", default: 0 },      // 最后离开时间
    joinTime: { type: "number", default: 0 },       // 创建时间
    name: { type: "string", default: '' },          // 玩家名称
    lv: { type: "number", default: 0 },             // 玩家等级
    vip: { type: "number", default: 0 },            // 玩家VIP
    head: { type: "number", default: 0 },           // 玩家头像
    sex: { type: "number", default: 0 },            // 玩家性别
    power: { type: "number", default: 0 },          // 玩家身价
    lastLogoutTime: { type: "number", default: 0 }, // 离线时间
    buildList: { type: "object", default: [] },     // 建设信息
    buildBox: { type: "object", default: [] },      // 建设宝箱已领取信息
    buildLastTime: { type: "number", default: 0 },   // 建设最后操作时间
    technologyInfo: { type: "object", default: {} }, // 科技信息
    guildContribute: { type: "number", default: 0 }, // 联盟贡献
};
MongoGuildMember.prototype._index = 'uid';
