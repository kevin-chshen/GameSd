/**
 * @description GM用户反馈表
 * @author chenyq
 * @date 2020/06/24
 */

const Sequelize = require('sequelize');
module.exports = seqInstance => {
    const { STRING, INTEGER, BIGINT } = Sequelize;
    const Complaints = seqInstance.define('tbllog_complaints', {
        complaint_id: { type: INTEGER, primaryKey: true, autoIncrement: true },  // 投诉编号, 服唯一
        platform: { type: STRING(255) },                    // 所属平台，记录SDK platform_id
        device: { type: STRING(255) },                      // 最后登录设备端，可选值如下： android、ios、web、pc
        role_id: { type: BIGINT(20) },                      // 角色id
        role_name: { type: STRING(255) },                   // 角色名称
        account_name: { type: STRING(255) },                // 平台账号ID
        game_abbrv: { type: STRING(255) },                  // 游戏简称(由平台技术中心填写)
        sid: { type: INTEGER },                             // 游戏服编号(由平台技术中心填写)
        complaint_type: { type: INTEGER },                  // 投诉类型(‘全部’,11=’bug’,12=’投诉’,13=’建议’,10=’其他’, 15=’咨询’, 16=’封禁申诉’)
        complaint_title: { type: STRING(255) },             // 投诉的标题
        complaint_content: { type: STRING(255) },           // 投诉的正文
        complaint_time: { type: INTEGER },                  // 玩家提交投诉时间
        internal_id: { type: INTEGER },                     // 内部编号(由平台技术中心填写)
        reply_cnts: { type: INTEGER },                      // GM回帖数(由平台技术中心填写)
        user_ip: { type: STRING(255) },                     // 用户IP(可不填)
        agent: { type: STRING(255) },                       // 代理商名称，如’4399’(可不填)
        pay_amount: { type: INTEGER },                      // 玩家已充值总额(可不填)
        qq_account: { type: INTEGER },                      // 玩家的qq帐号(可不填)
        dim_level: { type: INTEGER },                       // 玩家等级
        dim_vip_level: { type: INTEGER },                   // VIP等级
        evaluate: { type: INTEGER },                        // 评分: 0未评,1优秀,2一般,3很差(可不填)
        sync_numbers: { type: INTEGER },                    // 同步次数(可不填)
        last_reply_time: { type: INTEGER },                 // 最后回复时间(可不填)
        is_spam: { type: INTEGER },                         // 是否标记为垃圾问题(可不填)
        spam_reporter: { type: STRING(255) },               // spam注释(可不填)
        spam_time: { type: INTEGER },                       // spam生成时间(可不填)
    }, {
        timestamps: false,                                 // 去掉sequelize中自动添加的时间字段
        freezeTableName: true                              // 去掉表名自动添加的s
    });
    return Complaints;
};