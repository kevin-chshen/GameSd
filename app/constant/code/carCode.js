/**
 * 豪车定义
 */
module.exports = {
    /**
     * 豪车配件类型
     */
    CAR_PART:{
        ENGINE  :   "1",    //引擎
        FRAME   :   "2",    //车架
        TIRES   :   "3",    //轮胎
        CHASSIS :   "4",    //底盘
    },
    /**
     * 豪车评分段
     */
    CAR_REFIT_TYPE:{
        ROUGH       :   1,    //粗糙
        DEFECTS     :   2,    //瑕疵
        SUPERIOR    :   3,    //精良
        PERFECT     :   4,    //完美
        INDEPENDENT :   5,    //绝世
    },
    /**
     * 豪车品质
     */
    CAR_QUALITY:{
        green   :   1,    //绿
        blue    :   2,    //蓝
        purple  :   3,    //紫
        yellow  :   4,    //橙
        red     :   5,    //红
        golden  :   6,    //金
    },

    // 改装系统消息id
    CAR_REFIT_SYSTEM_ID: 701,
    // 改装大师系统消息id
    CAR_REFIT_COMPOSE_SYSTEM_ID: 702,

};