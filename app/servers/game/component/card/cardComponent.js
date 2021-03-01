/**
 * @description 卡牌管理模块
 * @author chenyq
 * @data 2020/03/17
 */

const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const bearcat = require('bearcat');
const code = require('@code');
const util = require('@util');

//初始属性 {cardId:1,level:1,stage:1,point:1,failCount:1,star:1,formation:0}
const initData = { level: 1, stage: 0, point: 0, failCount: 1, star: 0 };

const CardComponent = function (app, player) {
    this.$id = 'game_CardComponent';
    this.$scope = 'prototype';
    this.app = app;
    this.player = player;
    this.cardDict = {};         //{card:{},card:{}}
};

bearcat.extend('game_CardComponent', 'game_Component');
module.exports = CardComponent;

/**
 * 登录初始化卡牌信息、阵型信息
 * playerCard{
 *  cardId:{cardId:1,level:1,stage:1,point:1,star:1}
 * }
 */
CardComponent.prototype.onAfterLoad = function () {
    const formation = this.getCardFormation();
    // let formation = [101, 201];
    this.cardDict = {};
    const playerCard = this.player.cardList || {};
    this.player.attributeMgr = bearcat.getBean("game_AttributeComponent", this.app, this.player);
    // let playerCard = { 101: { cardId: 101, level: 1, stage: 1, point: 1, failCount: 1, star: 1 }, 201: { cardId: 201, level: 1, stage: 1, point: 1, failCount: 1, star: 1 } };
    for (const [cardId, info] of Object.entries(playerCard)) {
        const cardObj = bearcat.getBean('game_Card', this.app, this.player, parseInt(cardId), info);
        cardObj.setFormation(formation);
        this.cardDict[parseInt(cardId)] = cardObj;
    }
    // 计算羁绊属性加成
    this.CalcFetterAttribute();
    logger.info("CardComponent onLogin");
};

CardComponent.prototype.onAfterLogin = function () {
    // 计算公会科技属性加成
    this.CalcTechnologyAttribute(0, true);
    this.player.battleMember = this.getCardList(false);
    this.player.Event.emit(code.event.BATTLE_MEMBER_UPDATE.name);

    this.player.power = this.getTotalPower();
};
/**
 * 获取卡牌信息
 */
CardComponent.prototype.cardGetInfo = function () {
    const cardList = [];
    if (this.cardDict) {
        for (const cardObj of Object.values(this.cardDict)) {
            const info = this.getInfo(cardObj);
            cardList.push(info);
        }
    }
    return cardList;
};
/**
 * 更新卡牌数据
 */
CardComponent.prototype.update = function () {
    if (this.cardDict) {
        const playerCard = {};
        for (const cardId of Object.keys(this.cardDict)) {
            playerCard[cardId] = this.cardDict[cardId].getData();
        }
        this.player.cardList = playerCard;
    }
};
/**
* 通知客户端卡牌变更信息
*/
CardComponent.prototype.notifyChanges = function (idList) {
    const data = [];
    for (const cardId of idList) {
        const cardObj = this.cardDict[cardId];
        if (cardObj) {
            const info = this.getInfo(cardObj);
            data.push(info);
        }
    }
    this.cardInfoNotify(data);
};

/**
* 通知客户端卡牌信息
*/
CardComponent.prototype.cardInfoNotify = function (cardList) {
    if (cardList.length <= 0) {
        return;
    }
    this.notify("onCardInfoNotify", { cardList: cardList });
};

/**
* 通知客户端卡牌分解信息
*/
CardComponent.prototype.cardResolveNotify = function (cardId, awardList) {
    this.notify("onCardResolveNotify", { cardId: cardId, awardList: awardList });
};

/**
 * 通知客户端信息
 */
CardComponent.prototype.notify = function (name, data) {
    this.app.get('channelService').pushMessageByUids(name, data,
        [{ uid: this.player.uid, sid: this.player.connectorId }]);
};
/**
 * 获取上阵卡牌属性
 * @param {Boolean} isRandom 是否随机出热度和魅力
 */
CardComponent.prototype.getCardList = function (isRandom = true) {
    const list = [];
    if (this.cardDict) {
        const formation = this.getCardFormation();
        for (const [cardId, cardObj] of Object.entries(this.cardDict)) {
            if (formation.has(parseInt(cardId))) {
                const info = {};
                info.cardId = cardId;
                const attr = cardObj.getAttr();
                if (isRandom) {
                    info.heat = util.random.random(attr[code.attribute.ATTR_TYPE.HP_MIN], attr[code.attribute.ATTR_TYPE.HP_MAX]);
                    info.charm = util.random.random(attr[code.attribute.ATTR_TYPE.ATTACK_MIN], attr[code.attribute.ATTR_TYPE.ATTACK_MAX]);
                    info.attr = {};
                }
                else {
                    info.heat = 0;
                    info.charm = 0;
                    info.attr = util.object.deepClone(attr);
                }
                info.star = cardObj.getStar();
                info.power = cardObj.getPower();
                list.push(info);
            }
        }
    }
    return list;
};
/**
 * 根据卡牌id获取车展卡牌信息，用于同步数据到AutoShow表
 */
CardComponent.prototype.getAutoShowCardInfo = function (cardId) {
    const cardObj = this.cardDict[cardId];
    if (cardObj) {
        const cardData = cardObj.getData();
        const cardAttr = cardObj.getAttr();
        const info = {};
        info['cardId'] = cardObj.cardId;
        info['level'] = cardData.level;
        info['star'] = cardData.star;
        info['attrs'] = util.object.deepClone(cardAttr);
        info['power'] = cardObj.getPower();
        return info;
    }
};

/**
 * 获取拥有的卡牌信息
 */
CardComponent.prototype.getOwnCardList = function (idList) {
    const list = [];
    for (const id of idList) {
        if (this.cardDict[id]) {
            const cardObj = this.cardDict[id];
            const info = {};
            info.cardId = id;
            const attr = cardObj.getAttr();
            info.attr = util.object.deepClone(attr);
            info.star = cardObj.getStar();
            info.power = cardObj.getPower();
            list.push(info);
        }
    }
    return list;
};

/**
 * 获取上阵卡牌战斗信息
 */
CardComponent.prototype.getCardBattleInfo = function () {
    const selfArray = [];
    const cardList = this.getCardList();
    if (cardList.length > 0) {
        cardList.sort(function (left, right) {
            return right.power - left.power;
        });
        for (const info of cardList) {
            const cardCfg = this.app.Config.Card.get(parseInt(info.cardId));
            if (cardCfg) {
                const skillCfg = this.app.Config.Skill.getByLevel(cardCfg.Skill, info.star + 1);
                selfArray.push({
                    id: parseInt(info.cardId),
                    hp: info.heat,
                    atk: info.charm,
                    skill: skillCfg ? skillCfg.Id : 0,
                });
            }
        }
    }
    return selfArray;
};
/**
 * 获取上阵总战力
 */
CardComponent.prototype.getTotalPower = function () {
    let power = 0;
    if (this.cardDict) {
        const formation = this.getCardFormation();
        for (const [cardId, cardObj] of Object.entries(this.cardDict)) {
            if (formation.has(parseInt(cardId))) {
                power = power + cardObj.getPower();
            }
        }
    }
    this.player.power = power;
    return power;
};
/**
 * 上阵战力变更 上下阵、阵上卡牌升级、包装、升星 等
 */
CardComponent.prototype.updatePower = function (cardId) {
    this.player.Event.emit(code.event.ATTRIBUTE_CHANGE.name);
    if (cardId && this.isFormation(cardId) == false) {
        return;
    }
    const oldPower = this.player.power;
    const newPower = this.getTotalPower();
    const changePower = newPower - oldPower;
    if (changePower != 0) {
        const isAdd = changePower > 0 ? 1 : 0;
        // 广播上阵战力变更
        const data = { power: newPower.toString(), changePower: Math.abs(changePower).toString(), isAdd: isAdd };
        this.notify("onPowerNotify", data);
        this.player.Event.emit(code.event.TOTAL_POWER_UPDATE.name, oldPower, newPower);
        // 记录战斗成员
        this.player.battleMember = this.getCardList(false);
        this.player.Event.emit(code.event.BATTLE_MEMBER_UPDATE.name);
    }
};
/**
 * 获取上阵卡牌信息
 */
CardComponent.prototype.getCardFormation = function () {
    const formation = this.player.formation || [];
    return new Set(formation);
};
CardComponent.prototype.isFormation = function (cardId) {
    const formation = this.getCardFormation();
    return formation.has(cardId) ? true : false;
};
/**
 * 保存上阵卡牌
 */
CardComponent.prototype.setCardFormation = function (formation) {
    this.player.formation = [...formation];
};
/**
 * 上阵
 */
CardComponent.prototype.upFormation = function (upCardId, downCardId) {
    const formation = this.getCardFormation();
    let changeList = new Set();
    //先下
    if (downCardId > 0 && this.cardDict[downCardId] && formation.has(downCardId)) {
        formation.delete(downCardId);
        this.cardDict[downCardId].setFormation(formation);

        const deductList = this.CalcFetterAttributeDeduct(downCardId, formation);
        changeList = util.set.setUnion(changeList, deductList);
    }
    //后上
    if (upCardId > 0 && this.cardDict[upCardId]) {
        formation.add(upCardId);
        this.cardDict[upCardId].setFormation(formation);
        const addList = this.CalcFetterAttributeAdd(upCardId, formation);
        changeList = util.set.setUnion(changeList, addList);
    }
    this.setCardFormation(formation);
    const returnList = [];
    if (downCardId > 0) {
        changeList.add(downCardId);
    }
    if (upCardId > 0) {
        changeList.add(upCardId);
    }
    if (changeList.size > 0) {
        for (const cardId of changeList.values()) {
            returnList.push(this.getInfo(this.cardDict[cardId]));
        }
    }
    this.updatePower();
    this.player.Event.emit(code.event.CARD_UP_FORMATION.name);
    return returnList;
};

/**
 * 升级卡牌
 */
CardComponent.prototype.upgradeCard = function (cardId, level, oldLv) {
    if (this.cardDict[cardId] == undefined) {
        return;
    }
    this.cardDict[cardId].setLevel(level);
    this.update();
    // 如果上阵中，更新数据
    this.updatePower(cardId);
    this.player.Event.emit(code.event.CARD_UP.name, level - oldLv);
    return this.getInfo(this.cardDict[cardId]);
};
/**
 * 包装卡牌
 */
CardComponent.prototype.stageCard = function (cardId, stage, point, failCount) {
    if (this.cardDict[cardId] == undefined) {
        return;
    }
    const oldValue = this.cardDict[cardId].getStage();
    this.cardDict[cardId].setStage(stage, point, failCount);
    this.update();
    // 如果上阵中，更新数据
    this.updatePower(cardId);
    const newValue = stage;
    if (oldValue != newValue) {
        this.player.Event.emit(code.event.CARD_STAGE.name);
    }
    this.player.Event.emit(code.event.CARD_PACK.name);
    return this.getInfo(this.cardDict[cardId]);
};
/**
 * 升星卡牌
 */
CardComponent.prototype.starCard = function (cardId, star) {
    if (this.cardDict[cardId] == undefined) {
        return;
    }
    this.cardDict[cardId].setStar(star);
    this.update();
    // 如果上阵中，更新数据
    this.updatePower(cardId);
    this.player.Event.emit(code.event.CARD_STAR.name, cardId);
    const config = this.cardDict[cardId].getCardConfig();
    if (config) {
        this.app.Chat.bannerSysTpltChat(code.card.CARD_CHAT_SYSTEM_ID.STAR_CARD, [this.player.name, util.color.getNameColor(config.Name, config.Quality), String(star)]);
    }
    return this.getInfo(this.cardDict[cardId]);
};
/**
 * 重置卡牌
 */
CardComponent.prototype.resetCard = function (cardId) {
    if (this.cardDict[cardId] == undefined) {
        return;
    }
    this.cardDict[cardId].reset({ ...initData });
    this.update();
    this.player.Event.emit(code.event.ATTRIBUTE_CHANGE.name);
    this.player.Event.emit(code.event.CARD_RESET.name, cardId);
    return this.getInfo(this.cardDict[cardId]);
};

/**
 * 获取卡牌等级
 */
CardComponent.prototype.getCardLevel = function (cardId) {
    if (this.cardDict[cardId] == undefined) {
        return 0;
    }
    return this.cardDict[cardId].getLevel();
};
/**
 * 获取卡牌对象
 */
CardComponent.prototype.getCardObj = function (cardId) {
    if (this.cardDict == undefined) {
        return undefined;
    }
    return this.cardDict[cardId];
};

/**
 * 返回信息卡牌信息
 */
CardComponent.prototype.getInfo = function (cardObj) {
    const cardData = cardObj.getData();
    const cardAttr = cardObj.getAttr();
    const info = {};
    info['cardId'] = cardObj.cardId;
    info['level'] = cardData.level;
    info['stage'] = cardData.stage;
    info['point'] = cardData.point;
    info['failCount'] = cardData.failCount;
    info['star'] = cardData.star;
    info['attrs'] = this.returnAttribute(cardAttr);
    info['power'] = cardObj.getPower();
    info['formation'] = cardObj.getFormation();
    info['carId'] = cardObj.getEquipCar();
    // logger.debug("getInfo id:", info.cardId, "power:", info.power, "formation:", info.formation, "attrs:", info.attrs);
    return info;
};

/**
 * 计算羁绊属性
 */
CardComponent.prototype.CalcFetterAttribute = function () {
    const formation = this.getCardFormation();
    for (const [cardId, cardObj] of Object.entries(this.cardDict)) {
        let fetterAttribute = {};
        const config = cardObj.getCardConfig();
        if (config) {
            // 计算卡牌相关羁绊
            for (const fetterId of config.Fetters) {
                // 判断羁绊条件是否达成
                const fetterConfig = this.app.Config.CardFetter.get(fetterId);
                let isTrue = true;
                for (const cId of fetterConfig.Cards) {
                    if (!formation.has(cId)) {
                        isTrue = false;
                        break;
                    }
                }
                // 羁绊加成属性
                if (isTrue && fetterConfig.Attribute) {
                    fetterAttribute = util.object.mergeObject(fetterAttribute, fetterConfig.Attribute);
                }
            }
            // 更新卡牌羁绊属性
            // console.log("fetter:", cardId, fetterAttribute);
            this.player.attributeMgr.updateAttr(cardId, code.attribute.ATTR_MODULE.FETTER, fetterAttribute, true);
        }
    }
};
/**
 * 羁绊属性增加
 */
CardComponent.prototype.CalcFetterAttributeAdd = function (cardId, formation) {
    const changeList = new Set();
    const cardObj = this.cardDict[cardId];
    if (!cardObj) {
        return changeList;
    }
    const config = cardObj.getCardConfig();
    // 计算卡牌相关羁绊
    for (const fetterId of config.Fetters) {
        // 判断羁绊条件是否达成
        const fetterConfig = this.app.Config.CardFetter.get(fetterId);
        if (fetterConfig) {
            let isTrue = true;
            for (const cId of fetterConfig.Cards) {
                if (!formation.has(parseInt(cId))) {
                    isTrue = false;
                    break;
                }
            }
            // 羁绊相关卡牌属性变更
            if (isTrue && fetterConfig.Attribute) {
                for (const cId of fetterConfig.Cards) {
                    let fetterAttribute = {};
                    fetterAttribute = util.object.mergeObject(fetterAttribute, fetterConfig.Attribute);
                    this.player.attributeMgr.addAttr(cId, code.attribute.ATTR_MODULE.FETTER, fetterAttribute);
                    if (!changeList.has(cId)) {
                        changeList.add(cId);
                    }
                }
            }
        }
    }
    return changeList;
};
/**
 * 羁绊属性扣除
 */
CardComponent.prototype.CalcFetterAttributeDeduct = function (cardId, formation) {
    const changeList = new Set();
    const cardObj = this.cardDict[cardId];
    if (!cardObj) {
        return changeList;
    }
    const config = cardObj.getCardConfig();
    // 计算卡牌相关羁绊
    for (const fetterId of config.Fetters) {
        // 判断羁绊条件是否达成
        const fetterConfig = this.app.Config.CardFetter.get(fetterId);
        if (fetterConfig) {
            let isTrue = true;
            for (const cId of fetterConfig.Cards) {
                if (!formation.has(parseInt(cId)) && cId != cardId) {
                    isTrue = false;
                    break;
                }
            }
            // 羁绊相关卡牌属性变更
            if (isTrue && fetterConfig.Attribute) {
                for (const cId of fetterConfig.Cards) {
                    let fetterAttribute = {};
                    fetterAttribute = util.object.mergeObject(fetterAttribute, fetterConfig.Attribute);
                    this.player.attributeMgr.deductAttr(cId, code.attribute.ATTR_MODULE.FETTER, fetterAttribute);
                    if (!changeList.has(cId)) {
                        changeList.add(cId);
                    }
                }
            }
        }
    }
    return changeList;
};
/**
 * 科技属性加成
 * @param {Number} career 对应职业 0为所有职业更新属性
 * @param {Boolean} isInit
 */
CardComponent.prototype.CalcTechnologyAttribute = function (career, isInit = false) {
    const technologyAdd = this.player.technologyAdd;
    const idList = [];
    for (const [cardId, cardObj] of Object.entries(this.cardDict)) {
        const config = cardObj.getCardConfig();
        // 是否有科技加成属性
        if (config && technologyAdd && technologyAdd.cardAdd && technologyAdd.cardAdd[config.Career] && (career == 0 || career == config.Career)) {
            // 更新卡牌羁绊属性
            const technologyAttribute = technologyAdd.cardAdd[config.Career];
            this.player.attributeMgr.updateAttr(cardId, code.attribute.ATTR_MODULE.TECHNOLOGY, technologyAttribute, isInit);
            idList.push(cardId);
        }
    }
    if (!isInit && idList.length > 0) {
        this.notifyChanges(idList);
        this.updatePower();
    }
};
/**
 * 添加新卡牌
 * @param list [cardId,cardId,cardId,...]
 */
CardComponent.prototype.addNewCards = function (idList) {
    const cardList = [];
    for (const cardId of idList) {
        const cardInfo = this.addNewCard(cardId, false, false);
        cardList.push(cardInfo);
    }
    this.update();
    return cardList;
};
/**
 * 获取新卡牌
 */
CardComponent.prototype.addNewCard = function (cardId = 0, isUpdate = true, isNotice = true) {
    let cardInfo = {};
    const config = this.app.Config.Card.get(cardId);
    if (config) {
        if (!this.cardDict[cardId]) {
            const cardObj = bearcat.getBean('game_Card', this.app, this.player, cardId, { ...initData });
            this.cardDict[cardId] = cardObj;
            if (isUpdate) {
                this.update();
            }
            cardInfo = this.getInfo(cardObj);
            //广播数据
            if (isNotice) {
                this.cardInfoNotify([cardInfo]);
            }
            if (config.Notice > 0) {
                //公告
                this.app.Chat.bannerSysTpltChat(code.card.CARD_CHAT_SYSTEM_ID.NEW_CARD, [this.player.name, util.color.getNameColor(config.Name, config.Quality)]);
            }
            logger.info(`player:${this.player.uid} add new card:${cardId}`);

            this.player.Event.emit(code.event.CARD_ACTIVE.name);
            this.player.Event.emit(code.event.ATTRIBUTE_CHANGE.name);
        }
        else {
            cardInfo = this.getInfo(this.cardDict[cardId]);
            //已有分解碎片
            const costList = util.proto.encodeConfigAward([config.Cost]);
            this.player.Item.addItem(costList, code.reason.OP_CARD_RESOLVE_GET);
            this.cardResolveNotify(cardId, util.proto.encodeAward(costList));
            logger.info(`player:${this.player.uid} add new card:${cardId} exist, resolve item:${config.Cost}`);
        }
    }
    else {
        logger.error("add card error, cardId error", cardId);
    }
    return cardInfo;

};
/**
 * 获取卡牌战力
 */
CardComponent.prototype.getCardPower = function (cardId) {
    const cardObj = this.getCardObj(cardId);
    if (cardObj) {
        return cardObj.getPower();
    }
    else {
        return 0;
    }
};
/**
 * 获取卡牌人气
 */
CardComponent.prototype.getCardPopularity = function (cardId) {
    const cardObj = this.getCardObj(cardId);
    if (cardObj) {
        return cardObj.getPopularity();
    }
    else {
        return 0;
    }
};
/*================ internal interface ====================*/

/**
 * 获取阵型位置
 */
CardComponent.prototype.getPositionNum = function () {
    const prestigeLv = this.player.lv;
    const vip = this.player.vip;
    let num = 0;
    const positionConfig = this.app.Config.CardPosition;
    for (const config of positionConfig.values()) {
        if (config.Id > num && (config.PrestigeLv <= prestigeLv || (config.Vip > 0 && config.Vip <= vip))) {
            num = config.Id;
        }
    }
    return num;
};
/**
 * 获取当前强化最大等级
 */
CardComponent.prototype.getCardLevelMaxlv = function () {
    const prestigeLv = this.player.lv;
    let lv = 0;
    const levelConfig = this.app.Config.CardLevel;
    for (const config of levelConfig.values()) {
        if (config.Level >= lv && config.PrestigeLv == prestigeLv) {
            lv = config.Level;
        }
    }
    return lv;
};
/**
 * 转换属性返回格式
 */
CardComponent.prototype.returnAttribute = function (attrs) {
    const attribute = {};
    if (attrs) {
        for (const [type, val] of Object.entries(attrs)) {
            attribute[code.attribute.ATTR_VALUE[type]] = val;
        }
    }
    return attribute;
};
