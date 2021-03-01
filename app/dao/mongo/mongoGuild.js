/**
 * @description 全局公会表
 * @author chenyq
 * @date 2020/04/26
 */

const MongoDataBase = require('../../logic/mongo/mongoDataBase');

class MongoGuild extends MongoDataBase {
    constructor(data) {
        super(data);
    }
}

module.exports = MongoGuild;

MongoGuild.prototype._collectionName = 'guild';
MongoGuild.prototype._columns = {
    guildId: { type: "number", default: 0 },       // 联盟编号
    name: { type: "string", default: '' },          // 联盟名称
    badge: { type: "string", default: '' },         // 联盟徽章
    manifesto: { type: "string", default: '' },     // 联盟宣言
    notice: { type: "string", default: '' },        // 联盟公告
    lv: { type: "number", default: 0 },             // 联盟等级
    exp: { type: "number", default: 0 },            // 联盟经验
    createTime: { type: "number", default: 0 },     // 创建时间
    joinType: { type: "number", default: 0 },       // 加入类型
    memberList: { type: "object", default: {} },    // 成员信息{uid:job,uid:job}
    applyList: { type: "object", default: {} },     // 申请信息
    lastTime: { type: "number", default: 0 },       // 最后活跃时间
    totalPower: { type: "number", default: 0 },     // 总身价
    championsName: { type: "string", default: '' }, // 盟主名称
    championsUid: { type: "number", default: 0 },   // 盟主uid
    dayBuildExp: { type: "number", default: 0 },    // 今日建设资金
    buildRecord: { type: "object", default: [] },   // 建设贡献记录
};
MongoGuild.prototype._index = 'guildId';
