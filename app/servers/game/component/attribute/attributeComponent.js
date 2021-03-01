/**
 * @description 属性管理模块
 * @author chenyq
 * @data 2020/03/17
 */

const bearcat = require('bearcat');
const code = require('@code');

const AttributeComponent = function (app, player) {
    this.$id = 'game_AttributeComponent';
    this.$scope = 'prototype';
    this.app = app;
    this.player = player;
    this.caches = {};
    this.attrDict = {};
};

module.exports = AttributeComponent;
bearcat.extend('game_AttributeComponent', 'game_Component');

/**
 * 加载卡牌属性
 */
AttributeComponent.prototype.loadCardAttr = function (cardId) {
    if (!this.attrDict) {
        this.attrDict = {};
    }
    const cardAttrObj = bearcat.getBean('game_Attribute', cardId, this.player);
    this.attrDict[cardId] = cardAttrObj;
};
/**
 * 获取模块属性
 */
AttributeComponent.prototype.getAttr = function (cardId, module) {
    if (!this.attrDict || !this.attrDict[cardId]) {
        return {};
    }
    const cardObj = this.attrDict[cardId];
    return cardObj.getCardAttr(module);
};
/**
 * 获取卡牌战力
 */
AttributeComponent.prototype.getPower = function (cardId) {
    if (!this.attrDict || !this.attrDict[cardId]) {
        return 0;
    }
    const cardObj = this.attrDict[cardId];
    return cardObj.getCardPower();
};
/**
 * 更新模块属性
 */
AttributeComponent.prototype.updateAttr = function (cardId, module, attr, isInit = false) {
    if (!this.attrDict || !this.attrDict[cardId]) {
        return;
    }
    const cardObj = this.attrDict[cardId];
    cardObj.updateAttr(module, attr, isInit);
};
/**
 * 添加模块属性
 */
AttributeComponent.prototype.addAttr = function (cardId, module, attr) {
    if (!this.attrDict || !this.attrDict[cardId]) {
        return;
    }
    const cardObj = this.attrDict[cardId];
    cardObj.addAttr(module, attr);
};
/**
 * 扣除模块属性
 */
AttributeComponent.prototype.deductAttr = function (cardId, module, attr) {
    if (!this.attrDict || !this.attrDict[cardId]) {
        return;
    }
    const cardObj = this.attrDict[cardId];
    cardObj.deductAttr(module, attr);
};
/**
 * 更新全局模块属性
 */
AttributeComponent.prototype.updateAllAttr = function (attr, module = code.attribute.ATTR_MODULE.ALL) {
    if (!this.attrDict) {
        return;
    }
    for (const cardId of Object.keys(this.attrDict)) {
        this.updateAttr(cardId, module, attr);
    }
};
/**
 * 添加全局模块属性
 */
AttributeComponent.prototype.addAllAttr = function (attr, module = code.attribute.ATTR_MODULE.ALL) {
    if (!this.attrDict) {
        return;
    }
    for (const cardId of Object.keys(this.attrDict)) {
        this.addAttr(cardId, module, attr);
    }
};
/**
 * 扣除全局模块属性
 */
AttributeComponent.prototype.deductAllAttr = function (attr, module = code.attribute.ATTR_MODULE.ALL) {
    if (!this.attrDict) {
        return;
    }
    for (const cardId of Object.keys(this.attrDict)) {
        this.deductAttr(cardId, module, attr);
    }
};