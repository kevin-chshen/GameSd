/**
 * @description Map处理
 * @author chenyq
 * @data 2020/03/17
 */

/**
 * Map to Object
 * @param {*} map 
*/
module.exports.mapToObj = function (map) {
    const obj = Object.create(null);
    for (const [k, v] of map) {
        obj[k] = v;
    }
    return obj;
};
/**
 * Object to Map
 * @param {*} obj 
 */
module.exports.objToMap = function (obj) {
    const map = new Map();
    for (const k of Object.keys(obj)) {
        map.set(k, obj[k]);
    }
    return map;
};
/**
 * Map to Json
 * @param {*} map 
 */
module.exports.mapToJson = function (map) {
    return JSON.stringify(this.mapToObj(map));
};
/**
 * Json to Map
 * @param {*} jsonObj 
 */
module.exports.jsonToMap = function (jsonObj) {
    return this.objToMap(jsonObj);
};

/**
 * 属性合并 RMap加入LMap 存在元素增加值 不存在添加
 * @param {Map} LMap 
 * @param {Map} RMap 
 */
module.exports.mergeMap = function (LMap, RMap) {
    for (const [k, v] of RMap) {
        const oldVal = LMap.get(k);
        if (oldVal == undefined) {
            LMap.set(k, v);
        }
        else {
            LMap.set(k, oldVal + v);
        }
    }
    return LMap;
};
/**
 * 扣除属性 LMap - RMap
 * @param {Map} LMap 
 * @param {Map} RMap 
 */
module.exports.deductMap = function (LMap, RMap) {
    for (const [k, v] of RMap) {
        const oldVal = LMap.get(k);
        if (oldVal != undefined) {
            const newVal = oldVal - v;
            if (newVal <= 0) {
                LMap.delete(k);
            }
            else {
                LMap.set(k, newVal);
            }
        }
    }
    return LMap;
};