/**
 * @description 卡牌对象
 * @author chenyq
 * @data 2020/03/17
 */

// let pomelo = require('pomelo');
const code = require('@code');
const util = require('@util');

const CardObject = function (app, player, cardId, dataInfo) {
    this.$id = 'game_Card';
    this.$scope = "prototype";
    this.app = app;
    this.player = player;
    this.cardId = cardId;
    this.dbData = dataInfo;
    this.formation = 0;
    this.attr = {};
    this.player.attributeMgr.loadCardAttr(this.cardId);
    this.calcAttr(true);
    this.car = 0;
};
module.exports = CardObject;
/**
 * 计算属性
 */
CardObject.prototype.calcAttr = function (isInit = false) {
    this.attr = {};

    // 卡牌强化属性
    this.getLevelAttr();

    // console.log("card attr:", this.cardId, this.attr);
    this.player.attributeMgr.updateAttr(this.cardId, code.attribute.ATTR_MODULE.CARD, this.attr, isInit);
    // 包装属性
    this.getStageAttr();
    // console.log("card stage attr:", this.stageAttr);
    this.player.attributeMgr.updateAttr(this.cardId, code.attribute.ATTR_MODULE.STAGE, this.stageAttr, isInit);
    // 升星属性
    this.getStarAttr();
    // console.log("card star attr:", this.starAttr);
    this.player.attributeMgr.updateAttr(this.cardId, code.attribute.ATTR_MODULE.STAR, this.starAttr, isInit);
    // 羁绊属性 所有卡牌初始化后 一起计算
};
/**
 * 获取卡牌等级属性
 */
CardObject.prototype.getLevelAttr = function () {
    const attr = {};
    const config = this.getCardConfig();
    if (config && config.Attribute) {
        for (const type of Object.keys(config.Attribute)) {
            const lv = this.dbData.level;
            const val = config.Attribute[type];
            if (type == code.attribute.ATTR_TYPE.POPULARITY) {
                //卡牌升级人气属性=卡牌初始人气*（1+0.2*（卡牌等级-1））
                attr[type] = Math.floor(val * (1 + 0.2 * (lv - 1)));
            }
            else {
                //卡牌升级属性=卡牌初始属性*（1+0.02*（卡牌等级-1））
                attr[type] = Math.floor(val * (1 + 0.04 * (lv - 1)));
            }
        }
    }
    this.attr = attr;
    return attr;
};
/**
 * 获取卡牌包装属性
 */
CardObject.prototype.getStageAttr = function () {
    let stageAttr = {};
    const stageConfig = this.getCardStageConfig();
    if (stageConfig && stageConfig.Attribute && stageConfig.TotalAttribute) {
        stageAttr = {};
        stageAttr = util.object.mergeObject(stageAttr, stageConfig.Attribute);
        stageAttr = util.object.mergeObject(stageAttr, stageConfig.TotalAttribute);
    }
    this.stageAttr = stageAttr;
    return stageAttr;
};
/**
 * 获取卡牌星级属性
 */
CardObject.prototype.getStarAttr = function () {
    let starAttr = {};
    const starConfig = this.getCardStarConfig();
    if (starConfig && starConfig.Attribute && starConfig.Percentage) {
        starAttr = {};
        starAttr = util.object.mergeObject(starAttr, starConfig.Attribute);
        starAttr = util.object.mergeObject(starAttr, starConfig.Percentage);
    }
    this.starAttr = starAttr;
    return starAttr;
};

CardObject.prototype.getLevel = function () {
    return this.dbData.level < 1 ? 1 : this.dbData.level;
};

CardObject.prototype.setLevel = function (lv) {
    let oldAttr = {};
    oldAttr = util.object.mergeObject(oldAttr, this.attr);
    const oldLv = this.dbData.level;
    this.dbData.level = lv;
    // this.calcAttr();
    if (lv > oldLv) {
        //计算增加的属性
        const newAttr = this.getLevelAttr();
        const changeAttr = util.object.deductObject(newAttr, oldAttr);
        this.player.attributeMgr.addAttr(this.cardId, code.attribute.ATTR_MODULE.CARD, changeAttr);
    }
    else {
        //计算减少的属性
        const newAttr = this.getLevelAttr();
        const changeAttr = util.object.deductObject(oldAttr, newAttr);
        this.player.attributeMgr.deductAttr(this.cardId, code.attribute.ATTR_MODULE.CARD, changeAttr);
    }
};

CardObject.prototype.getStage = function () {
    return this.dbData.stage;
};

CardObject.prototype.setStage = function (stage, point, failCount) {
    let oldAttr = {};
    oldAttr = util.object.mergeObject(oldAttr, this.stageAttr);
    const oldStage = this.dbData.stage;
    const oldPoint = this.dbData.point;
    this.dbData.stage = stage;
    this.dbData.point = point;
    this.dbData.failCount = failCount;
    // this.calcAttr();
    const newAttr = this.getStageAttr();
    if (stage >= oldStage || point >= oldPoint) {
        //计算增加的属性
        const changeAttr = util.object.deductObject(newAttr, oldAttr);
        this.player.attributeMgr.addAttr(this.cardId, code.attribute.ATTR_MODULE.STAGE, changeAttr);
    }
    else {
        //计算减少的属性
        const changeAttr = util.object.deductObject(oldAttr, newAttr);
        this.player.attributeMgr.deductAttr(this.cardId, code.attribute.ATTR_MODULE.STAGE, changeAttr);
    }
};

CardObject.prototype.getPoint = function () {
    return this.dbData.point;
};

CardObject.prototype.getFailCount = function () {
    return this.dbData.failCount;
};

CardObject.prototype.getStar = function () {
    return this.dbData.star;
};

CardObject.prototype.setStar = function (star) {
    let oldAttr = {};
    oldAttr = util.object.mergeObject(oldAttr, this.starAttr);
    const oldStar = this.dbData.star;
    this.dbData.star = star;
    // this.calcAttr();
    const newAttr = this.getStarAttr();
    if (star >= oldStar) {
        //计算增加的属性
        const changeAttr = util.object.deductObject(newAttr, oldAttr);
        this.player.attributeMgr.addAttr(this.cardId, code.attribute.ATTR_MODULE.STAR, changeAttr);
    }
    else {
        //计算减少的属性
        const changeAttr = util.object.deductObject(oldAttr, newAttr);
        this.player.attributeMgr.deductAttr(this.cardId, code.attribute.ATTR_MODULE.STAR, changeAttr);
    }
};

CardObject.prototype.getFormation = function () {
    return this.formation;
};
/**
 * 更新上阵信息
 */
CardObject.prototype.setFormation = function (formation) {
    // this.dbData.formation = Object.values(formation).includes(parseInt(this.cardId)) ? 1 : 0;
    this.formation = formation.has(parseInt(this.cardId)) ? 1 : 0;
};
/**
 * 重置
 */
CardObject.prototype.reset = function (initData) {
    this.dbData = initData;
    this.calcAttr();
};
/**
 * 获取卡牌基础数据
 */
CardObject.prototype.getData = function () {
    return this.dbData;
};

/**
 * 获取卡牌属性
 */
CardObject.prototype.getAttr = function () {
    return this.player.attributeMgr.getAttr(this.cardId);
};
/**
 * 获取战力
 */
CardObject.prototype.getPower = function () {
    return this.player.attributeMgr.getPower(this.cardId);
};
/**
 * 获取卡牌人气值
 */
CardObject.prototype.getPopularity = function(){
    const attrs = this.getAttr();
    return attrs[code.attribute.ATTR_TYPE.POPULARITY] || 0;
};

CardObject.prototype.getEquipCar = function(){
    return this.car;
};

CardObject.prototype.setEquipCar = function(car){
    this.car = car;
    // 装备或卸下豪车 判断是否在阵上 属性计算

};

/**
 * 获取卡牌配置
 */
CardObject.prototype.getCardConfig = function () {
    return this.app.Config.Card.get(this.cardId);
};
/**
 * 获取卡牌等级配置
 */
CardObject.prototype.getCardLevelConfig = function (level) {
    return this.app.Config.CardLevel.get(level);
};
/**
 * 获取卡牌阶级配置
 */
CardObject.prototype.getCardStageConfig = function (cardId = this.cardId, stage = this.dbData.stage, point = this.dbData.point) {
    // ID=CardId*10000+Stage*100+Point
    const stageId = cardId * 10000 + stage * 100 + point;
    return this.app.Config.CardStage.get(stageId);
};
/**
* 获取卡牌星级配置
*/
CardObject.prototype.getCardStarConfig = function (cardId = this.cardId, star = this.dbData.star) {
    // ID=CardId*100+Star
    const starId = cardId * 100 + star;
    return this.app.Config.CardStar.get(starId);
};
