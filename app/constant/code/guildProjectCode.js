/**
 * @description 联盟相关定义
 * @author chenyq
 * @date 2020/04/26
 */

module.exports = {
    /**
     * 联盟职位
     */
    PROJECT_ACT_ID: {
        NOON:           201,  // 中午
        NIGHT:          202,  // 晚上
    },
    /**
     * 状态
     */
    PROJECT_STATE:{
        NONE:           0,  // 活动未开始
        QUERY:          1,  // 选择(未开启项目)
        ARRANGEMENT:    2,  // 筹备
        NEGOTIATE:      3,  // 谈判
        OPERATION:      4,  // 运营
    },
    /**
     * 捐献类型
     */
    PROJECT_DONATION_TYPE:{
        CASH:           0,  // 现金
        DIAMOND:        1,  // 钻石
    },
    /**
     * 捐献上限
     */
    PROJECT_DONATION_FULL: 10000,

};