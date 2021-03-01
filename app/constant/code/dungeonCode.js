/**
 * @description 主线关卡定义
 * @author jzy
 * @date 2020/03/23
 */

module.exports = {
    //比赛类型定义
    MATCH_TYPE : {
        AUDITION : 1,    //海选
        QUALIFYING : 2,  //外围
        ELIMINATION : 3, //淘汰
        FINAL : 4,       //决赛
        REWARD : 5,      //宝箱
    },

    //事件类型
    EVENT_TYPE : {
        GET_REWARD : 0, //奖励
        CHOOSE : 1,     //选择
        DISPATCH : 2,   //派遣
    },

    //打赏和挑战消耗的物品ID
    ENCOURAGE_COST_ITEM_ID : 99,
    
    //赛事最大进度值，因为是百分比所以满为100
    MATCH_MAX_PROGRESS : 100,

};