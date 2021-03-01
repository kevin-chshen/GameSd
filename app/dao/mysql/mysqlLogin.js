/**
 * @description 登录日志
 * @author linjs
 * @date 2020/03/18
 */

const Sequelize = require('sequelize');
module.exports = seqInstance => {
    const { STRING, INTEGER, BIGINT } = Sequelize;
    const Login = seqInstance.define('tbllog_login', {
        id: { type: INTEGER, primaryKey: true, autoIncrement: true },
        platform: { type: STRING(255) },      // 所属平台，记录SDK platform_id
        device: { type: STRING(255) },        // 设备端：android、 ios 、web、 pc
        role_id: { type: BIGINT(20) },        // 角色ID
        account_name: { type: STRING(255) },  // 平台账号ID
        dim_level: { type: INTEGER },         // 等级
        user_ip: { type: STRING(255) },       // 登录IP
        login_map_id: { type: INTEGER },      // 登录地图ID
        did: { type: STRING(255) },           // 用户设备ID
        game_version: { type: STRING(255) },  // 游戏版本号
        os: { type: STRING(255) },            // 手游专用 手机操作系统，如： android、iOS
        os_version: { type: STRING(255) },    // 手游专用 操作系统版本号，如： 2.3.4
        device_name: { type: STRING(255) },   // 手游专用 设备名称，如： 三星GT-S5830 MI 2S , Nexus 5 iPhone9 , 1
        screen: { type: STRING(255) },        // 手游专用 屏幕分辨率，如： 480*800
        mno: { type: STRING(255) },           // 手游专用 移动网络运营商(mobile network operators)，如： 中国移动、中国联通
        nm: { type: STRING(255) },            // 手游专用 联网方式(Networking mode)，如： 3G、WIFI
        happend_time: { type: INTEGER },      // 事件发生时间
    }, {
        timestamps: false,                    // 去掉sequelize中自动添加的时间字段
        freezeTableName: true                 // 去掉表名自动添加的s
    });
    return Login;
};