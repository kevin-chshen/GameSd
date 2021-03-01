/**
 * 物品定义
 */
module.exports = {
    ITEM_TYPE:{
        CURRENCY :  1, // 货币
        INVENTORY : 2, // 可放于仓库的物品类型
        CARD :      3, // 卡片
        CAR :       4, // 豪车
        DROP_ITEM : 5, // 掉落中间物品，掉落获得时转换成物品
        GUILD_EXP : 51, // 联盟经验
        GUILD_CONTRIBUTE : 52, // 联盟贡献
    },

    ITEM_QUALITY:{
        GREEN:1,  //绿
        BLUE:2,   //蓝
        PURPLE:3, //紫
        ORANGE:4, //橙
        RED:5,    //红
    },

    // 道具限时类型
    ITEM_LIMIT_TIME_TYPE:{
        FOREVER:0,   //永久
        GET:1,       //获得后开始计时
        USE:2,       //使用后开始计时
    },

    // 物品使用类型
    ITEM_USE_TYPE:{
        NONE:0,
        USE:1,          // 使用
        LINK:2,
        OPTIONAL_GIFT:3,// 自选礼包
        DIRECT_USE:4,   // 获得后直接使用
    },

    // 最大物品上限
    MAX_ITEM_NUM: 4200000000,
};