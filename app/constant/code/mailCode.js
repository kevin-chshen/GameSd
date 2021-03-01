/**
 * @description 邮件相关定义
 * @author linjs
 * @date 2020/04/09
 */

module.exports = {
    STATUS: {
        UNREAD: 1,          // 未读
        READ: 2,            // 已读
        UNRECEIVED: 3,      // 未领取
        RECEIVED: 4,        // 已领取
    },
    
    TYPE: {
        SYSTEM: 1,          // 系统邮件
        OPERATE: 2,         // 运营平台邮件
    },

    INIT_GLOBAL_MAIL_ID: 1, // 初始化的全局邮件id

    // 邮件配置id
    MAIL_CONFIG_ID:{
        CAR_MAIL: 1,                // 豪车邮件
        GUILD_JOIN_MAIL: 11,        // 联盟加入邮件
        GUILD_KICK_OUT_MAIL: 12,    // 联盟踢出邮件
        GUILD_DISSOLVE_MAIL: 13,    // 联盟解散邮件
        GUILD_EXIT_MAIL: 14,        // 联盟退出邮件
        GUILD_AUTO_OLD_CHAMPIONS_MAIL: 15,  // 盟主自动转让原盟主邮件
        GUILD_AUTO_NEW_CHAMPIONS_MAIL: 16,  // 盟主自动转让新盟主邮件

        GUILD_PROJECT_LUCKY: 61,    // 幸运儿
        GUILD_PROJECT_LAST_ATK: 62, // 最后一击
        GUILD_PROJECT_RANK: 63,     // 伤害排行
        GUILD_PROJECT_UNLOAD: 64,   // 盟主卸任
        GUILD_PROJECT_END: 65,      // 派驻结束
    },
};
