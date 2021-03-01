/**
 * @description 系统配置读取服务
 * @author linjs
 * @date 2020/03/31
 */

const bearcat = require('bearcat');
const path = require('path');
const code = require('@code');
const util = require('@util');

const SystemConfigService = function () {
    this.$id = 'logic_SystemConfigService';
    this.app = null;
    this.chatAbbr = "";
};
module.exports = SystemConfigService;
bearcat.extend('logic_SystemConfigService', 'logic_BaseService');

/**
 * 加载配置,并全部设置到自身
 */
SystemConfigService.prototype.init = async function () {
    // 加载对应的配置
    const env = this.app.get('env') || 'development';
    this.app.loadConfig('systemConfig', path.join(this.app.getBase(), 'config', env, 'system.json'));
    const config = this.app.get('systemConfig');
    Object.assign(this, config);

    // 生成abbr配置
    this.chatAbbr = code.system.ABBR; //+ this.platform.split('_').join('');
};

/**
 * 获取平台
 */
SystemConfigService.prototype.getPlatform = function () {
    return this.platform;
};

/**
 * 获得主服务器id
 */
SystemConfigService.prototype.getServerId = function () {
    return this.serverIdList[0];
};

/**
 * 获取所有服务器id
 */
SystemConfigService.prototype.getAllServerId = function () {
    return this.serverIdList;
};

/**
 * 是否有效的服务器id
 */
SystemConfigService.prototype.isValidServerId = function (serverId) {
    return this.serverIdList.includes(serverId);
};

/**
 * 获取agentId
 */
SystemConfigService.prototype.getAgentId = function () {
    return this.agentIdList[0];
};

/**
 * 获取所有agentId
 */
SystemConfigService.prototype.getAllAgentId = function () {
    return this.agentIdList;
};

/**
 * 是否有效的agentId
 */
SystemConfigService.prototype.isValidAgentId = function (agentId) {
    return this.agentIdList.includes(agentId);
};

/**
 * 获取聊天记录用的abbr缩写
 */
SystemConfigService.prototype.getChatAbbr = function () {
    return this.chatAbbr;
};

/**
 * 开服时间字符串
*/
SystemConfigService.prototype.getServerOpenStr = function () {
    return this.serverOpenTime;
};

/**
 * 开服时间戳秒
*/
SystemConfigService.prototype.getServerOpenTs = function () {
    return util.time.ms2s((new Date(this.serverOpenTime)).getTime());
};

/**
 * 开服时间戳毫秒
*/
SystemConfigService.prototype.getServerOpenMs = function () {
    return (new Date(this.serverOpenTime)).getTime();
};

/**
 * 后台web 服务器端口
*/
SystemConfigService.prototype.getWebBackendPort = function () {
    return this.webBackendPort;
};

/**
 * 蜂鸟web 服务器端口
*/
SystemConfigService.prototype.getWebPort = function () {
    return this.webPort;
};

/**
 * 是否是跨服服务器
 */
SystemConfigService.prototype.isCross = function(){
    return this.isCrossServers==true? true:false;
};

/**
 * ipDb目录路径
 */
SystemConfigService.prototype.getIpDbDir = function(){
    return path.resolve(this.app.getBase(), this.ipDbPath || "");
};