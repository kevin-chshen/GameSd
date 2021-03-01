/**
 * @description 全局混合项
 * @author chshen
 * @date 2020/03/30
 */


module.exports = {
    // 数学代号 e
    E : 2.71828182845904523536,

    // 一天多少毫秒
    ONE_DAY_MS : 24*60*60*1000,
    // 一周多少毫秒
    ONE_WEEK_MS: 7*24 * 60 * 60 * 1000,

    TIMER_FAULT_TOLERANCE_MS: 1000, // 计时器容差范围(毫秒)

    TIMER_TYPE: {
        PERSONAGE : 0,      // 个人（每个人都触发）
        SERVICE: 1          // 全服（service）
    },

    /**
     * 买次数配置类型
     */
    BUYING_TIMES_TYPE: {
        TYPE_1: 1,      // 俱乐部购买明信片消耗
        TYPE_2: 2,      // 俱乐部送礼重置消耗
        TYPE_3: 3,      // 流量为王购买流量券消耗
        TYPE_4: 4,      // 团建次数购买消耗
        TYPE_11: 11,     // 人才市场
        TYPE_12: 12,     // 豪车商店
        TYPE_13: 13,     // 涂装商店
        TYPE_21: 21,     // 全球项目谈判次数消耗
    },

    // 计数器重置时间类型
    COUNTER_RESET_TIME_TYPE: {
        DAILY: 0,   // 每天
        WEEKLY: 1,  // 每周
        MONTHLY: 2, // 每月
        DAY_BETWEEN:3, // 间隔几天
    },

    PAY_TYPE : {
        DIAMOND: 1,     // 充值钻石
        DAILY_PAY: 2,   // 每日充值
        MONTH_CARD: 3,  // 月卡
        ZERO_GIFT: 4,   // 0元礼包
    },

    PAY_WAY_GM: 999, // 默认充值途径
};