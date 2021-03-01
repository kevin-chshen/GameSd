/**
 * 属性定义
 */

const define = {
    /**
     * 属性模块
     */
    ATTR_MODULE:{
        ROOT    :   "root",
        CARD    :   "card",
        STAGE   :   "stage",
        STAR    :   "star",
        FETTER  :   "fetter",
        TECHNOLOGY  :   "technology",
        CAR     :   "car",
        ALL     :   "ALL",
    },
    /**
     * 属性类型 ATTR_TYPE与ATTR_VALUE需同时修改
     */
    ATTR_TYPE:{
        HP_MIN          : "1",    //热度min
        HP_MAX          : "2",    //热度max
        ATTACK_MIN      : "3",    //魅力min
        ATTACK_MAX      : "4",    //魅力max
        POPULARITY      : "50",   //人气
        HP_MIN_PRO      : "101",  //热度百分比min
        HP_MAX_PRO      : "102",  //热度百分比max
        ATTACK_MIN_PRO  : "103",  //魅力百分比min
        ATTACK_MAX_PRO  : "104",  //魅力百分比max
    },
    /**
     * 属性类型 ATTR_TYPE与ATTR_VALUE需同时修改
     *  属性类型:协议字段名
     */
    ATTR_VALUE:{
        "1"    : "hpMin",         //热度min
        "2"    : "hpMax",         //热度max
        "3"    : "attackMin",     //魅力min
        "4"    : "attackMax",     //魅力max
        "50"   : "popularity",    //人气
        "101"  : "hpMinPro",      //热度百分比min
        "102"  : "hpMaxPro",      //热度百分比max
        "103"  : "attackMinPro",  //魅力百分比min
        "104"  : "attackMaxPro",  //魅力百分比max
    },


    
};

/**
 * 百分比id对应的属性id
 */
const ATTR_PRO_TO_ID = {
    [define.ATTR_TYPE.HP_MIN_PRO] : define.ATTR_TYPE.HP_MIN,
    [define.ATTR_TYPE.HP_MAX_PRO] : define.ATTR_TYPE.HP_MAX,
    [define.ATTR_TYPE.ATTACK_MIN_PRO] : define.ATTR_TYPE.ATTACK_MIN,
    [define.ATTR_TYPE.ATTACK_MAX_PRO] : define.ATTR_TYPE.ATTACK_MAX,
};

module.exports = {
    ...define,
    ATTR_PRO_TO_ID,
};