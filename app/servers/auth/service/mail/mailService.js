/**
 * @description handler服务account
 * @author chshen
 * @date 2020/06/11
 */
const bearcat = require('bearcat');
const code = require('@code');
const util = require('@util');

const MailService = function () {
    this.$id = 'auth_MailService';
    this.app = null;
};
module.exports = MailService;
bearcat.extend('auth_MailService', 'logic_BaseService');

MailService.prototype.sendMail = async function(param) {
    const dur = Number(param.existDay) == 0 ? code.global.ONE_DAY_MS : Number(param.existDay) * code.global.ONE_DAY_MS;
    const now = util.time.nowSecond();
    const mail = {
        title: param.mailTitle,
        content: param.mailContent,
        item: [],
        type: code.mail.TYPE.OPERATE,
        sendTime: now,
        expirationTime: now + util.time.ms2s(dur),
        status: code.mail.STATUS.UNREAD,
    };
    // 全服
    if (Number(param.sendType) == 5) {
        this.app.rpcs.global.mailRemote.addGlobalMail({}, mail);
    } else {
        const uids = await this._getUids(param);
        this.app.rpcs.global.mailRemote.sendCustomMail2Uids({}, uids, mail);
    }
};


MailService.prototype._getUids = async function(param) {
    switch (Number(param.sendType)) {
    case 1:
        return await this.app.Helper.OperateMail.getUidsFromName(param.roleName);
    case 2:
        return param.roleId.split(',');
    case 3:
        return await this.app.Helper.OperateMail.getUidsFromAccount(param.roleName);
    // 指定条件
    case 4:
        // 指定条件先不处理
        return await this.app.Helper.OperateMail.getUidsFromCondition(
            param.minVip, param.maxVip, param.minLevel, param.maxLevel, param.minLoginTime, param.maxLoginTime,
            param.minLoginOutTime, param.maxLoginOutTime, param.minRegTime, param.maxRegTime, param.sex, param.career, param.guild, param.vipType);
    // 全服
    case 5:
        // 不在这里处理
        return [];
    // 在线玩家
    case 6:
        return await this.app.Helper.OperateMail.getUidsFromOnline(param.vipType);
    // 赛季玩家
    case 7:
        return [];
    // 非赛季玩家
    case 8:
        return [];
    default:
        return [];
    }
};