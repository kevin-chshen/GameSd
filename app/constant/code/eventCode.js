/**
 * @description 玩家事件名称定义
 * @author linjs
 * @date 2020/03/26
 */

const assert = require('assert');

/**
 * 角色事件属性
 */
const eventKeyProp = {};

module.exports = {
    isValidEventName,
    makeEventName,
    // eventName定义
    LEVEL_UP: makeEventKeyType({
        name: 'levelUp',    // 玩家等级提升 参数:{oldLv, newLv}
    }),
    RENAME: makeEventKeyType({
        name: 'rename',    // 玩家改名 参数:{name}
    }),
    TOTAL_POWER_UPDATE: makeEventKeyType({
        name: 'totalPowerUpdate', // 总战力改变
    }),
    MANIFESTO_MODIFY: makeEventKeyType({
        name: 'manifestoModify',    // 个人宣言修改
    }),
    LAST_LOGOUT_TIME_UPDATE: makeEventKeyType({
        name: 'lastLogoutTimeUpdate',    // 最后登出时间更新
    }),
    LAST_LOGIN_TIME_UPDATE: makeEventKeyType({
        name: 'lastLoginTimeUpdate',    // 最后登入时间更新
    }),
    CASH_PER_SECOND: makeEventKeyType({
        name: 'cashPerSecond',   // 计算玩家每秒赚钱
    }),
    CASH_PER_SECOND_AFTER: makeEventKeyType({
        name: 'cashPerSecondAfter',   // 计算玩家每秒总赚钱速度之后
    }),
    FAME_UP: makeEventKeyType({
        name: "fameUp",      // 头像升阶
    }),
    DUNGEON_FORWARD: makeEventKeyType({
        name: "dungeonForward",   // 关卡前进 参数1 表示是否为战斗胜利前进
    }),
    DUNGEON_REWARD: makeEventKeyType({
        name: "dungeonReward",   // 关卡领取奖励
    }),
    MISSION_UPDATE: makeEventKeyType({
        name: "missionUpdate", // 任务更新
    }),
    MISSION_COMPLETE: makeEventKeyType({
        name: "missionComplete", // 任务完成
    }),
    LIVE_PLATFORM_ACTIVE: makeEventKeyType({
        name: "livePlatformActive", // 直播平台激活事件
    }),
    MGR_EXP_CHANGED: makeEventKeyType({
        name: "mgrExpChanged",  // 管理经验变更事件
    }),
    RECOVERY_DEDUCT: makeEventKeyType({
        name: 'recoveryDeduct',  // 恢复次数扣除
    }),
    RECOVERY_ADD: makeEventKeyType({
        name: 'recoveryAdd',        // 恢复次数增加
    }),
    RECOVERY_MAX_CHANGE: makeEventKeyType({
        name: 'recoveryMaxChange',        // 恢复次数上限变化
    }),
    RECUR_TIMER: makeEventKeyType({
        name: 'recurTimer',          // 重置计数器次数 参数:{timerId}
        joinKey: true,
    }),
    MGR_LEVEL_UP: makeEventKeyType({
        name: 'mgrLevelUp',         // 管理等级提升 参数:{oldLv, newLv}
    }),
    SYSTEM_OPEN: makeEventKeyType({
        name: 'systemOpen',          // 功能开启-系统激活
        joinKey: true
    }),
    GUILD_ID_UPDATE: makeEventKeyType({
        name: 'guildIdUpdate',       // 公会变更
    }),
    GUILD_LV_CHANGE: makeEventKeyType({
        name: 'guildLvChange',       // 公会等级变化
    }),
    PAY_DIAMOND: makeEventKeyType({
        name: 'payDiamond',         // 充值钻石事件
    }),
    PAY_DAILY_DISCOUNT: makeEventKeyType({
        name: 'payDailyDiscount',   // 每日特惠事件
    }),
    PAY_MONTH_CARD: makeEventKeyType({
        name: 'payMonthCard',       // 月卡
    }),
    PAY_ZERO_GIFT: makeEventKeyType({
        name: 'payZeroGift',         // 0元礼包
    }),
    PAY_FIRST: makeEventKeyType({
        name: 'payFirst',           // 首充
    }),
    PAY_OPERATE_ACTIVITY: makeEventKeyType({
        name: 'payOperateActivity', // 充值活动
    }),
    MONTH_CARD_EXPIRED: makeEventKeyType({
        name: 'monthCardExpired'     // 月卡过期
    }),
    MONTH_CARD_REWARD: makeEventKeyType({
        name: 'monthCardReward',      // 月卡奖励
    }),
    MONTH_CARD_RECEIVE: makeEventKeyType({
        name: 'monthCardReceive',      // 领取月卡奖励
    }),
    BATTLE_MEMBER_UPDATE: makeEventKeyType({
        name: 'battleMemberUpdate',       // 战斗成员变更
    }),
    CAR_TOP_THREE_UPDATE: makeEventKeyType({
        name: 'carTopThreeUpdate',       // 豪车前三
    }),
    CARD_UP: makeEventKeyType({
        name: 'cardUp',             // 主播升级事件
    }),
    CARD_ACTIVE: makeEventKeyType({
        name: 'cardActive',         // 主播解锁事件
    }),
    CARD_STAR: makeEventKeyType({
        name: 'cardStar',           // 主播升星事件
    }),
    CARD_STAGE: makeEventKeyType({
        name: 'cardStage',          // 主播升阶事件
    }),
    CARD_PACK: makeEventKeyType({
        name: 'cardPack',          // 主播包装事件（包装x次能升阶一次）
    }),
    CARD_UP_FORMATION: makeEventKeyType({
        name: 'cardUpFormation',    // 主播上阵
    }),
    CARD_EQUIP_CAR: makeEventKeyType({
        name: 'cardEquipCar',       // 主播装备豪车
    }),
    ATTRIBUTE_CHANGE: makeEventKeyType({
        name: 'attributeChange',    // 属性变化
    }),
    CASH_ADD: makeEventKeyType({
        name: 'cashAdd',            // 现金增加
    }),
    CAR_UP: makeEventKeyType({
        name: 'carUp',              // 豪车升级事件
    }),
    CAR_CHANGE: makeEventKeyType({
        name: 'carChange',          // 豪车获得或者删除事件
    }),
    CAR_EXCHANGE: makeEventKeyType({
        name: 'carExchange',        // 豪车置换事件   参数1 次数
    }),
    CAR_REFIT: makeEventKeyType({
        name: 'carRefit',        // 豪车改造事件
    }),
    CAR_RESET: makeEventKeyType({
        name: 'carReset',        // 豪车重置
    }),
    CLUB_SEND_GIFT: makeEventKeyType({
        name: 'clubSendGift',       // 俱乐部送礼
    }),
    CLUB_UP_LEVEL: makeEventKeyType({
        name: 'clubUpLevel',        // 俱乐部升级
    }),
    CLICK_MAIN_HOUSE: makeEventKeyType({
        name: 'clickMainHouse',         // 点击住宅
    }),
    PLATFORM_BUILD: makeEventKeyType({
        name: 'platformBuild',          // 建造平台
    }),
    PLATFORM_RECRUIT: makeEventKeyType({
        name: 'platformRecruit',        // 招募网管
    }),
    PLATFORM_UP_LEVEL: makeEventKeyType({
        name: 'platformUpLevel',        // 平台扩建
    }),
    PLATFORM_CARD_CHANGE: makeEventKeyType({
        name: 'platformCardChange',     // 平台主播变化
    }),
    POWER_FULL_OPERATE: makeEventKeyType({
        name: 'powerFullOperate',     // 火力全开
    }),
    TALENT_MARKET_REFRESH: makeEventKeyType({
        name: 'talentMarketRefresh',        // 人才市场刷新
    }),
    SHOP_BUY: makeEventKeyType({
        name: 'shopBuy',                    // 商店购买
    }),
    INVEST_PROGRESS: makeEventKeyType({
        name: 'investProgress',        // 项目注资
    }),
    INVEST_COMPLETE: makeEventKeyType({
        name: 'investComplete',        // 项目完成
    }),
    FRIENDSHIP_TIMES: makeEventKeyType({
        name: 'friendshipTimes',       // 团建次数
    }),
    FINISH_FRIENDSHIP: makeEventKeyType({
        name: 'finishFriendship',       // 结束团建
    }),
    CARD_RESET: makeEventKeyType({
        name: 'cardReset',          // 主播重置事件
    }),
    POPULARITY_CHANGE: makeEventKeyType({
        name: 'popularityChange',          // 人气变化事件
    }),
    ACTIVITY_START_TIMER: makeEventKeyType({
        name: 'ActivityStartTimer'  // 活动开启
    }),
    ACTIVITY_STOP_TIMER: makeEventKeyType({
        name: 'ActivityStopTimer'   // 活动关闭
    }),
    OPERATE_START_TIMER: makeEventKeyType({
        name: 'OperateStartTimer'  // 运营活动开启
    }),
    OPERATE_STOP_TIMER: makeEventKeyType({
        name: 'OperateStopTimer'   // 运营活动关闭
    }),
    VIP_CHANGED: makeEventKeyType({
        name: 'vipChanged'          // vip变化
    }),
    AUTO_SHOW_DATA_UPDATE:  makeEventKeyType({
        name: 'autoShowDataUpdate', // 车展数据变化
    }),
    AUTO_SHOW_START: makeEventKeyType({
        name: 'autoShowStart'       // 车展开始参展
    }),
    AUTO_SHOW_ROB: makeEventKeyType({
        name: 'autoShowRob'       // 车展抢单
    }),
    LOGIN_DAYS_CHANGE: makeEventKeyType({
        name: 'loginDaysChange'       // 登录天数变化
    }),
    FLOW_RATE_CHALLENGE: makeEventKeyType({
        name: 'flowRateChallenge'       // 流量为王挑战    参数1 是否胜利
    }),
    FLOW_RATE_RANK_CHANGE: makeEventKeyType({
        name: 'flowRateRankChange'       // 流量为王排名变化
    }),
    BAN_CHAT_CHANGED: makeEventKeyType({
        name: 'banChatChanged'          // 禁言信息变更
    }),
};

/**
 * 生成事件event相关的配置
 * @param {Object} config key配置
 */
function makeEventKeyType(config) {
    assert(eventKeyProp[config.name] == null, `event key [${config.name}] duplicate`);
    const prop = {
        name: config.name,
        joinKey: config.joinKey || false,
    };
    eventKeyProp[config.name] = prop;
    return prop;
}

/**
 * 是否有效的事件名称
 * @param {String} name key的名称
 */
function isValidEventName(name) {
    return eventKeyProp[name] != null;
}

/**
 * 生成事件真实的名称
 * @param {Array|String} eventName 事件名称
 */
function makeEventName(eventName) {
    let keyName = null;
    let realEventName = null;
    if (Array.isArray(eventName)) {
        keyName = eventName[0];
        realEventName = eventName.join('_');
    } else {
        keyName = eventName;
        realEventName = eventName;
    }
    assert(isValidEventName(keyName), `event name [${eventName}] is invalid.`);
    return realEventName;
}
