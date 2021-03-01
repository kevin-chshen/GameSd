/**
 * @description 货币变动日志
 * @author linjs
 * @date 2020/03/18
 */

const Sequelize = require('sequelize');
module.exports = seqInstance => {
    const { STRING, INTEGER, BIGINT } = Sequelize;
    const Gold = seqInstance.define('tbllog_gold', {
        id: { type: INTEGER, primaryKey: true, autoIncrement: true },
        platform: { type: STRING(255) },     // 所属平台，记录SDK platform_id
        device: { type: STRING(255) },       // 设备端：android、 ios 、 web 、 pc
        role_id: { type: BIGINT(20) },       // 角色ID
        account_name: { type: STRING(255) }, // 平台账号ID
        dim_level: { type: INTEGER },        // 等级
        dim_prof: { type: INTEGER },         // 职业ID
        money_type: { type: INTEGER },       // 货币类型（1=钻石，2=绑定钻石，3=金币，4=绑定金币，5=礼券，6=积分/荣誉, 7=兑换）
        amount: { type: INTEGER },           // 货币数量
        money_remain: { type: INTEGER },     // 剩余货币数量
        item_id: { type: INTEGER },          // 涉及的道具ID
        opt: { type: INTEGER },              // 货币加减 （1=增加，2=减少）
        action_1: { type: INTEGER },         // 行为分类1 （一级消费点） 对应(dict_action.action_id)
        action_2: { type: INTEGER },         // 若存在一级消费点,不存在二级消费点,则将二级消费点设置为一级消费点的值
        item_number: { type: INTEGER },      // 物品数量
        happend_time: { type: INTEGER },     // 事件发生时间
    }, {
        timestamps: false,                   // 去掉sequelize中自动添加的时间字段
        freezeTableName: true                // 去掉表名自动添加的s
    });
    return Gold;
};