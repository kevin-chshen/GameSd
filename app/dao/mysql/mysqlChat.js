/**
 * @description 聊天日志
 * @author linjs
 * @date 2020/03/18
 */

const Sequelize = require('sequelize');
module.exports = seqInstance => {
    const { STRING, INTEGER, BIGINT } = Sequelize;
    const Chat = seqInstance.define('tbllog_chat', {
        id: { type: INTEGER, primaryKey: true, autoIncrement: true },
        platform: { type: STRING(255) },      // 所属平台，记录SDK platform_id
        device: { type: STRING(255) },        // 设备端：android、 ios 、 web 、pc
        account_name: { type: STRING(255) },  // 平台账号ID
        role_id: { type: BIGINT(20) },        // 角色ID
        role_name: { type: STRING(255) },     // 角色名
        dim_level: { type: INTEGER },         // 玩家等级
        user_ip: { type: STRING(255) },       // 玩家IP
        channel: { type: INTEGER },           // 聊天频道（提供字典表）
        msg: { type: STRING(255) },           // 聊天信息
        type: { type: INTEGER },              // 内容类型(0代表语音,1代表文本)
        target_role_id: { type: BIGINT(20) }, // 聊天对象ID
        happend_time: { type: INTEGER },      // 聊天发生时间
    }, {
        timestamps: false,                    // 去掉sequelize中自动添加的时间字段
        freezeTableName: true                 // 去掉表名自动添加的s
    });
    return Chat;
};