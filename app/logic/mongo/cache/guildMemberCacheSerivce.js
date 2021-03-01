/**
 * @description 联盟成员缓存服务
 * @author chenyq
 * @date 2020/04/26
 */

const bearcat = require('bearcat');

const guildMemberCacheService = function () {
    this.$id = 'logic_GuildMemberCacheService';
    this.app = null;
};

module.exports = guildMemberCacheService;
bearcat.extend('logic_GuildMemberCacheService', 'logic_MongoBaseService');
guildMemberCacheService.prototype.mongoDataClassFunc = require('@mongo/mongoGuildMember');
guildMemberCacheService.prototype.needClean = false;  // 永久缓存,不需要清理
