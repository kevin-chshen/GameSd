/**
 * @description Game服务器的redis缓存服务
 * @author linjs
 * @date 2020/03/23
 */

const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const bearcat = require('bearcat');
const code = require('@code');

const RedisCacheService = function () {
    this.$id = 'game_RedisCacheService';
    this.app = null;
    this.caches = {};           // 所有缓存
    this.updateFunMap = {};     // 所有更新函数 {RedisKey => fun}
};

module.exports = RedisCacheService;
bearcat.extend('game_RedisCacheService', 'logic_BaseRedisCacheService');

/**
 * 设置缓存初值
 */
RedisCacheService.prototype.initCache = async function () {
    await this.app.Redis.zadd(code.redis.GAME_ONLINE_NUM.name, 0, this.app.getServerId());
    logger.debug("%s set %s %s to 0", this.$id, code.redis.GAME_ONLINE_NUM.name, this.app.getServerId());
};
