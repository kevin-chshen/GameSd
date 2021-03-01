/**
 * @description 
 * @author chenyq
 * @date 2020/06/17
 */

const Sequelize = require('sequelize');
module.exports = seqInstance => {
    const { INTEGER, STRING } = Sequelize;
    const Version = seqInstance.define('version', {
        id: { type: INTEGER, primaryKey: true, autoIncrement: true },   //
        version: { type: STRING(20) },                         // log版本
        happend_time: { type: INTEGER },                    // 事件发生时间
    }, {
        timestamps: false,                                 // 去掉sequelize中自动添加的时间字段
        freezeTableName: true                              // 去掉表名自动添加的s
    });
    return Version;
};