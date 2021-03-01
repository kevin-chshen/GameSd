/**
 * @description 服务器计数容器
 * @author linjs
 * @date 2020/04/29
 */

const bearcat = require('bearcat');
const code = require('@code');

/**
 * 服务器计数器存储容器
 * @param {Object} app pomelo app
 * @param {String} name counter的name
 * @param {Object} dataObj 数据库里面存储的数据
 * @param {Function} idChecker id有效性检查器 idChecker(id) => Boolean
 * @param {Function} dataSaver 保存数据的函数 dataSaver() => none
 */
const ServerCounterMap = function (app, name, dataObj, idChecker, dataSaver) {
    this.$id = 'logic_ServerCounterMap';
    this.$scope = 'prototype';
    this.app = app;
    this.name = name;
    this.bearcatId = code.counter.getBearcatId(name);
    this.dataObj = dataObj;
    this.idChecker = idChecker;
    this.dataSaver = dataSaver;
    this.cache = {};
};

module.exports = ServerCounterMap;

/**
 * 获取某个id对应的计数器
 */
ServerCounterMap.prototype.get = function (id) {
    if (!this._checkId(id)) {
        return null;
    }
    const cacheCounter = this.cache[id];
    if (cacheCounter) {
        return cacheCounter;
    }
    const data = this.dataObj[id];
    if (data) {
        const counter = bearcat.getBean(this.bearcatId, this.player, id, data);
        this.cache[id] = counter;
        return counter;
    } else {
        const counterInit = bearcat.getBean(this.bearcatId, this.player, id, null);
        this.cache[id] = counterInit;
        this.dataObj[id] = counterInit.getDataObj();
        return counterInit;
    }
};

/**
 * 设置某个id对应的计数器的值
 */
ServerCounterMap.prototype.set = function (id, value) {
    if (!this._checkId(id)) {
        return;
    }
    const counter = this.get(id);
    counter.set(value);
    this.dataSaver();
};

/**
 * 返回计数器的编码形式
 * @param {Array} ids id数组
 * @returns {Array} 查询的结果 {id => 计数器encode函数的结果}
 */
ServerCounterMap.prototype.getCounterGroup = function (ids) {
    const obj = {};
    ids.map( (id) => {
        if (this._checkId(id)) {
            const counter = this.get(id);
            obj[id] = counter.encode();
        }
    });
    return obj;
};

/**
 * 将计数器设置回计数
 * @param {Object} obj {id => 计数器encode函数的结果}
 */
ServerCounterMap.prototype.setCounterGroup = function (obj) {
    Object.entries(obj).map( ([id, value]) => {
        if (this._checkId(id)) {
            const counter = this.get(id);
            counter.decode(value);
        }
    });
    this.dataSaver();
};

/**
 * 重设列表里面的计数器
 * @param {Array} ids 计数器列表
 */
ServerCounterMap.prototype.resetCounterGroup = function (ids) {
    ids.map( (id) => {
        if (this._checkId(id)) {
            const counter = this.get(id);
            counter.reset();
        }
    });
};

/**
 * 检查某个id是否有效
 */
ServerCounterMap.prototype._checkId = function (id) {
    if (this.idChecker) {
        return this.idChecker(id);
    }
    return true;
};
