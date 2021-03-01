/* eslint-disable indent */
/**
 * @description 掉落相关的帮助函数
 * @author chenyq
 * @date 2020/06/15
 */

const bearcat = require('bearcat');
const MongoAccount = require('@mongo/mongoAccount');
const MongoPlayer = require('@mongo/mongoPlayer');
const code = require('@code');
const util = require('@util');

const OperateMailHelper = function () {
    this.$id = 'logic_OperateMailHelper';
    this.name = 'OperateMail';
    this.app = null;
};

module.exports = OperateMailHelper;
bearcat.extend('logic_OperateMailHelper', 'logic_BaseHelper');

/**
 * 获取玩家uid列表
 */
OperateMailHelper.prototype.queryUidList = async function (
    sendType,
    roleName,
    roleId,
    accountName,
    minVip,
    maxVip,
    minLevel,
    maxLevel,
    minLoginTime,
    maxLoginTime,
    minLoginOutTime,
    maxLoginOutTime,
    minRegTime,
    maxRegTime,
    sex,
    career,
    guild,
    vipType) {
    let uidList = [];
    console.log("queryUidList", sendType, roleName, roleId, accountName, minVip, maxVip, minLevel, maxLevel, minLoginTime, maxLoginTime, minLoginOutTime, maxLoginOutTime, minRegTime, maxRegTime, sex, career, guild, vipType);
    switch (Number(sendType)) {
        case code.operate.OPERATE_SEND_TYPE.ROLE_NAME:
            uidList = await this.getUidsFromName(roleName);
            break;
        case code.operate.OPERATE_SEND_TYPE.ROLE_UID:
            uidList = this.getUidsFromId(roleId);
            break;
        case code.operate.OPERATE_SEND_TYPE.ROLE_ACCOUNT:
            uidList = this.getUidsFromAccount(accountName);
            break;
        case code.operate.OPERATE_SEND_TYPE.CONDITION:
            uidList = this.getUidsFromCondition(minVip, maxVip, minLevel, maxLevel, minLoginTime, maxLoginTime, minLoginOutTime, maxLoginOutTime, minRegTime, maxRegTime, sex, career, guild, vipType);
            break;
        case code.operate.OPERATE_SEND_TYPE.GLOBAL:
            uidList = this.getUidsFromAllServer(vipType);
            break;
        case code.operate.OPERATE_SEND_TYPE.ONLINE:
            uidList = this.getUidsFromOnline(vipType);
            break;
        case 7:
            // vipType
            // uidList = [];
            break;
        case 8:
            // vipType
            // uidList = [];
            break;
    }
    return uidList;
};
/**
@param {} moneyData	    String	是	[{“id”：1,“name”：“金币”，“nums”：5}，｛“id”：2,“name”：“绑定礼券”，“nums”：50｝]	Json格式的货币数据,id是货币类型id，name货币名称，num货币数量,空为[]
@param {} propsData	    String	是	[{“id”:10001,“name”：“聚宝盆”，“nums”：2，“bind”：1，“strengthLevel”:null,”propsExistDay”:null }]	
                                Id是道具id，name是道具名称，num是数量，bind=1表示绑定，Bind=0表示非绑定，strengthLevel表示强化等级,propsExistDay表示道具有效期 空为[]
@return {Array} itemList [{itemID:1,itemNum:1},...]
 */
OperateMailHelper.prototype.getItemList = async function (moneyData, propsData) {
    console.log(moneyData, propsData);
    const itemList = [];
    const moneyList = JSON.parse(moneyData);
    const propsObj = JSON.parse(propsData);
    for (const money of moneyList) {
        itemList.push({ itemID: money.id, itemNum: Number(money.nums) });
    }
    for (const prop of propsObj) {
        itemList.push({ itemID: prop.id, itemNum: Number(prop.nums) });
    }
    return itemList;
};

/**
 * 获取邮件信息
 */
OperateMailHelper.prototype.getItemMail = function (title, content, itemList, existDay) {
    const now = util.time.nowSecond();
    const mail = {};
    mail.title = title;
    mail.content = content;
    mail.item = itemList ? itemList : [];
    mail.type = code.mail.TYPE.OPERATE;
    mail.sendTime = now;
    mail.expirationTime = existDay > 0 ? now + existDay * 24 * 3600 : 0;
    mail.status = itemList && itemList.length > 0 ? code.mail.STATUS.UNRECEIVED : code.mail.STATUS.UNREAD;
    return mail;
};

/**
 * 获取全局邮件信息
 */
OperateMailHelper.prototype.getGlobalMail = function (title, content, itemList, existDay, vipType) {
    const now = util.time.nowSecond();
    const mail = {};
    mail.title = title;
    mail.content = content;
    mail.item = itemList ? itemList : [];
    mail.type = code.mail.TYPE.OPERATE;
    mail.sendTime = now;
    mail.expirationTime = existDay > 0 ? now + existDay * 24 * 3600 : 0;
    mail.received = {};
    mail.vipType = vipType;
    return mail;
};



/**
 * 获取角色名对应uid
 */
OperateMailHelper.prototype.getUidsFromName = async function (roleName) {
    if (typeof (roleName) != 'string') {
        return [];
    }
    const res = roleName.split(',');
    const roleNameList = res.reduce((all, str) => {
        return all.concat(str.split('%2C'));
    }, []);
    const queryList = await MongoPlayer.query({ name: { $in: roleNameList } });
    if (queryList.length <= 0) {
        return [];
    }
    return queryList.map((info) => { return info.get('uid'); });
};
/**
 * 获取uid
 */
OperateMailHelper.prototype.getUidsFromId = async function (roleId) {
    if (typeof (roleId) != 'string') {
        return [];
    }
    const res = roleId.split(',');
    let roleIdList = res.reduce((all, str) => {
        return all.concat(str.split('%2C'));
    }, []);
    roleIdList = roleIdList.map((info) => { return Number(info); });
    const queryList = await MongoPlayer.query({ uid: { $in: roleIdList } });
    if (queryList.length <= 0) {
        return [];
    }
    return queryList.map((info) => { return info.get('uid'); });
};
/**
 * 获取平台账号ID对应uid
 */
OperateMailHelper.prototype.getUidsFromAccount = async function (accountName) {
    if (typeof (accountName) != 'string') {
        return [];
    }
    const res = accountName.split(',');
    const accountList = res.reduce((all, str) => {
        return all.concat(str.split('%2C'));
    }, []);
    const queryList = await MongoAccount.query({ account: { $in: accountList } });
    if (queryList.length <= 0) {
        return [];
    }
    return queryList.map((info) => { return info.get('uid'); });
};
/**
 * 获取满足条件uid
 */
OperateMailHelper.prototype.getUidsFromCondition = async function (minVip, maxVip, minLevel, maxLevel, minLoginTime, maxLoginTime, minLoginOutTime, maxLoginOutTime, minRegTime, maxRegTime, sex, career, guild, vipType) {
    const andList = [];
    if (Number(vipType) != 2 && minVip && maxVip) {
        andList.push({ vip: { $gte: Number(minVip), $lte: Number(maxVip) } });
    }
    if (minLevel && maxLevel) {
        andList.push({ lv: { $gte: Number(minLevel), $lte: Number(maxLevel) } });
    }
    if (minLoginTime && maxLoginTime) {
        andList.push({ lastLoginTime: { $gte: Number(minLoginTime) * 1000, $lte: Number(maxLoginTime) * 1000 } });
    }
    if (minLoginOutTime && maxLoginOutTime) {
        andList.push({ lastLogoutTime: { $gte: Number(minLoginOutTime) * 1000, $lte: Number(maxLoginOutTime) * 1000 } });
    }
    if (minRegTime && maxRegTime) {
        andList.push({ regTime: { $gte: Number(minRegTime), $lte: Number(maxRegTime) } });
    }
    if (sex > 0) {
        andList.push({ sex: Number(sex) });
    }
    if (career > 0) {
        andList.push({ career: Number(career) });
    }
    // 帮派 公会特殊处理 根据公会名称获取公会所有成员
    if (guild) {
        let guildUids = [];
        const res = await this.app.rpcs.global.guildRemote.getMemberFromGuildName({}, guild);
        if (res && !res.err) {
            guildUids = res.res;
        }
        if (guildUids.length > 0) {
            guildUids = guildUids.map((info) => { return Number(info); });
            andList.push({ uid: { $in: guildUids } });
        }
    }
    const queryList = await MongoPlayer.query({ $and: andList });
    if (queryList.length <= 0) {
        return [];
    }
    return queryList.map((info) => { return info.get('uid'); });
};
/**
 * TODO:获取全服uid
 */
OperateMailHelper.prototype.getUidsFromAllServer = async function (vipType) {
    let vipCondition = {};
    if (vipType) {
        if (vipType == 1) {
            vipCondition = { vip: { $gt: 0 } };
        }
        else if (vipType == 2) {
            vipCondition = { vip: { $lte: 0 } };
        }
    }
    const queryList = await MongoPlayer.query(vipCondition);
    if (queryList.length <= 0) {
        return [];
    }
    return queryList.map((info) => { return info.get('uid'); });
};
/**
 * 获取在线玩家uid
 */
OperateMailHelper.prototype.getUidsFromOnline = async function (vipType) {
    let vipCondition = {};
    if (vipType) {
        if (vipType == 1) {
            vipCondition = { vip: { $gt: 0 } };
        }
        else if (vipType == 2) {
            vipCondition = { vip: { $lte: 0 } };
        }
    }
    let res = [];
    const servers = this.app.getServersByType('game');    
    await Promise.all(servers.map(async (server) =>{
            const ret = await this.app.rpcs.game.playerRemote.getOnlinePlayerUids.toServer(server.id);
            if (!ret.err && ret.res) {
                res = res.concat(ret.res);
            }
        })
    );
    const uids = res.map((info) => { return info.uid; });
    if (uids.length <= 0) {
        return [];
    }
    const queryList = await MongoPlayer.query({ $and: [{ uid: { $in: uids } }, vipCondition] });
    if (queryList.length <= 0) {
        return [];
    }
    return queryList.map((info) => { return info.get('uid'); });
};