/**
 * @description 退出日志
 * @author linjs
 * @date 2020/03/18
 */

const Sequelize = require('sequelize');
module.exports = seqInstance => {
    const { STRING, INTEGER, BIGINT } = Sequelize;
    const Quit = seqInstance.define('tbllog_quit', {
        id: { type: INTEGER, primaryKey: true, autoIncrement: true },
        platform: { type: STRING(255) },      // 所属平台，记录SDK platform_id
        device: { type: STRING(255) },        // 设备端：android、 ios 、 web、 pc
        role_id: { type: BIGINT(20) },        // 角色ID
        account_name: { type: STRING(255) },  // 平台账号ID
        login_level: { type: INTEGER },       // 登录等级
        logout_level: { type: INTEGER },      // 登出等级
        logout_ip: { type: STRING(255) },     // 登出IP
        login_time: { type: INTEGER },        // 登录时间
        logout_time: { type: INTEGER },       // 退出时间
        time_duration: { type: INTEGER },     // 在线时长
        logout_map_id: { type: INTEGER },     // 退出地图ID
        reason_id: { type: INTEGER },         // 退出异常或者原因，reason 对应字典表(0表示正常退出)
        msg: { type: STRING(255) },           // 特殊信息
        did: { type: STRING(255) },           // 用户设备ID
        game_version: { type: STRING(255) },  // 游戏版本号
    }, {
        timestamps: false,                    // 去掉sequelize中自动添加的时间字段
        freezeTableName: true                 // 去掉表名自动添加的s
    });
    return Quit;
};