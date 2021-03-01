/**
 * @description 聊天内容落地服务
 * @author linjs
 * @date 2020/04/23
 */

const logger = require('pomelo-logger').getLogger('chat-log');
const bearcat = require('bearcat');
const code = require('@code');

const ChatDumpService = function () {
    this.$id = 'log_ChatDumpService';
    this.app = null;
};

module.exports = ChatDumpService;
bearcat.extend('log_ChatDumpService', 'logic_BaseService');

/**
 * 将聊天记录写入到chatlog文件夹底下
 */
ChatDumpService.prototype.dumpChat = function (msg) {
    // 格式为: 游戏简称|服务器代号|平台帐号|玩家角色|玩家 IP|设备ID<<<角色ID<<<频道ID/私聊时接收方平台帐号>>>聊天内容
    const info = `${this.app.SystemConfig.getChatAbbr()}|\
${this.app.SystemConfig.getServerId()}|\
${msg.account_name}|\
${msg.role_name}|\
${msg.user_ip}|\
${msg.did}<<<\
${msg.role_id}<<<\
${msg.channel == code.chat.CHANNEL.PRIVATE ? msg.target_role_id : msg.channel}>>>\
${msg.msg}`;
    logger.info(info);
};