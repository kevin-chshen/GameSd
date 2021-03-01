/**
 * @description 用户信息表
 * @author linjs
 * @date 2020/03/18
 */

const Sequelize = require('sequelize');
module.exports = seqInstance => {
    const { STRING, INTEGER, BIGINT } = Sequelize;
    const Player = seqInstance.define('tbllog_player', {
        id: { type: INTEGER, primaryKey: true, autoIncrement: true },
        platform: { type: STRING(255) },                               // 所属平台，记录SDK platform_id
        device: { type: STRING(255) },                                 // 最后登录设备端，可选值如下： android、ios、web、pc
        role_id: { type: BIGINT(20), allowNull: false, unique: true }, // 角色ID
        role_name: { type: STRING(255) },                              // 角色名
        account_name: { type: STRING(255) },                           // 平台账号ID
        user_name: { type: STRING(255) },                              // 平台帐号名
        dim_nation: { type: STRING(255) },                             // 阵营
        dim_prof: { type: INTEGER },                                   // 职业
        dim_sex: { type: INTEGER },                                    // 性别(0=女，1=男，2=未知)
        reg_time: { type: INTEGER },                                   // 注册时间
        reg_ip: { type: STRING(255) },                                 // 注册IP
        did: { type: STRING(255) },                                    // 用户设备ID
        dim_level: { type: INTEGER },                                  // 用户等级
        dim_vip_level: { type: INTEGER },                              // VIP等级
        dim_grade: { type: INTEGER },                                  // 用户段位ID
        dim_exp: { type: INTEGER },                                    // 当前经验
        dim_guild: { type: STRING(255) },                              // 帮派名称
        dim_power: { type: INTEGER },                                  // 战斗力
        gold_number: { type: INTEGER },                                // 剩余元宝数（充值兑换货币）
        bgold_number: { type: INTEGER },                               // 剩余绑定元宝数（非充值兑换货币）
        coin_number: { type: INTEGER },                                // 剩余金币数
        bcoin_number: { type: INTEGER },                               // 剩余绑定金币数
        pay_money: { type: INTEGER },                                  // 总充值
        first_pay_time: { type: INTEGER },                             // 首充时间
        last_pay_time: { type: INTEGER },                              // 最后充值时间
        last_login_time: { type: INTEGER },                            // 最后登录时间
        happend_time: { type: INTEGER },                               // 变动时间
    }, {
        timestamps: false,                                             // 去掉sequelize中自动添加的时间字段
        freezeTableName: true                                          // 去掉表名自动添加的s
    });
    return Player;
};