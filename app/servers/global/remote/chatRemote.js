/**
 * @description 活动远程调用
 * @author chshen
 * @date 2020/06/11
 */

module.exports = function (app) {
    return new Remote(app);
};

const Remote = function (app) {
    this.app = app;
};

/**
 * 发送世界频道系统消息
 */
Remote.prototype.worldSysChat = async function(content, cb) {
    await this.app.Chat.worldSysChat(content);
    cb(null);
};

/**
 * 发送世界频道系统消息(基于模板)
 */
Remote.prototype.worldSysTpltChat = async function (templateId, param, cb) {
    await this.app.Chat.worldSysTpltChat(templateId, param);
    cb(null);
};

/**
 * 发送跑马灯频道系统消息
 */
Remote.prototype.bannerSysChat = async function (content, cb) {
    await this.app.Chat.bannerSysChat(content);
    cb(null);
};

/**
 * 发送跑马灯频道系统消息(基于模板)
 */
Remote.prototype.bannerSysTpltChat = async function (templateId, param, cb) {
    await this.app.Chat.worldSysChat(templateId, param);
    cb(null);
};

/**
 * 发送联盟频道系统信息
 */
Remote.prototype.guildSysChat = async function (guildId, content, cb) {
    await this.app.Chat.worldSysChat(guildId, content);
    cb(null);
};

/**
 * 发送联盟频道系统信息:基于模板
 */
Remote.prototype.guildSysTpltChat = async function (guildId, templateId, param, cb) {
    await this.app.Chat.worldSysChat(guildId, templateId, param);
    cb(null);
};