/**
 * @description 全服通知&广播服务
 * @author linjs
 * @date 2020/04/21
 */

const bearcat = require('bearcat');
const code = require('@code');

const NotifyService = function () {
    this.$id = 'global_NotifyService';
    this.app = null;
};

module.exports = NotifyService;
bearcat.extend('global_NotifyService', 'logic_BaseService');

/**
 * 全服广播
 * @param {String} messageName 消息名称,协议名称
 * @param {Object} data 消息内容
 */
NotifyService.prototype.broadcast = function (messageName, data) {
    this.app.get('channelService').broadcast('connector', messageName, data, {});
};

/**
 * 全公会广播
 * @param {Integer} guildId 目标公会id
 * @param {String} messageName 消息名称,协议名称
 * @param {Object} data 消息内容
 */
NotifyService.prototype.guildBroadcast = function (guildId, messageName, data) {
    // 根据公会id,找到对应的channel进行广播
    this.app.Guild.broadcast(guildId, messageName, data);
};

/**
 * 发送通知给某个角色
 * @param {Integer} uid
 * @param {String} msgName 消息名称
 * @param {Object} msgData 消息内容
 */
NotifyService.prototype.notify = async function (uid, msgName, msgData) {
    // 如果能找到玩家的connectorId,则通过connectorId直接发送
    const {err, res} = await this.app.Redis.hget(code.redis.ROLE_ON_CONNECTOR.name, uid);
    if (err || !res) {
        // 出错,说明玩家连接不在
        return false;
    }
    this.app.get('channelService').pushMessageByUids(msgName, msgData, [{ uid:uid, sid: res }]);
    return true;
};

