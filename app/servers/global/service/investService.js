/**
 * @description 投资系统管理器
 * @author jzy
 * @date 2020/04/23
 */

const bearcat = require('bearcat');
const code = require('@code');
const utils = require('@util');

const InvestService = function () {
    this.$id = 'global_InvestService';
    this.app = null;



    //需要维护的内存块
    this.uid2id = {};         //根据uid分类
    this.uid2idByFriend = {};   //uid --> 受到邀请的data
    this.globalList = [];       //全服data
    this.guild2idByGuild = {};  //公会id --> 标示为公会的data
};

module.exports = InvestService;
bearcat.extend('global_InvestService', 'logic_MongoBaseService');
InvestService.prototype.mongoDataClassFunc = require('@mongo/mongoInvest');
InvestService.prototype.uidKey = 'id';
InvestService.prototype.needClean = false;  // 不需要缓存

/** 数据结构
 *  id:[id]
 *  uid:xxx,
 *  investID:xxx,
 *  color:xxx,
 *  name:xxx,
 *  time:xxx,
 *  globalFlag:true,
 *  guildId:0,
 *  friendList:[],
 *  finishType:xxx,
 */
/*******************************继承接口*******************************/
/**
 * 初始化服务
 */
InvestService.prototype.init = async function () {
    const allData = await this.loadAll();
    for(const data of allData){
        this._classifyData(data);
    }
};

InvestService.prototype.onDelete = async function(data){
    // uid2id
    const id = data.get("id");
    const uid = data.get("uid");
    const uid2idIndex = this.uid2id[uid].indexOf(id);
    if(uid2idIndex>=0){
        this.uid2id[uid].splice(uid2idIndex,1);
    }

    await this._onFinish(data);
};

InvestService.prototype._onFinish = async function(data){
    const id = data.get("id");
    // 删除好友内的
    for(const friendUid of data.get("friendList")){
        const friendIndex = this.uid2idByFriend[friendUid].indexOf(id);
        if(friendIndex>=0){
            this.uid2idByFriend[friendUid].splice(friendIndex,1);
        }
    }

    // 删除全服内的
    if(data.get("globalFlag")){
        const globalIndex = this.globalList.indexOf(id);
        if(globalIndex>=0){
            this.globalList.splice(globalIndex,1);
        }
    }

    // 删除工会的
    const guildID = data.get("guildId");
    if(guildID!=0){
        const guildIndex = this.guild2idByGuild[guildID].indexOf(id);
        if(guildIndex>=0){
            this.guild2idByGuild[guildID].splice(guildIndex,1);
        }
    }
};

InvestService.prototype._classifyData = function(data){
    const finishType = data.get("finishType");
    if(finishType!=this.mongoDataClassFunc.prototype._columns.finishType.default){
        return;
    }
    const id = data.get("id");
    // uid2id
    const uid = data.get("uid");
    this.uid2id[uid] = this.uid2id[uid] || [];
    this.uid2id[uid].push(id);

    // 好友
    for(const friendUid of data.get("friendList")){
        this.uid2idByFriend[friendUid] = this.uid2idByFriend[friendUid] || [];
        this.uid2idByFriend[friendUid].push(id);
    }

    // 全服
    if(data.get("globalFlag")){
        this.globalList.push(id);
    }

    // 公会
    const guildID = data.get("guildId");
    if(guildID!=0){
        this.guild2idByGuild[guildID] = this.guild2idByGuild[guildID] || [];
        this.guild2idByGuild[guildID].push(id);
    }
};
/**********************************************************************/

/**
 * 获取项目协议信息
 */
InvestService.prototype.getProjectInfo = async function(uid){
    const result = [];
    for(const id of (this.uid2id[uid] || [])){
        const data = await this.getSingleProjectInfo(id, uid);
        if(data == null){continue;}
        let cooperate;
        if(data.finishType!=undefined){
            const data = await this.query(id);
            cooperate = data.get("cooperate");
        }
        result.push({self:data,cooperate:cooperate});
    }
    return result;
};

/**
 * 获取别人的项目信息
 */
InvestService.prototype.getSingleProjectInfo = async function(id, selfUid){
    const data = await this.query(id);
    if(data==null){return null;}
    const uid = data.get("uid");
    const type = [];

    const isGlobal = data.get("globalFlag");
    const isRecordFriend = data.get("friendList").indexOf(selfUid)>=0;
    const isRecordGuild = data.get("guildId")!=0;
    if(isGlobal){
        type.push(code.invest.INVEST_TYPE.GLOBAL);
    }
    if(isRecordFriend){
        type.push(code.invest.INVEST_TYPE.FRIEND);
    }
    if(isRecordGuild){
        type.push(code.invest.INVEST_TYPE.GUILD);
    }
    const brief = await this.app.Brief.getBrief(uid);
    const obj = {
        id:data.get("id"),
        investID:data.get("investID"),
        color:data.get("color"),
        playerUid:uid.toString(),
        playerName:brief.name,
        playerLevel:data.get("playerLevel"),
        name:data.get("name"),
        tags:type,
    };
    const finishType = data.get("finishType");
    if(finishType!=this.mongoDataClassFunc.prototype._columns.finishType.default){
        obj.finishType = finishType;
    }
    return obj;
};

/**
 * 加一条待上市项目
 * @param {Object} info {id:xxx, investID:xxx, color:xxx, name:xxx}
 */
InvestService.prototype.addProject = async function(uid,info){
    //判断项目已满
    const brief = await this.app.Brief.getBrief(uid);
    const vipCfg = this.app.Config.Vip.get(brief.vip);
    if(Object.keys(this.uid2id[uid] || []).length + 1 > vipCfg.InvestCnt){
        return {code:code.err.ERR_INVEST_PROJECT_FULL};
    }
    //判断是否相同项目
    const data = await this.queryOrCreate(info.id);
    if(data.get("uid")!=this.mongoDataClassFunc.prototype._columns.uid.default){
        return {code:code.err.ERR_INVEST_PROJECT_EXIST};
    }
    const obj = {
        id: info.id,
        uid: uid,
        investID: info.investID,
        color: info.color,
        playerLevel: info.playerLevel,
        name: info.name,
        time: utils.time.nowMS(),
    };
    data.update(obj);
    this._classifyData(data);
    return {code:code.err.SUCCEEDED};
};

/**
 * 获取推荐的项目列表数据库对象
 */
InvestService.prototype.recommend = async function(uid){
    const list = await this.__recommend(uid);
    const result = [];
    for(const id of list){
        const data = await this.getSingleProjectInfo(id, uid);
        if(data==null){continue;}
        result.push(data);
    }
    return result;
};
InvestService.prototype.__recommend = async function(uid){
    let list = [];
    const self = this;
    // 公会 
    const guildID = await this._getGuildId(uid);
    const guildList = [];
    for(const element of (this.guild2idByGuild[guildID] || [])){
        const data = self.getCache(element);
        if(data == null){continue;}
        const targetUID = data.get("uid");
        // 排除自身
        if(targetUID == uid){continue;}
        // 排除此时状态不是同一工会
        if((await this._getGuildId(targetUID))!=guildID){
            continue;
        }
        guildList.push(element);
    }
    guildList.sort(function(a, b) {
        return self.getCache(b).get("time") - self.getCache(a).get("time");
    });
    if(guildList.length>=code.invest.MAX_RECOMMEND_NUM){
        return guildList.slice(0,code.invest.MAX_RECOMMEND_NUM);
    }
    list = list.concat(guildList);

    // 好友
    const selfFriends = await this.app.Friend.getFriends(uid);
    const friendList = (this.uid2idByFriend[uid] || []).filter(function(element){
        const data =self.getCache(element);
        // 排除此时不是好友
        if(data == null || selfFriends.indexOf(data.get("uid"))<0){return false;}
        // 去重
        return list.indexOf(element)<0;
    });
    friendList.sort(function(a, b) {
        return self.getCache(b).get("time") - self.getCache(a).get("time");
    });
    if(list.length + friendList.length >= code.invest.MAX_RECOMMEND_NUM){
        return list.concat(friendList.slice(0,code.invest.MAX_RECOMMEND_NUM-list.length));
    }
    list = list.concat(friendList);

    // 全服
    const globalLists = (this.globalList || []).filter(function(element){
        const data =self.getCache(element);
        if(data == null){return false;}
        // 排除自身和去重
        return data.get("uid") != uid && list.indexOf(element)<0;
    });
    globalLists.sort(function(a, b) {
        return self.getCache(b).get("time") - self.getCache(a).get("time");
    });
    if(list.length + globalLists.length >= code.invest.MAX_RECOMMEND_NUM){
        return list.concat(globalLists.slice(0,code.invest.MAX_RECOMMEND_NUM-list.length));
    }
    list = list.concat(globalLists);
    
    return list;
};

/**
 * 邀请通告
 */
InvestService.prototype.invite = async function(uid,id,tag,targetUID){
    const data = await this.query(id);
    if(!data || data.get("uid")!=uid){
        return {code:code.err.ERR_INVEST_PROJECT_NOT_EXIST};
    }
    if(data.get("finishType")!=this.mongoDataClassFunc.prototype._columns.finishType.default){
        return {code:code.err.ERR_INVEST_PROJECT_COMPLETE};
    }
    const updateObj = {};
    switch(tag){
    case code.invest.INVEST_TYPE.GLOBAL:{ //全服
        if(data.get("globalFlag")){
            return {code:code.err.ERR_INVEST_HAS_INVITE_GLOBAL};
        }
        updateObj.globalFlag = true;
        this.globalList.push(id);
        break;
    }
    case code.invest.INVEST_TYPE.GUILD:{ //公会
        const recordGuildID = data.get("guildId");
        if(recordGuildID){
            // 删除工会的
            const guildIndex = this.guild2idByGuild[recordGuildID].indexOf(id);
            if(guildIndex>=0){
                this.guild2idByGuild[recordGuildID].splice(guildIndex,1);
            }
        }
        if(!(await this._isJoinGuild(uid))){
            return {code:code.err.ERR_INVEST_NOT_IN_GUILD};
        }
        const guildID = await this._getGuildId(uid);
        updateObj.guildId = guildID;
        this.guild2idByGuild[guildID] = this.guild2idByGuild[guildID] || [];
        this.guild2idByGuild[guildID].push(id);
        break;
    }
    case code.invest.INVEST_TYPE.FRIEND:{ //好友
        if(!targetUID){
            return {code:code.err.ERR_CLIENT_PARAMS_WRONG};
        }
        targetUID = Number(targetUID);
        const currentFriendList = data.get("friendList");
        if(currentFriendList.indexOf(targetUID)>=0){
            return {code:code.err.ERR_INVEST_HAS_INVITE_FRIEND};
        }
        if(!(await this.app.Friend.isFriend(uid,targetUID))){
            return {code:code.err.ERR_FRIEND_NOT_EXIST};
        }
        currentFriendList.push(targetUID);
        updateObj.friendList = currentFriendList;

        this.uid2idByFriend[targetUID] = this.uid2idByFriend[targetUID] || [];
        this.uid2idByFriend[targetUID].push(id);
        break;
    }
    default:{
        return {code:code.err.ERR_CLIENT_PARAMS_WRONG};
    }
    }
    data.update(updateObj);
    return {code:code.err.SUCCEEDED};
};

/**
 * 自己完成，收货已完成
 */
InvestService.prototype.investSelf = async function(uid,id){
    const data = await this.query(id);
    if(!data || data.get("uid")!=uid){
        return {code:code.err.ERR_INVEST_PROJECT_NOT_EXIST};
    }
    let finishType = data.get("finishType");
    if(finishType==this.mongoDataClassFunc.prototype._columns.finishType.default){
        finishType = code.invest.FINISH_TYPE.NONE;
    }
    const targetInvestID = (data.get("cooperate") || {}).investID;
    const targetColor = (data.get("cooperate") || {}).color;
    this.delete(id);
    return {code:code.err.SUCCEEDED, id:id, finishParams : [
        data.get("investID"),data.get("color"),data.get("playerLevel"),finishType,targetInvestID,targetColor
    ]};
};
InvestService.prototype.investSelfBot = async function(uid,id){
    const data = await this.query(id);
    if(!data || data.get("uid")!=uid){
        return {code:code.err.ERR_INVEST_PROJECT_NOT_EXIST};
    }
    const finishType = data.get("finishType");
    if(finishType!=this.mongoDataClassFunc.prototype._columns.finishType.default){
        return {code:code.err.ERR_INVEST_PROJECT_COMPLETE};
    }
    this.delete(id);
    return {code:code.err.SUCCEEDED, id:id, finishParams : [
        data.get("investID"),data.get("color"),data.get("playerLevel")
    ]};
};

/**
 * 合作完成
 */
InvestService.prototype.investTogether = async function(uid,id,targetID){
    //检查
    const data = await this.query(id);
    if(!data || data.get("uid")!=uid){
        return {code:code.err.ERR_INVEST_PROJECT_NOT_EXIST};
    }
    const targetData = await this.query(targetID);
    if(!targetData){
        return {code:code.err.ERR_INVEST_TARGET_PROJECT_NOT_EXIST};
    }
    const targetUID = targetData.get("uid");
    if(targetUID==uid){
        return {code:code.err.ERR_INVEST_TARGET_PROJECT_SELF};
    }
    if(data.get("finishType")!=this.mongoDataClassFunc.prototype._columns.finishType.default){
        return {code:code.err.ERR_INVEST_PROJECT_COMPLETE};
    }
    if(targetData.get("finishType")!=this.mongoDataClassFunc.prototype._columns.finishType.default){
        return {code:code.err.ERR_INVEST_TARGET_PROJECT_COMPLETE};
    }

    let type;
    const isRecordTargetGuildId = targetData.get("guildId")!=0;
    const targetGuildId = await this._getGuildId(targetUID);
    const selfGuildId = await this._getGuildId(uid);

    const isSameGuild = targetGuildId && targetGuildId == selfGuildId;
    const isRecordFriend = targetData.get("friendList").indexOf(uid)>=0;
    const isFriend = await this.app.Friend.isFriend(uid,targetUID);
    const isGlobal = targetData.get("globalFlag");
    // 优先级: 公会>好友>全服
    // 好友通告或全服通告里面有同工会的也算
    if( (isRecordTargetGuildId || isRecordFriend || isGlobal) && isSameGuild){
        type = code.invest.FINISH_TYPE.GUILD;
    }
    // 全服通告里面有好友也算
    else if(isRecordFriend || (isGlobal&&isFriend)){
        type = code.invest.FINISH_TYPE.FRIEND;
    }
    else if(isGlobal){
        type = code.invest.FINISH_TYPE.GLOBAL;
    }
    else{
        return {code:code.err.ERR_INVEST_TARGET_PROJECT_CAN_COOPERATION};
    }
    const targetInvestID = targetData.get("investID");
    const targetColor = targetData.get("color");
    const cooperate = await this.getSingleProjectInfo(id, uid);   // TODO: projectInfo消息修改时会导致旧号已完成数据消息错误
    this.delete(id);
    targetData.update({finishType:type, cooperate:cooperate});
    await this._onFinish(targetData); // 先从搜索缓存中删除
    await this.app.Notify.notify(targetUID,"onNotifyInvestFinishType",{
        id:targetID,
        finishType:type,
        cooperate:cooperate,
    });
    return {code:code.err.SUCCEEDED,id:id, finishType:type, finishParams:[
        data.get("investID"),data.get("color"),data.get("playerLevel"),type,targetInvestID,targetColor
    ]};
};

/**
 * 获取合作项目信息
 */
InvestService.prototype.getCooperateProjectInfo = async function(uid,id){
    const data = await this.getSingleProjectInfo(id,uid);
    if(data==null){
        return {code:code.err.ERR_INVEST_PROJECT_NOT_EXIST};
    }
    if(data.finishType!=undefined){
        return {code:code.err.ERR_INVEST_TARGET_PROJECT_COMPLETE};
    }
    return {code:code.err.SUCCEEDED,info:data};
};





/**
 * 获取联盟id，无id标示为0
 */
InvestService.prototype._getGuildId = async function(uid){
    return await this.app.Guild.getGuildId(uid);
};

/**
 * 判断是否加入公会
 */
InvestService.prototype._isJoinGuild = async function(uid){
    if((await this._getGuildId(uid))==0){
        return false;
    }
    return true;
};