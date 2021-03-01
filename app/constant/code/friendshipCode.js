/**
 * @description 团建定义
 * @author jzy
 * @date 2020/04/28
 */

module.exports = {
    /**
     * 格子类型
     */
    GRID_TYPE : {
        BATTLE:1,   // 战斗
        SHOP:2,     // 商店
        REST:3,     // 休息
    },

    /**
     * 状态类型
     */
    STATUS_TYPE : {
        IDLE:0,         // 闲置阶段
        BATTLE_FAIL:1,  // 战斗失败状态
        SELECT_BUFF:2,  // 选择buff阶段
        SHOP:3,         // 商店阶段
        WAIT_RECEIVE_REWARD:4, // 等待选择层奖励阶段
        WAIT_ENTER_NEXT_STAGE:5, // 等待进入下一层
        FINISH:6, // 团建等待结束状态
    },

    /**
     * 宝箱类型
     */
    REWARD_BOX_TYPE: {
        STAGE1:0,
        STAGE2:1,
        STAGE3EASY:2,
        STAGE3HARD:3,
    },

    /**
     * 战斗结束可选择的buff数量
     */
    SELECT_BUFF_NUM: 3,

    /**
     * 全局表里面配置最低基准战力的id
     */
    GLOBAL_MIN_POWER_ID: 301,

    /**
     * 全局表里面配置购买buff的id
     */
    GLOBAL_BUY_BUFF_ID: 302,
    /**
     * buff购买消耗，BuyingTimes表配置类型
     */
    BUY_BUFF_BUY_TIMES_TYPE: 5,

    /**
     * 团建次数消耗物品
     */
    GLOBAL_COST_FRIENDSHIP_TIME_ITEM: 303,
    /**
     * 团建次数购买消耗，BuyingTimes表配置类型
     */
    BUY_FRIENDSHIP_TIMES_TYPE: 4,
    /**
     * 团建商店物品数量
     */
    PER_SHOP_ITEM_NUM:2,
};
