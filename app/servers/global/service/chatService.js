/**
 * @description 全球服的聊天服务
 * @author linjs
 * @date 2020/05/06
 */

const bearcat = require('bearcat');
const code = require('@code');

const ChatService = function () {
    this.$id = 'global_ChatService';
    this.app = null;
};

module.exports = ChatService;
bearcat.extend('global_ChatService', 'logic_BaseService');

/**
 * 发送世界频道系统消息
 */
ChatService.prototype.worldSysChat = async function (content) {
    await this.app.Helper.Chat.worldSysChat(content);
};

/**
 * 发送世界频道系统消息(基于模板)
 */
ChatService.prototype.worldSysTpltChat = async function (templateId, param) {
    await this.app.Helper.Chat.worldSysTpltChat(templateId, param);
};

/**
 * 发送跑马灯频道系统消息
 */
ChatService.prototype.bannerSysChat = async function (content) {
    await this.app.Helper.Chat.bannerSysChat(content);
};

/**
 * 发送跑马灯频道系统消息(基于模板)
 */
ChatService.prototype.bannerSysTpltChat = async function (templateId, param) {
    await this.app.Helper.Chat.bannerSysTpltChat(templateId, param);
};

/**
 * 发送联盟频道系统信息
 */
ChatService.prototype.guildSysChat = async function (guildId, content) {
    await this.app.Helper.Chat.guildSysChat(guildId, content);
};

/**
 * 发送联盟频道系统信息:基于模板
 */
ChatService.prototype.guildSysTpltChat = async function (guildId, templateId, param) {
    await this.app.Helper.Chat.guildSysTpltChat(guildId, templateId, param);
};

/**
 * 发送私聊系统消息
 */
ChatService.prototype.privateSysChat = async function (targetUid, content) {
    await this.app.Helper.Chat.privateSysChat(targetUid, content);
};

/**
 * 发送私聊系统消息(基于模板)
 */
ChatService.prototype.privateSysTpltChat = async function (targetUid, templateId, param) {
    await this.app.Helper.Chat.privateSysTpltChat(targetUid, templateId, param);
};

/**
 * 模拟聊天
 */
ChatService.prototype.simulateChat = async function (msg) {
    // 模拟聊天不用记录日志
    const realMsg = this.app.Helper.Chat.makeSimulateChatMsg(msg);
    // 根据目标进行转发
    switch (realMsg.channelId) {
    case code.chat.CHANNEL.WORLD:
        {
            this.app.Notify.broadcast('chatNotify', { msg: realMsg });
            this._addWorldCache(realMsg);
        }
        break;
    case code.chat.CHANNEL.BANNER:
        {
            this.app.Notify.broadcast('chatNotify', { msg: realMsg });
        }
        break;
    case code.chat.CHANNEL.GUILD:
        {
            this.app.Notify.guildBroadcast(parseInt(realMsg.targetUid), 'chatNotify', { msg: realMsg });
            this._addGuildCache(realMsg);
        }
        break;
    case code.chat.CHANNEL.PRIVATE:
        {
            // 如果不是系统消息,没有发送者,不用给发送者回一条
            if (realMsg.msgType != code.chat.MSG_TYPE.SYSTEM) {
                await this.app.Notify.notify(parseInt(realMsg.sender.uid), 'chatNotify', { msg: realMsg });
            }
            // 发送给对方,如果失败要存离线消息
            if (!await this.app.Notify.notify(parseInt(realMsg.targetUid), 'chatNotify', { msg: realMsg })) {
                this.app.OfflineData.addPrivateChat(realMsg);
            }
        }
        break;
    default: return false;
    }
    return true;
};

/**
 * 将世界聊天加入到redis缓存
 */
ChatService.prototype._addWorldCache = function (msg) {
    this.app.Redis.zadd(code.redis.CHAT_WORLD_HISTORY.name, msg.time, JSON.stringify(msg));
};

/**
 * 将商会聊天加入到redis缓存
 */
ChatService.prototype._addGuildCache = function (msg) {
    this.app.Redis.zadd([code.redis.CHAT_GUILD_HISTORY.name, msg.targetUid], msg.time, JSON.stringify(msg));
};
