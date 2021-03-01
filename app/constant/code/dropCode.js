/**
 * @description 掉落相关定义
 * @author linjs
 * @date 2020/04/27
 */

module.exports = {
    // 掉落下标类型
    SIGN_TYPE: {
        PERSON: 1,  // 个人下标
        SERVER: 2,  // 全服下标
    },
    // 重置类型
    RESET_TYPE: {
        NONE: 0,    // 不会重置
        SUCCESS: 1, // 成功时重置
    },
    // 累加类型
    ADD_TYPE: {
        FAIL: 0,    // 失败时,次数+1
        SUCCESS: 1, // 成功时,次数+1
    },
    // 抽取物品的总权重
    EXTRACT_WEIGHT: 1000000,
    // 公式抽取的概率值
    FORMULA_PROB: 10000,
};