/**
 * @description 通知服务相关的远程调用
 * @author linjs
 * @date 2020/04/21
 */

module.exports = function (app) {
    return new Remote(app);
};

const Remote = function (app) {
    this.app = app;
};

/**
 * 全服广播
 * @param {String} messageName 消息名称,协议名称
 * @param {Object} data 消息内容
 */
Remote.prototype.broadcast = async function (messageName, data, cb) {
    this.app.Notify.broadcast(messageName, data);
    cb(null, true);
};


/**
 * 全公会广播
 * @param {Integer} guildId 目标公会id
 * @param {String} messageName 消息名称,协议名称
 * @param {Object} data 消息内容
 */
Remote.prototype.guildBroadcast = async function (guildId, messageName, data, cb) {
    this.app.Notify.guildBroadcast(guildId, messageName, data);
    cb(null, true);
};
