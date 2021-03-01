/**
 * @description 头衔定义
 * @author chenyq
 * @date 2020/04/10
 */

module.exports = {
    /**
     * 改名消耗
     */
    FAME_RENAME_COST: 102,
    /**
     * 头衔对应配置数据
     */
    FAME_CONFIG_DATA: {
        REVENUE_PLUS: 'RevenuePlus',           // 收益加成
        STAFF_NUM: 'StaffNum',                 // 可招募管理员
        OFFLINE_TIME: 'OfflineTime',           // 离线收益时长
        INVEST_COST: 'InvestCost',             // 单次注资最高消耗
        INVEST_TOTAL_COST: 'InvestTotalCost',  // 总注资需求
        INVEST_REWARD: 'InvestReward',         // 单次注资奖励
        INVEST_TIMES: 'InvestTimes',           // 注资次数存储上限
    },
    /**
     * 头衔对应配置数据
     */
    VIP_CONFIG_DATA: {
        INVEST_TIMES: 'InvestTimes',           // 注资次数存储上限
    }
};