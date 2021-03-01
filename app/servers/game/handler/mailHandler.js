/**
 * @description 邮件消息处理
 * @author linjs
 * @date 2020/04/11
 */

const code = require('@code');
const util = require('@util');

module.exports = function (app) {
    return new Handler(app);
};

const Handler = function (app) {
    this.app = app;
};

/**
 * 查询邮件列表
 */
Handler.prototype.queryMail = async function (msg, session, next) {
    const player = session.player;
    const mailList = await player.Mail.query();
    next(null, { code: code.err.SUCCEEDED, list: util.mail.toClientMail(mailList) });
};

/**
 * 读取邮件
 */
Handler.prototype.readMail = async function (msg, session, next) {
    const player = session.player;
    const [readList, errorNo] = player.Mail.read(msg.id);
    // 前端默认只读取一条邮件，所以只要一个错误码就可以，如果要显示多个错误码再与客户端协商，发错误码列表
    let resCode = code.err.SUCCEEDED;
    if (errorNo.length > 0) {
        resCode = errorNo[0];
    }
    next(null, { code: resCode, id: readList });
};

/**
 * 收取邮件附件
 */
Handler.prototype.receiveMail = async function (msg, session, next) {
    const player = session.player;
    const { id, item, errorNo } = player.Mail.receive(msg.id);
    next(null, { code: code.err.SUCCEEDED, id, item, errorNo });
};

/**
 * 删除邮件
 */
Handler.prototype.deleteMail = async function (msg, session, next) {
    const player = session.player;
    const id = player.Mail.delete(msg.id);
    next(null, { code: code.err.SUCCEEDED, id });
};

