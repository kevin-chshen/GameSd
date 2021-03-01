/**
 * @description 在线日志
 * @author linjs
 * @date 2020/03/18
 */

const Sequelize = require('sequelize');
module.exports = seqInstance => {
    const { STRING, INTEGER } = Sequelize;
    const Online = seqInstance.define('tbllog_online', {
        id: { type: INTEGER, primaryKey: true, autoIncrement: true },
        platform: { type: STRING(255) },     // 所属平台，记录SDK platform_id
        device: { type: STRING(255) },       // 设备端：android、 ios 、 web 、 pc
        people: { type: INTEGER },           // 当前在线玩家总人数
        device_cnt: { type: INTEGER },       // 当前在线玩家总设备数
        ip_cnt: { type: INTEGER },           // 当前在线IP数
        happend_time: { type: INTEGER },     // 事件发生时间
    }, {
        timestamps: false,                   // 去掉sequelize中自动添加的时间字段
        freezeTableName: true                // 去掉表名自动添加的s
    });
    return Online;
};