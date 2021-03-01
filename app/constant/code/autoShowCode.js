/**
 * @description  车展
 * @author jzy
 * @date 2020/05/21
 */

module.exports = {
    /**
     * 最大上阵卡牌数量
     */
    MAX_UP_CARD_NUM:5,
    /**
     * 提前结束消耗物品 全局表配置ID
     */
    GLOBAL_ID_END_IN_ADVANCE_COST: 311,
    /**
     * 鼓舞BUFF ID 全局表配置ID
     */
    GLOBAL_ID_BUY_BUFF: 312,

    /**
     * 刷新推荐使用的消耗id
     */
    GLOBAL_ID_REFRESH_RECOMMEND: 313,

    /**
     * 恢复cd
     */
    GLOBAL_ID_ROB_TIMES_RECOVERY_CD: 314,

    /**
     * 恢复次数限制
     */
    GLOBAL_ID_ROB_TIMES_RECOVERY_LIMIT: 315,

    /**
     * 推荐倒计时时间
     */
    GLOBAL_ID_RECOMMEND_TIMEOUT:316,

    /**
     * 恢复卡牌次数消耗
     */
    GLOBAL_ID_RECOVERY_COST:317,

    
    /**
     * 刷新到各个难度的概率权重
     */
    DIFFICULTY_RATE_LIST: [25,40,25,10],
    /**
     * 随机数量
     */
    RANDOM_RECOMMEND_NUM: 3,
};