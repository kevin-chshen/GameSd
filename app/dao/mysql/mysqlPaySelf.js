/**
 * @description 充值日志
 * @author linjs
 * @date 2020/03/18
 */

const Sequelize = require('sequelize');

module.exports = seqInstance => {
    const { STRING, INTEGER, BIGINT, FLOAT } = Sequelize;
    const Pay = seqInstance.define('tbllog_pay_self', {
        id: { type: INTEGER, primaryKey: true, autoIncrement: true },
        platform: { type: STRING(255) },     // 所属平台，记录SDK platform_id
        device: { type: STRING(255) },       // 设备端：android、 ios 、 web 、 pc
        role_id: { type: BIGINT(20) },       // 角色ID
        account_name: { type: STRING(255) }, // 平台账号ID
        user_ip: { type: STRING(255) },      // 玩家IP
        dim_level: { type: INTEGER },        // 等级
        pay_type: { type: INTEGER },         // 充值类型, 0为测试订单（不计入流水部分）, 其他为正式订单(如1)
        order_id: { type: STRING(255) },     // 订单号
        pay_money: { type: FLOAT },          // 充值金额（总充值金额）
        money_type: { type: INTEGER },       // 充值金额（总充值金额）
        pay_gold: { type: INTEGER },         // 充值获得的元宝/金币数
        did: { type: STRING(255) },          // 用户设备ID
        game_version: { type: STRING(255) }, // 游戏版本号
        happend_time: { type: INTEGER },     // 事件发生时间
        pay_id: { type: STRING(255) },       // 充值ID
        dungeon_id: { type: INTEGER },       // 当前主线关卡ID
        main_task_id: { type: INTEGER },     // 当前主线任务ID
    }, {
        timestamps: false,                   // 去掉sequelize中自动添加的时间字段
        freezeTableName: true                // 去掉表名自动添加的s
    });
    return Pay;
};