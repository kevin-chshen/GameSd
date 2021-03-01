/**
 * @description redis开服清除服务
 * @author linjs
 * @date 2020/04/03
 */

const bearcat = require('bearcat');
const code = require('@code');

const RedisCleanService = function () {
    this.$id = 'master_RedisCleanService';
    this.app = null;
};

module.exports = RedisCleanService;
bearcat.extend('master_RedisCleanService', 'logic_BaseService');

/**
 * 初始化服务
 * 删除所有标记为启动清除的redis key
 */
RedisCleanService.prototype.init = async function() {
    const redis = this.app.Redis;
    return Promise.all(code.redis.getAllRedisKeyProp().map(async ({name, cleanOnStarting, joinedKey}) => {
        if (cleanOnStarting) {
            if (joinedKey) {
                const {err, res} = await redis.keys(name + '_*');
                if (err == null && res.length > 0) {
                    await redis.delDirect(res);
                }
            } else {
                await redis.delDirect(name);
            }
        }
    }));
};
