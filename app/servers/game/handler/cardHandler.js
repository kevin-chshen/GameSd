/**
 * @description 卡牌消息模块
 * @author chenyq
 * @date 2020/03/17
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
 * 
 */
Handler.prototype.cardGetInfo = function (msg, session, next) {
    const player = session.player;
    if (!player) { next(null); return; }

    const cardList = player.Card.cardGetInfo();
    next(null, { code: code.err.SUCCEEDED, cardList: cardList });
};
/**
 * 卡牌上阵
 */
Handler.prototype.cardFormation = function (msg, session, next) {
    const downCardId = msg.downCardId;
    const upCardId = msg.upCardId;
    const player = session.player;
    if (!player) { next(null); return; }
    const formation = player.Card.getCardFormation();
    const length = formation.size;
    if (downCardId > 0) {
        if (length <= 1 && upCardId <= 0) {
            next(null, { code: code.err.ERR_CARD_FORMATION_LEAST_ONE });
            return;// 下阵至少保留一个主播
        }
        if (!formation.has(downCardId)) {
            next(null, { code: code.err.ERR_CARD_FORMATION_DOWN });
            return;//未上阵无法下阵
        }
    }
    if (upCardId > 0) {
        const cardObj = player.Card.getCardObj(upCardId);
        if (!cardObj) {
            next(null, { code: code.err.ERR_CARD_NO_EXIST });
            return;//该主播未获得
        }
        if (formation.has(upCardId)) {
            next(null, { code: code.err.ERR_CARD_FORMATION_UP });
            return;//已上阵
        }
        // 阵位解锁
        // 获取当前阵位数
        // 阵位上限
        const maxLength = player.Card.getPositionNum();
        if (length >= maxLength) {
            next(null, { code: code.err.ERR_CARD_FORMATION_NOT_ENOUGH });
            return;
        }
    }
    const cardList = player.Card.upFormation(upCardId, downCardId);
    next(null, { code: code.err.SUCCEEDED, cardList: cardList });
};
/**
 * 卡牌升级
 */
Handler.prototype.cardUpgrade = function (msg, session, next) {
    const cardId = msg.cardId;
    let level = msg.level;
    const player = session.player;
    if (!player) { next(null); return; }
    const cardObj = player.Card.getCardObj(cardId);
    if (!cardObj) {
        next(null, { code: code.err.ERR_CARD_NO_EXIST });
        return;//该主播未获得
    }
    // 头衔等级判断
    // 判断是否满级
    const lv = cardObj.getLevel();
    const maxLv = player.Card.getCardLevelMaxlv();
    if (lv >= maxLv) {
        next(null, { code: code.err.ERR_CARD_UPGRADE_LIMIT });
        return;//已达当前可提升最大等级，请提升头衔等级
    }
    if (level <= 0) {
        level = 1;
    }
    let newLv = lv + level;
    if (newLv > maxLv) {
        newLv = maxLv;
    }
    const cardConfig = cardObj.getCardConfig();
    // 判断消耗 [lv+1,newLv]的消耗
    let costList = {};
    for (let index = lv + 1; index <= newLv; index++) {
        const config = cardObj.getCardLevelConfig(index);
        const costInfo = config.Cost[cardConfig.Quality - 1];
        costList = util.object.mergeObject(costList, costInfo);
    }
    const costTotalList = util.proto.encodeConfigAward(costList);
    const itemMgr = player.Item;
    if (!itemMgr.isEnough(costTotalList)) {
        next(null, { code: code.err.ERR_CARD_UPGRADE_COST });
        return;
    }
    itemMgr.deleteItem(costTotalList, code.reason.OP_CARD_UPGRADE_COST);

    const cardInfo = player.Card.upgradeCard(cardId, newLv, lv);
    next(null, { code: code.err.SUCCEEDED, cardInfo: cardInfo });
};
/**
 * 卡牌包装
 */
Handler.prototype.cardStage = function (msg, session, next) {
    const cardId = msg.cardId;

    const player = session.player;
    if (!player) { next(null); return; }
    // 判断是否满级
    const cardObj = player.Card.getCardObj(cardId);
    if (!cardObj) {
        next(null, { code: code.err.ERR_CARD_NO_EXIST });
        return;//该主播未获得
    }
    const stage = cardObj.getStage();
    const point = cardObj.getPoint();
    let nextStage = point >= 4 ? stage + 1 : stage;
    let nextPoint = point >= 4 ? 0 : point + 1;
    const stageConfig = cardObj.getCardStageConfig(cardId, nextStage, nextPoint);
    if (!stageConfig) {
        next(null, { code: code.err.ERR_CARD_STAGE_MAX });
        return;//包装等级已满
    }
    // 卡牌等级判断
    const lv = cardObj.getLevel();
    if (lv < stageConfig.NeedCardLv) {
        next(null, { code: code.err.ERR_CARD_STAGE_LIMIT });
        return;//已达当前可提升最大等级，请提升卡牌等级
    }
    let isSuccess = true;
    let failCount = cardObj.getFailCount();
    //第5个点无消耗且必定成功
    if (nextPoint > 0) {
        isSuccess = false;
        // 判断消耗
        const costList = util.proto.encodeConfigAward([stageConfig.Cost]);
        const itemMgr = player.Item;
        if (!itemMgr.isEnough(costList)) {
            next(null, { code: code.err.ERR_CARD_STAGE_COST });
            return;
        }
        itemMgr.deleteItem(costList, code.reason.OP_CARD_STAGE_COST);

        //成功率判断
        const probability = stageConfig.SuccessValue * (failCount - stageConfig.TimesMin);
        const rand = util.random.random(1, 10000);
        isSuccess = probability >= rand ? true : false;
    }
    if (isSuccess) {
        failCount = 1;
    }
    else {
        failCount = failCount + 1;
        nextStage = stage;
        nextPoint = point;
    }
    const cardInfo = player.Card.stageCard(cardId, nextStage, nextPoint, failCount);
    next(null, { code: code.err.SUCCEEDED, cardInfo: cardInfo, isSuccess: isSuccess ? 1 : 0 });
};
/**
 * 卡牌升星
 */
Handler.prototype.cardStar = function (msg, session, next) {
    const cardId = msg.cardId;

    const player = session.player;
    if (!player) { next(null); return; }

    const cardObj = player.Card.getCardObj(cardId);
    if (!cardObj) {
        next(null, { code: code.err.ERR_CARD_NO_EXIST });
        return;//该主播未获得
    }
    const star = cardObj.getStar();
    const newStar = star + 1;
    const starConfig = cardObj.getCardStarConfig(cardId, newStar);
    if (!starConfig) {
        next(null, { code: code.err.ERR_CARD_STAR_MAX });
        return;//星级已满
    }
    // 判断消耗
    const costList = util.proto.encodeConfigAward([starConfig.Cost]);
    const itemMgr = player.Item;
    if (!itemMgr.isEnough(costList)) {
        next(null, { code: code.err.ERR_CARD_STAR_COST });
        return;
    }
    itemMgr.deleteItem(costList, code.reason.OP_CARD_STAR_COST);

    const cardInfo = player.Card.starCard(cardId, newStar);
    next(null, { code: code.err.SUCCEEDED, cardInfo: cardInfo });
};
/**
 * 卡牌重置
 */
Handler.prototype.cardReset = function (msg, session, next) {
    const cardId = msg.cardId;

    const player = session.player;
    if (!player) { next(null); return; }

    const cardObj = player.Card.getCardObj(cardId);
    if (!cardObj) {
        next(null, { code: code.err.ERR_CARD_NO_EXIST });
        return;//该主播未获得
    }
    const formation = player.Card.getCardFormation();
    if (formation.has(cardId)) {
        next(null, { code: code.err.ERR_CARD_RESET });
        return;//上阵中无法重置
    }
    const lv = cardObj.getLevel();
    const stage = cardObj.getStage();
    const point = cardObj.getPoint();
    const star = cardObj.getStar();
    if (lv <= 1 && stage <= 0 && point <= 0 && star <= 0) {
        next(null, { code: code.err.ERR_CARD_RESET_NOT });
        return;//未强化无法重置
    }

    // 判断消耗
    const itemMgr = player.Item;
    // const globalInfo = this.app.Config.Global.get(code.card.CARD_RESET_COST);
    // const consumeList = util.proto.encodeConfigAward([globalInfo.GlobalJson]);
    const cardConfig = cardObj.getCardConfig();
    if (!util.object.isNull(cardConfig.ResetCost)) {
        const consumeList = util.proto.encodeConfigAward([cardConfig.ResetCost]);
        if (!itemMgr.isEnough(consumeList)) {
            next(null, { code: code.err.ERR_CARD_RESET_COST });
            return;
        }
        itemMgr.deleteItem(consumeList, code.reason.OP_CARD_RESET_COST);
    }
    // 统计返还消耗物品
    let costList = {};
    // 升级消耗
    for (let i = 2; i <= lv; i++) {
        const config = cardObj.getCardLevelConfig(i);
        if (config && config.Cost) {
            costList = util.object.mergeObject(costList, config.Cost[cardConfig.Quality - 1]);
        }
    }
    // 升阶消耗
    for (let i = 0; i <= stage; i++) {
        const pointMax = i == stage ? point : 4;
        for (let j = 0; j <= pointMax; j++) {
            const config = cardObj.getCardStageConfig(cardId, i, j);
            if (config && config.Cost) {
                costList = util.object.mergeObject(costList, config.Cost);
            }
        }
    }
    // 升星消耗
    for (let i = 1; i <= star; i++) {
        const config = cardObj.getCardStarConfig(cardId, i);
        if (config && config.Cost) {
            costList = util.object.mergeObject(costList, config.Cost);
        }
    }
    const cardInfo = player.Card.resetCard(cardId);
    // 返还消耗物品
    itemMgr.addItem(util.proto.encodeConfigAward(costList), code.reason.OP_CARD_RESET_GET);
    next(null, { code: code.err.SUCCEEDED, cardInfo: cardInfo });
};

/**
 * 激活卡牌
 */
Handler.prototype.cardActive = function (msg, session, next) {
    const cardId = msg.cardId;
    const player = session.player;
    if (!player) { next(null); return; }
    const config = this.app.Config.Card.get(cardId);
    if (!config) {
        next(null, { code: code.err.ERR_CARD_ERROR });
        return;//卡牌id错误
    }
    const cardObj = player.Card.getCardObj(cardId);
    if (cardObj) {
        next(null, { code: code.err.ERR_CARD_ACTIVE });
        return;//该主播已激活
    }
    // 判断消耗
    const costList = util.proto.encodeConfigAward([config.Cost]);
    const itemMgr = player.Item;
    if (!itemMgr.isEnough(costList)) {
        next(null, { code: code.err.ERR_CARD_STAR_COST });
        return;//碎片不足
    }
    itemMgr.deleteItem(costList, code.reason.OP_CARD_ACTIVE_COST);
    const cardInfo = player.Card.addNewCard(cardId, true, true);
    next(null, { code: code.err.SUCCEEDED, cardInfo: cardInfo });
};

/**
 * 获取新卡牌
 */
Handler.prototype.cardNew = function (msg, session, next) {
    const cardId = msg.cardId;
    const player = session.player;
    if (!player) { next(null); return; }

    const cardInfo = player.Card.addNewCard(cardId, true, true);
    next(null, { code: code.err.SUCCEEDED, cardInfo: cardInfo });
};