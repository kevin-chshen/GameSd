/**
 * @description handler服务player
 * @author chenyq
 * @date 2020/06/16
 */
// const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const bearcat = require('bearcat');
const MongoAccount = require('@mongo/mongoAccount');
const MongoPlayer = require('@mongo/mongoPlayer');
const code = require('@code');
const util = require('@util');

const PlayerService = function () {
    this.$id = 'auth_PlayerService';
    this.app = null;
};
module.exports = PlayerService;
bearcat.extend('auth_PlayerService', 'logic_BaseService');

/**
 * 说明：roleId, roleName, accountName 这三个条件关系在SQL语句是AND。
 *      当roleName不为空的时候，默认为模糊查询，请返回roleName的模糊查询结果
 */
PlayerService.prototype.getUserList = async function (params) {
    const roleName = params.roleName;
    const roleId = Number(params.roleId);
    const accountName = params.accountName;
    // const userName = params.userName;
    const isOnline = Number(params.isOnline);
    const orderField = params.orderField;
    const orderType = params.orderType;
    const pageNum = Number(params.pageNum) || 1;
    const pageSize = Number(params.pageSize);
    const isForbid = Number(params.isForbid);

    const andList = [{}];
    if (roleName) {
        andList.push({ name: { $regex: roleName } });
    }
    if (roleId) {
        andList.push({ uid: roleId });
    }
    let uids = [];
    if (accountName) {
        // 获取账号对应玩家uid
        const accountDBList = await MongoAccount.query({ account: accountName });
        if (accountDBList.length > 0) {
            uids = accountDBList.map((info) => { return info.get('uid'); });
        }
    }
    else if (isOnline == 1) {
        // 获取在线玩家
        let res = [];
        const servers = this.app.getServersByType('game');
        await Promise.all(servers.map(async (server) => {
            const ret = await this.app.rpcs.game.playerRemote.getOnlinePlayerUids.toServer(server.id);
            if (!ret.err && ret.res) {
                res = res.concat(ret.res);
            }
        }));
        const uids = res.map((info) => { return info.uid; });
        if (uids.length <= 0) {
            return [];
        }
    }
    if (uids.length > 0) {
        andList.push({ uid: { $in: uids } });
    }
    const sort = {};
    if (orderField && orderType) {
        sort[orderField] = orderType == 'asc' ? 1 : -1;
    }
    let skip = 0;
    let limit = pageSize;
    if (!limit && limit != 0) {
        limit = 10;
    }
    if (pageNum > 0) {
        skip = (pageNum - 1) * pageSize;
    }
    // db.getCollection("player").find({name:{$regex:'cyq'}},{"uid":{"$in":[100200000010020,100200000010019]}}).sort({uid:1}).skip(0).limit(10)
    const queryList = await MongoPlayer.query({ $and: andList }, {}, sort, limit, false, skip);
    let dataList = [];
    if (queryList.length > 0) {
        const nowTime = util.time.nowSecond();
        for (const dbData of queryList) {
            const dbValue = dbData.dbValue();
            // 是否封号过滤
            const isBan = this.isBan(dbValue.ban, nowTime);
            if (isForbid == 1 ? !isBan : isBan) {
                continue;
            }

            const info = {};
            info.roleId = dbValue.uid;
            info.roleName = dbValue.name;
            info.accountName = '';
            info.userName = '';
            info.regTime = dbValue.createTime;
            info.level = dbValue.lv;
            info.career = 0;
            info.guild = dbValue.guildId;
            info.lastLoginTime = util.time.ms2s(dbValue.lastLogoutTime);
            info.ban = isBan ? 1 : 0;
            dataList.push(info);
        }
        if (dataList.length > 0) {
            const uidList = dataList.map((info) => { return info.roleId; });
            const accountDBList = await MongoAccount.query({ uid: { $in: uidList } });
            if (accountDBList.length > 0) {
                const list = {};
                for (const accountDB of accountDBList) {
                    list[accountDB.get('uid')] = accountDB.get('account');
                }
                dataList = dataList.map((info) => {
                    info.accountName = list[info.roleId] || '';
                    info.userName = info.accountName;
                    return info;
                });
            }
        }

    }

    const result = {};
    result.ret = 0;
    result.msg = '';
    result.desc = '';
    result.data = dataList;
    result.totalNum = dataList.length;
    return result;
};

PlayerService.prototype.isBan = function (ban, nowTime) {
    if (ban && ban.forbidTs > nowTime) {
        return true;
    }
    else {
        return false;
    }
};
/**
 * 玩家详细信息
 */
PlayerService.prototype.getUserDetail = async function (params) {
    const type = params.type;
    const uid = Number(params.roleId);
    const result = { ret: 0, msg: '', desc: {}, data: {}, tableType: '' };
    if (type == 'UserDetail') {
        //
        result.tableType = '1';
        result.desc = {
            prestige: '名望',
            power: '身价',
            cashPerSecond: '秒赚钱',
            vip: 'vip等级',
            vipExp: 'vip经验',
            dayPay: '今日充值',
            platforms: '直播平台数据[id,lv,num]',
            clubInfo: '俱乐部信息[俱乐部类型、俱乐部等级、俱乐部经验、主播信息[主播id、亲密度、亲密度奖励、当前已赠礼次数、今日已重置次数]]',
            clubPostcardBuy: '俱乐部明信片',
            flowRate: '流量为王',
            friendShip: '团建策划书购买次数',
            friendNum: '好友数量',
        };
        // 检测玩家是否在线
        // 通知game服guildID修改
        let data = {};
        const retRole = await this.app.Redis.hget(code.redis.ROLE_ON_GAME.name, uid);
        if (!retRole.err && retRole.res) {
            const ret = await this.app.rpcs.game.playerRemote.getPlayerDetail.toServer(retRole.res, uid);
            if (!ret.err && ret.res) {
                const playerData = ret.res;
                data = this.getPlayerDetail(playerData, await this.isOnline(uid));
            }
        }
        else {
            //
            // 从数据库中读取
            const ret = await MongoPlayer.query({ uid: uid });
            if (ret.length > 0) {
                const dbData = ret[0].dbValue();
                data = this.getPlayerDetail(dbData, await this.isOnline(uid));
            }
        }
        // 从global获取流量为王数据
        const flowRateRet = await this.app.rpcs.global.flowRateRemote.getFlowRateBuyInfo({}, uid);
        if (!flowRateRet.err && flowRateRet.res) {
            data.flowRate = this.getNowNum(flowRateRet.res.buyNum, flowRateRet.res.lastBuyTime);
        }
        // 从global获取好友数据
        const friendRet = await this.app.rpcs.global.friendRemote.getFriends({}, uid);
        if (!friendRet.err && friendRet.res) {
            data.friendNum = friendRet.res.length;
        }
        result.data = data;
    }
    else if (type == 'PropsDetail') {
        //
        result.tableType = '3';
        result.desc = {
            propId: '道具ID',
            onlyId: '道具唯一ID',
            propName: '道具名称',
            position: '1=背包，2=车库',
            num: '道具数量',
            lv: '等级',
            refit: '改装信息',
        };
        // 检测玩家是否在线
        // 通知game服guildID修改
        let propObj = {};
        let carObj = {};
        const retRole = await this.app.Redis.hget(code.redis.ROLE_ON_GAME.name, uid);
        if (!retRole.err && retRole.res) {
            const ret = await this.app.rpcs.game.itemRemote.getItem.toServer(retRole.res, uid);
            if (!ret.err && ret.res) {
                propObj = ret.res;
            }
            const carRet = await this.app.rpcs.game.playerRemote.getCarDBData.toServer(retRole.res, uid);
            if (!carRet.err && carRet.res) {
                carObj = carRet.res;
            }
        }
        else {
            // 从数据库中读取
            const ret = await MongoPlayer.query({ uid: uid });
            if (ret.length > 0) {
                const dbData = ret[0].dbValue();
                propObj = dbData.item;
                if (dbData.carInfo) {
                    carObj = dbData.carInfo.carList;
                }
            }
        }
        const data = [];
        for (const [itemId, info] of Object.entries(propObj)) {
            const itemNum = info.itemNum;
            const prop = {};
            prop.propId = itemId;
            prop.num = itemNum;
            prop.onlyId = itemId;
            prop.position = 1;
            prop.propName = '';
            const config = this.app.Config.Item.get(itemId);
            if (config) {
                prop.propName = config.Name;
            }
            data.push(prop);
        }
        for (const [carId, info] of Object.entries(carObj)) {
            const prop = {};
            prop.propId = info.cId;
            prop.num = 1;
            prop.onlyId = carId;
            prop.position = 2;
            prop.propName = '';
            const config = this.app.Config.Car.get(info.cId);
            if (config) {
                prop.propName = config.Name;
            }
            prop.lv = info.level;
            prop.refit = JSON.stringify(info.refit);
            data.push(prop);
        }

        result.data = data;
    }
    return result;
};

PlayerService.prototype.getPlayerDetail = function (dbData, isOnline) {
    // 直播平台数据
    const platforms = [];
    if (dbData.livePlatforms && dbData.livePlatforms.platforms) {
        for (const info of Object.values(dbData.livePlatforms.platforms)) {
            platforms.push([info.id, info.level, info.num]);
        }
    }
    // 俱乐部数据
    const clubInfo = [];
    for (const [clubType, info] of Object.entries(dbData.clubInfo)) {
        const cardList = [];
        if (info.cardDict) {
            for (const [cardId, cardInfo] of Object.entries(info.cardDict)) {
                // 主播id、亲密度、亲密度奖励、当前已赠礼次数、今日已重置次数
                cardList.push([
                    Number(cardId),
                    cardInfo.intimacy,
                    cardInfo.intimacyReward,
                    this.getNowNum(cardInfo.gift, cardInfo.lastGiftTime),
                    this.getNowNum(cardInfo.buyGiftNum, cardInfo.lastBuyGiftTime),
                ]);
            }
        }
        // 俱乐部类型、俱乐部等级、俱乐部经验、主播信息
        clubInfo.push([Number(clubType), info.lv, info.exp, cardList]);
    }
    const data = {
        prestige: dbData.currency[code.currency.CURRENCY_ID.REPUTATION],
        power: dbData.power,
        cashPerSecond: dbData.cashPerSecond,
        vip: dbData.vip,
        vipExp: dbData.vipExp,
        dayPay: this.getNowNum(dbData.dayPay, dbData.lastPayTime),
        platforms: JSON.stringify(platforms),
        clubInfo: JSON.stringify(clubInfo),
        clubPostcardBuy: this.getNowNum(dbData.clubPostcardBuyNum, dbData.clubPostcardLastTime),
        flowRate: 0,
        friendShip: dbData.friendship.buyTimes || 0,
        friendNum: 0,
        isOnline: isOnline,
    };
    return data;
};
/**
 * 根据最后处理时间判断次数是否重置
 * @param {Number} num 当前次数
 * @param {Number} time 最后处理时间(秒)
 * @returns {Number} 最新次数
 */
PlayerService.prototype.getNowNum = function (num, time) {
    let nowNum = num;
    if (time > 0 && !util.time.isSameDay(Number(time))) {
        nowNum = 0;
    }
    return nowNum;
};
PlayerService.prototype.getConnectId = async function (uid) {
    const result = await this.app.Redis.hget(code.redis.ROLE_ON_CONNECTOR.name, uid);
    if (result.err) {
        return undefined;
    }
    return result.res;
};
/**
 * 是否在线
 */
PlayerService.prototype.isOnline = async function (uid) {
    const connectId = await this.getConnectId(uid);
    if (connectId) {
        return 1;
    }
    else {
        return 0;
    }
};