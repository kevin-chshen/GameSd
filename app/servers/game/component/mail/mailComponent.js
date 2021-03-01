/**
 * @description 邮件组件
 * @author linjs
 * @date 2020/04/11
 */

const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const bearcat = require('bearcat');
const util = require('@util');
const code = require('@code');

const MailComponent = function(app, player) {
    this.$id = 'game_MailComponent';
    this.$scope = 'prototype';
    this.app = app;
    this.player = player;
    this.loadOfflineMailPromise = null; // 加载离线邮件
    this.loadGlobalMailPromise = null;  // 加载全局邮件
};

module.exports = MailComponent;
bearcat.extend('game_MailComponent', 'game_Component');

/**
 * 角色对象初始化是调用
 */
MailComponent.prototype.onInit = async function () {
    logger.debug(`player:${this.player.uid} component: ${this.$id} onInit`);
};

/**
 * 角色数据加载完成时调用
 */
MailComponent.prototype.onLoad = async function () {
    logger.debug(`player:${this.player.uid} component: ${this.$id} onLoad`);
};

/**
 * 角色登录时调用
 */
MailComponent.prototype.onAfterLogin = async function () {
    // 通知global服加载离线邮件和全局邮件
    this.loadOfflineMailPromise = this._loadOfflineMail();
    this.loadGlobalMailPromise = this._loadGlobalMail();
    logger.debug(`player:${this.player.uid} component: ${this.$id} onLogin`);
};

/**
 * 角色重新登录时调用
 */
MailComponent.prototype.onReLogin = async function () {
    logger.debug(`player:${this.player.uid} component: ${this.$id} onReLogin`);
};

/**
 * 角色重连时调用
 */
MailComponent.prototype.onReConnect = async function () {
    logger.debug(`player:${this.player.uid} component: ${this.$id} onReConnect`);
};


/**
 * 角色登出调用
 */
MailComponent.prototype.onLogout = async function () {
    logger.debug(`player:${this.player.uid} component: ${this.$id} onLogout`);
};

/**
 * 角色跨天时调用
 */
MailComponent.prototype.onDayChange = async function () {
    logger.debug(`player:${this.player.uid} component: ${this.$id} onDayChange`);
};

/**
 * 查询玩家的邮件列表
 */
MailComponent.prototype.query = async function () {
    await this.loadOfflineMailPromise;
    await this.loadGlobalMailPromise;
    return Object.values(this.player.mail);
};

/**
 * 读取邮件
 */
MailComponent.prototype.read = function (mailIdList) {
    const errorNo = [];
    const mails = mailIdList.filter((mailId) => {
        const mail = this.player.mail[mailId];
        if (!util.mail.isValidMail(mail)) {
            errorNo.push(code.err.ERR_MAIL_HAD_EXPIRED);
            return true;
        }
        if (mail && mail.status == code.mail.STATUS.UNREAD) {
            mail.status = code.mail.STATUS.READ;
            this.app.Log.updateMailLog(this.player, mail.id, code.mail.STATUS.READ);
            return true;
        }
        return false;
    });
    return [ mails, errorNo ];
};

/**
 * 收取邮件附件
 */
MailComponent.prototype.receive = function (mailIdList) {
    const receiveId = [];
    let itemVec = [];
    const errorNo = [];
    const mailMap = this.player.mail;
    for (const mailId of mailIdList) {
        const mail = mailMap[mailId];
        // 邮件过期
        if (!util.mail.isValidMail(mail)) {
            errorNo.push(code.err.ERR_MAIL_HAD_EXPIRED);
            continue;
        }
        // 有没有待领取的附件
        if (!util.mail.haveUnreceivedItem(mail)) {
            continue;
        }
        // 检查能否完整领取
        const errNo = this.player.Item.isCanAddWithErrNo(mail.item);
        if (errNo != code.err.SUCCEEDED) {
            if (!errorNo.includes(errNo)) {
                errorNo.push(errNo);
            }
            continue;
        }

        // 修改状态
        mail.status = code.mail.STATUS.RECEIVED;
        this.app.Log.updateMailLog(this.player, mail.id, code.mail.STATUS.RECEIVED);
        // 领取
        this.player.Item.addItem(mail.item, code.reason.OP_MAIL_GET);

        // 领取成功
        receiveId.push(mailId);
        itemVec = itemVec.concat(mail.item);
    }
    return {id: receiveId, item: util.proto.encodeAward(itemVec), errorNo};
};

/**
 * 删除邮件
 */
MailComponent.prototype.delete = function (mailIdList) {
    return mailIdList.filter((mailId) => {
        const mail = this.player.mail[mailId];
        if (util.mail.canDelete(mail)) {
            delete this.player.mail[mailId];
            return true;
        }
        return false;
    });
};

/**
 * 往邮件列表里面添加邮件
 * @param {Array} mailList 要添加的邮件
 * @return {Array} 添加的邮件(分配好id)
 */
MailComponent.prototype.addMail = function (mailList, notifyClient) {
    const addMailList = mailList.map((mail) => {
        this.player.lastMailId += 1;
        const addMail = util.mail.fillMail({...mail, id: this.player.lastMailId});
        this.player.mail[this.player.lastMailId] = addMail;
        this.app.Log.mailLog(this.player, addMail);
        return addMail;
    });
    // 增加邮件,通知客户端
    if (addMailList.length > 0 && notifyClient) {
        this.player.Notify.notify("newMailNotify", { list: util.mail.toClientMail(addMailList) });
    }
    return true;
};

/**
 * 加载离线邮件
 */
MailComponent.prototype._loadOfflineMail = async function () {
    return this.app.rpcs.global.mailRemote.takeOfflineMail({}, this.player.uid).then(({err, res}) => {
        if (err != null) {
            logger.error(`player [${this.player.uid}] offline mail take error: ${err}`);
        } else {
            if (res.length > 0) {
                this.addMail(res, false);
            }
        }
    });
};

/**
 * 加载全局邮件
 */
MailComponent.prototype._loadGlobalMail = async function () {
    return this.app.rpcs.global.mailRemote.takeGlobalMail({}, this.player.uid, this.player.vip).then(({err, res}) => {
        if (err != null) {
            logger.error(`player [${this.player.uid}] global mail take error: ${err}`);
        } else {
            if (res.length > 0) {
                this.addMail(res, false);
            }
        }
    });
};


