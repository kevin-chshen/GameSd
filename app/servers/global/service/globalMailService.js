/**
 * @description 全局邮件服务
 * @author linjs
 * @date 2020/04/10
 */

const bearcat = require('bearcat');
const code = require('@code');
const util = require('@util');

const GlobalMailService = function () {
    this.$id = 'global_GlobalMailService';
    this.app = null;
};

module.exports = GlobalMailService;
bearcat.extend('global_GlobalMailService', 'logic_MongoBaseService');
GlobalMailService.prototype.mongoDataClassFunc = require('@mongo/mongoGlobalMail');
GlobalMailService.prototype.uidKey = 'id';
GlobalMailService.prototype.needClean = false;  // 永久缓存,不需要清理

/**
 * 初始化全局邮件服务
 * 1.加载数据里的所有邮件
 */
GlobalMailService.prototype.init = async function () {
    const allData = await this.loadAll();
    allData.filter(data => {
        if (!util.mail.isValidGlobalMail(data)) {
            this.delete(data.get('id'));
        }
    });
};

/**
 * 玩家获取全局邮件
 */
GlobalMailService.prototype.takeMail = async function (uid, vip) {
    const allMail = this.getAllData();
    const addMail = [];
    for (const mail of allMail) {
        // 邮件有效,就不用发了
        if (!util.mail.isValidGlobalMail(mail)) {
            continue;
        }

        const received = mail.get('received') || {};
        // 玩家已经领取过该邮件,也不用了
        if (received[uid]) {
            continue;
        }
        let isSend = true;
        const vipType = mail.get('vipType') || 0;
        const noReceived = mail.get('noReceived') || {};
        if(vipType > 0){
            if(noReceived[uid]){
                continue;
            }
            // 记录不发送记录
            if((vipType == 1 && vip <= 0) || (vipType == 2 && vip > 0)){
                isSend = false;
                noReceived[uid] = 1;
            }
        }
        if(isSend){
            received[uid] = 1;
        }
        mail.update({ received: received, noReceived: noReceived });

        if(!isSend){
            continue;
        }
        const personMail = this._toPersonMail(mail);
        addMail.push(personMail);
    }
    return addMail;
};

/**
 * 增加一封全局邮件
 */
GlobalMailService.prototype.addMail = async function (customMail) {
    // 计算新的邮件id
    const { err, res } = await this.app.Redis.incrby(code.redis.MAX_GLOBAL_MAIL_ID.name, 1);
    if (err) {
        return null;
    }
    const mail = await this.queryOrCreate(res);
    // 已在线玩家直接发送
    let online = [];
    const servers = this.app.getServersByType('game');
    await Promise.all(servers.map(async (server) => {
        const ret = await this.app.rpcs.game.playerRemote.getOnlinePlayerUids.toServer(server.id);
        if (!ret.err && ret.res) {
            online = online.concat(ret.res);
        }
    }));
    let uids = [];
    const noReceived = [];
    if (online.length > 0) {
        if (customMail.vipType > 0) {
            for (const info of online) {
                // 满足vip条件才即刻发送 否则加入不发送记录
                if((customMail.vipType == 1 && info.vip > 0) || (customMail.vipType == 2 && info.vip <= 0)){
                    uids.push(info.uid);
                }
                else{
                    noReceived.push(info.uid);
                }
            }
        }
        else {
            uids = online.map((info) => { return info.uid; });
        }
    }
    // 非在线记录全局邮件
    const mailInfo = this._initMail(customMail);
    for (const uid of uids) {
        mailInfo.received[uid] = 1;
    }
    for (const noVipUid of noReceived) {
        mailInfo.noReceived[noVipUid] = 1;
    }
    const newMail = { ...mailInfo, id: res };
    mail.update(newMail);

    // 发送在线玩家邮件
    for (const uid of uids) {
        this.app.Mail.sendCustomMail(uid, mailInfo);
    }

    return newMail;
};

/**
 * 初始化全局邮件
 */
GlobalMailService.prototype._initMail = function (customMail) {
    const initMail = {
        id: 0,
        title: "",
        content: "",
        item: [],
        type: code.mail.TYPE.SYSTEM,
        sendTime: util.time.nowSecond(),
        expirationTime: 0,
        received: {},
        vipType: 0,
        noReceived: {}
    };
    return Object.assign(initMail, customMail);
};

/**
 * 全局邮件转化成个人邮件
 */
GlobalMailService.prototype._toPersonMail = function (mail) {
    const personMail = {
        title: mail.get('title') || "",
        content: mail.get('content') || "",
        item: mail.get('item') || [],
        type: mail.get('type') || code.mail.TYPE.SYSTEM,
        sendTime: mail.get('sendTime') || util.time.nowSecond(),
        expirationTime: mail.get('expirationTime') || 0,
        status: (mail.get('item') && mail.get('item').length > 0) ? code.mail.STATUS.UNRECEIVED : code.mail.STATUS.UNREAD,
    };
    return personMail;
};
