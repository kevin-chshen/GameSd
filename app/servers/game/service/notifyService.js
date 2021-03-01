/**
 * @description 通知&广播服务
 * @author linjs
 * @date 2020/04/21
 */

const bearcat = require('bearcat');
const code = require('@code');
const util = require('@util');

const NotifyService = function () {
    this.$id = 'game_NotifyService';
    this.app = null;
};

module.exports = NotifyService;
bearcat.extend('game_NotifyService', 'logic_BaseService');

/**
 * 全服广播
 * @param {String} msgName 消息名称,协议名称
 * @param {Object} msgData 消息内容
 */
NotifyService.prototype.broadcast = function (msgName, msgData) {
    this.app.get('channelService').broadcast('connector', msgName, msgData, {});
};

/**
 * 全公会广播
 * @param {Integer} guildId 目标公会id
 * @param {String} msgName 消息名称,协议名称
 * @param {Object} msgData 消息内容
 */
NotifyService.prototype.guildBroadcast = async function (guildId, msgName, msgData) {
    await this.app.rpcs.global.notifyRemote.guildBroadcast({}, guildId, msgName, msgData);
};

/**
 * 发送通知给某个角色
 * @param {Integer} uid
 * @param {String} msgName 消息名称
 * @param {Object} msgData 消息内容
 */
NotifyService.prototype.notify = async function (uid, msgName, msgData) {
    const channelService = this.app.get('channelService');
    const target = this.app.Player.getOnlinePlayerByUid(uid);
    // 如果玩家在线并且同服,则直接发送
    if (target) {
        channelService.pushMessageByUids(msgName, msgData, [{ uid: target.uid, sid: target.connectorId }]);
        return true;
    }
    // 如果能找到玩家的connectorId,则通过connectorId直接发送
    const {err, res} = await this.app.Redis.hget(code.redis.ROLE_ON_CONNECTOR.name, uid);
    if (err || !res) {
        // 出错,说明玩家连接不在
        return false;
    }
    channelService.pushMessageByUids(msgName, msgData, [{ uid:uid, sid: res }]);
    return true;
};

/**
 * 发送通知给一组玩家
 * @param {Array} uids
 * @param {String} msgName 消息名称
 * @param {Object} msgData 消息内容
 * @return {Object} 发送结果 {err, success:[], fail: []}
 */
NotifyService.prototype.notifyGroup = async function (uids, msgName, msgData) {
    const successUid = new Set();
    const targetVec = this.app.Player.getOnlinePlayerByUids(uids);
    const onlineVec = [];
    for (const target of targetVec) {
        if (target) {
            successUid.add(target.uid);
            onlineVec.push({uid: target.uid, sid: target.connectorId});
        }
    }
    const channelService = this.app.get('channelService');
    if (onlineVec.length > 0) {
        channelService.pushMessageByUids(msgName, msgData, onlineVec);
    }
    const offlineUids = [...util.set.difference(new Set(uids), successUid)];
    if (offlineUids.length <= 0) {
        return {err: null, success:uids, fail: []};
    }
    const {err, res} = await this.app.Redis.hmget(code.redis.ROLE_ON_CONNECTOR.name, ...offlineUids);
    if (err) {
        return {err, success: [...successUid], fail: offlineUids};
    }
    const offlineVec = [];
    const fail = [];
    for (let index = 0; index < offlineUids.length; index++) {
        const uid = offlineUids[index];
        const sid = res[index];
        if (sid) {
            offlineVec.push({uid, sid});
            successUid.add(uid);
        } else {
            fail.push(uid);
        }
    }
    if (offlineVec.length > 0) {
        channelService.pushMessageByUids(msgName, msgData, offlineVec);
    }
    return {err: null, success: [...successUid], fail: fail };
};
