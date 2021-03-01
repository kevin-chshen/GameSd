/**
 * @description 卡片定义
 * @author jzy
 * @date 2020/03/31
 */

module.exports = {
    /**
     * 职业
     */
    CAREER_TYPE:{
        ART:1,           //才艺
        GAME:2,          //游戏
        ENTERTAINMENT:3, //娱乐
    },

    /**
     * 需求类型，在其他系统有用到，前几项和职业一一对应
     */
    REQUIRE_TYPE:{
        DEFAULT:0,
        ART:1,           //才艺
        GAME:2,          //游戏
        ENTERTAINMENT:3, //娱乐

        MALE:4,   //男
        FEMALE:5, //女
    },
    

    /**
     * k
     */
    CARD_RESET_COST:101,

    
    // 系统消息id
    CARD_CHAT_SYSTEM_ID:{
        NEW_CARD:               11, // 签约新主播跑马灯
        STAR_CARD:               12, // 主播升星跑马灯
    },
    /**
     * 品质对应颜色
     */
    QUALITY_COLOR:{
        '0': "#83db0f",     // 灰
        '1': "#26e37b",     // 绿
        '2': "#28bbff",     // 蓝
        '3': "#ff3efd",     // 紫
        '4': "#ff9d1d",     // 黄
        '5': "#ff3030",     // 红
    },
};