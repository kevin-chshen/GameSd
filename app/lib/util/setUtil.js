/**
 * 并集
 */
module.exports.setUnion = function(lSet, rSet){
    return new Set([...lSet, ...rSet]);
};
/**
 * 交集
 */
module.exports.setIntersect  = function(lSet, rSet){
    return new Set([...lSet].filter(x => rSet.has(x)));
};
/**
 * 差集
 */
module.exports.setDifference = function(lSet, rSet){
    return new Set([...lSet].filter(x => !rSet.has(x)));
};

/**
 * 是否是超集
 * @param {*} set 
 * @param {*} subset 
 */
module.exports.isSuperSet = function (set, subset) {
    for (const elem of subset) {
        if (!set.has(elem)) {
            return false;
        }
    }
    return true;
};

/**
 * 计算2个集合的并集 A∪B
 * @param {*} setA 
 * @param {*} setB 
 */
module.exports.union = function (setA, setB) {
    const _union = new Set(setA);
    for (const elem of setB) {
        _union.add(elem);
    }
    return _union;
};

/**
 * 计算2个集合的交集 即 A∩B
 * @param {*} setA 
 * @param {*} setB 
 */
module.exports.intersection = function (setA, setB) {
    const _intersection = new Set();
    for (const elem of setB) {
        if (setA.has(elem)) {
            _intersection.add(elem);
        }
    }
    return _intersection;
};

/**
 * 计算2个集合的对称差 即 A∪B-A∩B
 * @param {*} setA 
 * @param {*} setB 
 */
module.exports.symmetricDifference = function (setA, setB) {
    const _difference = new Set(setA);
    for (const elem of setB) {
        if (_difference.has(elem)) {
            _difference.delete(elem);
        } else {
            _difference.add(elem);
        }
    }
    return _difference;
};

/**
 * 计算2个集合的差集 即 A - B
 * @param {*} setA 
 * @param {*} setB 
 */
module.exports.difference = function (setA, setB) {
    const _difference = new Set(setA);
    for (const elem of setB) {
        _difference.delete(elem);
    }
    return _difference;
};
