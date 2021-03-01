/* eslint-disable indent */
/**
 * @description 俱乐部管理模块
 * @author chenyq
 * @data 2020/04/16
 */

// const logger = require('pomelo-logger').getLogger('pomelo', __filename);

const bearcat = require('bearcat');
const code = require('@code');
const util = require('@util');

const ClubComponent = function (app, player) {
    this.$id = 'game_ClubComponent';
    this.$scope = 'prototype';
    this.app = app;
    this.player = player;
    this.clubDict = {};
};

bearcat.extend('game_ClubComponent', 'game_Component');
module.exports = ClubComponent;

/**
 * clubInfo:{
    clubType:{lv:1,exp:0,
        cardDict:{
            101:{intimacy:0,isMake:1,intimacyReward:{},
                gift:0,giftMax:0,lastGiftTime:0,buyGiftNum:0,lastBuyGiftTime:0}
            }
        }
    }
 */

ClubComponent.prototype.onAfterLoad = function () {
    const clubInfo = this.player.clubInfo || {};
    for (const clubType of Object.values(code.club.CLUB_TYPE)) {
        const clubObj = bearcat.getBean('game_Club', this.app, this.player, clubType, clubInfo[clubType] || { lv: 1, exp: 0 });
        this.clubDict[clubType] = clubObj;
    }
    this.dayChange(false);
};

ClubComponent.prototype.onDayChange = function () {
    // 推送俱乐部信息
    this.dayChange();
};

ClubComponent.prototype.dayChange = function (isNotify = true) {
    for (const clubObj of Object.values(this.clubDict)) {
        const dbInfo = clubObj.getDBData();
        for (const id of Object.keys(dbInfo.cardDict || {})) {
            clubObj.dayChange(id);
        }
    }
    this.updateClub();
    if (isNotify) {
        const clubList = this.clubGetInfo();
        this.player.Notify.notify('onClubGetInfoNotify', { clubList: clubList });
    }
};
/**
 * 更新俱乐部数据
 */
ClubComponent.prototype.updateClub = function () {
    if (this.clubDict) {
        const clubList = {};
        for (const [clubType, clubObj] of Object.entries(this.clubDict)) {
            clubList[clubType] = clubObj.getDBData();
        }
        this.player.clubInfo = clubList;
    }
};

/**
 * 获取俱乐部对象
 * @param {Number | string} clubType
 */
ClubComponent.prototype.getClubObj = function (clubType) {
    if (this.clubDict == undefined) {
        return undefined;
    }
    return this.clubDict[clubType];
};
/**
 * 获取俱乐部等级
 */
ClubComponent.prototype.getClubLv = function (clubType) {
    const clubObj = this.getClubObj(clubType);
    if (clubObj) {
        return clubObj.getLv();
    }
    return 1;
};

/**
 * 获取俱乐部信息
 */
ClubComponent.prototype.clubGetInfo = function () {
    const clubList = [];
    for (const clubObj of Object.values(this.clubDict)) {
        clubList.push(clubObj.getInfo());
    }
    return clubList;
};
/**
 * 升级俱乐部
 * @param {Number | string} clubType
 */
ClubComponent.prototype.clubUpgrade = function (clubType) {
    const clubObj = this.getClubObj(clubType);
    if (!clubObj) {
        return { clubInfo: {}, reward: {} };
    }
    // 增加经验
    const dbInfo = clubObj.getDBData();
    const lvConfig = clubObj.getLvConfig();
    let reward = util.object.deepClone(lvConfig.EveryReward);
    dbInfo.exp += lvConfig.EveryExp;
    if (dbInfo.exp >= lvConfig.LvExp) {
        const nextLvConfig = clubObj.getNextLvConfig();
        if (nextLvConfig) {
            // 升级
            dbInfo.exp -= lvConfig.LvExp;
            dbInfo.lv = nextLvConfig.Lv;
            
            // 升级增加亲密度
            // 原升级只增加已结交亲密度
            // for (const [id, cardInfo] of Object.entries(dbInfo.cardDict || {})) {
            //     const clubConfig = this.app.Config.Club.get(id);
            //     cardInfo.intimacy += lvConfig.Intimacy;
            //     cardInfo.giftMax = this.getGiftNumFromIntimacy(clubConfig, cardInfo.intimacy);
            // }
            // 20200706 升级增加已结交和已解锁亲密度
            const nowTime = Date.now();
            for (const [id, clubConfig] of this.app.Config.Club.entries()) {
                if (clubConfig.ClubType == clubType) {
                    if (clubConfig.NeedClubLv <= dbInfo.lv) {
                        if (dbInfo.cardDict[id]) {
                            dbInfo.cardDict[id].intimacy += lvConfig.Intimacy;
                            dbInfo.cardDict[id].giftMax = this.getGiftNumFromIntimacy(clubConfig, dbInfo.cardDict[id].intimacy);
                        }
                        else {
                            // 升级刚好到解锁等级不增加亲密度
                            const addIntimacy = clubConfig.NeedClubLv == dbInfo.lv ? 0 : lvConfig.Intimacy;
                            const giftMax = this.getGiftNumFromIntimacy(clubConfig, addIntimacy);
                            const cardInfo = { isMake: 0, intimacy: addIntimacy, intimacyReward: [], gift: 0, giftMax: giftMax, lastGiftTime: nowTime, buyGiftNum: 0, lastBuyGiftTime: nowTime };
                            dbInfo.cardDict[id] = cardInfo;
                        }
                    }
                }
            }

            // 升级奖励
            reward = util.object.mergeObject(reward, lvConfig.UpgradeReward);
        }
    }
    clubObj.setDBData(dbInfo);
    this.updateClub();
    this.player.Event.emit(code.event.CLUB_UP_LEVEL.name);
    return { clubInfo: clubObj.getInfo(), reward: reward };
};
/**
 * 俱乐部主播结交
 */
ClubComponent.prototype.clubMake = function (clubConfig) {
    const clubObj = this.getClubObj(clubConfig.ClubType);
    if (clubObj) {
        // 原升级只增加已结交亲密度
        // const nowTime = Date.now();
        // const giftMax = this.getGiftNumFromIntimacy(clubConfig, 0);
        // const cardInfo = { intimacy: 0, intimacyReward: [], gift: 0, giftMax: giftMax, lastGiftTime: nowTime, buyGiftNum: 0, lastBuyGiftTime: nowTime };
        // clubObj.setCardInfo(clubConfig.Id, cardInfo);
        // 20200706 升级增加已结交和已解锁亲密度
        let cardInfo = clubObj.getCardInfo(clubConfig.Id);
        if(util.object.isNull(cardInfo)){
            const nowTime = Date.now();
            const giftMax = this.getGiftNumFromIntimacy(clubConfig, 0);
            cardInfo = { isMake: 0, intimacy: 0, intimacyReward: [], gift: 0, giftMax: giftMax, lastGiftTime: nowTime, buyGiftNum: 0, lastBuyGiftTime: nowTime };
        }
        cardInfo.isMake = 1;

        clubObj.setCardInfo(clubConfig.Id, cardInfo);
        this.updateClub();
        return clubObj.getClubCard(clubConfig.Id, cardInfo);
    }
    return undefined;
};
/**
 * 俱乐部主播赠礼
 */
ClubComponent.prototype.clubGift = function (clubConfig) {
    const clubObj = this.getClubObj(clubConfig.ClubType);
    if (clubObj) {
        const cardInfo = clubObj.getCardInfo(clubConfig.Id);
        cardInfo.intimacy += clubConfig.RewardIntimacy;
        cardInfo.gift += 1;
        cardInfo.giftMax = this.getGiftNumFromIntimacy(clubConfig, cardInfo.intimacy);
        cardInfo.lastGiftTime = Date.now();
        cardInfo.isMake = 1;
        clubObj.setCardInfo(clubConfig.Id, cardInfo);
        this.updateClub();
        this.player.Item.addItem(util.proto.encodeConfigAward(clubConfig.RewardItem), code.reason.OP_CLUB_GIFT_GET);
        this.player.Event.emit(code.event.CLUB_SEND_GIFT.name);
        return clubObj.getClubCard(clubConfig.Id, cardInfo);
    }
    return {};
};
/**
 * 领取亲密度奖励
 */
ClubComponent.prototype.clubIntimacyReward = function (clubConfig, index) {
    const clubObj = this.getClubObj(clubConfig.ClubType);
    if (clubObj) {
        const intimacyReward = clubObj.addIntimacyReward(clubConfig.Id, index);
        this.updateClub();
        const reward = clubConfig.StageReward[index];
        this.player.Item.addItem(util.proto.encodeConfigAward(reward), code.reason.OP_CLUB_INTIMACY_REWARD_GET);
        return intimacyReward;
    }
    return [];
};
/**
 * 俱乐部重置赠礼次数
 */
ClubComponent.prototype.clubReset = function (clubConfig) {
    const clubObj = this.getClubObj(clubConfig.ClubType);
    if (clubObj) {
        const cardInfo = clubObj.getCardInfo(clubConfig.Id);
        cardInfo.gift = 0;
        cardInfo.buyGiftNum += 1;
        cardInfo.lastBuyGiftTime = Date.now();
        clubObj.setCardInfo(clubConfig.Id, cardInfo);
        this.updateClub();
        return [cardInfo.giftMax - cardInfo.gift, cardInfo.buyGiftNum];
    }
    return [0, 0];
};
/**
 * 俱乐部购买明信片
 */
ClubComponent.prototype.clubPostcardBuy = function () {
    const buyNum = this.getPostCardBuyNum();
    this.player.clubPostcardBuyNum = buyNum + 1;
    this.player.clubPostcardLastTime = Date.now();
    const config = this.app.Config.CounterRecovery.get(code.recovery.RECOVERY_TYPE.POST_CARD);
    if (config) {
        this.player.Item.addItem([{ itemID: config.ItemId, itemNum: 1 }], code.reason.OP_CLUB_BUY_GET);
    }
    return this.player.clubPostcardBuyNum;
};

/**
 * 根据亲密度获取赠礼次数
 * @param {Object} clubConfig 俱乐部主播配置
 * @param {Number} intimacy 俱乐部主播亲密度
 */
ClubComponent.prototype.getGiftNumFromIntimacy = function (clubConfig, intimacy) {
    const intimacyDict = { ...clubConfig.Intimacy };
    const givingDict = { ...clubConfig.GiftGiving };
    let index = 0;
    for (const [k, v] of Object.entries(intimacyDict)) {
        if (k >= index && v <= intimacy) {
            index = k;
        }
    }
    return givingDict[index] || 0;
};
/**
 * TODO 获取操作上限次数 Vip
 */
ClubComponent.prototype.getMaxNum = function (operateType) {
    const vipConfig = this.app.Config.Vip.get(this.player.vip || 0);
    let maxNum = 0;
    if (vipConfig) {
        switch (operateType) {
            case code.club.OPERATE_TYPE.CLUB_RESET_GIFT_NUM:
                maxNum = vipConfig.ClubGiftReset;
                break;
            case code.club.OPERATE_TYPE.CLUB_BUY_POST_CARD:
                maxNum = vipConfig.ClubGiftNum;
                break;
            default:
                break;
        }
    }
    return maxNum;
};

/**
 * 获取明信片已购买次数
 */
ClubComponent.prototype.getPostCardBuyNum = function () {
    const nowTime = Date.now();
    if (!util.time.isSameDay(this.player.clubPostcardLastTime || 0, nowTime)) {
        this.player.clubPostcardLastTime = nowTime;
        this.player.clubPostcardBuyNum = 0;
    }
    return this.player.clubPostcardBuyNum;
};