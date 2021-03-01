/**
 * @description 道具产出/消耗日志
 * @author chenyq
 * @date 2020/06/08
 */

const Sequelize = require('sequelize');
module.exports = seqInstance => {
    const { STRING, INTEGER, BIGINT } = Sequelize;
    const Items = seqInstance.define('tbllog_items', {
        id: { type: INTEGER, primaryKey: true, autoIncrement: true },   // 
        platform: { type: STRING(255) },                    // 所属平台，记录SDK platform_id
        device: { type: STRING(255) },                      // 最后登录设备端，可选值如下： android、ios、web、pc
        role_id: { type: BIGINT(20)},                       // 角色ID
        account_name: { type: STRING(255) },                // 平台账号ID
        dim_level: { type: INTEGER },                       // 玩家等级
        opt: { type: INTEGER },                             // 操作类型 ( -1是使用【数量减少】，1是增加【数量增加】，0是修改【数量不变，状态变化】)
        action_id: { type: INTEGER },                       // 对应各自项目组的道具消耗项目字典,行为类型（dict_action.action_id）
        item_id: { type: INTEGER },                         // 道具ID
        item_number: { type: INTEGER },                     // 道具获得/消耗数量
        map_id: { type: INTEGER },                          // 物品产出所在地图ID(dict_action.action_id)
        happend_time: { type: INTEGER },                    // 事件发生时间
    }, {
        timestamps: false,                                 // 去掉sequelize中自动添加的时间字段
        freezeTableName: true                              // 去掉表名自动添加的s
    });
    return Items;
};