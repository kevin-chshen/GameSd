/**
 * @description 联盟缓存服务
 * @author chenyq
 * @date 2020/04/26
 */

const bearcat = require('bearcat');

const guildCacheService = function () {
    this.$id = 'logic_GuildCacheService';
    this.app = null;
};

module.exports = guildCacheService;
bearcat.extend('logic_GuildCacheService', 'logic_MongoBaseService');
guildCacheService.prototype.mongoDataClassFunc = require('@mongo/mongoGuild');
guildCacheService.prototype.uidKey = 'guildId';
guildCacheService.prototype.needClean = false;  // 永久缓存,不需要清理
