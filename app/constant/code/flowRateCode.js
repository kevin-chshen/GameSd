/**
 * @description 流量为王定义
 * @author chenyq
 * @date 2020/05/08
 */

module.exports = {
    /**
     * 最大排名
     */
    FLOW_RATE_MAX_RANK: 10000,
    /**
     * 挑战消耗 全局表Id
     */
    FLOW_RATE_CHALLENGE_COST: 111,
    /**
     * 战报数量
     */
    FLOW_RATE_BATTLE_RECORD: 10,
    /**
     * 战报类型
     */
    BATTLE_RECORD_TYPE: {
        CHALLENGE_WIN: 0,    // 挑战成功
        SWEEP_WIN: 1,        // 扫荡成功
        DEFENCE_WIN: 2,      // 防御成功
        DEFENCE_FAIL: 3,     // 防御失败
        CHALLENGE_FAIL: 4,   // 挑战失败
    },
    /**
     * 结算计时器Id
     */
    FLOW_RATE_SETTLEMENT_TIMER: 21,
    /**
     * 结算邮件Id
     */
    FLOW_RATE_SETTLEMENT_MAIL: 21,
    /**
     * 离线奖励未领取邮件Id
     */
    FLOW_RATE_OFFLINE_MAIL: 22,
    
    // 系统消息id
    FLOW_RATE_SYSTEM_ID: 601,
    
};