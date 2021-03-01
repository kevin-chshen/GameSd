/**
 * @description 卡牌属性对象
 * @author chenyq
 * @data 2020/03/17
 */

const pomelo = require('pomelo');
const bearcat = require('bearcat');
const code = require('@code');

/**
 * 玩家属性对象
 * @integer cardId
 * @integer power   //总战力(身价)
 * @object attrMap //玩家所有模块属性Map
 * 
 * @function updateAttr (attrModule, attrList)
 * @function addAttr (attrModule, attrList)
 * @function deductAttr (attrModule, attrList)
 * @function getCardAttr ()
 * @function getCardPower ()
 */
const AttributeObject = function (cardId, player) {
    this.$id = "game_Attribute";
    this.$scope = "prototype";
    this.player = player;
    this.init(cardId);
};
module.exports = AttributeObject;

AttributeObject.prototype.init = function (cardId) {
    this.cardId = cardId;
    //根据配置加载所有模块属性
    pomelo.app.loadConfig("attrTreeConfig", pomelo.app.getBase() + "/config/attributeTree.json");
    const attrTreeConfig = pomelo.app.get("attrTreeConfig");
    this.attrMap = {};
    //加载模块属性对象
    for (const name of Object.keys(attrTreeConfig)) {
        const attrObj = bearcat.getBean('game_AttributeNode', name, attrTreeConfig[name], {}, this.attrMap);
        this.attrMap[name] = attrObj;
    }
    // for (const [k, v] of this.attrMap) {
    //     console.log("map:", k, v.totalAttribute);
    // }
    this.setCardAttr(0, 0, true);
};

//模块属性变更
AttributeObject.prototype.updateAttr = function (attrModule, attrList, isInit) {
    const mapObj = this.attrMap[attrModule];
    if (mapObj) {
        mapObj.updateAttr(attrList, this.attrMap);
        this.setCardAttr(0, 0, isInit);
    }
    // for (const k of Object.keys(this.attrMap)) {
    //     console.log("map:", k, this.attrMap[k].totalAttribute, this.attrMap[k].baseAttribute, this.attrMap[k].basePercent, this.attrMap[k].totalPercent);
    // }
};
//属性增加
AttributeObject.prototype.addAttr = function (attrModule, attrList) {
    const mapObj = this.attrMap[attrModule];
    if (mapObj) {
        const oldPower = this.power;
        const oldPopularity = this.popularity;
        mapObj.addAttr(attrList, this.attrMap);
        // console.log("addAttr:", attrModule, attrList);
        this.setCardAttr(oldPower, oldPopularity);
    }
    // for (const k of Object.keys(this.attrMap)) {
    //     console.log("map:", k, this.attrMap[k].totalAttribute, this.attrMap[k].baseAttribute, this.attrMap[k].basePercent, this.attrMap[k].totalPercent);
    // }
};
//属性扣除
AttributeObject.prototype.deductAttr = function (attrModule, attrList) {
    const mapObj = this.attrMap[attrModule];
    if (mapObj) {
        const oldPower = this.power;
        const oldPopularity = this.popularity;
        mapObj.deductAttr(attrList, this.attrMap);
        // console.log("deductAttr:", attrModule, attrList);
        this.setCardAttr(oldPower, oldPopularity);
    }
    // for (const k of Object.keys(this.attrMap)) {
    //     console.log("map:", k, (this.attrMap[k]));
    // }
};
/**
 * 属性变更 总属性缓存和总战力缓存
 */
AttributeObject.prototype.setCardAttr = function (oldPower = 0, oldPopularity = 0, isInit) {
    const attrObj = this.attrMap[code.attribute.ATTR_MODULE.ROOT];
    if (attrObj != undefined) {
        const attrs = attrObj.totalAttribute;
        // 卡牌身价=（热度min+热度max）*（魅力min+魅力max）/5000
        const hpMin = attrs[code.attribute.ATTR_TYPE.HP_MIN] || 0;
        const hpMax = attrs[code.attribute.ATTR_TYPE.HP_MAX] || 0;
        const attackMin = attrs[code.attribute.ATTR_TYPE.ATTACK_MIN] || 0;
        const attackMax = attrs[code.attribute.ATTR_TYPE.ATTACK_MAX] || 0;
        this.power = Math.floor((hpMin + hpMax) * (attackMin + attackMax) / 5000);
        // 战力变化
        if(!isInit && oldPower != this.popularity){
            // const changePower = this.power - oldPower;
            // console.log("Power change:", oldPower, this.power, changePower, attrObj.totalAttribute);
        }
        // 人气变化
        this.popularity = attrs[code.attribute.ATTR_TYPE.POPULARITY] || 0;
        if(!isInit && oldPopularity != this.popularity){
            this.player.Event.emit(code.event.POPULARITY_CHANGE.name, this.cardId);
            // console.log("popularity change:", this.cardId, oldPopularity, this.popularity, this.popularity - oldPopularity);
        }
    }
};
/**
 * 获取总属性
 */
AttributeObject.prototype.getCardAttr = function (module = code.attribute.ATTR_MODULE.ROOT) {
    const attrObj = this.attrMap[module];
    if (attrObj != undefined) {
        // console.log("totalAttribute", attrObj.totalAttribute);
        return attrObj.totalAttribute;
    }
    else {
        return {};
    }
};
/**
 * 获取卡牌身价
 */
AttributeObject.prototype.getCardPower = function () {
    return this.power || 0;
};
