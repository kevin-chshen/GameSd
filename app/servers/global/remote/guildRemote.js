/**
 * @description global服公会相关的远程调用
 * @author chenyq
 * @date 2020/04/28
 */

// const logger = require('pomelo-logger').getLogger('pomelo', __filename);

module.exports = function (app) {
    return new Remote(app);
};

const Remote = function (app) {
    this.app = app;
};

/**
 * 玩家登陆 公会处理
 * @param {Integer} uid 角色id
 * @param {Function} cb
 */
Remote.prototype.loginGuildProcess = async function (uid, cb) {
    const res = await this.app.Guild.loginGuildProcess(uid);
    // logger.info("____ loginGuildProcess %d",uid, res);
    cb(null, res);
};

/**
 * 玩家登出 公会处理
 * @param {Integer} uid 角色id
 * @param {Function} cb
 */
Remote.prototype.logoutGuildProcess = async function (uid, cb) {
    await this.app.Guild.logoutGuildProcess(uid);
    // logger.info("____ logoutGuildProcess %d",uid);
    cb(null);
};

/**
 * 增加联盟经验
 */
Remote.prototype.addGuildExp = async function(uid, exp, cb){
    await this.app.Guild.addGuildExp(uid, exp);
    cb(null);
};

/**
 * 增加联盟贡献
 */
Remote.prototype.addGuildContribute = async function(uid, num, actionId, cb){
    await this.app.Guild.addGuildContribute(uid, num, actionId);
    cb(null);
};
/**
 * 扣除联盟贡献
 */
Remote.prototype.delGuildContribute = async function(uid, num, actionId, cb){
    await this.app.Guild.delGuildContribute(uid, num, actionId);
    cb(null);
};
/**
 * 获取联盟等级
 */
Remote.prototype.getGuildLvFromUid = async function(uid, cb){
    const lv = await this.app.Guild.getGuildLvFromUid(uid);
    cb(null, lv);
};
/**
 * 根据公会名称获取成员uids
 */
Remote.prototype.getMemberFromGuildName = async function(name, cb){
    const uids = await this.app.Guild.getMemberFromGuildName(name);
    cb(null, uids);
};

/**
 * 清除离开联盟cd
 */
Remote.prototype.clearLeaveTime = async function(uid, cb){
    await this.app.Guild.clearLeaveTime(uid);
    cb(null);
};


/**
 * 获取联盟信息
*/
Remote.prototype.getGuildInfo = async function(uid, cb) {
    const guildInfo = await this.app.Guild.getGuildInfo(uid);
    cb(null, guildInfo);
};

/**
 * 修改联盟公告
*/
Remote.prototype.modifyGuildNoticeAndmanifesto = async function (uid, name, guildId, notice, cb) {
    this.app.Guild.guildChangeNoticeAndmanifesto(uid, name, guildId, notice);
    cb(null);
};