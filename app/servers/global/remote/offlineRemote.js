/**
 * @description 离线服务
 * @author linjs
 * @date 2020/04/23
 */

module.exports = function (app) {
    return new Remote(app);
};

const Remote = function (app) {
    this.app = app;
};

/**
 * 增加一个离线聊天信息
 * @param {Object} msg 参考协议roleMsg
 * @param {Function} cb
 */
Remote.prototype.addOfflinePrivateChat = async function (msg, cb) {
    await this.app.OfflineData.addPrivateChat(msg);
    cb(null);
};

/**
 * 获取玩家的离线私聊信息
 * @param {Integer} uid 
 */
Remote.prototype.takeOfflinePrivateChat = async function (uid, cb) {
    const msgList = await this.app.OfflineData.takePrivateChat(uid);
    cb(null, msgList);
};

/**
 * 清空玩家离线私聊信息
 * @param {Integer} uid 
 */
Remote.prototype.cleanOfflinePrivateChat = async function (uid, cb) {
    const msgList = await this.app.OfflineData.cleanPrivateChat(uid);
    cb(null, msgList);
};



/**
 * 增加一个禁言信息
*/
Remote.prototype.addOfflineBanChat = async function(uid, param, cb) {
    await this.app.OfflineData.addBanChat(uid, param);
    cb(null);
};

/**
 * 获取玩家禁言信息
*/
Remote.prototype.takeOfflineBanChat = async function (uid, cb) {
    const param = await this.app.OfflineData.takeBanChat(uid);
    cb(null, param);
};