/**
 * @description 事件流程字典表
 * @author chenyq
 * @date 2020/07/23
 */

const Sequelize = require('sequelize');
module.exports = seqInstance => {
    const { STRING, INTEGER } = Sequelize;
    const DictLinkStep = seqInstance.define('dict_link_step', {
        step_id: { type: INTEGER, primaryKey: true, autoIncrement: true }, // 步骤ID
        next_step_id: { type: INTEGER },                    // 本步骤的下一个步骤ID
        step_name: { type: STRING(255) },                   // 本次步骤名称
        order_id: { type: INTEGER },                        // 顺序ID
        step_section: { type: STRING(255) },                // 步骤所属的主任务阶段
        step_type: { type: INTEGER },                       // 任务类型，1代表主线任务、2代表强制引导、3代表支线
    }, {
        timestamps: false,                                 // 去掉sequelize中自动添加的时间字段
        freezeTableName: true                              // 去掉表名自动添加的s
    });
    return DictLinkStep;
};