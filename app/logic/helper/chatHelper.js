/**
 * @description 聊天相关帮助函数
 * @author linjs
 * @date 2020/05/06
 */

const bearcat = require('bearcat');
const code = require('@code');
const util = require('@util');

const ChatHelper = function () {
    this.$id = 'logic_ChatHelper';
    this.name = 'Chat';
    this.app = null;
};

module.exports = ChatHelper;
bearcat.extend('logic_ChatHelper', 'logic_BaseHelper');

/**
 * 发送世界频道系统消息
 */
ChatHelper.prototype.worldSysChat = async function (content) {
    const msg = {
        msgType: code.chat.MSG_TYPE.SYSTEM,
        channelId: code.chat.CHANNEL.WORLD,
        text: content,
        voice: '',
        templateId: 0,
        voiceTime: 0,
        targetUid: '0',
        param: [],
    };
    await this.app.Chat.simulateChat(msg);
};

/**
 * 发送世界频道系统消息(基于模板)
 */
ChatHelper.prototype.worldSysTpltChat = async function (templateId, param) {
    const msg = {
        msgType: code.chat.MSG_TYPE.SYSTEM,
        channelId: code.chat.CHANNEL.WORLD,
        text: '',
        voice: '',
        templateId: templateId,
        voiceTime: 0,
        targetUid: '0',
        param: param || [],
    };
    await this.app.Chat.simulateChat(msg);
};

/**
 * 发送跑马灯频道系统消息
 */
ChatHelper.prototype.bannerSysChat = async function (content) {
    const msg = {
        msgType: code.chat.MSG_TYPE.SYSTEM,
        channelId: code.chat.CHANNEL.BANNER,
        text: content,
        voice: '',
        templateId: 0,
        voiceTime: 0,
        targetUid: '0',
        param: [],
    };
    await this.app.Chat.simulateChat(msg);
};

/**
 * 发送跑马灯频道系统消息(基于模板)
 */
ChatHelper.prototype.bannerSysTpltChat = async function (templateId, param) {
    const msg = {
        msgType: code.chat.MSG_TYPE.SYSTEM,
        channelId: code.chat.CHANNEL.BANNER,
        text: '',
        voice: '',
        templateId: templateId,
        voiceTime: 0,
        targetUid: '0',
        param: param || [],
    };
    await this.app.Chat.simulateChat(msg);
};

/**
 * 发送联盟频道系统信息
 */
ChatHelper.prototype.guildSysChat = async function (guildId, content) {
    const msg = {
        msgType: code.chat.MSG_TYPE.SYSTEM,
        channelId: code.chat.CHANNEL.GUILD,
        text: content,
        voice: '',
        templateId: 0,
        voiceTime: 0,
        targetUid: guildId,
        param: [],
    };
    await this.app.Chat.simulateChat(msg);
};

/**
 * 发送联盟频道系统信息:基于模板
 */
ChatHelper.prototype.guildSysTpltChat = async function (guildId, templateId, param) {
    const msg = {
        msgType: code.chat.MSG_TYPE.SYSTEM,
        channelId: code.chat.CHANNEL.GUILD,
        text: '',
        voice: '',
        templateId: templateId,
        voiceTime: 0,
        targetUid: guildId,
        param: param || [],
    };
    await this.app.Chat.simulateChat(msg);
};

/**
 * 发送私聊系统消息
 */
ChatHelper.prototype.privateSysChat = async function (targetUid, content) {
    const msg = {
        msgType: code.chat.MSG_TYPE.SYSTEM,
        channelId: code.chat.CHANNEL.GUILD,
        text: content,
        voice: '',
        templateId: 0,
        voiceTime: 0,
        targetUid: targetUid,
        param: [],
    };
    await this.app.Chat.simulateChat(msg);
};

/**
 * 发送私聊系统消息(基于模板)
 */
ChatHelper.prototype.privateSysTpltChat = async function (targetUid, templateId, param) {
    const msg = {
        msgType: code.chat.MSG_TYPE.SYSTEM,
        channelId: code.chat.CHANNEL.GUILD,
        text: '',
        voice: '',
        templateId: templateId,
        voiceTime: 0,
        targetUid: targetUid,
        param: param || [],
    };
    await this.app.Chat.simulateChat(msg);
};

/**
 * 生成模拟的聊天信息:协议roleMsg内容
 */
ChatHelper.prototype.makeSimulateChatMsg = function (msg) {
    const realMsg = {
        ...msg,
        id: this.app.Id.genNext(code.id.KEYS.CHAT),
        time: util.time.nowSecond(),
    };
    // 系统聊天,发送者的uid为0
    if (msg.msgType == code.chat.MSG_TYPE.SYSTEM) {
        realMsg.sender = {
            uid: code.chat.SYSTEM_CHAT_UID,
            name: '',
            vipLv: 0,
            headId: 0,
            status: code.chat.ONLINE
        };
    }
    delete realMsg['__route__'];
    return realMsg;
};
