/**
 * @description 副本日志
 * @author chenyq
 * @date 2020/07/15
 */

const Sequelize = require('sequelize');
module.exports = seqInstance => {
    const { STRING, INTEGER, BIGINT } = Sequelize;
    const Dungeon = seqInstance.define('tbllog_dungeon', {
        id: { type: INTEGER, primaryKey: true, autoIncrement: true },   // 
        platform: { type: STRING(255) },                    // 所属平台，记录SDK platform_id
        device: { type: STRING(255) },                      // 最后登录设备端，可选值如下： android、ios、web、pc
        role_id: { type: BIGINT(20)},                       // 角色ID
        role_name: { type: STRING(255) },                   // 角色名
        account_name: { type: STRING(255) },                // 平台账号ID
        matchID: { type: INTEGER },                         // 章节关卡编号
        happend_time: { type: INTEGER },                    // 事件发生时间
    }, {
        timestamps: false,                                 // 去掉sequelize中自动添加的时间字段
        freezeTableName: true                              // 去掉表名自动添加的s
    });
    return Dungeon;
};