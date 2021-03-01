/**
 * @description 日志相关定义
 * @author linjs
 * @date 2020/03/18
 */

module.exports = {
    // 日志的表的缩写,app.mysql.player,就能直接访问对应的代理
    LOG_TYPE_DICT_ACTION: 'dictAction', // 行为字典表
    LOG_TYPE_DICT_ITEM: 'dictItem',     // 道具字典表
    LOG_TYPE_DICT_LINK_STEP: 'dictLinkStep',     // 事件流程字典表

    LOG_TYPE_PLAYER: 'player', // 用户信息表 
    LOG_TYPE_ROLE: 'role',     // 角色创建日志
    LOG_TYPE_EVENT: 'event',   // 事件日志
    LOG_TYPE_LOGIN: 'login',   // 登录日志
    LOG_TYPE_QUIT: 'quit',     // 退出日志
    LOG_TYPE_ONLINE: 'online', // 在线日志
    LOG_TYPE_GOLD: 'gold',     // 货币变动日志
    LOG_TYPE_PVP: 'pvp',       // PVP日志
    LOG_TYPE_ERROR: 'error',   // 错误日志
    LOG_TYPE_CHAT: 'chat',     // 聊天日志
    LOG_TYPE_PAY: 'pay',       // 充值日志
    LOG_TYPE_GUILD: 'guild',   // 帮派信息表
    LOG_TYPE_LEVEL_UP: 'levelUp',   // 等级变动日志
    LOG_TYPE_SHOP: 'shop',          // 商城购买日志
    LOG_TYPE_ITEMS: 'items',        // 道具产出/消耗日志
    LOG_TYPE_MAIL: 'mail',          // 邮件日志
    LOG_TYPE_DUNGEON: 'dungeon',    // 关卡日志
    LOG_TYPE_MISSION: 'mission',    // 邮件日志
    LOG_TYPE_PVE: 'pve',            // PVE日志
    LOG_TYPE_PAY_SELF: 'paySelf',   // 用于自己查询的充值日志

    LOG_TYPE_FLOWRATE_SETTLEMENT: 'flowRateSettlement',     // 流量为王结算日志
    LOG_TYPE_GUILD_TRANSFER: 'guildTransfer',               // 公会转让日志
    LOG_TYPE_GUILD_PROJECT: 'guildProject',                 // 公会项目日志
    LOG_TYPE_COMPLAINTS: 'complaints',                      // 用户反馈日志

    LOG_TYPE_OPERATE_INTERFACE: 'operateInterface',         // 运营接口日志

    LOG_TYPE_VERSION: 'version',                        // 版本日志

    STATISTICS_ONLINE_LOG_TIME_MS : (5 * 60 * 1000),    // 统计在线日志
    LOG_CASH_EARN_PER_SECOND_TYPE: 100,                 // 每秒赚钱的日志枚举, 数据库默认最大值是255
};

