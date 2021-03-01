/**
 * @description 联盟项目日志
 * @author chenyq
 * @date 2020/06/17
 */

const Sequelize = require('sequelize');
module.exports = seqInstance => {
    const { INTEGER, TEXT } = Sequelize;
    const GuildProject = seqInstance.define('tbllog_guild_project', {
        id: { type: INTEGER, primaryKey: true, autoIncrement: true },   //
        guildId: { type: INTEGER },                         // 联盟id
        state: { type: INTEGER },                           // 项目状态(阶段结束的时候 1选择结束项目开始、2筹备结束、3谈判结束、4运营结束)
        info: { type: TEXT },                               // 
        happend_time: { type: INTEGER },                    // 事件发生时间
    }, {
        timestamps: false,                                 // 去掉sequelize中自动添加的时间字段
        freezeTableName: true                              // 去掉表名自动添加的s
    });
    return GuildProject;
};