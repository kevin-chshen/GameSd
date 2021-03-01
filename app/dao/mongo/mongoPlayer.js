/**
 * created by chshen 2020/03/13
 * @note 玩家缓存数据
*/
const MongoDataBase = require("../../logic/mongo/mongoDataBase");

class MongoPlayer extends MongoDataBase {

    constructor(data) {
        super(data);
    }
}

module.exports = MongoPlayer;

MongoPlayer.prototype._collectionName = "player";
MongoPlayer.prototype._columns = {
    uid: { type: "number", default: 0 },
    name: { type: "string", default: "" },
    character: { type: "number", default: 0 },
    headImageId: { type: "number", default: 20001 },
    lv: { type: "number", default: 1 },
    vip: { type: "number", default: 0 },
    vipExp: { type: "number", default: 0 },
    vipHadPrivilegeGifts: { type: "object", default: [] },
    sex: { type: "number", default: 2 },
    createTime: { type: "number", default: 0 },
    lastLoginTime: { type: "number", default: 0 },
    lastLogoutTime: { type: "number", default: 0 },
    cashPerSecond: { type: "string", default: '0' },
    power: { type: "number", default: 0 },
    item: { type: "object", default: {} },
    currency: { type: "object", default: {} },
    dungeon: { type: "object", default: {} },
    invest: { type: "object", default: {} },
    mission: { type: "object", default: {} },
    rank: { type: "object", default: {} },
    friendship: { type: "object", default: {} },
    cardList: { type: "object", default: {} },
    formation: { type: "object", default: [] },
    mgrLv: { type: 'number', default: 0 },       // 直播平台管理等级
    livePlatforms: { type: "object", default: {} },
    livePlatformsEvents: { type: "object", default: {} },
    carInfo: { type: "object", default: {} },
    manifesto: { type: "string", default: "" },
    fameDailyReward: { type: "object", default: {} },
    lastMailId: { type: "number", default: 0 },
    mail: { type: "object", default: {} },
    clubInfo: { type: "object", default: {} },
    shop: { type: "object", default: {} },              // 商店系统
    shopTemporary: { type: 'object', default: {} },     // 临时商店
    clubPostcardBuyNum: { type: "number", default: 0 },
    clubPostcardLastTime: { type: "number", default: 0 },
    recoveryInfo: { type: "object", default: {} },
    counter: { type: 'object', default: {} },
    recurTimer: { type: 'object', default: {} },
    systemOpens: { type: 'object', default: {} },
    battleMember: { type: 'object', default: {} },
    payIds: { type: 'object', default: [] },
    rechargeMoney: { type: 'number', default: 0 },
    autoShow: { type: 'object', default: {} },
    autoShowWork: { type: 'object', default: {} },
    carTopThree: { type: 'object', default: [] },
    firstPay: { type: 'number', default: 0 },               // 是否首充过:0：未首充 1：首充
    hadFetchFirst: { type: 'number', default: 0 },          // 领取首充奖励:0：未领取 1：已领取
    requireMoney: { type: "number", default: 0 },           // 点击住宅领取奖励时间戳
    actInvestFunds: { type: 'object', default: {} },        // 投资基金活动
    operate: { type: 'object', default: {} },               // 运营活动
    operateZeroGift: { type: 'object', default: {} },       // 运营活动0元礼包
    monthCard: { type: 'object', default: {} },             // 月卡
    specialDelivery: { type: 'object', default: [] },       // 特邀派送
    loginDays: { type: 'number', default: 0 },
    guide: { type: 'object', default: {} },
    ban: { type: 'object', default: {} },                   // 封禁{} 禁言
    firstPayTime: { type: 'number', default: 0 },           // 首次充值时间
    lastPayTime: { type: 'number', default: 0 },            // 最后充值时间
    dayPay: { type: 'number', default: 0 },                 // 每日充值
};
MongoPlayer.prototype._index = 'uid';