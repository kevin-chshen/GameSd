
/**
 * @description 商店
 * @author chshen
 * @date 2020/03/23
 */

module.exports = {
    LIMIT_TYPE : {
        NONE: 0, // 无限制
        VIP: 1, // VIP等级
        LV:2,   // 等级
        KIND_OF_TRAFFIC_RANK: 3,  // 流量为王排名
        GUILD_LV: 4,    // 联盟等级
    },

    // 商店类型
    SHOP_TYPE: {
        DIRECT_SALE: 1,     // 直营商店
        MYSTERY: 2,         // 神秘商店
        TEMPORARY: 3,       // 临时商店
    },

    NUM_REFRESH_SHOW_GOODS: 6,   // 商店刷新需要显示的商品数量

    GLOBAL_MYSTERY_SHOP_BUY_COST_ITEM: 110,     // 消耗道具
    GLOBAL_MYSTERY_SHOP_BUY_COST_CURRENCY: 111, // 消耗钻石

    COUNTER_RESET_TIME_TALENTS: 301, // 人才市场时间
    COUNTER_RESET_TIME_VEHICLE: 302, // 豪车市场时间
    COUNTER_RESET_TIME_COATING: 303, // 豪车市场时间
    COUNTER_RESET_COUNT_TALENTS: 321, // 人才市场次数
    COUNTER_RESET_COUNT_VEHICLE: 322, // 豪车市场次数
    COUNTER_RESET_COUNT_COATING: 323, // 豪车市场次数
};