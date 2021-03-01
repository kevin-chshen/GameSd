/**
 * @description game服邮件相关的远程调用
 * @author linjs
 * @date 2020/04/14
 */

module.exports = function(app) {
    return new Remote(app);
};

const Remote = function(app) {
    this.app = app;
};

/**
 * 给某人发送订制邮件
 * @param {Integer} uid 角色id
 * @param {Object} mail 定制邮件内容
 * @param {Function} cb
 */
Remote.prototype.sendCustomMail = async function (uid, mail, cb) {
    const result = this.app.Mail.addMail(uid, [mail]);
    cb(null, result);
};
