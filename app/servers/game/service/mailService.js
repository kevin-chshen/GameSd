/**
 * @description 本地的邮件服务
 * @author linjs
 * @date 2020/04/14
 */

const bearcat = require('bearcat');
const util = require('@util');
const code = require('@code');

const MailService = function () {
    this.$id = 'game_MailService';
    this.app = null;
};

module.exports = MailService;
bearcat.extend('game_MailService', 'logic_BaseService');

/**
 * 发送邮件
 * @param {Integer} uid 目标uid
 * @param {Integer} mailId 邮件id
 */
MailService.prototype.sendTpltMail = async function(uid, mailId) {
    const mail = this.createTpltMail(mailId);
    return this.sendCustomMail(uid, mail);
};

/**
 * 发送定制邮件
 * @param {Integer} uid 目标uid
 * @param {String} title 邮件标题
 * @param {String} content 内容
 * @param {Array} item 物品列表 util.proto.encodeConfigAward()转换好的结果
 * @param {Object} ops 其他订制参数 
 */
MailService.prototype.sendMail = async function (uid, title, content, item, ops = {}) {
    const mail = this.createCustomMail(title, content, item, ops);
    return this.sendCustomMail(uid, mail);
};

/**
 * 发送定制邮件
 * @param {Integer} uid 目标uid
 * @param {Object} mail 邮件结构体
 */
MailService.prototype.sendCustomMail = async function (uid, mail) {
    // 如果是gameServer的在线玩家,直接增加
    const player = this.app.Player.getPlayerByUid(uid);
    if (player) {
        player.Mail.addMail([mail], true);
        return true;
    } else {
        return await this.app.rpcs.global.mailRemote.sendCustomMail({}, uid, mail);
    }
};

/**
 * 某个玩家接收邮件
 * @param {Integer} uid 目标uid
 * @param {Array} mailList 邮件列表
 */
MailService.prototype.addMail = function (uid, mailList) {
    uid = Number(uid);
    const player = this.app.Player.getPlayerByUid(uid);
    if (player) {
        return player.Mail.addMail(mailList, true);
    }
    return false;
};

/**
 * 从配置表生成邮件
 */
MailService.prototype.createTpltMail = function (mailId, o = {}) {
    const mailTplt = this.app.Config.Mail.get(mailId);
    const now = util.time.nowSecond();
    const mail = {
        title: mailTplt.Name || "",
        content: mailTplt.Text || "",
        item: mailTplt.Item ? util.proto.encodeConfigAward(mailTplt.Item) : [],
        type: code.mail.TYPE.SYSTEM,
        sendTime: now,
        expirationTime: mailTplt.ExpirationTime > 0 ? now + mailTplt.ExpirationTime : 0,
        status: mailTplt.Item && mailTplt.Item.length > 0 ? code.mail.STATUS.UNRECEIVED : code.mail.STATUS.UNREAD,
    };
    return Object.assign(mail, o);
};

/**
 * 定制参数生成邮件
 */
MailService.prototype.createCustomMail = function (title, content, item, ops = {}) {
    const now = util.time.nowSecond();
    const mail = {
        title: title || "",
        content: content || "",
        item: item ? item : [],
        type: code.mail.TYPE.SYSTEM,
        sendTime: now,
        expirationTime: 0,
        status: item.length > 0 ? code.mail.STATUS.UNRECEIVED : code.mail.STATUS.UNREAD,
    };
    return Object.assign(mail, ops);
};


/**
 * 发送重复充值邮件
*/
MailService.prototype.sendMailRepeatPay = function (uid, mailId, diamond, name) {
    const nodeSec = util.time.nowSecond();
    const reward = { 1: diamond };
    const mailConfig = this.app.Config.Mail.get(mailId);
    const content = util.format.format(mailConfig.Text, name, diamond);
    const mail = {
        title: util.format.format(mailConfig.Name, name) || "",
        content: content || "",
        item: reward ? util.proto.encodeConfigAward(reward) : [],
        type: code.mail.TYPE.SYSTEM,
        sendTime: nodeSec,
        expirationTime: mailConfig.ExpirationTime > 0 ? nodeSec + mailConfig.ExpirationTime : 0,
        status: reward ? code.mail.STATUS.UNRECEIVED : code.mail.STATUS.UNREAD,
    };
    this.app.Mail.sendCustomMail(uid, mail);
};

/**
 * 发送运营活动邮件
*/
MailService.prototype.sendOperateActivityMail = function (uid, mailId, reward, param) {
    const nodeSec = util.time.nowSecond();
    const mailConfig = this.app.Config.Mail.get(mailId);
    let content = "";
    if (param) {
        content = util.format.format(mailConfig.Text, param);
    } else {
        content = mailConfig.Text;
    }
    const mail = {
        title: mailConfig.Name || "",
        content: content || "",
        item: reward ? util.proto.encodeConfigAward(reward) : [],
        type: code.mail.TYPE.SYSTEM,
        sendTime: nodeSec,
        expirationTime: mailConfig.ExpirationTime > 0 ? nodeSec + mailConfig.ExpirationTime : 0,
        status: reward ? code.mail.STATUS.UNRECEIVED : code.mail.STATUS.UNREAD,
    };
    this.app.Mail.sendCustomMail(uid, mail);
};
