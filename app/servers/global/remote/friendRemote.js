/**
 * @description 好友相关远程调用
 * @author linjs
 * @date 2020/04/25
 */

module.exports = function(app) {
    return new Remote(app);
};

const Remote = function(app) {
    this.app = app;
};

/**
 * 是否好友
 */
Remote.prototype.isFriend = async function (uid, targetUid, cb) {
    cb(null, await this.app.Friend.isFriend(uid, targetUid));
};

/**
 * 是否黑名单
 */
Remote.prototype.isBlock = async function (uid, targetUid, cb) {
    cb(null, await this.app.Friend.isBlock(uid, targetUid));
};

/**
 * 获取好友
 */
Remote.prototype.getFriends = async function(uid, cb){
    cb(null, await this.app.Friend.getFriends(uid));
};