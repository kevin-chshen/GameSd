/**
 * @description 邮件相关工具函数
 * @author linjs
 * @date 2020/04/10
 */

const code = require('@code');
const util = require('@util');
const assert = require('assert');

/**
 * 补齐邮件结构体
 * @param {Object} o 订制的邮件参数
 * @return {Object} 新生成的邮件结构体
 */
module.exports.fillMail = function (o) {
    const initMail = {
        id: 0,
        title: "",
        content: "",
        item: [],
        type: code.mail.TYPE.SYSTEM,
        sendTime: 0,
        expirationTime: 0,
        status: code.mail.STATUS.UNREAD, 
    };
    const mail = Object.assign(initMail, o);
    assert(mail.id > 0, `fill mail error, mail id ${mail.id}`);
    mail.status = mail.item.length > 0 ? code.mail.STATUS.UNRECEIVED : code.mail.STATUS.UNREAD;
    return mail;
};

/**
 * 是否拥有未领取的附件
 */
module.exports.haveUnreceivedItem = function (mail) {
    // 有效的邮件
    if (!this.isValidMail(mail)) {
        return false;
    }

    // 附件未领取
    if (mail.status != code.mail.STATUS.UNRECEIVED) {
        return false;
    }

    // 有物品
    return mail.item && mail.item.length > 0;
};

/**
 * 邮件能否删除
 * 1.已读或者已领取附件的邮件可以删除
 * 2.过期的邮件也可以删除
 */
module.exports.canDelete = function (mail) {
    // 已读或者已领取附件的邮件可以删除
    if (mail.status == code.mail.STATUS.READ || mail.status == code.mail.STATUS.RECEIVED) {
        return true;
    }
    // 过期的邮件也可以删除
    if (!this.isValidMail(mail)) {
        return true;
    }

    return false;
};

/**
 * 是否有效的邮件
 * 1.在生命周期内
 * @param {Object} mail
 */
module.exports.isValidMail = function (mail) {
    if (mail.expirationTime > 0 && mail.expirationTime < util.time.nowSecond()) {
        return false;
    }
    return true;
};

/**
 * 是否有效的全局邮件
 * 1.在生命周期内
 * @param {Object} mail
 */
module.exports.isValidGlobalMail = function (mail) {
    const expirationTime = mail.get('expirationTime');
    if (expirationTime && expirationTime > 0 && expirationTime < util.time.nowSecond()) {
        return false;
    }
    return true;
};

/**
 * 将邮件列表转换成客户端格式
 * @param {Array} mailList 邮件列表
 */
module.exports.toClientMail = function (mailList) {
    return mailList.map((mail) => {
        return {...mail, item: util.proto.encodeAward(mail.item)};
    });
};
