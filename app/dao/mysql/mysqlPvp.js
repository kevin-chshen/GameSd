/**
 * @description PVP日志
 * @author linjs
 * @date 2020/03/18
 */

const Sequelize = require('sequelize');
module.exports = seqInstance => {
    const { STRING, INTEGER, BIGINT } = Sequelize;
    const Pvp = seqInstance.define('tbllog_pvp', {
        id: { type: INTEGER, primaryKey: true, autoIncrement: true },
        platform: { type: STRING(255) },     // 所属平台，记录SDK platform_id
        device: { type: STRING(255) },       // 设备端：android、 ios、 web、 pc
        role_id: { type: BIGINT(20) },       // 角色ID
        account_name: { type: STRING(255) }, // 平台账号ID
        dim_level: { type: INTEGER },        // 玩家等级
        action_type: { type: INTEGER },      // 类型id（对应dict_action.action_type_id）,现pvp日志分为PVP字典(12)以及战场字典(10), 如果游戏没有区分，则记为0
        pvp_type: { type: INTEGER },         // pvp 类型，1=>1v1, 2=>2v2, 3=>3v3, 4=>4v4, 5=>5v5, 10=>10v10，其他从1000开始
        pvp_id: { type: INTEGER },           // PVP地图ID，对应dict_action中的action_id，表示该pvp行为所在的地图
        continuous: { type: INTEGER },       // 连续战斗局数，从1开始
        begin_time: { type: INTEGER },       // 事件发生时间
        end_time: { type: INTEGER },         // 事件结束时间
        time_duration: { type: INTEGER },    // PVP战斗时长
        dim_power: { type: INTEGER },        // 战斗力
        game_id: { type: INTEGER },          // 游戏场次或者记录成room_id
        status: { type: INTEGER },           // 状态 (0=提前退出，1=完成比赛，2=开始匹配，-1=退出匹配或匹配失败)
        result: { type: INTEGER },           // 结果（1=战胜，2=战败，3=战平，4=无胜负（类似虫虫、球球的自由模式需要用到4））
        happend_time: { type: INTEGER },     // 事件发生时间
    }, {
        timestamps: false,                   // 去掉sequelize中自动添加的时间字段
        freezeTableName: true                // 去掉表名自动添加的s
    });
    return Pvp;
};