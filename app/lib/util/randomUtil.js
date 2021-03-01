/**
 * 获取随机数[min,max] 包含上下限
 */
module.exports.random = function (min, max) {
    return parseInt(Math.random() * (max - min + 1) + min, 10);
};

/**
 * 根据概率[0,1]随机是否成功
 */
module.exports.randomBool = function (rate) {
    return Math.random() <= rate;
};

/**
 * 根据权重抽取
 * @param {Array} list [100, 200, 300]
 * @return {Integer} 抽到的索引(>=0)或者没抽到(-1)
 */
module.exports.randomWeight = function (list) {
    const total = list.reduce(function (x, y) { return x + y; });
    return this.randomFixWeight(list, total);
};
/**
 * @param {Object} obj {a:100,b:200,c:300}
 * @return {Integer} 抽到的索引(>=0)或者没抽到(-1)
 */
module.exports.randomWeightObject = function(obj){
    const keyList = Object.keys(obj);
    const valList = Object.values(obj);
    const total = valList.reduce(function (x, y) { return x + y; });
    const index = this.randomFixWeight(valList, total);
    return keyList[index];
};
/**
 * 根据固定的权重抽取,有可能因为权重的关系抽取不到
 * @param {Array} list [100, 200, 300]
 * @param {Integer} total 指定的权重总和
 * @return {Integer} 抽到的索引(>=0)或者没抽到(-1)
 */
module.exports.randomFixWeight = function (list, total) {
    const rand = this.random(1, total);
    let sum = 0;
    for (const [index, value] of list.entries()) {
        sum = sum + value;
        if (sum > 0 && rand <= sum) {
            return index;
        }
    }
    return -1;
};

/**
 * 抽取一定长度数组内随机几个成员
 */
module.exports.randomArrayElements = function (array, num) {
    const shuffled = array.slice(0);
    let i = array.length, min = i - num, temp, index;
    min = min >= 0 ? min : 0;
    while (i-- > min) {
        index = Math.floor((i + 1) * Math.random());
        temp = shuffled[index];
        shuffled[index] = shuffled[i];
        shuffled[i] = temp;
    }
    return shuffled.slice(min);
};

/**
 * 根据权重抽取一定长度数组内随机几个成员
 */
module.exports.randomArrayElementsWeight = function (array, weights, num) {
    const shuffled = array.slice(0);
    const weightsShuffled = weights.slice(0);
    let i = array.length, min = i - num, temp, tempWeight, index;
    min = min >= 0 ? min : 0;
    while (i-- > min) {
        index = this.randomWeight(weightsShuffled.slice(0, i));
        temp = shuffled[index];
        tempWeight = weightsShuffled[index];
        shuffled[index] = shuffled[i];
        weightsShuffled[index] = weightsShuffled[i];
        shuffled[i] = temp;
        weightsShuffled[i] = tempWeight;
    }
    return shuffled.slice(min);
};

/**
 * 默认万分比
 * @param probability 概率 整数
 * @param max 默认10000
 */
module.exports.probability = function (probability, max = 10000) {
    if (probability <= 0) {
        return false;
    }
    const rand = this.random(1, max < 1 ? 1 : max);
    return rand <= probability ? true : false;
};
/**
 * 获取枚举中随机一个值
 */
module.exports.randomEnum = function (enumObj) {
    if (typeof (enumObj) != 'object') {
        return undefined;
    }
    const values = Object.values(enumObj);
    const rand = this.random(0, values.length - 1);
    return values[rand];
};