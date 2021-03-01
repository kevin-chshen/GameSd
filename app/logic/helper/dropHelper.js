/**
 * @description 掉落相关的帮助函数
 * @author linjs
 * @date 2020/04/27
 */

const bearcat = require('bearcat');
const code = require('@code');
const util = require('@util');
const assert = require('assert');

const DropHelper = function() {
    this.$id = 'logic_DropHelper';
    this.name = 'Drop';
    this.app = null;
};

module.exports = DropHelper;
bearcat.extend('logic_DropHelper', 'logic_BaseHelper');

/**
 * 实际的掉落函数
 * @param {Integer} times 已经掉落的次数
 * @param {Integer} sex 性别
 * @param {Object} sign 需要用到的下标
 * @param {Integer} payLv 支付等级
 * @returns {Object} {bModify, item=[], newSign=[]}
 */
DropHelper.prototype.drop = function ({id, times, sex, sign, payLv, trace}) {
    const dropOneConfig = this.app.Config.DropOne.get(id);
    let allItem = [];
    let bModifySign = false;
    const newSign = {...sign};
    const traceInfoVec = [];
    for (let index = times; index < times + dropOneConfig.ExtractNum; index++) {
        const traceInfo = [];
        const {item, bModify} = this.dropOneTime(dropOneConfig, index, sex, newSign, payLv, trace, traceInfo);
        if (trace) {
            traceInfoVec.push({innerTimes: index, traceInfo: traceInfo});
        }
        allItem = allItem.concat(item);
        bModifySign = bModifySign || bModify;
    }
    return {
        times: times + dropOneConfig.ExtractNum,
        bModify: bModifySign,
        item: allItem,
        newSign: newSign,
        traceInfo: traceInfoVec,
    };
};

/**
 * 掉落一次
 */
DropHelper.prototype.dropOneTime = function (dropOneConfig, times, sex, sign, payLv, trace, traceInfoVec) {
    // 判断是否进入特定流程
    const specId = dropOneConfig.GivenDropId[times];
    if (specId > 0) {
        return { item: this.dropSpec(specId, sex, sign, payLv, trace, traceInfoVec), bModify: false };
    } else {
        const result = this.dropCommon(dropOneConfig.IdTwo, sex, sign, payLv, trace, traceInfoVec);
        return result;
    }
};

/**
 * 特殊掉落
 */
DropHelper.prototype.dropSpec = function (specId, sex, sign, payLv, trace, traceInfoVec) {
    // 特殊掉落不用判断是否使用公式,直接跳到道具抽取步骤
    const traceInfo = {};
    if (trace) {
        traceInfo.specId = specId;
        traceInfoVec.push(traceInfo);
    }
    return this.extractItem(this.app.Config.DropTwo.get(specId), sex, trace, traceInfo);
};

/**
 * 普通掉落
 */
DropHelper.prototype.dropCommon = function (idTwos, sex, sign, payLv, trace, traceInfoVec) {
    const DropTwo = this.app.Config.DropTwo;
    let bModifySign = false;
    for (const idTwo of idTwos) {
        const traceInfo = {};
        if (trace) {
            traceInfoVec.push(traceInfo);
        }
        const dropTwoConfig = DropTwo.get(idTwo);
        if (dropTwoConfig.FormulaId > 0) {
            // 根据公式掉落
            const {item, bModify} = this.extractItemByFormula(dropTwoConfig, sex, sign, payLv, trace, traceInfo);
            bModifySign = bModifySign || bModify;
            if (item.length > 0) {
                return {item: item, bModify: bModifySign};
            }
        } else {
            // 没有公式直接抽取物品
            const item = this.extractItem(dropTwoConfig, sex, trace, traceInfo);
            // 抽到了直接完成
            if (item.length > 0) {
                return {item: item, bModify: bModifySign};
            } 
        }
    }
};

/**
 * 道具抽取
 */
DropHelper.prototype.extractItem = function (dropTwoConfig, sex, trace, traceInfo) {
    const itemVec = (sex == code.player.SexType.MALE) ? dropTwoConfig.BoyItemsId : dropTwoConfig.GirlItemsId;
    const index = util.random.randomFixWeight(dropTwoConfig.Probability, code.drop.EXTRACT_WEIGHT);
    let item = [];
    if (index >= 0) {
        item = this.extractNum(itemVec[index]);
    }
    if (trace) {
        traceInfo.extractIndex = index;
        traceInfo.item = item;
        traceInfo.dropTwoId = dropTwoConfig.Id;
    }
    return item;
};

/**
 * 数量抽取
 */
DropHelper.prototype.extractNum = function (itemObj) {
    const item = [];
    for (const [itemId, [min, max]] of Object.entries(itemObj)) {
        const num = util.random.random(min, max);
        if (num > 0) {
            item.push({ itemID: itemId, itemNum: num});
        }
    }
    return item;
};

/**
 * 通过公式抽取
 * @param {Object} dropTwoConfig 掉落配置
 * @param {Integer} sex 玩家性别
 * @param {Object} sign 下标数值(可能会被修改)
 * @param {Integer} payLv 付费等级
 * @returns {Object} {item, bModify}
 */
DropHelper.prototype.extractItemByFormula = function (dropTwoConfig, sex, sign, payLv, trace, traceInfo) {
    const rate = dropTwoConfig.FormulaValue;
    const signId = dropTwoConfig.SignId;
    let prob = 0;
    let bModify = false;
    let item = [];
    switch (dropTwoConfig.FormulaId) {
    case 1: prob = this.calcProbByFormulaOne(rate, signId, sex, sign, payLv); break;
    case 2: prob = this.calcProbByFormulaTwo(rate, signId, sex, sign, payLv); break;
    case 3: prob = this.calcProbByFormulaThree(rate, signId, sex, sign, payLv); break;
    }
    if (trace) {
        traceInfo.formulaId = dropTwoConfig.FormulaId;
        traceInfo.prob = prob;
        traceInfo.beforeSign = this.toTraceSign({...sign});
    }
    // 从10000里面随机
    let formulaResult = false;
    if (util.random.probability(prob, code.drop.FORMULA_PROB)) {
        // 随机成功:下标重置,下标累加,道具抽取
        bModify = this.modifySignValue(sign, signId, true);
        item = this.extractItem(dropTwoConfig, sex, trace, traceInfo);
        formulaResult = true;
    } else {
        // 随机失败:下标累加
        bModify = this.modifySignValue(sign, signId, false);
    }
    if (trace) {
        traceInfo.afterSign = this.toTraceSign({...sign});
        traceInfo.formulaResult = formulaResult;
    }
    return {item: item, bModify: bModify};
};

/**
 * 公式1:掉落概率值=系数【1】*（下标【1】-系数【2】）*（1-付费等级/系数【3】）
 * @param {Array} rate 系数
 * @param {Array} signId 下标数组
 * @param {Integer} sex 玩家性别
 * @param {Object} sign 下标数值
 * @param {Integer} payLv 付费等级
 */
DropHelper.prototype.calcProbByFormulaOne = function (rate, signId, sex, sign, payLv) {
    const signValue1 = this.getSignValue(sign, signId, 0);
    if (signValue1 < rate[1]) {
        return 0;
    }
    return rate[0] * (signValue1 - rate[1]) * (1 - payLv / rate[2]);
};

/**
 * 公式2:掉落概率值=系数【1】*（下标【1】-系数【2】）*（下标【2】-系数【3】）*（1-付费等级/系数【4】）
 * @param {Array} rate 系数
 * @param {Array} signId 下标数组
 * @param {Integer} sex 玩家性别
 * @param {Object} sign 下标数值
 * @param {Integer} payLv 付费等级
 */
DropHelper.prototype.calcProbByFormulaTwo = function (rate, signId, sex, sign, payLv) {
    const signValue1 = this.getSignValue(sign, signId, 0);
    if (signValue1 < rate[1]) {
        return 0;
    }
    const signValue2 = this.getSignValue(sign, signId, 1);
    if (signValue2 < rate[2]) {
        return 0;
    }
    return rate[0] * (signValue1 - rate[1]) * (signValue2 - rate[2]) * (1 - payLv / rate[3]);
};

/**
 * 公式3:掉落概率值=系数【1】*INT(1+下标【1】/系数【2】）*（1+付费等级/系数【4】）/INT（1+下标【2】/系数【3】）
 * @param {Array} rate 系数
 * @param {Array} signId 下标数组
 * @param {Integer} sex 玩家性别
 * @param {Object} sign 下标数值
 * @param {Integer} payLv 付费等级
 */
DropHelper.prototype.calcProbByFormulaThree = function (rate, signId, sex, sign, payLv) {
    const signValue1 = this.getSignValue(sign, signId, 0);
    const signValue2 = this.getSignValue(sign, signId, 1);
    return rate[0] * Math.floor(1 + signValue1 / rate[1]) * (1 + payLv / rate[3]) / Math.floor(1 + signValue2 / rate[2]);
};

/**
 * 获取下标数值
 * @param {Object} sign 下标对应的数值
 * @param {Array} signId 下标id数组
 * @param {Integer} index 索引
 */
DropHelper.prototype.getSignValue = function (sign, signId, index) {
    const id = signId[index];
    const signValue = sign[id].current;
    assert(id && id > 0 && signValue >= 0, `get sign value err signId[${id}] signValue[${signValue}]`);
    return signValue;
};

/**
 * 设置下标对应的数值
 * @param {Object} sign 下标对应的数值
 * @param {Integer} id 下标id
 * @param {Integer} value 要设置的值
 */
DropHelper.prototype.setSignValue = function (sign, id, value) {
    const signValue = sign[id];
    assert(id && id > 0 && signValue.current >= 0, `set sign value err signId[${id}] signValue[${signValue.current}]`);
    signValue.current = value;
};

/**
 * 增加下标对应的数值
 * @param {Object} sign 下标对应的数值
 * @param {Integer} id 下标id
 * @param {Integer} value 要增加的值
 */
DropHelper.prototype.addSignValue = function (sign, id, value) {
    const signValue = sign[id];
    assert(id && id > 0 && signValue.current >= 0, `add sign value err signId[${id}] signValue[${signValue.current}]`);
    signValue.current += value;
};

/**
 * 根据下标属性,重置或者累加下标
 * @param {Object} sign 下标对应的数值 {id: id, current: current}
 * @param {Array} signId 下标数组
 * @param {Boolean} success 是否成功
 */
DropHelper.prototype.modifySignValue = function (sign, signId, success) {
    const dropSign = this.app.Config.DropSign;
    let bModify = false;
    for (const id of signId) {
        const signConfig = dropSign.get(id);
        // 如果是成功重置
        if (signConfig.ResetType == code.drop.RESET_TYPE.SUCCESS && success) {
            this.setSignValue(sign, id, 0);
            bModify = true;
            continue;
        }
        // 如果是成功+1
        if (signConfig.AddType == code.drop.ADD_TYPE.SUCCESS && success) {
            this.addSignValue(sign, id, 1);
            bModify = true;
            continue;
        }
        // 如果是失败+1
        if (signConfig.AddType == code.drop.ADD_TYPE.FAIL && !success) {
            this.addSignValue(sign, id, 1);
            bModify = true;
            continue;
        }
    }
    return bModify;
};

/**
 * 将下标转换成trace需要的格式
 */
DropHelper.prototype.toTraceSign = function (sign) {
    const obj = {};
    Object.values(sign).map( ({id, current}) => { obj[id] = current; });
    return obj;
};
