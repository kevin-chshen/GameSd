/**
 * @description 角色创建日志
 * @author linjs
 * @date 2020/03/18
 */

const Sequelize = require('sequelize');
module.exports = seqInstance => {
    const { STRING, INTEGER, BIGINT } = Sequelize;
    const Role = seqInstance.define('tbllog_role', {
        id: { type: INTEGER, primaryKey: true, autoIncrement: true },
        platform: { type: STRING(255) },     // 所属平台，记录SDK platform_id
        device: { type: STRING(255) },       // 设备端：android、ios、web、pc
        role_id: { type: BIGINT(255) },      // 角色ID
        role_name: { type: STRING(255) },    // 角色名称
        account_name: { type: STRING(255) }, // 平台账号ID
        user_ip: { type: STRING(255) },      // 玩家IP
        dim_prof: { type: INTEGER },         // 职业ID
        dim_sex: { type: INTEGER },          // 性别(0=女，1=男，2=未知)
        did: { type: STRING(255) },          // 用户设备ID
        game_version: { type: STRING(255) }, // 游戏版本号
        happend_time: { type: INTEGER },     // 事件发生时
    }, {
        timestamps: false,                   // 去掉sequelize中自动添加的时间字段
        freezeTableName: true                // 去掉表名自动添加的s
    });
    return Role;
};