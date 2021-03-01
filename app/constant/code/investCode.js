/**
 * @description 投资代码
 * @author jzy
 * @date 2020/04/21
 */

module.exports = {
    /**
     * 每次刷新多少件投资
     */
    MAX_INVEST_NUM:3,

    /**
     * 最大推荐联合项目数量
     */
    MAX_RECOMMEND_NUM:20,
    
    /**
     * 刷新列表的消耗配置在Global表的对应id
     */
    REFRESH_COST_GLOBAL_ID : 103,
    
    /**
     * 品质类型
     */
    COLOR_TYPE:{
        GREEN:0,
        BLUE:1,
        PURPLE:2,
        ORANGE:3,
        RED:4,
    },

    /**
     * 上映方式
     */
    FINISH_TYPE: {
        NONE: -1,  //自己完成
        GLOBAL: 0, //普通合作 
        FRIEND: 1, //好友合作
        GUILD: 2,  //公会合作
    },

    /**
     * 通告方式
     */
    INVEST_TYPE:{
        GLOBAL:0,   //全服
        FRIEND:1,   //好友
        GUILD:2,    //公会
    },

    GLOBAL_ID_FIRST_TIME_EACH_COST:105, // 第一次通告的每次消耗
    GLOBAL_ID_FIRST_TIME_TOTAL:106,     // 第一次通告的总进度
};