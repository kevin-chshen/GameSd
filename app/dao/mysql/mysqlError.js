/**
 * @description 错误日志
 * @author linjs
 * @date 2020/03/18
 */

const Sequelize = require('sequelize');
module.exports = seqInstance => {
    const { STRING, INTEGER, BIGINT } = Sequelize;
    const Error = seqInstance.define('tbllog_error', {
        id: { type: INTEGER, primaryKey: true, autoIncrement: true },
        platform: { type: STRING(255) },     // 所属平台，记录SDK platform_id
        device: { type: STRING(255) },       // 设备端：android、 ios 、 web 、pc
        role_id: { type: BIGINT(20) },       // 角色ID
        account_name: { type: STRING(255) }, // 平台账号ID
        error_msg: { type: STRING(255) },    // 错误信息
        did: { type: STRING(255) },          // 用户设备ID
        game_version: { type: STRING(255) }, // 游戏版本号
        os: { type: STRING(255) },           // 手游专用 手机操作系统，如： android、iOS
        os_version: { type: STRING(255) },   // 手游专用 操作系统版本号，如： 2.3.4
        device_name: { type: STRING(255) },  // 手游专用 设备名称，如： 三星GT-S5830
        Screen: { type: STRING(255) },       // 手游专用 屏幕分辨率，如： 480*800
        Mno: { type: STRING(255) },          // 手游专用 移动网络运营商(mobile network operators)，如： 中国移动、中国联通
        Nm: { type: STRING(255) },           // 手游专用 联网方式(Networking mode)，如： 3G、WIFI
        happend_time: { type: INTEGER },     // 错误发生时间
    }, {
        timestamps: false,                   // 去掉sequelize中自动添加的时间字段
        freezeTableName: true                // 去掉表名自动添加的s
    });
    return Error;
};