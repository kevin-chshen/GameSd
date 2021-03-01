/**
 * @description 基础计数器
 * @author linjs
 * @date 2020/04/28
 */

const assert = require('assert');

const BaseCounter = function (owner, id, dataObj) {
    this.$id = 'logic_BaseCounter';
    this.$scope = 'prototype';
    this.owner = owner;
    this.id = id;
    this.dataObj = dataObj || this.createInitObj();
};

module.exports = BaseCounter;

/**
 * 返回数据结构
 */
BaseCounter.prototype.getDataObj = function () {
    return this.dataObj;
};

/**
 * 返回初始化的obj
 */
BaseCounter.prototype.createInitObj = function () {
    return { current: 0 };
};

/**
 * 获取计数器上的值
 */
BaseCounter.prototype.get = function () {
    return this.dataObj.current;
};

/**
 * 设置计数器上的值
 */
BaseCounter.prototype.set = function (value) {
    this.dataObj.current = value;
};

/**
 * 增加计数器
 */
BaseCounter.prototype.add = function (num = 1) {
    this.dataObj.current += num;
};

/**
 * 重置计数器
 */
BaseCounter.prototype.reset = function () {
    this.dataObj.current = 0;
};

/**
 * 将计数器编码
 */
BaseCounter.prototype.encode = function () {
    return {id: this.id, current: this.dataObj.current};
};

/**
 * 从一个结构体反编码
 */
BaseCounter.prototype.decode = function ({id, current}) {
    assert(id == this.id, `decode counter error with ${this.id} => ${id} current ${this.dataObj.current} => ${current}`);
    this.dataObj.current = current;
};
