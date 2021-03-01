/**
 * @description 行为字典表
 * @author chenyq
 * @date 2020/06/11
 */

const Sequelize = require('sequelize');
module.exports = seqInstance => {
    const { STRING, INTEGER } = Sequelize;
    const DictAction = seqInstance.define('dict_action', {
        action_id: { type: INTEGER, primaryKey: true, autoIncrement: true },    // 行为ID
        action_name: { type: STRING(255) },                 // 行为名称
        action_type_id: { type: INTEGER, primaryKey: true },                    // 行为类型ID
        level_req: { type: INTEGER },                       // 等级要求
    }, {
        timestamps: false,                                 // 去掉sequelize中自动添加的时间字段
        freezeTableName: true                              // 去掉表名自动添加的s
    });
    return DictAction;
};