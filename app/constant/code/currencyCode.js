/**
 * @description 货币
 * @author jzy
 * @date 2020/03/16
 */

module.exports = {
    //货币id枚举,对应物品表的货币ID
    CURRENCY_ID : {
        NONE: 0,        // 无任何意义， 用于登陆时的占位符，方便前端通过下标范围值，因此下面的枚举一定要连续， 未来的货币类型只增不删
        DIAMOND : 1,    // 钻石
        COIN : 2,       // 金币
        REPUTATION: 3,  // 名望
        FIRE_POWER: 4,  // 火力
        MGR_EXP: 5,     // 管理经验
        FLOW_RATE: 6,   // 流量
    },

    // 使用大数处理的货币  （默认货币使用number处理，而这个枚举内使用大数处理）
    BIG_CURRENCY_ID :{
        CASH: 99,      // 现金,99值是item表中的固定值
    },
    
    // 普通数值最大数量限制
    MAX_CURRENCY_NUM: 4200000000,

    //货币减少的方式
    DELETE_TYPE : {
        Normal : 1,  //正常余额不足报错
        AsMuch : 2,  //尽可能减少，余额不足为0
        Debt: 3,     //余额不足变成负数
    }
};