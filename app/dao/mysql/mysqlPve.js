/**
 * @description PVE日志
 * @author chenyq
 * @date 2020/07/23
 */

const Sequelize = require('sequelize');
module.exports = seqInstance => {
    const { STRING, INTEGER, BIGINT } = Sequelize;
    const Pve = seqInstance.define('tbllog_pve', {
        id: { type: INTEGER, primaryKey: true, autoIncrement: true },
        platform: { type: STRING(255) },     // 所属平台，记录SDK platform_id
        device: { type: STRING(255) },       // 设备端：android、 ios、 web、 pc
        role_id: { type: BIGINT(20) },       // 角色ID
        account_name: { type: STRING(255) }, // 平台账号ID
        dim_level: { type: INTEGER },        // 玩家等级
        action_type: { type: INTEGER },      // 功能类型ID(对应dict_action.action_type_id)，无区分时记为0
        action_id: { type: INTEGER },        // 功能ID(对应dict_action.action_id)
        pve_id: { type: INTEGER },           // 功能ID（对应dict_action.action_id）
        dim_power: { type: BIGINT(20) },     // 战斗力
        status: { type: INTEGER },           // 状态：1=进入（开始），2=结束（完成），3=提前退出（未完成），4=超时（未完成）
        info: { type: STRING(255) },         // 行为特定标志，没有记空
        begin_time: { type: INTEGER },       // 事件发生时间
        end_time: { type: INTEGER },         // 事件结束时间
        time_duration: { type: INTEGER },    // PVE战斗时长
        happend_time: { type: INTEGER },     // 事件发生时间
    }, {
        timestamps: false,                   // 去掉sequelize中自动添加的时间字段
        freezeTableName: true                // 去掉表名自动添加的s
    });
    return Pve;
};