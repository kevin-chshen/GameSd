/**
 * @description 活动定义
 * @author chshen
 * @date 2020/05/21
 */
module.exports = {

    // 全服投资总人数
    TOTAL_INVEST_PLAN_PEOPLE_ID: 1,

    TYPE : {
        DAILY: 1,       // 每日
        WEEKLY: 2,      // 每周
        OPEN_DAY: 3,    // 开服天数
        TIME_REGION: 4, // 固定时间段
    },

    CONFIG_TYPE: {
        ACTIVITY: 1,    // 游戏玩法活动
        OPERATE: 2,     // 运营活动
    },

    GLOBAL_INVEST_PLAN_VIP: 21,     //【投资基金】所需VIP等级
    GLOBAL_INVEST_PLAN_COST: 22,    //【投资基金】投资所需消耗
    GLOBAL_MONTH_CARD_NOTICE: 901,  // 【月卡】到期提前续费时间（天）

    // 投资基金类型
    OPERATE_INVEST_FUNDS_TYPE: {
        INVEST_FUNDS:1,              // 投资基金
        WELFARE: 2                  // 全民福利
    },

    // 活动类型
    ACTIVITY_TYPE: {
        SPECIAL_DELIVERY:1          // 特邀派送game服
    },

    // 运营活动类型,如果非game服的活动枚举领取字段，这里默认是game服注册的活动
    OPERATE_TYPE: {
        DAILY_PAY:1,                    // 每日充值
        ADD_UP_PAY: 2,                  // 累计充值
        DAYS_PAY: 3,                    // 积天充值
        DAILY_SIGN: 4,                  // 每日签到
        DAILY_DISCOUNT: 5,              // 每日特惠
        SEVEN_DAY: 10,                  // 七日登陆
        TREASURE: 11,                   // 全民夺宝
        ZERO_GIFT: 51,                  // 0元礼包
        TURNTABLE: 52,                  // 转盘
    },

    OPERATE_GLOBAL_TYPE:{
        RANK_RUSH: 50,                  // 冲榜活动
    },
};