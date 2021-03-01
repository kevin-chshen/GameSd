/**
 * @description 属性对象
 * @author chenyq
 * @data 2020/03/17
 */

const code = require('@code');
const util = require('@util');

/**
 * 模块属性对象
 * 私有属性
 * @var name                //模块名称
 * @var parent              //父节点
 * @var childList           //子节点
 * @var percent             //百分比加成模块
 * @var attrList            //模块属性
 * @var baseAttribute       //自身模块基础属性
 * @var basePercent         //自身模块基础百分比
 * @var totalPercent        //自身百分比加成 包含所有百分比来源
 * @var totalAttribute      //包含子节点总属性
 * 公开方法
 * @function updateAttr (attrList, attrMap)
 * @function addAttr (attrList, attrMap)
 * @function deductAttr (attrList, attrMap)
 */

/**
 * 
 * @param {string} name 模块名称
 * @param {*} nodeInfo 节点配置信息
 * @param {Object} attrList 模块属性
 * @param {Object} attrMap 玩家属性对象
 */
const AttributeNodeObject = function (name, nodeInfo, attrList, attrMap) {
    this.$id = 'game_AttributeNode';
    this.$scope = "prototype";
    this.name = name;
    this.parent = nodeInfo.parent;
    this.childList = nodeInfo.child;
    this.percentParent = nodeInfo.percentParent;
    this.percentChild = nodeInfo.percentChild;
    this.attrList = attrList;
    this.baseAttribute = {};
    this.basePercent = {};
    this.totalPercent = {};
    this.totalAttribute = {};
    this.calcAttrSelf(attrMap);
    this.calcAttrChild(attrMap);

};

module.exports = AttributeNodeObject;

/**
 * 更新模块属性 属性重置
 * @param {Object} attrList 
 * @param {Object} attrMap 玩家属性对象
 */
AttributeNodeObject.prototype.updateAttr = function (attrList, attrMap) {
    this.attrList = {};
    for (const id of Object.keys(attrList)) {
        this.attrList[id] = attrList[id];
    }
    this.calcAttrSelf(attrMap);
    this.calcAttrChild(attrMap);
};
/**
 * 增加属性
 * @param {*} attrList 
 * @param {*} attrMap 
 */
AttributeNodeObject.prototype.addAttr = function (attrList, attrMap) {
    this.attrList = util.object.mergeObject(this.attrList, attrList);
    this.calcAttrSelf(attrMap);
    this.calcAttrChild(attrMap);
};
/**
 * 扣除属性 
 * @param {*} attrList 
 * @param {*} attrMap 
 */
AttributeNodeObject.prototype.deductAttr = function (attrList, attrMap) {
    this.attrList = util.object.deductObject(this.attrList, attrList);
    this.calcAttrSelf(attrMap);
    this.calcAttrChild(attrMap);
};
/**
 * 计算自身属性
 * @param {Object} attrMap 玩家属性对象
 */
AttributeNodeObject.prototype.calcAttrSelf = function (attrMap) {
    // TODO Map { '1' => 1, '2' => 2, '3' => 3, '4' => 4, '50' => 50, '101' => 101, '102' => 102, '103' => 103, '103' => 104 }
    // 拆分固定属性和百分比属性
    this.baseAttribute = {};
    this.basePercent = {};
    for (const type of Object.keys(this.attrList)) {
        const val = this.attrList[type];
        if (parseInt(type) >= parseInt(code.attribute.ATTR_TYPE.HP_MIN_PRO)) {
            this.basePercent[type] = val;
        } else {
            this.baseAttribute[type] = val;
        }
    }
    this.calcAttrPercent(attrMap);
    attrMap[this.name] = this;
};
/**
 * 计算百分比属性来源
 */
AttributeNodeObject.prototype.calcAttrPercent = function(attrMap){
    this.totalPercent = {};
    for (const p of this.percentChild) {
        if (p == this.name) {
            this.totalPercent = util.object.mergeObject(this.totalPercent, this.basePercent);
        }
        else {
            const childObj = attrMap[p];
            if (childObj != undefined && childObj.totalPercent != undefined) {
                this.totalPercent = util.object.mergeObject(this.totalPercent, childObj.basePercent);
            }
        }
    }
};
/**
 * 重新计算总属性=自身属性+所有子节点属性综合
 * @param {Object} attrMap 玩家属性对象
 */
AttributeNodeObject.prototype.calcAttrChild = function (attrMap) {
    let newAttr = {};
    // 自身属性
    newAttr = util.object.mergeObject(newAttr, this.baseAttribute);
    // 计算子节点属性
    for (const child of this.childList) {
        const childObj = attrMap[child];
        if (childObj != undefined && childObj.totalAttribute != undefined) {
            newAttr = util.object.mergeObject(newAttr, childObj.totalAttribute);
        }
    }
    
    // 计算百分比属性
    newAttr = this.calcPercent(newAttr, this.totalPercent || {});

    this.totalAttribute = newAttr;
    attrMap[this.name] = this;
    // 广播当前节点模块属性变更

    // 通知父节点属性变更
    const parentObj = attrMap[this.parent];
    if (parentObj != undefined && this.parent != this.name) {
        parentObj.calcAttrChild(attrMap);
    }
    // 通知百分比影响节点属性刷新
    const percentParentObj = attrMap[this.percentParent];
    if (percentParentObj != undefined && this.percentParent != this.name) {
        percentParentObj.calcAttrSelf(attrMap);
        percentParentObj.calcAttrChild(attrMap);
    }
};
/**
 * 计算万分比加成
 * @param {*} attr 
 * @param {*} percent 
 */
AttributeNodeObject.prototype.calcPercent = function (attr, percent) {
    const newAttr = {};
    for (const type of Object.keys(attr)) {
        const val = attr[type];
        let add = 0;
        switch (type) {
        case code.attribute.ATTR_TYPE.HP_MIN:
            add = percent[code.attribute.ATTR_TYPE.HP_MIN_PRO] || 0;
            break;
        case code.attribute.ATTR_TYPE.HP_MAX:
            add = percent[code.attribute.ATTR_TYPE.HP_MAX_PRO] || 0;
            break;
        case code.attribute.ATTR_TYPE.ATTACK_MIN:
            add = percent[code.attribute.ATTR_TYPE.ATTACK_MIN_PRO] || 0;
            break;
        case code.attribute.ATTR_TYPE.ATTACK_MAX:
            add = percent[code.attribute.ATTR_TYPE.ATTACK_MAX_PRO] || 0;
            break;
        default:
            break;
        }
        newAttr[type] = Math.floor(val * (1 + add / 10000));
    }
    return newAttr;
};
