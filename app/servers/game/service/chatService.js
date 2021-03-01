/**
 * @description 聊天服务
 * @author linjs
 * @date 2020/04/22
 */

const bearcat = require('bearcat');
const code = require('@code');
const util = require('@util');

const ChatService = function () {
    this.$id = 'game_ChatService';
    this.app = null;
};

module.exports = ChatService;
bearcat.extend('game_ChatService', 'logic_BaseService');

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
 * 发送聊天信息
 */
ChatService.prototype.chat = async function (player, msg) {
    // 增加聊天日志和文本记录
    if (this._needChatLog(msg)) {
        this.app.Log.chatLog(player, msg);
    }
    // 发送到目标
    const realMsg = this.makeChatMsg(player, msg);
    // 根据目标进行转发
    switch (realMsg.channelId) {
    case code.chat.CHANNEL.WORLD: 
        {
            this.app.Notify.broadcast('chatNotify', { msg: realMsg });
            this._addWorldCache(realMsg);
        }
        break;
    case code.chat.CHANNEL.GUILD: 
        {
            this.app.Notify.guildBroadcast(player.guildId, 'chatNotify', { msg: realMsg });
            this._addGuildCache(realMsg);
        }
        break;
    case code.chat.CHANNEL.PRIVATE:
        {
            // 私聊的要回一条消息给发送者
            player.Notify.notify('chatNotify', { msg: realMsg });
            if (!await this.app.Notify.notify(parseInt(realMsg.targetUid), 'chatNotify', { msg: realMsg })) {
                this.app.rpcs.global.offlineRemote.addOfflinePrivateChat({}, realMsg);
            }
        }
        break;
    default: return false;
    }
    return true;
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
                this.app.rpcs.global.offlineRemote.addOfflinePrivateChat({}, realMsg);
            }
        }
        break;
    default: return false;
    }
    return true;
};

/**
 * 查询玩家所有的离线消息(10条世界,10条商会,所有的私聊信息)
 */
ChatService.prototype.queryOfflineChat = async function (player) {
    const result = await Promise.all([this._getWorldCache(), this._getGuildCache(player.guildId), this._getPrivateCache(player.uid)]);
    return result.reduce( (total, current) => { return total.concat(current); }, []);
};

/**
 * 查询玩家的在线状态
 */
ChatService.prototype.queryOnline = async function (uids) {
    const now = util.time.nowSecond();
    const briefList = await this.app.Brief.getBriefGroup(uids);
    return briefList.reduce( (total, current) => {
        const info = {
            uid: current.uid,
            name: current.name,
            vipLv: current.vip,
            headId: current.headImageId,
            status: current.lastLoginTime > current.lastLogoutTime ? code.chat.ONLINE : code.chat.OFFLINE,
            lastLogoutTime: util.time.ms2s(current.lastLogoutTime),
            isBanChat: current.banChatEndTs > now ? 1: 0,   // 禁言1 非禁言0
        };
        return total.concat(info);
    }, []);
};

/**
 * 生成聊天信息:协议roleMsg内容
 */
ChatService.prototype.makeChatMsg = function (player, msg) {
    const realMsg = {
        param: [],
        ...msg,
        id: this.app.Id.genNext(code.id.KEYS.CHAT),
        time: util.time.nowSecond(),
        sender: this._makeSelfBase(player),
    };
    delete realMsg['__route__'];
    return realMsg;
};

/**
 * 生成发送者信息:协议roleChatBase内容
 */
ChatService.prototype._makeSelfBase = function (player) {
    return {
        uid: player.uid.toString(),
        name: player.name,
        vipLv: player.vip,
        headId: player.headImageId,
        status: code.chat.ONLINE,
    };
};

/**
 * 聊天内容是否需要记录sql日志
 */
ChatService.prototype._needChatLog = function (msg) {
    // 系统消息不要记录
    if (msg.msgType == code.chat.MSG_TYPE.SYSTEM) {
        return false;
    }
    // 模板消息不要记录
    if (msg.templateId > 0) {
        return false;
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

/**
 * 从世界聊天缓存中取数据
 */
ChatService.prototype._getWorldCache = async function () {
    // 取最新的10条,
    const {err, res} = await this.app.Redis.zrange(code.redis.CHAT_WORLD_HISTORY.name, -10, -1);
    return err ? [] : res.map( e => { return JSON.parse(e); });
};

/**
 * 从商会聊天缓存中取数据
 */
ChatService.prototype._getGuildCache = async function (guildId) {
    if (guildId) {
        // 取本商会中最新的10条
        const {err, res} = await this.app.Redis.zrange([code.redis.CHAT_GUILD_HISTORY.name, guildId], -10, -1);
        return err ? [] : res.map(e => { return JSON.parse(e); });
    } else {
        return [];
    }
};

/**
 * 从角色的离线数据中获取离线的私聊信息
 */
ChatService.prototype._getPrivateCache = async function (uid) {
    const {err, res} = await this.app.rpcs.global.offlineRemote.takeOfflinePrivateChat({}, uid);
    return err ? [] : res;
};
