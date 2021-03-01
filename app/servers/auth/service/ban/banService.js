/**
 * @description 封禁服务
 * @author chshen
 * @date 2020/06/09
 */
const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const bearcat = require('bearcat');
const MongoAccount = require('@mongo/mongoAccount');
const MongoPlayer = require('@mongo/mongoPlayer');
const code = require('@code');
const util = require('@util');

const BanService = function () {
    this.$id = 'auth_BanService';
    this.app = null;
};
module.exports = BanService;
bearcat.extend('auth_BanService', 'logic_BaseService');

BanService.prototype._getUids = async function (typeStr, paramData) {
    const res = paramData.split(',');
    const list = res.reduce((all, str) =>{
        return all.concat(str.split('%2C'));
    }, []);
    switch (typeStr) {
    case 'name':
    {
        const queryList = await MongoPlayer.query({ name: { $in: list } });
        if (queryList.length <= 0) {
            return [];
        }
        return queryList.map((info) => { return info.get('uid'); });
    }
    case 'uid':
    {
        return list.map(id => Number(id));
        // const queryList = await MongoAccount.query({ uid: { $in: list } });
        // if (queryList.length <= 0) {
        //     return [];
        // }
        // return queryList.map((info) => { return info.get('uid'); });
    }
    case 'account':
    {
        const queryList = await MongoAccount.query({ account: { $in: list } });
        if (queryList.length <= 0) {
            return [];
        }
        return queryList.map((info) => { return info.get('uid'); });
    }
    // case 'ip':
    //     return [];
    // case 'device':
    //     return [];
    default:
        logger.warn(`BanService _getUids not found typeStr :${typeStr}`);
        return [];
    }
};

/**
 * 封禁
*/
BanService.prototype.ban = async function(param) {
    let timestamp = Number(param.banDate);
    if (Number(param.status) == 0) {
        timestamp = 0;
    }
    let msg = { ret: 0, msg: "success"};
    switch (param.banType) {
    case "BanChat":{
        const uids = await this._getUids('name', param.data);
        uids.map(uid =>{
            this._banChat(uid, timestamp, param);
        });
    }break;
    case "BanRoleIdChat":{
        const uids = await this._getUids('uid', param.data);
        uids.map(uid => {
            this._banChat(uid, timestamp, param);
        });
    }break;
    case "BanChatAct": {
        const uids = await this._getUids('account', param.data);
        uids.map(uid => {
            this._banChat(uid, timestamp, param);
        });
    } break;
    case "BanRole": {
        const uids = await this._getUids('name', param.data);
        uids.map(uid => {
            this._banLogin(uid, timestamp, param);
        });
    }break;
    case "BanRoleId":{
        const uids = await this._getUids('uid', param.data);
        uids.map(uid => {
            this._banLogin(uid, timestamp, param);
        });
    } break;
    case "BanAct":{
        const uids = await this._getUids('account', param.data);
        uids.map(uid => {
            this._banLogin(uid, timestamp, param);
        });
    } break;
    case "BanIP":{
        logger.warn(`BanService ban nonsupport`);
    } break;
    case "BanImei": {
        logger.warn(`BanService ban nonsupport`);
    }break;
    default:
        logger.warn(`WebBackendService ban type not found, param:%j`, param);
        msg = { ret: 202, msg:"BanChat Not Supported"};
        break;
    }
    return msg;
};
/**
 * 禁言
 * @return {Void}
*/
BanService.prototype._banChat = async function (uid, timestamp, param) {
    const ret = await this.app.Redis.hget(code.redis.ROLE_ON_GAME.name, uid);
    if (!ret.err && ret.res) {
        const gameId = ret.res;
        await this.app.rpcs.game.banRemote.banChat.toServer(gameId, uid, timestamp, param);
    } else {
        this.app.rpcs.global.offlineRemote.addOfflineBanChat({}, uid, param);
    }
    if (timestamp > util.time.nowSecond()) {
        // 修改禁言数据
        this._removeChatHistory(code.redis.CHAT_WORLD_HISTORY.name, uid);
        this._removeChatHistory(code.redis.CHAT_GUILD_HISTORY.name, uid);
        //this.app.rpcs.global.offlineRemote.cleanOfflinePrivateChat({}, uid); 要删除的是别人的聊天记录是记录，不是自己的
        // 全服广播
        this.app.rpcs.global.notifyRemote.broadcast({}, 'onSyncChatBanRoleId', {
            uid: String(uid)
        });

        // 内容为公告
        if (param.reason.match('--[0-9]*--')) {
            const { err, res } = await this.app.rpcs.global.guildRemote.getGuildInfo({}, uid);
            if (!err && res) {
                this.app.rpcs.global.guildRemote.modifyGuildNoticeAndmanifesto({}, uid, "", res.leagueId, code.system.GUILD_NOTICE_ILLEGAL_WARNING_MSG);
                return;
            }
        }
    }
    
};

/**
 * 查询并删除最近100记录中某个玩家的聊天信息
*/
BanService.prototype._removeChatHistory = function(name, uid) {
    const self = this;
    const playerUid = String(uid);
    this.app.Redis.zrange(name, -100, -1).then(
        ({ _err, res }) => {
            if (res) {
                res.map(msg => {
                    const msgJson = JSON.parse(msg);
                    if (msgJson && msgJson.sender && msgJson.sender.uid == playerUid) {
                        self.app.Redis.zrem(name, msg);
                    }
                });
            }
        }
    );
};

/**
 * 封号
*/
BanService.prototype._banLogin = async function (uid, timestamp, param) {
    // 记录数据
    const accounts = await MongoAccount.query({uid: Number(uid)});
    if (!accounts[0]) {
        logger.warn(`BanService _banLogin mongo account can not found uid:${uid}`);
        return;
    } else {
        accounts[0].updateImmediately({
            forbidTs: timestamp,
            forbidReason: param.reason
        });
    }
    if (timestamp > util.time.nowSecond()) {
        // 将玩家踢下线
        this._kick(uid, 'forbid', timestamp);
    }
};

/**
 * 将玩家踢下线
 * @param {Integer} uid
 */ 
BanService.prototype._kick = async function (uid, reason, timestamp) {
    const playerUid = uid;
    this.app.Redis.hget(code.redis.ROLE_ON_GAME.name, playerUid).then(async ({ err, res }) => {
        if (!err && res) {
            const gameId = res;
            switch (reason) {
                case 'forbid':
                    await this.app.rpcs.game.banRemote.kickByForbid.toServer(gameId, playerUid, timestamp);
                    break;
                case 'kick':
                    await this.app.rpcs.game.banRemote.kickByBackend.toServer(gameId, playerUid);
                    break;
                default:
                    break;
            }
            this.app.Redis.hget(code.redis.ROLE_ON_CONNECTOR.name, playerUid).then(async ({ err, res }) => {
                if (!err && res) { 
                    this.app.backendSessionService.kickByUid(res, playerUid, () => {
                        logger.info(`BanService _banLogin kickByUid :${playerUid}`);
                    });
                }
            });
        }
    });
};

/**
 * 踢人
 */ 
BanService.prototype.kickUser = async function (param) {
    let uids = [];
    if (Number(param.kickAll) == 1) {
        uids = await this.app.Helper.OperateMail.getUidsFromOnline();
    } else {
        switch (Number(param.sendType)) {
        case 1: {
            uids = await this._getUids('uid', param.data);
        } break;
        case 2: {
            uids = await this._getUids('name', param.data);
        } break;
        case 3: {
            uids = await this._getUids('account', param.data);
        } break;
        default:
            break;
        }
    }
    uids.map(uid => {
        this._kick(uid, 'kick');
    });
};