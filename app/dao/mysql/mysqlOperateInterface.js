/**
 * @description 运营接口 日志
 * @author chenyq
 * @date 2020/06/16
 */

const Sequelize = require('sequelize');
module.exports = seqInstance => {
    const { STRING, INTEGER, TEXT } = Sequelize;
    const OperateInterface = seqInstance.define('tbllog_operate_interface', {
        id: { type: INTEGER, primaryKey: true, autoIncrement: true },   //
        path: { type: STRING(255) },                        // path
        query: { type: TEXT },                              // query
        result: { type: TEXT},                              // result
        happend_time: { type: INTEGER },                    // 事件发生时间
    }, {
        timestamps: false,                                  // 去掉sequelize中自动添加的时间字段
        freezeTableName: true                               // 去掉表名自动添加的s
    });
    return OperateInterface;
};