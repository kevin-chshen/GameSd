/**
 * @description 商城购买信息表
 * @author chenyq
 * @date 2020/06/10
 */

const Sequelize = require('sequelize');
module.exports = seqInstance => {
    const { STRING, INTEGER, BIGINT } = Sequelize;
    const Shop = seqInstance.define('tbllog_shop', {
        id: { type: INTEGER, primaryKey: true, autoIncrement: true },   // 
        platform: { type: STRING(255) },                    // 所属平台，记录SDK platform_id
        device: { type: STRING(255) },                      // 最后登录设备端，可选值如下： android、ios、web、pc
        role_id: { type: BIGINT(20)},                       // 角色ID
        account_name: { type: STRING(255) },                // 平台账号ID
        shopId: { type: INTEGER },                          // 商城类型ID
        dim_level: { type: INTEGER },                       // 玩家等级
        dim_prof: { type: INTEGER },                        // 职业ID
        money_type: { type: INTEGER },                      // 货币类型
        amount: { type: INTEGER },                          // 货币数量(总价)
        item_type: { type: INTEGER },                       // 物品类型id（礼包类型id）
        item_id: { type: INTEGER },                         // 物品ID（礼包id）
        item_number: { type: INTEGER },                     // 物品数量（礼包数量）
        happend_time: { type: INTEGER },                    // 事件发生时间
    }, {
        timestamps: false,                                 // 去掉sequelize中自动添加的时间字段
        freezeTableName: true                              // 去掉表名自动添加的s
    });
    return Shop;
};