/**
 * @description 计数器相关帮助函数
 * @author linjs
 * @date 2020/04/28
 */

const bearcat = require('bearcat');
const code = require('@code');
const assert = require('assert');

const CounterHelper = function() {
    this.$id = 'logic_CounterHelper';
    this.name = 'Counter';
    this.app = null;
};

module.exports = CounterHelper;
bearcat.extend('logic_CounterHelper', 'logic_BaseHelper');

CounterHelper.prototype.get = function (data, name, id) {
    assert(code.counter.isValidKey(name), `counter key [${name}] invalid`);
    const domain = data[name];
    if (domain) {
        const counter = domain[id];
        if (counter) {
            return bearcat.getBean(code.counter.getBearcatId(name), name, id, counter);
        } else {
            const bean = bearcat.getBean(code.counter.getBearcatId(name), name, id, counter);
            domain[id] = bean.create();
        }
    }
};
