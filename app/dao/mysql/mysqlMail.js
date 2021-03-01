/**
 * @description 邮件日志表
 * @author chenyq
 * @date 2020/07/01
 */

const Sequelize = require('sequelize');
module.exports = seqInstance => {
    const { STRING, INTEGER, BIGINT } = Sequelize;
    const Mail = seqInstance.define('tbllog_mail', {
        id: { type: BIGINT(20), primaryKey: true, autoIncrement: true },  // 
        platform: { type: STRING(255) },                    // 所属平台，记录SDK platform_id
        device: { type: STRING(255) },                      // 最后登录设备端，可选值如下： android、ios、web、pc
        mail_id: { type: INTEGER },                         // 邮件ID
        mail_sender_id: { type: BIGINT(20) },               // 发送者ID(角色ID)
        mail_sender_name: { type: STRING(255) },            // 发送者平台账号ID
        mail_receiver_id: { type: BIGINT(20) },             // 接收者ID(角色ID)
        mail_receiver_name: { type: STRING(255) },          // 接收者平台账号ID
        mail_title: { type: STRING(255) },                  // 邮件标题
        mail_content: { type: STRING(255) },                // 邮件内容
        mail_type: { type: INTEGER },                       // 邮件类型(0系统邮件，1用户邮件)
        mail_money_list: { type: STRING(255) },             // 货币类型:数量，组合用逗号隔,如<gold:1, bind_gold:2>
        mail_item_list: { type: STRING(255) },              // 道具id:数量，组合用逗号隔开，如<item1:1, item2:2>
        mail_status: { type: INTEGER },                     // 邮件接收状态(1=已读，2=未读)
        get_status: { type: INTEGER },                      // 物品领取状态（1=已领取，2=未领取）
        happend_time: { type: INTEGER },                    // 事件发生时间
    }, {
        timestamps: false,                                 // 去掉sequelize中自动添加的时间字段
        freezeTableName: true                              // 去掉表名自动添加的s
    });
    return Mail;
};