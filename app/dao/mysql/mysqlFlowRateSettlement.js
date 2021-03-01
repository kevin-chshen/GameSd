/**
 * @description 流量为王结算日志
 * @author chenyq
 * @date 2020/06/15
 */

const Sequelize = require('sequelize');
module.exports = seqInstance => {
    const { TEXT, INTEGER } = Sequelize;
    const FlowRateSettlement = seqInstance.define('tbllog_flowRate_settlement', {
        id: { type: INTEGER, primaryKey: true, autoIncrement: true },   // 
        rankInfo: { type: TEXT },                           // 排行信息{配置id:[[uid,rank],[uid,rank],...],配置id:[[uid,rank],[uid,rank],...],...}
        happend_time: { type: INTEGER },                    // 事件发生时间
    }, {
        timestamps: false,                                 // 去掉sequelize中自动添加的时间字段
        freezeTableName: true                              // 去掉表名自动添加的s
    });
    return FlowRateSettlement;
};