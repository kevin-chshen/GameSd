/**
 * created by chshen on 2020/03/12
 * @note redis缓存器
 */

const bearcat = require('bearcat');
const code = require('@code');

const RedisCacheService = function () {
    this.$id = 'gate_RedisCacheService';
    this.app = null;
    this.caches = {};           // 所有缓存
    this.updateFunMap = {};     // 所有更新函数 {RedisKey => fun}
};

module.exports = RedisCacheService;
bearcat.extend('gate_RedisCacheService', 'logic_BaseRedisCacheService');

/**
 * 设置缓存初值
 */
RedisCacheService.prototype.initCache = async function () {

};

/**
 * 载入同步缓存
 */
RedisCacheService.prototype.loadCache = async function () {
    const redis = this.app.Redis;
    this.addCache(code.redis.CONNECTOR_ONLINE_NUM.name, async function (storeCB) {
        const ret = await redis.zrange(code.redis.CONNECTOR_ONLINE_NUM.name, 0, -1, "withscores");
        if (!ret.err || ret.res)
        {
            const replies = ret.res;
            const newReplies = [];
            for (let i = 0; i < replies.length; i += 2) {
                newReplies.push({ server: replies[i], count: parseInt(replies[i + 1]) });
            }
            storeCB(newReplies);
        }
    });
};
