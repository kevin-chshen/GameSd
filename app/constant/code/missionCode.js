/**
 * @description 任务定义
 * @author jzy
 * @date 2020/04/03
 */

module.exports = {
    /**
     * 任务类型
     */
    MISSION_TYPE:{
        MAIN: 1,          // 主线任务
        DAILY: 2,         // 日常任务
        ACHIEVEMENT: 3,   // 成就
    },

    /**
     * 行为类型
     */
    BEHAVIOR_TYPE:{
        DUNGEON_PROGRESS:           101,// 主线进度
        DUNGEON:                    102,// 主线关卡
        DUNGEON_FORWARD:            103,// 主线关卡前进
        DUNGEON_RECEIVE_REWARD:     104,// 领取奖励

        CAR_QUALITY_NUM:            201,// 拥有X品质豪车数量
        CAR_EXCHANGE_NUM:           202,// 豪车置换X品质及以上的数量
        CAR_LEVEL_NUM:              203,// 拥有X等级豪车数量
        CAR_REFIT_TIMES:            204,// 豪车改造次数
        CAR_UP_LEVEL_TIMES:         205,// 豪车升级次数
        CAR_TOTAL_LEVEL:            206,// 豪车总等级

        CLICK_HOUSE_TIMES:          301,// 点击住宅次数
        PLATFORM_BUILD:             302,// 平台建造
        PLATFORM_UP_LEVEL_NUM:      303,// 平台扩建数量
        PLATFORM_UP_LEVEL:          304,// 指定平台扩建
        PLATFORM_MAIN_LEVEL:        305,// 商务区等级
        PLATFORM_TARGET_CARD_ID:    306,// 派遣主播到指定平台
        PLATFORM_ID_RECRUIT:        307,// 指定平台招募
        PLATFORM_RECRUIT:           308,// 平台招募
        PLATFORM_TARGET_CARD_NUM:   309,// 派遣主播到指定平台的数量
        PLATFORM_POWER_FULL_TIMES:  310,// 火力全开次数

        CARD_UNLOCK:                401,// 主播解锁
        CARD_LEVEL_NUM:             402,// 拥有X个X级人才
        TOTAL_POWER:                403,// 总身价
        CARD_QUALITY_NUM:           404,// 拥有X品质及以上主播数量
        CARD_STAGE_NUM:             405,// 拥有X阶及以上主播数量
        CARD_STAGE_UP_TIMES:        406,// 主播提高阶数次数
        CARD_STAR_NUM:              407,// 拥有X星级及以上主播数量
        CARD_LEVEL_UP_TIMES:        408,// 主播等级提升次数
        CARD_UP_FORMATION_NUM:      409,// 上阵主播数量
        CARD_EQUIP_CAR_NUM:         410,// 主播装备的X品质及以上豪车数量
        CARD_TOTAL_LEVEL:           411,// 主播总等级

        AUTO_SHOW_START:            501,// 进行车展的次数
        AUTO_SHOW_ROB:              502,// 车展抢单次数
        
        CLUB_GIFT_SEND:             511,// 俱乐部送礼
        CLUB_LEVEL_NUM:             512,// 俱乐部达到X级的数量

        INVEST_PROGRESS:            521,// 投资注资次数
        INVEST_COMPLETE:            522,// 投资完成项目数目

        EARN_CASH_PER_SECOND:       531,// 赚钱速度

        LEVEL_UP:                   541,// 等级提升

        FRIENDSHIP_TIMES:           551,// 团建次数
        FRIENDSHIP_FINISH_TIMES:    552,// 团建完成次数

        LOGIN_DAYS:                 561,// 登陆天数

        GUILD_LV:                   571,// 联盟等级

        GOLD_CARD_RECEIVE:          581,// 黄金月卡领取次数
        BLACK_CARD_RECEIVE:         582,// 黑钻月卡领取次数

        SHOP_ID_BUY_TIMES:          591,// 商店X购买次数

        FLOW_RATE_CHALLENGE_TIMES:  611,// 流量为王挑战次数
        FLOW_RATE_MAX_RANK:         612,// 流量为王最高历史排名
        FLOW_RATE_WIN_TIMES:        613,// 流量为王胜利次数
    },

    GOLD_CARD_ID:101,   // 黄金月卡ID
    BLACK_CARD_ID:102,  // 黑钻月卡ID
};