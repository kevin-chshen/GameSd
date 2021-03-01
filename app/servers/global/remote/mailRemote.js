/**
 * @description 邮件相关的远程调用
 * @author linjs
 * @date 2020/04/10
 */

module.exports = function(app) {
    return new Remote(app);
};

const Remote = function(app) {
    this.app = app;
};

/**
 * 从离线邮件列表中拿出自己的邮件
 * @param {Integer} uid 角色id
 * @param {Function} cb
 */
Remote.prototype.takeOfflineMail = async function (uid, cb) {
    const mailList = await this.app.OfflineData.takeMail(uid);
    cb(null, mailList);
};

/**
 * 添加全局邮件
 * @param {Object} mail
 * @param {Function} cb
 */
Remote.prototype.addGlobalMail = async function (mail, cb) {
    await this.app.GlobalMail.addMail(mail);
    cb(null);
};

/**
 * 从全局邮件中拿出自己未获得的邮件
 * @param {Integer} uid 角色id
 * @param {Function} cb
 */
Remote.prototype.takeGlobalMail = async function (uid, vip, cb) {
    const mailList = await this.app.GlobalMail.takeMail(uid, vip);
    cb(null, mailList);
};

/**
 * 给某些人发送订制邮件
 * @param {Integer} uid 角色id
 * @param {Object} mail 定制邮件内容
 * @param {Function} cb (返回Void)
 */
Remote.prototype.sendCustomMail2Uids = function (uids, mail, cb) {
    uids.map((uid) =>{
        this.app.Mail.sendCustomMail(uid, mail);
    });
    
    cb(null);
};

/**
 * 给某人发送订制邮件
 * @param {Integer} uid 角色id
 * @param {Object} mail 定制邮件内容
 * @param {Function} cb
 */
Remote.prototype.sendCustomMail = async function (uid, mail, cb) {
    const result = await this.app.Mail.sendCustomMail(uid, mail);
    cb(null, result);
};

/**
 * 发送全局邮件
 * @param {Object} mail 定制的全局邮件内容
 * @param {Function} cb
 */
Remote.prototype.sendGlobalMail = async function (mail, cb) {
    const result = await this.app.GlobalMail.addMail(mail);
    cb(null, result);
};
