/**
 * @description 道具字典表
 * @author chenyq
 * @date 2020/06/11
 */

const Sequelize = require('sequelize');
module.exports = seqInstance => {
    const { STRING, INTEGER } = Sequelize;
    const DictItem = seqInstance.define('dict_item', {
        item_id: { type: INTEGER, primaryKey: true, autoIncrement: true },  // 道具ID
        item_name: { type: STRING(255) },                   // 道具名称
        item_type: { type: INTEGER },                         // 道具类型(普通道具记0，礼包记录礼包类型id, 商店1，神秘商店2)
        item_type_name: { type: STRING(1024) },                   // 道具类型名称(礼包类型名称)
        quality: { type: INTEGER },                         // 品质
        level_req: { type: INTEGER },                       // 使用等级要求
    }, {
        timestamps: false,                                 // 去掉sequelize中自动添加的时间字段
        freezeTableName: true                              // 去掉表名自动添加的s
    });
    return DictItem;
};