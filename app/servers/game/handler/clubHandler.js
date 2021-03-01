/**
 * @description 俱乐部消息模块
 * @author chenyq
 * @date 2020/04/16
 */
// let pomelo = require('pomelo');
const code = require('@code');
const util = require('@util');

module.exports = function (app) {
    return new Handler(app);
};

const Handler = function (app) {
    this.app = app;
};
/**
 * 获取俱乐部信息
 */
Handler.prototype.clubGetInfo = function (msg, session, next) {
    const player = session.player;
    const clubList = player.Club.clubGetInfo();
    next(null, { code: code.err.SUCCEEDED, clubList: clubList });
};
/**
 * 获取明信片恢复时间
 */
Handler.prototype.clubPostcardTime = function (msg, session, next) {
    const player = session.player;
    const buyNum = player.Club.getPostCardBuyNum();
    const recoveryInfo = player.Recovery.getRecoveryInfo(code.recovery.RECOVERY_TYPE.POST_CARD);
    const postcardInfo = { recoveryInfo: recoveryInfo, buyNum: buyNum };
    next(null, { code: code.err.SUCCEEDED, postcardInfo: postcardInfo });
};
/**
 * 俱乐部升级
 */
Handler.prototype.clubUpgrade = function (msg, session, next) {
    const player = session.player;
    const clubType = msg.clubType;
    const clubObj = player.Club.getClubObj(clubType);
    if (!clubObj) {
        next(null, { code: code.err.ERR_CLUB_NO_EXIST });
        return; // 俱乐部错误5901
    }
    // 是否已满级 下一级无配置且经验已满
    const lvConfig = clubObj.getLvConfig();
    const nextLvConfig = clubObj.getNextLvConfig();
    if (nextLvConfig == undefined && clubObj.getExp() >= lvConfig.LvExp) {
        next(null, { code: code.err.ERR_CLUB_UPGRADE_MAX });
        return; // 俱乐部等级已满5902
    }
    const costList = util.proto.encodeConfigAward(lvConfig.EveryCost);
    const itemMgr = player.Item;
    if (!itemMgr.isEnough(costList)) {
        next(null, { code: code.err.ERR_CLUB_UPGRADE_COST });
        return; // 俱乐部升级消耗不足5903
    }
    itemMgr.deleteItem(costList, code.reason.OP_CLUB_UPGRADE_COST);
    const info = player.Club.clubUpgrade(clubType);
    itemMgr.addItem(util.proto.encodeConfigAward(info.reward), code.reason.OP_CLUB_UPGRADE_GET);
    next(null, { code: code.err.SUCCEEDED, clubInfo: info.clubInfo });
};
/**
 * 俱乐部结交主播
 */
Handler.prototype.clubMake = function (msg, session, next) {
    const player = session.player;
    const id = msg.id;
    const clubConfig = this.app.Config.Club.get(id);
    if (!clubConfig) {
        next(null, { code: code.err.ERR_CLUB_CARD_ERROR });
        return; // 主播不存在5904
    }
    const clubObj = player.Club.getClubObj(clubConfig.ClubType);
    if (!clubObj) {
        next(null, { code: code.err.ERR_CLUB_NO_EXIST });
        return; // 俱乐部错误5901
    }
    if (clubObj.isMake(clubConfig.Id)) {
        next(null, { code: code.err.ERR_CLUB_IS_MAKE });
        return; // 主播已结交5905
    }
    const lv = clubObj.getLv();
    if (lv < clubConfig.NeedClubLv) {
        next(null, { code: code.err.ERR_CLUB_MAKE_LEVEL });
        return; // 俱乐部等级不足5906
    }
    // 战斗数据
    const selfArray = player.Card.getCardBattleInfo();
    if (selfArray.length <= 0) {
        next(null, { code: code.err.ERR_CLUB_MAKE_NOT_FORMATION });
        return; // 无上阵主播无法结交 5916
    }
    const bossArray = [{ id: clubConfig.CardId, hp: clubConfig.BossHp, atk: clubConfig.BossAttack, skill: 0 }];
    const playerInfo = { uid: session.uid, name: player.name };
    const bossInfo = { uid: 0, name: clubConfig.CardName };
    // 获取战斗结果
    this.app.rpcs.battle.battleRemote.startBattleWithClientParams(
        session,
        code.battle.BATTLE_TYPE.CLUB,
        playerInfo,
        selfArray,
        bossInfo,
        bossArray,
        [],
        [clubConfig.Id],
    ).then(({ err, res }) => {
        if (err || res.isWin == false) {
            next(null, { code: code.err.SUCCEEDED, id: id });
            return;
        }
        const clubCard = player.Club.clubMake(clubConfig);
        next(null, { code: code.err.SUCCEEDED, id: id, clubCard: clubCard });
    });
};
/**
 * 俱乐部赠礼主播
 */
Handler.prototype.clubGift = function (msg, session, next) {
    const player = session.player;
    const id = msg.id;
    const clubConfig = this.app.Config.Club.get(id);
    if (!clubConfig) {
        next(null, { code: code.err.ERR_CLUB_CARD_ERROR });
        return; // 主播不存在5904
    }
    const clubObj = player.Club.getClubObj(clubConfig.ClubType);
    if (!clubObj) {
        next(null, { code: code.err.ERR_CLUB_NO_EXIST });
        return; // 俱乐部错误5901
    }
    if (!clubObj.isMake(clubConfig.Id)) {
        next(null, { code: code.err.ERR_CLUB_NOT_MAKE });
        return; // 主播未结交5908
    }
    if (clubObj.getGiftNum(id) <= 0) {
        next(null, { code: code.err.ERR_CLUB_GIFT_NUM_ERROR });
        return; // 赠礼次数不足5909
    }
    const isEnough = player.Recovery.judgeRecoveryNum(code.recovery.RECOVERY_TYPE.POST_CARD, clubConfig.Cost);
    if (!isEnough) {
        next(null, { code: code.err.ERR_CLUB_GIFT_COST });
        return; // 赠礼消耗不足5910
    }
    player.Item.deleteItem(util.proto.encodeConfigAward(clubConfig.Cost), code.reason.OP_CLUB_GIFT_COST);
    const clubCard = player.Club.clubGift(clubConfig);
    next(null, { code: code.err.SUCCEEDED, id: id, clubCard: clubCard });
};
/**
 * 俱乐部领取亲密度奖励
 */
Handler.prototype.clubIntimacyReward = function (msg, session, next) {
    const player = session.player;
    const id = msg.id;
    const index = msg.index;
    if (index < 0 || index > 3) {
        next(null, { code: code.err.ERR_CLUB_REWARD_ERROR });
        return; // 亲密度奖励领取失败5911
    }
    const clubConfig = this.app.Config.Club.get(id);
    if (!clubConfig) {
        next(null, { code: code.err.ERR_CLUB_CARD_ERROR });
        return; // 主播不存在5904
    }
    const clubObj = player.Club.getClubObj(clubConfig.ClubType);
    if (!clubObj) {
        next(null, { code: code.err.ERR_CLUB_NO_EXIST });
        return; // 俱乐部错误5901
    }
    if (!clubObj.isMake(clubConfig.Id)) {
        next(null, { code: code.err.ERR_CLUB_NOT_MAKE });
        return; // 主播未结交5908
    }
    // 奖励索引对应从亲密度第二索引开始
    if (clubObj.getIntimacy(id) < clubConfig.Intimacy[index + 1]) {
        next(null, { code: code.err.ERR_CLUB_INTIMACY_ERROR });
        return; // 亲密度不足5912
    }
    if (clubObj.getIntimacyReward(id).includes(index)) {
        next(null, { code: code.err.ERR_CLUB_INTIMACY_REWARD });
        return; // 奖励已领取5913
    }
    const intimacyReward = player.Club.clubIntimacyReward(clubConfig, index);
    next(null, { code: code.err.SUCCEEDED, id: id, intimacyReward: intimacyReward });
};
/**
 * 俱乐部重置赠礼次数
 */
Handler.prototype.clubReset = function (msg, session, next) {
    const player = session.player;
    const id = msg.id;
    const clubConfig = this.app.Config.Club.get(id);
    if (!clubConfig) {
        next(null, { code: code.err.ERR_CLUB_CARD_ERROR });
        return; // 主播不存在5904
    }
    const clubObj = player.Club.getClubObj(clubConfig.ClubType);
    if (!clubObj) {
        next(null, { code: code.err.ERR_CLUB_NO_EXIST });
        return; // 俱乐部错误5901
    }
    if (!clubObj.isMake(clubConfig.Id)) {
        next(null, { code: code.err.ERR_CLUB_NOT_MAKE });
        return; // 主播未结交5908
    }
    const maxNum = player.Club.getMaxNum(code.club.OPERATE_TYPE.CLUB_RESET_GIFT_NUM);
    const buyGiftNum = clubObj.getBuyGiftNum(id);
    const cost = this.app.Config.BuyingTimes.getCost(code.global.BUYING_TIMES_TYPE.TYPE_2, buyGiftNum + 1);
    if (buyGiftNum >= maxNum || !cost) {
        next(null, { code: code.err.ERR_CLUB_RESET_GIFT_MAX });
        return; // 重置赠礼次数已达上限5914
    }
    const costList = util.proto.encodeConfigAward(cost);
    const itemMgr = player.Item;
    if (!itemMgr.isEnough(costList)) {
        next(null, { code: code.err.ERR_CLUB_RESET_GIFT_COST });
        return; // 重置赠礼次数消耗不足5915
    }
    itemMgr.deleteItem(costList, code.reason.OP_CLUB_RESET_COST);
    const [giftNum, buyResetNum] = player.Club.clubReset(clubConfig);
    next(null, { code: code.err.SUCCEEDED, id: id, giftNum: giftNum, buyResetNum: buyResetNum });
};
/**
 * 俱乐部购买明信片
 */
Handler.prototype.clubPostcard = function (msg, session, next) {
    const player = session.player;
    const maxNum = player.Club.getMaxNum(code.club.OPERATE_TYPE.CLUB_BUY_POST_CARD);
    const buyNum = player.Club.getPostCardBuyNum();
    const cost = this.app.Config.BuyingTimes.getCost(code.global.BUYING_TIMES_TYPE.TYPE_1, buyNum + 1);
    if (buyNum >= maxNum || !cost) {
        next(null, { code: code.err.ERR_CLUB_POSTCARD_BUY_MAX });
        return; // 购买明信片次数已达上限5917
    }
    const costList = util.proto.encodeConfigAward(cost);
    const itemMgr = player.Item;
    if (!itemMgr.isEnough(costList)) {
        next(null, { code: code.err.ERR_CLUB_POSTCARD_BUY_COST });
        return; // 购买明信片次数消耗不足5918
    }
    itemMgr.deleteItem(costList, code.reason.OP_CLUB_BUY_COST);
    const newBuyNum = player.Club.clubPostcardBuy();
    const recoveryInfo = player.Recovery.getRecoveryInfo(code.recovery.RECOVERY_TYPE.POST_CARD);
    const postcardInfo = { recoveryInfo: recoveryInfo, buyNum: newBuyNum };
    next(null, { code: code.err.SUCCEEDED, postcardInfo: postcardInfo });
};
