/**
 * @description 全局公会项目表
 * @author chenyq
 * @date 2020/05/27
 */

const MongoDataBase = require('../../logic/mongo/mongoDataBase');

class MongoGuildProject extends MongoDataBase {
    constructor(data) {
        super(data);
    }
}

module.exports = MongoGuildProject;

MongoGuildProject.prototype._collectionName = 'guildProject';
MongoGuildProject.prototype._columns = {
    guildId: { type: "number", default: 0 },            // 联盟编号
    actId: { type: "number", default: 0 },              // 活动编号(中午201,晚上202)
    id: { type: "number", default: 0 },                 // 项目编号
    type: { type: "number", default: 0 },               // 项目类型
    openTime: { type: "number", default: 0 },           // 项目开启时间
    endTime: { type: "number", default: 0 },            // 项目结束时间(结算时使用)
    donation: { type: "number", default: 0 },           // 当前捐献进度
    donationInfo: { type: "object", default: {} },      // 捐献信息{捐献度、现金捐献次数、最后捐献时间}
    curHp: { type: "number", default: 0 },              // 当前生命
    atkLastTime: { type: "number", default: 0 },        // 最近受攻击时间
    damageInfo: { type: "object", default: {} },        // 伤害信息{伤害、最后谈判时间、谈判购买次数}
    career: { type: "number", default: 0 },             // 运营加成职业
    sex: { type: "number", default: 0 },                // 运营加成性别
    posInfo: { type: "object", default: {} },           // 派驻信息
};
MongoGuildProject.prototype._index = 'guildId';
