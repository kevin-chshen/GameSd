/**
 * @description 好友
 * @author jzy
 * @date 2020/04/16
 */

const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const bearcat = require('bearcat');
const code = require("@code");
const utils = require("@util");
const assert = require("assert");
const DBPlayer = require("@mongo/mongoPlayer");
const { clearInterval } = require('timers');

const FriendService = function () {
    this.$id = 'global_FriendService';
    this.app = null;

    this.recommendCache = null;
    this.recommendCacheTimer = null;
};

module.exports = FriendService;
bearcat.extend('global_FriendService', 'logic_MongoBaseService');
FriendService.prototype.mongoDataClassFunc = require('@mongo/mongoFriend');

/**
 * 内部调用：获取收到的邀请列表
 */
FriendService.prototype.getApplies = async function(uid){
    uid = this.stringToUid(uid);
    const data = await this.queryOrCreate(uid);
    const list = data.get("receiveAskList");
    return list.concat();
};

/**
 * 内部调用：获取好友列表
 */
FriendService.prototype.getFriends = async function(uid){
    uid = this.stringToUid(uid);
    const data = await this.queryOrCreate(uid);
    const list = data.get("friendList");
    return list.concat();
};

/**
 * 内部调用：获取黑名单列表
 */
FriendService.prototype.getBlacks = async function(uid){
    uid = this.stringToUid(uid);
    const data = await this.queryOrCreate(uid);
    const list = data.get("blackList");
    return list.concat();
};

/**
 * 是否为好友
 */
FriendService.prototype.isFriend = async function(uid,targetUid){
    uid = this.stringToUid(uid);
    targetUid = this.stringToUid(targetUid);
    const selfData = await this.queryOrCreate(uid);
    const selfFriendList = selfData.get("friendList");
    if(selfFriendList.indexOf(targetUid)>=0){
        return true;
    }
    return false;
};

/**
 * 是否拉黑了对方
 */
FriendService.prototype.isBlock = async function(uid,targetUid){
    uid = this.stringToUid(uid);
    targetUid = this.stringToUid(targetUid);
    const selfData = await this.queryOrCreate(uid);
    const list = selfData.get("blackList");
    if(list.indexOf(targetUid)>=0){
        return true;
    }
    return false;
};

/**
 * 是否收到对方的申请
 */
FriendService.prototype.isApplyFrom = async function(uid,targetUid){
    uid = this.stringToUid(uid);
    targetUid = this.stringToUid(targetUid);
    const selfData = await this.queryOrCreate(uid);
    const list = selfData.get("receiveAskList");
    if(list.indexOf(targetUid)>=0){
        return true;
    }
    return false;
};

/************************handler function******************************/

/**
 * 获取玩家收到的所有邀请
 */
FriendService.prototype.getApplyList = async function(uid){
    uid = this.stringToUid(uid);
    const data = await this.queryOrCreate(uid);
    const list = data.get("receiveAskList");
    const resultList = [];
    for(const targetUid of list){
        resultList.push(await this.getFriendInfo(targetUid));
    }

    return resultList;
};

/**
 * 获取好友列表
 */
FriendService.prototype.getFriendList = async function(uid){
    uid = this.stringToUid(uid);
    const data = await this.queryOrCreate(uid);
    const list = data.get("friendList");
    const resultList = [];
    for(const targetUid of list){
        resultList.push(await this.getFriendInfo(targetUid));
    }
    return resultList;
};

/**
 * 获取黑名单
 */
FriendService.prototype.getBlackList = async function(uid){
    uid = this.stringToUid(uid);
    const data = await this.queryOrCreate(uid);
    const list = data.get("blackList");
    const resultList = [];
    for(const targetUid of list){
        resultList.push(await this.getFriendInfo(targetUid));
    }
    return resultList;
};

FriendService.prototype.init = async function () {
    const self = this;
    this.recommendCacheTimer = setInterval(()=>{
        self.recommendCache = null;
    }, code.friend.RECOMMEND_CACHE_CLEAR_TIME);
};
FriendService.prototype.shutdown = async function (_reason) {
    if(this.recommendCacheTimer){
        clearInterval(this.recommendCacheTimer);
    }
    this.recommendCacheTimer = null;
};

/**
 * 推荐好友
 */
FriendService.prototype.recommendFriend = async function(uid){
    uid = this.stringToUid(uid);
    
    let result;
    if(this.recommendCache){
        result = this.recommendCache;
    }else{
        const minLogoutTime = new Date(utils.time.nowMS()-12*60*60*1000).valueOf();
        result = await DBPlayer.aggregate([
            {
                $project:{
                    _id: 0, uid: 1 , power: 1, lastLogoutTime: 1, isOnline : { "$gte" : ["$lastLoginTime", "$lastLogoutTime"] },
                }
            },
            {
                $match:{
                    $or:[
                        {lastLogoutTime:{$gte:minLogoutTime}}, // 离线不超过12小时
                        {isOnline:true} // 在线
                    ],
                }
            },
            {
                $project:{
                    uid: 1,
                    power: 1
                }
            },
        ]);
    
        this.recommendCache = result;
    }
    
    

    const data = await this.queryOrCreate(uid);
    const friendList = data.get("friendList");
    const blackList = data.get("blackList");
    const brief = await this.app.Brief.getBrief(uid);
    const playerPower = brief.power;
    const resultObj = {};
    
    if(result.documents){
        const excludeList = friendList.concat(blackList).concat(uid);
        const searchList = result.documents.filter((item)=>{ return excludeList.indexOf(item.uid)<0 });
        for(const each of searchList){
            let findFlag = false;
            for(const index in code.friend.SEARCH_RANGE_SLICE){
                const rate = code.friend.SEARCH_RANGE_SLICE[index];
                if(each.power>=playerPower/rate && each.power<=playerPower*rate){
                    if(!resultObj[index]){ resultObj[index] = []; }
                    resultObj[index].push(each.uid);
                    findFlag = true;
                    break;
                }
            }
            if(!findFlag){
                if(!resultObj[code.friend.SEARCH_RANGE_SLICE.length]) { resultObj[code.friend.SEARCH_RANGE_SLICE.length] = []; }
                resultObj[code.friend.SEARCH_RANGE_SLICE.length].push(each.uid);
            }
        }
    }
    const filterUids = this.__getRecommendUids(resultObj);

    const list = [];
    for(const each of filterUids){
        list.push(await this.getFriendInfo(each));
    }
    return {result:list};
};

/**
 * 
 * @param {Object} resultObj resultObj[0] = [uid,uid,uid];  key -> 0,1,2,3
 */
FriendService.prototype.__getRecommendUids = function(resultObj){
    const MAX_LENGTH = 5;
    const MIN_LENGTH = 3;

    let filterUids = [];
    for(const index in code.friend.SEARCH_RANGE_SLICE){
        if(resultObj[index]){
            filterUids = filterUids.concat(utils.random.randomArrayElements(resultObj[index], MAX_LENGTH - filterUids.length));
            if(filterUids.length >= MIN_LENGTH){
                return filterUids;
            }
        }
    }
    if(resultObj[code.friend.SEARCH_RANGE_SLICE.length]){
        filterUids = filterUids.concat(utils.random.randomArrayElements(resultObj[code.friend.SEARCH_RANGE_SLICE.length], MAX_LENGTH - filterUids.length));
    }
    return filterUids;
};


/**
 * 精确查找
 */
FriendService.prototype.searchFriend = async function(uid, word){
    word = word.trim();
    if(word == ""){
        return {code:code.err.ERR_CLIENT_PARAMS_WRONG};
    }
    uid = this.stringToUid(uid);
    let result = [];
    const wordNum = Number(word);
    // 先当做uid查询
    if(Number.isInteger(wordNum)){
        result = await DBPlayer.query({uid:wordNum},{uid:1},null,0,true);
    }

    // 找不到当做关键字查询
    if(result.length<=0){
        result = await DBPlayer.query(
            {name:{$regex:word,$options:"$i"}},
            {uid:1},
            null,
            code.friend.MAX_SEARCH_COUNT,
            true
        );
    }
    if(result.length<=0){
        return {code:code.err.ERR_FRIEND_EMPTY_RESULT};
    }
    const list = [];
    for(const each of result){
        list.push(await this.getFriendInfo(each.uid));
    }
    return {code:code.err.SUCCEEDED, result:list};
};

/**
 * 申请好友
 */
FriendService.prototype.apply = async function(uid, targetUid){
    uid = this.stringToUid(uid);
    targetUid = this.stringToUid(targetUid);
    if(uid == targetUid){
        return {code: code.err.ERR_FRIEND_SELF_TARGET};
    }
    // 检查在不在好友列表
    const selfData = await this.queryOrCreate(uid);
    const selfFriendList = selfData.get("friendList");
    if(selfFriendList.indexOf(targetUid)>=0){
        return {code:code.err.ERR_FRIEND_EXIST};
    }
    // 检查是不是拉黑了对方
    const selfBlack = selfData.get("blackList");
    if(selfBlack.indexOf(targetUid)>=0){
        return {code:code.err.ERR_FRIEND_BLOCK};
    }

    // 检查对方在不在线
    const targetFontId = await this.getConnectorID(targetUid);
    if(!targetFontId&&!await this.isPlayerExist(targetUid)){
        return {code:code.err.ERR_FRIEND_PLAYER_NOT_EXIST};
    }

    //检查是不是被对方拉黑了
    const target = await this.queryOrCreate(targetUid);
    const targetBlack = target.get("blackList");
    if(targetBlack.indexOf(uid)>=0){
        return {code:code.err.ERR_FRIEND_BEING_BLOCK};
    }
    // 增加到数据库
    const askList = target.get("receiveAskList");
    if(askList.indexOf(uid)<0){
        askList.push(uid);
        target.update({receiveAskList:askList});
        if(targetFontId){
            // 对方玩家在线直接通知
            this.app.get('channelService').pushMessageByUids("OnNotifyApplyFriend", {
                friendInfo: await this.getFriendInfo(uid,false,targetFontId),
            },[{uid: targetUid, sid: targetFontId}]);
        }
    }
    
    
    return {code: code.err.SUCCEEDED};
};

/**
 * 接受申请
 */
FriendService.prototype.acceptApply = async function(uid, targetUidList){
    uid = this.stringToUid(uid);
    targetUidList = this.stringToUid(targetUidList);
    if(targetUidList.indexOf(uid)>=0){
        return {code: code.err.ERR_FRIEND_SELF_TARGET};
    }
    const selfData = await this.queryOrCreate(uid);
    let selfFriendList = selfData.get("friendList");
    // 好友列表上限检查
    if(selfFriendList.length+targetUidList.length>code.friend.MAX_FRIEND_NUM){
        return {code: code.err.ERR_FRIEND_SELF_LIMIT};
    }
    const askList = selfData.get("receiveAskList");
    const selfBlack = selfData.get("blackList");
    const targetFontIDMap = {};

    for(const targetUid of targetUidList){
        // 检查对方在不在线
        const targetFontId = await this.getConnectorID(targetUid);
        if(!targetFontId&&!await this.isPlayerExist(targetUid)){
            return {code:code.err.ERR_FRIEND_PLAYER_NOT_EXIST};
        }
        targetFontIDMap[targetUid] = targetFontId;

        // 增加好友检查
        if(selfFriendList.indexOf(targetUid)>=0){
            return {code: code.err.ERR_FRIEND_EXIST};
        }
        // 检查是不是拉黑了对方
        if(selfBlack.indexOf(targetUid)>=0){
            return {code:code.err.ERR_FRIEND_BLOCK};
        }
        //检查是不是被对方拉黑了
        const targetData = await this.queryOrCreate(targetUid);
        const targetBlack = targetData.get("blackList");
        if(targetBlack.indexOf(uid)>=0){
            return {code:code.err.ERR_FRIEND_BEING_BLOCK};
        }

        // 删申请列表检查
        const askListIndex = askList.indexOf(targetUid);
        if(askListIndex<0){
            return {code:code.err.ERR_FRIEND_TARGET_NOT_APPLY};
        }

        // 对方好友列表上限检查
        const targetFriendList = targetData.get("friendList");
        if(targetFriendList.length + 1 > code.friend.MAX_FRIEND_NUM){
            return {code:code.err.ERR_FRIEND_TARGET_LIMIT};
        }
    }
    for(const targetUid of targetUidList){
        const targetData = await this.queryOrCreate(targetUid);
        const targetFriendList = targetData.get("friendList");
        const targetAskList = targetData.get("receiveAskList");

        // 修改数据
        if(targetFriendList.indexOf(uid)<0){
            // 不在就增加
            targetFriendList.push(uid);
            targetData.update({friendList:targetFriendList});
            if(targetFontIDMap[targetUid]){
                // 对方玩家在线直接通知
                this.app.get('channelService').pushMessageByUids("OnNotifyAddFriend", {
                    friendInfo: await this.getFriendInfo(uid,false,targetFontIDMap[targetUid]),
                },[{uid: targetUid, sid: targetFontIDMap[targetUid]}]);
            }
        }
        // 取消对方对自己的好友申请
        const askIndex = targetAskList.indexOf(uid);
        if(askIndex>=0){
            targetAskList.splice(askIndex,1);
            targetData.update({receiveAskList:targetAskList});
            if(targetFontIDMap[targetUid]){
                // 对方玩家在线直接通知
                this.app.get('channelService').pushMessageByUids("OnNotifyCancelApplyFriend", {
                    uid:uid.toString(),
                },[{uid: targetUid, sid: targetFontIDMap[targetUid]}]);
            }
        }
    }

    selfFriendList = selfFriendList.concat(targetUidList);
    const finalAskList = [];
    for(const askId of askList){
        if(targetUidList.indexOf(askId)>=0){
            continue;
        }
        finalAskList.push(askId);
    }
    selfData.update({receiveAskList:finalAskList,friendList:selfFriendList});

    const friendInfo = [];
    for(const targetUid of targetUidList){
        friendInfo.push(await this.getFriendInfo(targetUid,false,targetFontIDMap[targetUid]));
    }
    return {code: code.err.SUCCEEDED, newFriendInfo: friendInfo};
};

/**
 * 拒绝申请
 */
FriendService.prototype.denyApply = async function(uid, targetUidList){
    uid = this.stringToUid(uid);
    targetUidList = this.stringToUid(targetUidList);
    if(targetUidList.indexOf(uid)>=0){
        return {code: code.err.ERR_FRIEND_SELF_TARGET};
    }
    const selfData = await this.queryOrCreate(uid);
    const askList = selfData.get("receiveAskList");
    for(const targetUid of targetUidList){
        if(askList.indexOf(targetUid)<0){
            return {code: code.err.ERR_FRIEND_TARGET_NOT_APPLY};
        }
    }
    const finalAskList = [];
    for(const askId of askList){
        if(targetUidList.indexOf(askId)>=0){
            continue;
        }
        finalAskList.push(askId);
    }
    selfData.update({receiveAskList:finalAskList});
    return {code:code.err.SUCCEEDED, uid:this.uidToString(targetUidList)};
};

/**
 * 删除好友
 */
FriendService.prototype.deleteFriend = async function(uid, targetUidList){
    uid = this.stringToUid(uid);
    targetUidList = this.stringToUid(targetUidList);
    if(targetUidList.indexOf(uid)>=0){
        return {code: code.err.ERR_FRIEND_SELF_TARGET};
    }
    const selfData = await this.queryOrCreate(uid);
    const selfFriendList = selfData.get("friendList");
    const targetFontIDMap = {};

    for(const targetUid of targetUidList){
        // 检查对方在不在线
        const targetFontId = await this.getConnectorID(targetUid);
        // 注释掉防止不存在好友却删不掉
        // if(!targetFontId && !await this.isPlayerExist(targetUid)){
        //     return {code: code.err.ERR_FRIEND_PLAYER_NOT_EXIST};
        // }
        targetFontIDMap[targetUid] = targetFontId;
        // 删除好友检查
        const selfTargetIndex = selfFriendList.indexOf(targetUid);
        if(selfTargetIndex<0){
            return {code: code.err.ERR_FRIEND_NOT_EXIST};
        }
    }
    for(const targetUid of targetUidList){
        const targetData = await this.queryOrCreate(targetUid);
        const targetFriendList = targetData.get("friendList");

        // 修改数据
        const targetSelfIndex = targetFriendList.indexOf(uid);
        if(targetSelfIndex>=0){
            // 在就减少
            targetFriendList.splice(targetSelfIndex, 1);
            targetData.update({friendList:targetFriendList});
            if(targetFontIDMap[targetUid]){
                // 对方玩家在线直接通知
                this.app.get('channelService').pushMessageByUids("OnNotifyDeleteFriend", {
                    uid: uid.toString(),
                },[{uid: targetUid, sid: targetFontIDMap[targetUid]}]);
            }
        }
    }

    const finalFriendList = [];
    for(const id of selfFriendList){
        if(targetUidList.indexOf(id)>=0){
            continue;
        }
        finalFriendList.push(id);
    }
    selfData.update({friendList:finalFriendList});
    
    return {code: code.err.SUCCEEDED, uid:this.uidToString(targetUidList)};
};

/**
 * 拉黑
 */
FriendService.prototype.blockFriend = async function(uid,targetUidList){
    uid = this.stringToUid(uid);
    targetUidList = this.stringToUid(targetUidList);
    if(targetUidList.indexOf(uid)>=0){
        return {code: code.err.ERR_FRIEND_SELF_TARGET};
    }
    const selfData = await this.queryOrCreate(uid);
    let selfBlackList = selfData.get("blackList");
    const targetFontIDMap = {};
    for(const targetUid of targetUidList){
        // 检查对方在不在线
        const targetFontId = await this.getConnectorID(targetUid);
        if(!targetFontId&&!await this.isPlayerExist(targetUid)){
            return {code:code.err.ERR_FRIEND_PLAYER_NOT_EXIST};
        }
        targetFontIDMap[targetUid] = targetFontId;

        if(selfBlackList.indexOf(targetUid)>=0){
            return {code:code.err.ERR_FRIEND_BLOCK};
        }
    }

    for(const targetUid of targetUidList){
        const targetData = await this.queryOrCreate(targetUid);
        const targetFriendList = targetData.get("friendList");
        const targetAskList = targetData.get("receiveAskList");
        let isUpdate = false;
        const targetAskIndex = targetAskList.indexOf(uid);
        if(targetAskIndex>=0){
            isUpdate = true;
            targetAskList.splice(targetAskIndex,1);
            if(targetFontIDMap[targetUid]){
                // 对方玩家在线直接通知
                this.app.get('channelService').pushMessageByUids("OnNotifyCancelApplyFriend", {
                    uid: uid.toString(),
                },[{uid: targetUid, sid: targetFontIDMap[targetUid]}]);
            }
        }
        const targetFriendIndex = targetFriendList.indexOf(uid);
        if(targetFriendIndex>=0){
            isUpdate = true;
            targetFriendList.splice(targetFriendIndex,1);
            if(targetFontIDMap[targetUid]){
                // 对方玩家在线直接通知
                this.app.get('channelService').pushMessageByUids("OnNotifyDeleteFriend", {
                    uid: uid.toString(),
                },[{uid: targetUid, sid: targetFontIDMap[targetUid]}]);
            }
        }
        if(isUpdate){
            targetData.update({friendList:targetFriendList,receiveAskList:targetAskList});
        }
    }
    const finalFriendList = [];
    const finalAskList = [];
    const selfFriendList = selfData.get("friendList");
    const selfAskList = selfData.get("receiveAskList");
    const selfFontId = await this.getConnectorID(uid);
    for(const id of selfFriendList){
        if(targetUidList.indexOf(id)>=0){
            this.app.get('channelService').pushMessageByUids("OnNotifyDeleteFriend", {
                uid: id.toString(),
            },[{uid: uid, sid: selfFontId}]);
            continue;
        }
        finalFriendList.push(id);
    }
    for(const id of selfAskList){
        if(targetUidList.indexOf(id)>=0){
            this.app.get('channelService').pushMessageByUids("OnNotifyCancelApplyFriend", {
                uid: id.toString(),
            },[{uid: uid, sid: selfFontId}]);
            continue;
        }
        finalAskList.push(id);
    }
    selfBlackList = selfBlackList.concat(targetUidList);
    selfData.update({
        friendList:finalFriendList,
        receiveAskList:finalAskList,
        blackList:selfBlackList,
    });
    
    const blockInfo = [];
    for(const id of targetUidList){
        blockInfo.push(await this.getFriendInfo(id,false,targetFontIDMap[id]));
    }

    return {code:code.err.SUCCEEDED, newBlockInfo:blockInfo};
};

/**
 * 取消拉黑
 */
FriendService.prototype.unBlockFriend = async function(uid,targetUidList){
    uid = this.stringToUid(uid);
    targetUidList = this.stringToUid(targetUidList);
    if(targetUidList.indexOf(uid)>=0){
        return {code: code.err.ERR_FRIEND_SELF_TARGET};
    }
    const selfData = await this.queryOrCreate(uid);
    const selfBlackList = selfData.get("blackList");
    for(const targetUid of targetUidList){
        if(selfBlackList.indexOf(targetUid)<0){
            return {code: code.err.ERR_FRIEND_NOT_BLOCK};
        }
    }
    const finalBlackList = [];
    for(const id of selfBlackList){
        if(targetUidList.indexOf(id)>=0){
            continue;
        }
        finalBlackList.push(id);
    }
    selfData.update({blackList:finalBlackList});

    return {code:code.err.SUCCEEDED, uid:this.uidToString(targetUidList)};
};

/***************************internal function*******************************/

/**
 * 判断数据库玩家是否存在，配合ROLE_ON_CONNECT使用
 */
FriendService.prototype.isPlayerExist = async function(uid){
    const brief = await this.app.Brief.getBrief(uid);
    if(brief==null){
        return false;
    }else{
        return true;
    }
};

FriendService.prototype.stringToUid = function(uids){
    if(Array.isArray(uids)){
        const result = [];
        for(const uid of uids){
            const uidNum = uid*1;
            assert(!isNaN(uidNum),`uid格式错误`);
            result.push(uidNum);
        }
        return result;
    }else{
        const uidNum = uids*1;
        assert(!isNaN(uidNum),`uid格式错误`);
        return uidNum;
    }
};

FriendService.prototype.uidToString = function(uidStr){
    if(Array.isArray(uidStr)){
        const result = [];
        for(const uid of uidStr){
            result.push(uid.toString());
        }
        return result;
    }else{
        return uidStr.toString();
    }
};

FriendService.prototype.getConnectorID = async function(uid){
    const result = await this.app.Redis.hget(code.redis.ROLE_ON_CONNECTOR.name, uid);
    if(result.err){
        logger.error(result.err);
        return null;
    }
    return result.res;
};

FriendService.prototype.getFriendInfo = async function(uid, needQuery = true, connectorID){
    const brief = await this.app.Brief.getBrief(uid);
    let isOnline;
    if(needQuery){
        const con = await this.getConnectorID(uid);
        isOnline = con?true:false;
    }else{
        isOnline = connectorID?true:false;
    }
    return {
        uid:uid.toString(),
        lv:parseInt(brief.lv),
        vip:brief.vip,
        name:brief.name,
        power:parseInt(brief.power),
        guild:await this.app.Guild.getGuildName(uid),
        lastOnlineTime:isOnline?0:utils.time.ms2s(Number(brief.lastLogoutTime)),
        sex:parseInt(brief.sex),
    };
};
