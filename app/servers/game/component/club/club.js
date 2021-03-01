/**
 * @description 俱乐部对象
 * @author chenyq
 * @data 2020/04/16
 */
const util = require('@util');

const ClubObject = function (app, player, clubType, dataInfo) {
    this.$id = 'game_Club';
    this.$scope = 'prototype';
    this.app = app;
    this.player = player;
    this.clubType = clubType;
    this.dbData = dataInfo;
    if (!this.dbData.cardDict) {
        this.dbData.cardDict = {};
    }
};
module.exports = ClubObject;

/**
 * 获取俱乐部主播配置编号
 */
ClubObject.prototype.getCId = function () {
    return this.clubType * 1000 + this.dbData.lv;
};
/**
 * 获取db数据
 */
ClubObject.prototype.getDBData = function () {
    // if(this.dbData){
    //     for (const id of Object.keys(this.dbData.cardDict || {})) {
    //         this.dayChange(id);
    //     }
    // }
    return this.dbData || {};
};
/**
 * 设置db数据
 */
ClubObject.prototype.setDBData = function (db) {
    this.dbData = db;
};
/**
 * 获取当前等级
 */
ClubObject.prototype.getLv = function () {
    return this.dbData.lv || 1;
};
/**
 * 获取当前经验值
 */
ClubObject.prototype.getExp = function () {
    return this.dbData.exp || 0;
};
/**
 * 获取俱乐部主播数据
 */
ClubObject.prototype.getCardInfo = function (id) {
    // this.dayChange(id);
    return this.dbData.cardDict[id] || {};
};

/**
 * 设置主播数据
 */
ClubObject.prototype.setCardInfo = function (id, cardInfo) {
    this.dbData.cardDict[id] = cardInfo;
};
/**
 * 获取亲密度
 */
ClubObject.prototype.getIntimacy = function (id) {
    if (this.dbData && this.dbData.cardDict && this.dbData.cardDict[id]) {
        return this.dbData.cardDict[id].intimacy;
    }
    else {
        return 0;
    }
};
/**
 * 获取亲密度奖励
 */
ClubObject.prototype.getIntimacyReward = function (id) {
    if (this.dbData && this.dbData.cardDict && this.dbData.cardDict[id]) {
        return this.dbData.cardDict[id].intimacyReward;
    }
    else {
        return [];
    }
};

/**
 * 增加主播亲奖励
 */
ClubObject.prototype.addIntimacyReward = function (id, index) {
    if (this.dbData && this.dbData.cardDict && this.dbData.cardDict[id]) {
        this.dbData.cardDict[id].intimacyReward.push(index);
        return this.dbData.cardDict[id].intimacyReward;
    }
    else {
        return [];
    }
};
/**
 * 获取剩余赠礼次数
 */
ClubObject.prototype.getGiftNum = function (id) {
    if (this.dbData && this.dbData.cardDict && this.dbData.cardDict[id]) {
        // this.dayChange(id);
        return this.dbData.cardDict[id].giftMax - this.dbData.cardDict[id].gift;
    }
    else {
        return 0;
    }
};
/**
 * 获取赠礼已购买次数
 */
ClubObject.prototype.getBuyGiftNum = function (id) {
    if (this.dbData && this.dbData.cardDict && this.dbData.cardDict[id]) {
        // this.dayChange(id);
        return this.dbData.cardDict[id].buyGiftNum;
    }
    else {
        return 0;
    }
};

/**
 * 获取俱乐部等级配置
 */
ClubObject.prototype.getLvConfig = function () {
    return this.app.Config.ClubLv.get(this.getCId());
};
/**
 * 获取俱乐部下一级配置
 */
ClubObject.prototype.getNextLvConfig = function () {
    return this.app.Config.ClubLv.get(this.getCId() + 1);
};
/**
 * 获取返回信息
 */
ClubObject.prototype.getClubCard = function (id, cardInfo) {
    const clubCard = {};
    clubCard.id = parseInt(id);
    clubCard.intimacy = cardInfo.intimacy;
    clubCard.intimacyReward = cardInfo.intimacyReward;
    clubCard.giftNum = cardInfo.giftMax - cardInfo.gift;
    clubCard.buyResetNum = cardInfo.buyGiftNum;
    if (typeof (cardInfo.isMake) == 'undefined') {
        clubCard.isMake = 1;
    }
    else {
        clubCard.isMake = cardInfo.isMake;
    }
    return clubCard;
};
/**
 * 获取返回信息
 */
ClubObject.prototype.getInfo = function () {
    const info = {};
    info.clubType = this.clubType;
    info.lv = this.dbData.lv;
    info.exp = this.dbData.exp;
    info.clubCardList = [];
    // 原升级只增加已结交亲密度
    // for (const [id, cardInfo] of Object.entries(this.dbData.cardDict || {})) {
    //     // this.dayChange(id);
    //     const clubCard = this.getClubCard(id, cardInfo);
    //     info.clubCardList.push(clubCard);
    // }
    // 20200706 升级增加已结交和已解锁亲密度
    for (const [id, clubConfig] of this.app.Config.Club.entries()) {
        if (clubConfig.ClubType == info.clubType && clubConfig.NeedClubLv <= info.lv) {
            if (this.dbData.cardDict[id]) {
                const clubCard = this.getClubCard(id, this.dbData.cardDict[id]);
                info.clubCardList.push(clubCard);
            }
            else{
                const clubCard = { id: id, intimacy: 0, intimacyReward: [], giftNum: 0, buyResetNum: 0, isMake: 0 };
                info.clubCardList.push(clubCard);
            }
        }
    }

    return info;
};
/**
 * 主播是否已结交
 */
ClubObject.prototype.isMake = function (id) {
    // 原升级只增加已结交亲密度
    // return this.dbData.cardDict[id] ? true : false;
    // 20200706 升级增加已结交和已解锁亲密度
    if(!this.dbData.cardDict[id] || this.dbData.cardDict[id].isMake == 0){
        return false;
    }
    else{
        return true;
    }
};

/**
 * 跨天重置
 */
ClubObject.prototype.dayChange = function (id) {
    const nowTime = Date.now();
    if (!util.time.isSameDay(this.dbData.cardDict[id].lastGiftTime || 0, nowTime)) {
        this.dbData.cardDict[id].lastGiftTime = nowTime;
        const clubConfig = this.app.Config.Club.get(id);
        this.dbData.cardDict[id].giftMax = this.player.Club.getGiftNumFromIntimacy(clubConfig, this.dbData.cardDict[id].intimacy);
        this.dbData.cardDict[id].gift = 0;
    }
    if (!util.time.isSameDay(this.dbData.cardDict[id].lastBuyGiftTime || 0, nowTime)) {
        this.dbData.cardDict[id].lastBuyGiftTime = nowTime;
        this.dbData.cardDict[id].buyGiftNum = 0;
    }
};
