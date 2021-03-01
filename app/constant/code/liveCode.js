/**
 * @description 直播
 * @author chshen
 * @date 2020/03/30
 */
module.exports = {

    PLATFORM_BASE: 1,       // 大厅

    // 流程器类型
    PROCESSOR_TYPE: {
        THANKS: 1,  // 感谢事件
        OTHERS: 2,  // 其他事件
        DISCOUNT: 3,// 打折事件
    },
    // 事件类型
    EVENT_TYPE: {
        NONE:0,     // 空
        THANKS:1,   // 感谢
        DISPATCH:2, // 派遣
        DISCOUNT:3, // 推销
        CHOOSE:4,   // 选择
    },

    GLOBAL_FIRE_POWER_MAX: 201,    // 【火力全开】火力点存储上限
    GLOBAL_FIRE_POWER_NEED_COST: 202,    // 【火力全开】每次开启活动所需火力点
    GLOBAL_FIRE_POWER_EXTRACT_COUNT: 203,    // 【火力全开】评分抽取次数
    GLOBAL_FIRE_POWER_EXTRACT_INTERVAL: 204,    // 【火力全开】平台评分抽取间隔
    GLOBAL_FIRE_POWER_REWARD_PARAM: 205,    // 【火力全开】奖励系数

    GLOBAL_THANKS_CD: 401,       // 【小事件】感谢事件刷新CD（单位：秒）
    GLOBAL_OTHER_EVENT_CD: 402,  //【小事件】派遣|选择|推销事件刷新CD（单位：秒）
    GLOBAL_SINGLE_THANKS_LIMIT: 403,    // 【小事件】单个平台感谢事件上限
    GLOBAL_ALL_THANKS_LIMIT: 404,       // 【小事件】单个平台感谢事件上限
    GLOBAL_SINGLE_OTHER_EVENT_LIMIT: 405,    // 【小事件】单个平台派遣|选择|推销事件上限
    GLOBAL_ALL_DISCOUNTS_EVENT_LIMIT: 406,  // 【小事件】所有平台推销事件上限
    GLOBAL_OTHER_EVENT_WEIGHT: 407,     //【小事件】派遣|选择|推销 事件抽取权重
    GLOBAL_DISCOUNT_EVENT_DOWN_TIME: 408,     //【小事件】推销事件倒计时
};