/**
 * created by chshen on 2020/03/12
 * @note redis缓存器
 */

const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const bearcat = require('bearcat');
const code = require('@code');
const MongoAccount = require('@mongo/mongoAccount');
const GlobalMail = require('@mongo/mongoGlobalMail');
const Guild = require('@mongo/mongoGuild');

const RedisCacheService = function () {
    this.$id = 'master_RedisCacheService';
    this.app = null;
    this.caches = {};           // 所有缓存
    this.updateFunMap = {};     // 所有更新函数 {RedisKey => fun}
};

module.exports = RedisCacheService;
bearcat.extend('master_RedisCacheService', 'logic_BaseRedisCacheService');

/**
 * 设置缓存初值
 */
RedisCacheService.prototype.initCache = async function () {
    // redis中最大的playerUid初始化
    const serverIdList = this.app.SystemConfig.getAllServerId();
    const maxUidObj = {};
    for (const serverId of serverIdList) {
        maxUidObj[serverId] = serverId * code.system.SERVER_REGION + code.system.INIT_FIRST_UID;
    }
    const ret = await MongoAccount.aggregate([{ "$group": { _id: { serverId: "$serverId" }, max: { $max: "$uid" } } }]);
    if (ret.documents) {
        ret.documents.map(({ _id: { serverId }, max }) => {
            maxUidObj[serverId] = max;
        });
    }
    await this.app.Redis.hmset(code.redis.MAX_PLAYER_UID.name, maxUidObj);
    logger.info('redis init key %s success value = %j', code.redis.MAX_PLAYER_UID.name, maxUidObj);
    // redis中最大的globalMailId初始化
    const retMailId = await GlobalMail.aggregate([{ "$group": { _id: null, max: { $max: "$id" } } }]);
    const maxMailId = (retMailId.documents && retMailId.documents[0]) ? retMailId.documents[0].max : code.mail.INIT_GLOBAL_MAIL_ID;
    await this.app.Redis.set(code.redis.MAX_GLOBAL_MAIL_ID.name, maxMailId);
    logger.info('redis init key %s success value = %d', code.redis.MAX_GLOBAL_MAIL_ID.name, maxMailId);
    // redis中最大的guildId初始化
    const initGuildId = this.app.SystemConfig.getServerId() * 10000 + code.guild.INIT_GUILD_ID;
    const retGuildId = await Guild.aggregate([{ "$group": { _id: null, max: { $max: "$guildId" } } }]);
    const maxGuildId = (retGuildId.documents && retGuildId.documents[0]) ? retGuildId.documents[0].max : initGuildId;
    await this.app.Redis.set(code.redis.MAX_GUILD_ID.name, maxGuildId);
    logger.info('redis init key %s success value = %d', code.redis.MAX_GUILD_ID.name, maxGuildId);
};

/**
 * 载入同步缓存
 */
RedisCacheService.prototype.loadCache = async function () {

};
