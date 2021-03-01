/**
 * @description 事件派遣
 * @author jzy
 * @date 2020/03/23
 */

module.exports = {
    //事件类型
    EVENT_TYPE : {
        DUNGEON : 1,  //主线关卡
        VISIT : 2,    //拜访
    },

    //条件类型
    CONDITION_TYPE : {
        K : 0,       // K值
        HOT_MAX : 1,     // 热度上限
        CHARM_MAX : 2,   // 魅力上限
        POPULAR : 3, // 人气
        POWER : 4,   // 身价
    },

    GLOBAL_CONFIG_K_ID: 100001,
    GLOBAL_CONFIG_R: 100002,
    GLOBAL_CONFIG_D: 100003,
    GLOBAL_CONFIG_C: 100004,
    GLOBAL_CONFIG_E: 100005,

    //最大概率
    MAX_RATE : 1.0,
    //最小概率
    MIN_RATE : 0.2,
};