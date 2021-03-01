/**
 * @description 基础redis缓存服务
 * @author chenyq
 * @data 2020/03/10
 */

const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const bearcat = require('bearcat');
const code = require('@code');
const assert = require('assert');

const BaseRedisCacheService = function () {
    this.$id = 'logic_BaseRedisCacheService';
    this.app = null;
    this.caches = {};           // 所有缓存
    this.updateFunMap = {};     // 所有更新函数 {RedisKey => fun}
    this.timer = null;
};
module.exports = BaseRedisCacheService;
bearcat.extend('logic_BaseRedisCacheService', 'logic_BaseService');

/**
 * 缓存服务初始化
 */
BaseRedisCacheService.prototype.init = async function () {
    // 初始化需要完成2件事,同步进行,不分先后
    // 1.设置某些初值
    // 2.载入同步缓存
    return Promise.all([this.initCache(), this.loadCache()]);
};

/**
 * 设置缓存初值
 */
BaseRedisCacheService.prototype.initCache = async function () {
    logger.debug(`baseRedisCacheService:${this.$id} init cache`);
};

/**
 * 载入同步缓存
 */
BaseRedisCacheService.prototype.loadCache = async function () {
    logger.debug(`baseRedisCacheService:${this.$id} load cache`);
};

/**
 * 关服
*/
BaseRedisCacheService.prototype.shutdown = async function() {
    logger.debug(`baseRedisCacheService:${this.$id} shutdown`);
    clearInterval(this.timer);
};

/**
 * 增加一个缓存
 * @param {String} key 缓存的名称,必须是code.redis的成员
 * @param {Function} getterCB 获取函数 getterCB( storeCB(value) )
 * @param {Integer} intervalSecond 同步的间隔(秒)
 */
BaseRedisCacheService.prototype.addCache = function (key, getterCB, intervalSecond) {
    // logger.debug( "add redis cache %s", key );
    assert(code.redis.isValidRedisKey(key), `add cache error: [${key}] is not exist.`);
    const self = this;
    const cb = function () {
        getterCB(function (value) {
            self.updateValue(key, value);
        });
    };
    cb();
    this.timer = setInterval(cb, (intervalSecond || code.redis.getRedisKeyPropByName(key).cacheSyncSec) * 1000);
    // 保存到更新函数列表
    this.updateFunMap[key] = getterCB;
};

/**
 * 立即执行缓存更新
 * @param {String} key 要立即更新的缓存
 */
BaseRedisCacheService.prototype.updateCache = async function (key) {
    const getterCB = this.updateFunMap[key];
    if (getterCB) {
        return new Promise(resolve => {
            getterCB( value => {
                this.updateValue(key, value);
                resolve(value);
            });
        });
    }
};

/**
 * 获取缓存的值
 * @param {String} key 缓存名称
 */
BaseRedisCacheService.prototype.getCache = function (key) {
    return this.caches[key];
};

/**
 * 更新缓存的值
 * @param {String} key 要修改的key
 * @param {*} value 要修改的value
 */
BaseRedisCacheService.prototype.updateValue = function (key, value) {
    this.caches[key] = value;
    // logger.debug( "redis cache %s %j", key,  value);
};