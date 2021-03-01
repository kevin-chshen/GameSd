/**
 * @description 联盟相关定义
 * @author chenyq
 * @date 2020/04/26
 */

module.exports = {
    // 联盟职位
    GUILD_JOB: {
        CHAMPIONS:          1,  // 盟主
        DEPUTY_CHAMPIONS:   2,  // 副盟主
        ELITE:              3,  // 精英
        MEMBER:             4,  // 成员
    },

    INIT_GUILD_ID: 0, // 初始化的公会id

    GUILD_LIST_NUM: 20, // 联盟列表数量

    GUILD_CREATE_COST: 601,        // 创建联盟消耗
    GUILD_RENAME_COST: 602,        // 修改联盟名称消耗
    GUILD_CONTRIBUTE_RATIO: 603,   // 退出扣除的贡献比例
    GUILD_LEAVE_LIMIT_TIME:604,    // 离开联盟的限制时间
    GUILD_CREATE_VIP: 605,         // 创建联盟所需vip

    GUILD_ON_DAY_TIMER: 22,          // 公会跨天计时器

    GUILD_TRANSFER_LOGOUT_TIME: 3 * 24 * 3600 * 1000,   // 转让副盟主需在三天内登录过
    GUILD_TRANSFER_AUTO_OFFLINE_TIME: 7 * 24 * 3600 * 1000,     // 自动转让 盟主离线七天
    GUILD_TRANSFER_AUTO_TIME: 3 * 24 * 3600 * 1000,     // 自动转让 活跃三日

    // 联盟操作类型
    GUILD_OPERATE:{
        UPDATE:             0,  // 更新联盟信息
        JOIN:               1,  // 加入
        DISSOLVE:           2,  // 解散
        LEAVE:              3,  // 离开
        KICK_OUT:           4,  // 逐出
        REFUSE:             5,  // 申请拒绝
        AGREE:              6,  // 申请同意
        JOB_CHANGE:         7,  // 职位变更
        TRANSFER:           8,  // 盟主转让
    },

    // 联盟广播对象类型
    GUILD_UIDS_TYPE:{
        ALL:                1,  // 全员
        NOT_SELF:           2,  // 过滤自己
        JOB:                3,  // 广播某个职位权限以上的人
        JOB_NOT_SELF:       4,  // 广播某个职位权限以上的人不包含自己
    },
    
    // 职位操作类型
    GUILD_JOB_OPERATE:{
        ICON:               1,  // 修改图标徽章
        DISSOLVE:           2,  // 解散
        KICK_OUT:           3,  // 踢人
        APPLY:              4,  // 申请同意/拒绝
        MODIFY:             5,  // 信息修改
        JOB_CHANGE:         6,  // 职位变更
        NOTICE:             7,  // 修改公告
        MANIFESTO:          8,  // 修改宣言
        RENAME:             9,  // 改名
        PROJECT_OPEN:       10,  // 全球项目开启
        PROJECT_KICK_OUT:   11,  // 全球项目踢人
    },

    // 公会物品id
    GUILD_ITEM_ID:{
        GUILD_EXP:          1101, // 联盟经验
        CONTRIBUTE:         1102, // 贡献
    },

    GUILD_UINT32_MAX: 4294967295,

    // 科技加成类型
    GUILD_TECHNOLOGY_EFFECT_TYPE:{
        BUILD_CONTRIBUTE:   1,  // 建设贡献
        RECRUIT_STAFF:      2,  // 招募超管
        CARD_ART:           11,  // 才艺主播
        CARD_GAME:          12,  // 游戏主播
        CARD_AMUSEMENT:     13,  // 娱乐主播
    },

    // 系统消息id
    GUILD_CHAT_SYSTEM_ID:{
        JOIN:               101, // 加入联盟
        EXIT:               102, // 退出联盟
        KICK_OUT:           103, // 踢出联盟
        JOB_CHANGE:         104, // 职位变更
        RENAME:             105, // 联盟改名
    },

    GUILD_DEFAULT_MANIFESTO: 12,    // 默认宣言
    GUILD_DEFAULT_NOTICE: 13,       // 默认公告

    // 转让类型
    GUILD_TRANSFER_TYPE:{
        AUTO:               0,  // 自动转让
        MANUALLY:           1,  // 盟主手动转让
    },
};
