/**
 * @description 帮派信息表
 * @author linjs，chenyq
 * @date 2020/06/08
 */

const Sequelize = require('sequelize');
module.exports = seqInstance => {
    const { STRING, INTEGER, BIGINT } = Sequelize;
    const Guild = seqInstance.define('tbllog_guild', {
        platform: { type: STRING(255) },                    // 所属平台，记录SDK platform_id
        device: { type: STRING(255) },                      // 最后登录设备端，可选值如下： android、ios、web、pc
        guild_id: { type: BIGINT(20), primaryKey: true, autoIncrement: true },  // 联盟ID
        guild_name: { type: STRING(255) },                  // 联盟名称
        guild_level: { type: INTEGER },                     // 联盟等级
        guild_exp: { type: BIGINT(20) },                    // 联盟经验
        guild_rank: { type: INTEGER },                      // 联盟排行
        guild_member: { type: INTEGER },                    // 联盟人数
        guild_leader_id: { type: BIGINT(20) },              // 盟主ID
        guild_leader_name: { type: STRING(255) },           // 盟主名称
        guild_leader_power: { type: BIGINT(20) },           // 盟主战力
        guild_leader_vip: { type: INTEGER },                // 盟主vip
        guild_notice: { type: STRING(255) },                // 联盟公告
        guild_power: { type: BIGINT(20) },                  // 联盟总战力
        guild_money: { type: INTEGER },                     // 联盟资金
        happend_time: { type: INTEGER },                    // 事件发生时间
    }, {
        timestamps: false,                                 // 去掉sequelize中自动添加的时间字段
        freezeTableName: true                              // 去掉表名自动添加的s
    });
    return Guild;
};