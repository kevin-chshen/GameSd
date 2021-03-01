/**
 * @description 角色事件组件
 * @author linjs
 * @date 2020/03/26
 */

const bearcat = require('bearcat');
const EventEmitter = require('events').EventEmitter;
const code = require('@code');

const EventComponent = function (app, player) {
    this.$id = 'game_EventComponent';
    this.$scope = 'prototype';
    this.app = app;
    this.player = player;
    this.eventEmitter = new EventEmitter();
};

module.exports = EventComponent;
bearcat.extend('game_EventComponent', 'game_Component');

/**
 * 清理数据的时候统一清除掉玩家身上所有的事件监听
 */
EventComponent.prototype.onClean = async function () {
    // 移除所有的监听器
    this.removeAllListeners();
};

/**
 * 增加事件的监听器
 * @param {String|Array} event 事件名称
 * @param {Function} listener 事件回调函数
 */
EventComponent.prototype.addListener = function (event, listener) {
    this.eventEmitter.addListener(code.event.makeEventName(event), listener);
};

/**
 * 增加事件的监听器
 * @param {String|Array} event 事件名称
 * @param {Function} listener 事件回调函数
 */
EventComponent.prototype.on = function (event, listener) {
    this.eventEmitter.on(code.event.makeEventName(event), listener);
};

/**
 * 增加事件的一次性事件监听器
 * @param {String|Array} event 事件名称
 * @param {Function} listener 事件回调函数
 */
EventComponent.prototype.once = function (event, listener) {
    this.eventEmitter.once(code.event.makeEventName(event), listener);
};

/**
 * 移除事件监听器
 * @param {String|Array} event 事件名称
 * @param {Function} listener 事件回调函数
 */
EventComponent.prototype.removeListener = function (event, listener) {
    this.eventEmitter.removeListener(code.event.makeEventName(event), listener);
};

/**
 * 移除事件监听器
 * @param {String|Array} event 事件名称
 * @param {Function} listener 事件回调函数
 */
EventComponent.prototype.off = function (event, listener) {
    this.eventEmitter.off(code.event.makeEventName(event), listener);
};

/**
 * 移除指定/所有事件的监听器
 * @param {String|Symbol|NULL} event 事件名称
 */
EventComponent.prototype.removeAllListeners = function (event) {
    if (event) {
        this.eventEmitter.removeAllListeners(code.event.makeEventName(event));
    } else {
        this.eventEmitter.removeAllListeners();
    }
};

/**
 * 设定监听器的最大个数
 * @param {Integer} n 监听器最大个数
 */
EventComponent.prototype.setMaxListeners = function (n) {
    this.eventEmitter.setMaxListeners(n);
};

/**
 * 获取监听器的最大个数
 */
EventComponent.prototype.getMaxListeners = function () {
    return this.eventEmitter.getMaxListeners();
};

/**
 * 返回监听器列表
 * @param {String|Array} event 事件名称
 */
EventComponent.prototype.listeners = function (event) {
    return this.eventEmitter.listeners(code.event.makeEventName(event));
};

/**
 * 随机一个监听器
 * @param {String|Array} event 事件名称
 */
EventComponent.prototype.rawListeners = function (event) {
    return this.eventEmitter.rawListeners(code.event.makeEventName(event));
};

/**
 * 触发一次事件
 * @param {String|Array} event 事件名称
 * @param {*} args 事件参数
 */
EventComponent.prototype.emit = function (event, ...args) {
    this.eventEmitter.emit(code.event.makeEventName(event), ...args);
};

/**
 * 监听器计数
 * @param {String|Array} event 事件名称 
 */
EventComponent.prototype.listenerCount = function (event) {
    return this.eventEmitter.listenerCount(code.event.makeEventName(event));
};

/**
 * 
 * @param {String|Array} event 事件名称
 * @param {Function} listener 事件回调函数
 */
EventComponent.prototype.prependListener = function (event, listener) {
    this.eventEmitter.prependListener(code.event.makeEventName(event), listener);
};

/**
 * @param {String|Array} event 事件名称
 * @param {Function} listener 事件回调函数
 */
EventComponent.prototype.prependOnceListener = function (event, listener) {
    this.eventEmitter.prependOnceListener(code.event.makeEventName(event), listener);
};

/**
 * 返回所有监听事件的名称
 */
EventComponent.prototype.eventNames = function () {
    return this.eventEmitter.eventNames();
};
