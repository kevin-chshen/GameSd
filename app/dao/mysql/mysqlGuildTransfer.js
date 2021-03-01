/**
 * @description 联盟盟主转让日志
 * @author chenyq
 * @date 2020/06/16
 */

const Sequelize = require('sequelize');
module.exports = seqInstance => {
    const { STRING, INTEGER, BIGINT } = Sequelize;
    const guildTransfer = seqInstance.define('tbllog_guild_transfer', {
        id: { type: INTEGER, primaryKey: true, autoIncrement: true },   // 
        transferType: { type: INTEGER },                    // 转让类型 0自动，1手动
        guildId: { type: INTEGER },                         // 联盟id
        guildName: { type: STRING(255) },                   // 联盟名称
        oldUid: { type: BIGINT(20) },                       // 旧盟主编号
        oldName: { type: STRING(255) },                     // 旧盟主名称
        newUid: { type: BIGINT(20) },                       // 新盟主编号
        newName: { type: STRING(255) },                     // 新盟主名称
        happend_time: { type: INTEGER },                    // 事件发生时间
    }, {
        timestamps: false,                                 // 去掉sequelize中自动添加的时间字段
        freezeTableName: true                              // 去掉表名自动添加的s
    });
    return guildTransfer;
};