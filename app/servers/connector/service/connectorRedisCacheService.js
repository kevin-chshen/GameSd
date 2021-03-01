/**
 * created by chshen on 2020/03/12
 * @note redis缓存器
 */

const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const bearcat = require('bearcat');
const code = require('@code');

const RedisCacheService = function () {
    this.$id = 'connector_RedisCacheService';
    this.app = null;
    this.caches = {};           // 所有缓存
    this.updateFunMap = {};     // 所有更新函数 {RedisKey => fun}
};

module.exports = RedisCacheService;
bearcat.extend('connector_RedisCacheService', 'logic_BaseRedisCacheService');

/**
 * 设置缓存初值
 */
RedisCacheService.prototype.initCache = async function () {
    await this.app.Redis.zadd(code.redis.CONNECTOR_ONLINE_NUM.name, 0, this.app.getServerId());
    logger.debug("%s set %s %s to 0", this.$id, code.redis.CONNECTOR_ONLINE_NUM.name, this.app.getServerId());
};

/**
 * 载入同步缓存
 */
RedisCacheService.prototype.loadCache = async function () {
    const redis = this.app.Redis;
    this.addCache(code.redis.GAME_ONLINE_NUM.name, async function (storeCB) {
        const ret = await redis.zrange(code.redis.GAME_ONLINE_NUM.name, 0, -1, "withscores");
        if (!ret.err || ret.res)
        {
            const replies = ret.res;
            const newReplies = [];
            for (let i = 0; i < replies.length; i += 2) {
                newReplies.push({ server: replies[i], count: Number(replies[i + 1]) });
            }
            storeCB(newReplies);
        }
    });
};