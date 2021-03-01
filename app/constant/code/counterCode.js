/**
 * @description 计数器相关定义
 * @author linjs
 * @date 2020/04/28
 */

const assert = require('assert');

/**
 * counter key 属性缓存
 */
const counterKeyProp = {};


/**
 * counter key 配置
 * @param {String} name 名字
 * @param {String} bearcatId 存储对象对应的bearcat类型
 */
module.exports = {
    // 一些函数
    isValidKey,
    getAddKeyProp,
    getKeyProp,
    getBearcatId,
    // 掉落相关的计数器:掉落下标
    DROP_SIGN: makeCounterKeyType({
        name: 'DropSign',
        bearcatId: 'logic_DropSignCounter',
    }),
    // 掉落相关的计数器:掉落下标
    DROP_TIMES: makeCounterKeyType({
        name: 'DropTimes',
        bearcatId: 'logic_BaseCounter',
    }),
    // 投资计划
    INVEST_FUNDS: makeCounterKeyType({
        name: 'InvestFunds',
        bearcatId: 'logic_BaseCounter',
    }),
    // 充值相关数据记录
    PAY: makeCounterKeyType({
        name: 'Pay',
        bearcatId: 'logic_BaseCounter',
    }),
};

/**
 * 生成key相关的配置
 * @param {Object} config 配置
 */
function makeCounterKeyType(config) {
    assert(counterKeyProp[config.name] == null, `counter key [${config.name}] duplicate`);
    const prop = {
        name: config.name,
        bearcatId: config.bearcatId,
    };
    counterKeyProp[config.name] = prop;
    return prop;
}

/**
 * 是否有效的key
 * @param {String} name key的名称
 */
function isValidKey(name) {
    return counterKeyProp[name] != null;
}

/**
 * 获取所有key属性
 */
function getAddKeyProp() {
    return Object.values(counterKeyProp);
}

/**
 * 获取某个key的属性
 * @param {String} name key的名称
 */
function getKeyProp(name) {
    const prop = counterKeyProp[name];
    assert(prop != null, `counter [${name}] is undefined.`);
    return prop;
}

/**
 * 获取key对应的bearcat id
 * @param {String} name key的名称
 */
function getBearcatId(name) {
    return counterKeyProp[name].bearcatId;
}