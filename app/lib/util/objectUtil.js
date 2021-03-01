/**
 * @description Object处理
 * @author chenyq
 * @data 2020/03/31
 */

/**
 * 对象是否为空
 */
module.exports.isNull = function (obj) {
    const kList = Object.keys(obj);
    return kList.length <= 0 ? true : false;
};

/**i
 * 合并Object RObj加入LObj 存在元素增加值 不存在添加(object单层操作)
 * @param {Object} LObj 
 * @param {Object} RObj 
 */
module.exports.mergeObject = function (LObj, RObj) {
    const obj = { ...LObj };
    if (RObj == {}) {
        return obj;
    }
    for (const k of Object.keys(RObj)) {
        const oldVal = obj[k];
        if (oldVal == undefined) {
            obj[k] = RObj[k];
        }
        else {
            obj[k] = oldVal + RObj[k];
        }
    }
    return obj;
};
/**
 * 扣除Object LObj - RObj (object单层操作)
 * @param {Object} LObj 
 * @param {Object} RObj 
 */
module.exports.deductObject = function (LObj, RObj) {
    const obj = { ...LObj };
    if (RObj == {}) {
        return obj;
    }
    for (const k of Object.keys(RObj)) {
        const oldVal = obj[k];
        if (oldVal != undefined) {
            const newVal = oldVal - RObj[k];
            if (newVal <= 0) {
                obj[k] = null;
            }
            else {
                obj[k] = newVal;
            }
        }
    }
    return obj;
};
/**
 * 物品数量翻倍
 */
module.exports.itemDouble = function (itemObj, num) {
    const obj = { ...itemObj };
    for (const k of Object.keys(obj)) {
        obj[k] = obj[k] * num;
    }
    return obj;
};

/**
 * 深度拷贝object
*/
module.exports.deepClone = function (origin) {
    if (Array.isArray(origin)) {
        const list = [];
        for (const i of origin) {
            list.push(this.deepClone(i));
        }
        return list;
    }
    if (typeof (origin) != 'object') {
        return origin;
    }
    const obj = {};
    for (const [k, v] of Object.entries(origin)) {
        if (typeof (v) == 'object') {
            obj[k] = this.deepClone(v);
        }
        else {
            obj[k] = v;
        }
    }
    return obj;
};