/**
 * @description 服务器事件组件
 * @author chshen
 * @date 2020/04/30
 */
const assert = require('assert');
const bearcat = require('bearcat');
const code = require('@code');
const EventEmitter = require('events').EventEmitter;

const EventService = function () {
    this.$id = 'logic_EventService';
    this.app = null;
    this.eventEmitter = new EventEmitter();

    this.map = {}; // {[uid] : 事件列表}
};

module.exports = EventService;
bearcat.extend('logic_EventService', 'logic_BaseService');

/**
 * 清除离线玩家数据
 */
EventService.prototype.clean = function (logoutUids) {
    if (Array.isArray(logoutUids)) {
        logoutUids.map((uid) => this.removePlayerEventAll(uid));
    }
};

/**
 * 增加事件的监听器
 * @param {String|Symbol} event 事件名称
 * @param {Object} target 要绑定的事件对象,变成回调函数里面的this指针
 * @param {Integer} uid 玩家ID, 全服事件uid = 0
 * @param {Function} listener 事件回调函数
 */
EventService.prototype.addListener = function (event, uid, listener) {
    const key = makeKey(event);
    this.addPlayerEvent(key, uid, listener);
    this.eventEmitter.addListener(makeKey(key), listener);
};

/**
 * 增加事件的监听器
 * @param {String|Symbol} event 事件名称
 * @param {Object} target 要绑定的事件对象,变成回调函数里面的this指针
 * @param {Integer} uid 玩家ID, 全服事件uid = 0
 * @param {Function} listener 事件回调函数
 */
EventService.prototype.on = function (event, uid, listener) {
    const key = makeKey(event);
    this.addPlayerEvent(key, uid, listener);
    this.eventEmitter.on(key, listener);
};

/**
 * 增加事件的一次性事件监听器
 * @param {String|Symbol} event 事件名称
 * @param {Integer} uid 玩家ID, 全服事件uid = 0
 * @param {Function} listener 事件回调函数
 */
EventService.prototype.once = function (event, uid, listener) {
    const key = makeKey(event);
    this.addPlayerEvent(key, uid, listener);
    this.eventEmitter.once(key, listener);
};

/**
 * 移除事件监听器
 * @param {String|Symbol} event 事件名称
 * @param {Integer} uid 玩家ID, 全服事件uid = 0
 * @param {Function} listener 事件回调函数
 */
EventService.prototype.removeListener = function (event, uid, listener) {
    const key = makeKey(event);
    this.removePlayerEvent(key, uid, listener);
    this.eventEmitter.removeListener(key, listener);
};

/**
 * 移除事件监听器
 * @param {String|Symbol} event 事件名称
 * @param {Integer} uid 玩家ID, 全服事件uid = 0
 * @param {Function} listener 事件回调函数
 */
EventService.prototype.off = function (event, uid, listener) {
    const key = makeKey(event);
    this.removePlayerEvent(key, uid, listener);
    this.eventEmitter.off(key, listener);
};

/**
 * 移除指定/所有事件的监听器
 * @param {String|Symbol|NULL} event 事件名称
 */
EventService.prototype.removeAllListeners = function (event) {
    this.map = {};
    if (event) {
        this.eventEmitter.removeAllListeners(makeKey(event));
    } else {
        this.eventEmitter.removeAllListeners();
    }
};

/**
 * 设定监听器的最大个数
 * @param {Integer} n 监听器最大个数
 */
EventService.prototype.setMaxListeners = function (n) {
    this.eventEmitter.setMaxListeners(n);
};

/**
 * 获取监听器的最大个数
 */
EventService.prototype.getMaxListeners = function () {
    return this.eventEmitter.getMaxListeners();
};

/**
 * 返回监听器列表
 * @param {String|Symbol} event 事件名称
 */
EventService.prototype.listeners = function (event) {
    return this.eventEmitter.listeners(makeKey(event));
};

/**
 * 随机一个监听器
 * @param {String|Symbol} event 事件名称
 */
EventService.prototype.rawListeners = function (event) {
    return this.eventEmitter.rawListeners(makeKey(event));
};

/**
 * 触发一次事件
 * @param {String|Symbol} event 事件名称
 * @param {*} args 事件参数
 */
EventService.prototype.emit = function (event, ...args) {
    this.eventEmitter.emit(makeKey(event), ...args);
};

/**
 * 监听器计数
 * @param {String|Symbol} event 事件名称 
 */
EventService.prototype.listenerCount = function (event) {
    return this.eventEmitter.listenerCount(makeKey(event));
};

/**
 * 
 * @param {String|Symbol} event 事件名称
 * @param {Function} listener 事件回调函数
 */
EventService.prototype.prependListener = function (event, uid, listener) {
    const key = makeKey(event);
    this.addPlayerEvent(key, uid, listener);
    this.eventEmitter.prependListener(key, listener);
};

/**
 * @param {String|Symbol} event 事件名称
 * @param {Function} listener 事件回调函数
 */
EventService.prototype.prependOnceListener = function (event, uid, listener) {
    const key = makeKey(event);
    this.addPlayerEvent(key, uid, listener);
    this.eventEmitter.prependOnceListener(key, listener);
};

/**
 * 返回所有监听事件的名称
 */
EventService.prototype.eventNames = function () {
    return this.eventEmitter.eventNames();
};


/**
 * 添加玩家事件
 * @api private
 * @param {String|Symbol} event 事件名称
 * @param {Integer} uid 玩家ID, 全服事件uid = 0
 * @param {Function} listener 事件回调函数
*/
EventService.prototype.addPlayerEvent = function (event, uid, listener) {
    if (uid <= 0) {
        return;
    }
    if (!this.map[uid]) {
        this.map[uid] = {};
    }
    if (!this.map[uid][event]) {
        this.map[uid][event] = [];
    }    
    this.map[uid][event].push(listener);
};

/**
 * 删除玩家指定事件
 * @api private
 * @param {String|Symbol} event 事件名称
 * @param {Integer} uid 玩家ID, 全服事件uid = 0
 * @param {Function} listener 事件回调函数
*/
EventService.prototype.removePlayerEvent = function (event, uid, listener) {
    if (uid > 0 && this.map[uid] && this.map[uid][event]) {
        const index = this.map[uid][event].indexOf(listener);
        if (index > -1) {
            this.map[uid][event].splice(index, 1);
        }
    }
};

/**
 * 删除玩家的所有事件,
 * @api private
 * @param {Integer} uid 玩家ID, 全服事件uid = 0
*/
EventService.prototype.removePlayerEventAll = function (uid) {
    if (uid > 0 && this.map[uid]) {
        for (const [eventName, events] of Object.entries(this.map[uid])) {
            for (const listener of events) {
                this.eventEmitter.removeListener(eventName, listener);
            }
        }
        delete this.map[uid];
    }
};

/**
 * 生成实际要访问的redis key
 * 1.单独的key,直接使用名字
 * 2.组合的key,用key的名字+_剩下变量的join('_')
 * @param {Mixed} key redis Key 定义
 */
function makeKey(key) {
    let keyName = null;
    let realKey = null;
    if (Array.isArray(key)) {
        keyName = key[0];
        realKey = key.join('_');
    } else {
        keyName = key;
        realKey = key;
    }
    assert(code.eventServer.isValidKey(keyName), `redis key [${key}] is invalid`);
    return realKey;
}

