/**
 * @description 等级变动日志
 * @author chenyq
 * @date 2020/06/08
 */

const Sequelize = require('sequelize');
module.exports = seqInstance => {
    const { STRING, INTEGER, BIGINT } = Sequelize;
    const LevelUp = seqInstance.define('tbllog_level_up', {
        id: { type: INTEGER, primaryKey: true, autoIncrement: true },   // 
        platform: { type: STRING(255) },                    // 所属平台，记录SDK platform_id
        device: { type: STRING(255) },                      // 最后登录设备端，可选值如下： android、ios、web、pc
        role_id: { type: BIGINT(20)},                       // 角色ID
        role_name: { type: STRING(255) },                   // 角色名
        account_name: { type: STRING(255) },                // 平台账号ID
        last_level: { type: INTEGER },                      // 上一等级
        current_level: { type: INTEGER },                   // 当前等级
        last_exp: { type: INTEGER },                        // 上一经验值
        current_exp: { type: INTEGER },                     // 当前经验值
        happend_time: { type: INTEGER },                    // 事件发生时间
    }, {
        timestamps: false,                                 // 去掉sequelize中自动添加的时间字段
        freezeTableName: true                              // 去掉表名自动添加的s
    });
    return LevelUp;
};