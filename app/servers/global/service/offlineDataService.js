/**
 * @description 离线数据服务
 * @author linjs
 * @date 2020/04/10
 */
const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const bearcat = require('bearcat');

const OfflineDataService = function () {
    this.$id = 'global_OfflineDataService';
    this.app = null;
};

module.exports = OfflineDataService;
bearcat.extend('global_OfflineDataService', 'logic_MongoBaseService');
OfflineDataService.prototype.mongoDataClassFunc = require('@mongo/mongoOfflineData');

/**
 * 取出玩家的离线邮件
 * @param {Integer} uid 玩家id
 */
OfflineDataService.prototype.takeMail = async function (uid) {
    uid = Number(uid);
    const data = await this.query(uid);
    let mailList = [];
    if (data) {
        mailList = data.get('mailList');
        data.update({mailList: []});
        logger.info("================ offlineData takeMail", mailList);
    }
    return mailList;
};

/**
 * 增加玩家的离线邮件
 * @param {Integer} uid 玩家id
 * @param {Array} mailList 离线邮件id
 */
OfflineDataService.prototype.addMail = async function (uid, mailList) {
    uid = Number(uid);
    const data = await this.queryOrCreate(uid);
    if (data) {
        data.update({mailList: data.get('mailList').concat(mailList)});
        return true;
    } else {
        return false;
    }
};

/**
 * 增加玩家的离线聊天内容
 * @param {Object} msg 参考协议roleMsg
 */
OfflineDataService.prototype.addPrivateChat = async function (msg) {
    const data = await this.queryOrCreate(Number(msg.targetUid));
    if (data) {
        const map = data.get('privateChat') || {};
        const list = (map[msg.sender.uid] || []).concat(msg);
        map[msg.sender.uid] = list;
        data.update({privateChat: map});
        return true;
    }
    return false;
};

/**
 * 获取玩家的离线聊天内容并清空记录
 * @param {Integer} uid 玩家的uid
 * @param {Array} 离线消息数组
 */
OfflineDataService.prototype.takePrivateChat = async function (uid) {
    uid = Number(uid);
    const data = await this.query(uid);
    if (data) {
        const map = data.get('privateChat') || {};
        const list = Object.values(map).reduce((total, current) => { return total.concat(current); }, []);
        data.update({privateChat: {}});
        return list;
    } else {
        return [];
    }
};

/**
 * 清空记录
 * @param {Integer} uid 玩家的uid
 * @param {Array} 离线消息数组
 */
OfflineDataService.prototype.cleanPrivateChat = async function (uid) {
    uid = Number(uid);
    const data = await this.query(uid);
    if (data) {
        data.update({ privateChat: {} });
    }
};


/**
 * 增加玩家离线禁言信息
 * @param {Integer} uid
 * @param {Object} param
 */
OfflineDataService.prototype.addBanChat = async function (uid, param) {
    uid = Number(uid);
    const data = await this.queryOrCreate(uid);
    if (data) {
        data.set('banChat', param || {});
        data.update({ banChat: param });
        return true;
    }
    return false;
};

/**
 * 获取玩家离线禁言信息，并清空记录
 * @param {Integer} uid 玩家的uid
 * @return {Object} 后台发送的禁言信息
*/
OfflineDataService.prototype.takeBanChat = async function (uid) {
    uid = Number(uid);
    const data = await this.query(uid);
    if (data) {
        const ban = data.get('banChat') || {};
        data.update({banChat: {}});
        return ban;
    } else {
        return null;
    }
};
