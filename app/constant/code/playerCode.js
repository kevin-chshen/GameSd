/**
 * 玩家数据对象相关属性字段
 */

module.exports = {
    /**
     * MongoPlayer表上的所有字段名称
     * 1.必须驼峰风格,且小写字母开头
     * 2.角色加载之后,会自动生成玩家上的getter,setter属性
     * 例如:player.name代表玩家身上的NAME属性,对应MongoPlayer上的name字段
     */
    Keys: {
        ACCOUNT: "account",                                 // 账号
        UID: "uid",                                         // 角色uid
        NAME: "name",                                       // 角色名字    
        CHARACTER: "character",                             // 老板性格
        HEAD_IMAGE_ID: "headImageId",                       // 头像id
        CREATE_TIME: "createTime",                          // 创角时间
        LV: "lv",                                           // 等级
        EXP: "exp",                                         // 经验
        SEX: "sex",                                         // 性别
        VIP: "vip",                                         // vip等级
        VIP_EXP: "vipExp",                                  // vip经验
        VIP_HAD_PRIVILEGE_GIFTS: "vipHadPrivilegeGifts",    // 已领取的vip特权礼包
        POWER: "power",                                     // 身价
        LAST_LOGIN_TIME: "lastLoginTime",                   // 最后一次登陆时间(毫秒)
        COIN_PER_SECOND: "cashPerSecond",                   // 每秒赚钱速度
        ITEM: "item",                                       // 道具
        LAST_LOGOUT_TIME: "lastLogoutTime",                 // 最后一次退出时间(毫秒)
        FRIEND: "friend",                                   // 好友
        BLACK: "black",                                     // 黑名单    
        LAST_MAC: "lastMac",                                // 最后一次登陆使用的mac地址            
        CURRENCY: "currency",                               // 货币
        DUNGEON: "dungeon",                                 // 主线关卡
        INVEST: "invest",                                   // 投资
        Mission: "mission",                                 // 任务信息
        RANK: "rank",                                       // 排行榜相关单人数据
        FRIENDSHIP: "friendship",                           // 团建
        CARD: "cardList",                                   // 卡牌信息
        FORMATION: "formation",                             // 卡牌阵型
        MGR_LV: "mgrLv",                                    // 管理等级
        LIVE_PLATFORMS: "livePlatforms",                    // 直播平台
        LIVE_PLATFORMS_EVENTS: "livePlatformsEvents",       // 直播平台事件
        CAR: "carInfo",                                     // 豪车信息
        MANIFESTO: "manifesto",                             // 个性宣言
        FAME_DAILY_REWARD: "fameDailyReward",               // 头衔每日奖励
        LAST_MAIL_ID: "lastMailId",                         // 最新的邮件id
        MAIL: "mail",                                       // 邮件列表
        CLUB: "clubInfo",                                   // 俱乐部列表
        SHOP: "shop",                                       // 商店数据
        SHOP_TEMPORARY: "shopTemporary",                    // 临时商店数据
        CLUB_POSTCARD_BUY_NUM: "clubPostcardBuyNum",        // 俱乐部明信片购买次数
        CLUB_POSTCARD_LAST_TIME: "clubPostcardLastTime",    // 俱乐部明信片购买时间
        RECOVERY: "recoveryInfo",                           // 恢复数据列表
        RECUR_TIMER: "recurTimer",                          // 循环计时器
        COUNTER: "counter",                                 // 角色身上的计数器
        SYSTEM_OPENS: "systemOpens",                        // 已开启系统数据
        BATTLE_MEMBER: "battleMember",                      // 战斗成员
        PAY_IDS: "payIds",                                  // 已付费的ID列表
        RECHARGE_MONEY: "rechargeMoney",                    // 已经充值付费金额
        AUTO_SHOW: "autoShow",                              // 车展数据（缩略信息）
        AUTO_SHOW_WORK: "autoShowWork",                     // 车展模块数据
        CAR_TOP_THREE: "carTopThree",                       // 豪车前三
        REQUIRE_MONEY: "requireMoney",                      // 点击住宅领取奖励时间戳
        ACT_INVEST_Funds: "actInvestFunds",                 // 投资基金活动
        ACT_TURNTABLE: "actTurntable",                      // 转盘活动
        OPERATE: "operate",                                 // 运营活动
        OPERATE_ZERO_GIFT: "operateZeroGift",               // 运营活动0元礼包
        MONTH_CARD: "monthCard",                            // 月卡
        SPECIAL_DELIVERY: "specialDelivery",                // 特邀派送
        LOGIN_DAYS: "loginDays",                            // 登陆天数
        FIRST_PAY: "firstPay",                              // 是否首充
        HAD_FETCH_FIRST: "hadFetchFirst",                   // 是否已领取首充奖励
        GUIDE: "guide",                                     // 新手引导
        BAN: "ban",                                         // 封禁
        LAST_PAY_TIME: "lastPayTime",                       // 最后充值时间
        FIRST_PAY_TIME: "firstPayTime",                     // 首次充值时间
        DAY_PAY: "dayPay",                                  // 每日充值
    },

    // 性别枚举
    SexType: {
        MALE: 1,   // 男
        FEMALE: 2  // 女
    },

    NAME_REG: /^[\u4e00-\u9fa5a-zA-Z0-9]{2,12}$/,    // 名字检查正则表达式(目前由中文、数字、大小写字母组成, 至少4个字符)

    LEAVE_DATA_CACHE_TIME_MS: (10 * 60 * 1000),      // 玩家下线数据缓存时间(毫秒)
    CHECK_CLEAN_CACHE_TIME_MS: (60 * 1000),          // 清除玩家缓存定时(毫秒)
    SAVE_PLAYER_DATA_INTERVAL_MS: (10 * 1000),       // 间隔保存玩家数据(毫秒)

    DAILY_DEFAULT_TIMER_ID:1,                        // 跨天默认的定时器ID 等于1
    WEEKLY_DEFAULT_TIMER_ID: 2,                      // 跨周默认的定时器ID 等于2


    GLOBAL_ID_CREATE_ROLE_DEFAULT_ITEM: 2,                       // 全局表ID - 创角默认物品
};