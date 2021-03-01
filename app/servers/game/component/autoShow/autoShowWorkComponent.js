/**
 * @description 车展逻辑模块
 * @author jzy
 * @date 2020/05/20
 */

// const logger = require('pomelo-logger').getLogger('pomelo', __filename);

const code = require('@code');
const bearcat = require('bearcat');
const utils = require('@util');

const AutoShowWorkComponent = function(app, player){
    this.$id = 'game_AutoShowWorkComponent';
    this.$scope = 'prototype';
    this.app = app;
    this.player = player;

    this.recoveryTimerCache = {};//{UID:{idList:[],timer:xxx}}
    this.idMap = {};//id:UID
};

module.exports = AutoShowWorkComponent;
bearcat.extend('game_AutoShowWorkComponent', 'game_Component');

/**
 * {
 *      maxCardPower:xxx,       // 前五个卡牌 历史最高身价
 *      robBuffTimes:xxx,       // 抢单Buff次数
 *      recommendRecord:[{uid:xxx,type:xxx,hasRobbed:false}],     // 推荐记录
 *      recommendTime:xxx,      // 推荐的时间
 *      useTimes:{[cardId]:{num:xxx,lastRecoveryTime:xxx 秒}},  // 使用次数
 * }
 */

AutoShowWorkComponent.prototype.onInit = async function(){
    this.player.Event.on(code.event.ATTRIBUTE_CHANGE.name, (...params) => { this.attributeChange(...params); });
};

/**
 * 获取信息
 */
AutoShowWorkComponent.prototype.getInfo = async function(){
    const data = this.getDataObj();
    const queryList = [];
    for(const type of this.app.Config.AutoShow.keys()){
        queryList.push({uid:this.player.uid,type:Number(type)});
    }
    const {res} = await this.app.rpcs.global.autoShowRemote.getInfo({}, {
        selfUid: this.player.uid,
        queryList: queryList,
        isSelfQuery: true,
    });
    for(const info of res){
        if(!info.cardInfo){
            info.cardInfo = await this.__getAutoShowCardInfo(info.type);
        }
    }
    return {
        infoList:res,
        maxCardPower:this.getMaxPower(),
        robBuffTimes:data.robBuffTimes || 0,
        recoveryInfo:this._getRecoveryInfo(Object.keys(data.useTimes || {})),
    };
};

/**
 * 开始参展
 */
AutoShowWorkComponent.prototype.start = async function(type, rewardTypeIndex, idList){
    // 参数
    const config = this.app.Config.AutoShow.get(type);
    if(!config || !config.RewardType[rewardTypeIndex]){
        return { code: code.err.ERR_CLIENT_PARAMS_WRONG };
    }

    // 是否能设置上阵卡牌
    idList = idList || [];
    if(idList.length<=0){
        return {code:code.err.ERR_AUTO_SHOW_CARD_LIST_EMPTY};
    }
    if(!this.player.AutoShow.isCanSetData(idList)){
        return { code: code.err.ERR_AUTO_SHOW_CARD_HAS_ON_SHOW };
    }

    // 计算消耗
    const order = this.app.Config.Prestige.get(this.player.lv).Order;
    const baseCost = utils.proto.encodeConfigAward(this.app.Config.AutoShowReward.get(order).Cost);
    const cost = utils.item.multi(baseCost,config.CostValue[rewardTypeIndex],100);
    if(!this.player.Item.isEnough(cost)){
        return {code:code.err.ERR_ITEM_COST_NOT_ENOUGH};
    }

    // 逻辑开启remote
    const remoteInfo = {
        uid:this.player.uid,
        type:type,
        startTime:Date.now(),
        rewardTypeIndex: rewardTypeIndex,
    };
    // 设置开启数据
    const {res} = await this.app.rpcs.global.autoShowRemote.start({}, remoteInfo);
    if(res.code!=code.err.SUCCEEDED){
        return res;
    }

    // 设置上阵卡牌
    this.player.AutoShow.setData(type,idList);

    // 应用消耗
    this.player.Item.deleteItem(cost, code.reason.OP_AUTO_SHOW_START_COST);

    const itemInfo = res.autoShowItemInfo;
    if(!itemInfo.cardInfo){
        itemInfo.cardInfo = await this.__getAutoShowCardInfo(itemInfo.type);
    }
    this.player.Event.emit(code.event.AUTO_SHOW_START.name);
    return {code:code.err.SUCCEEDED, itemInfo:itemInfo};
};

/**
 * 结束参展
 */
AutoShowWorkComponent.prototype.end = async function(type,isInAdvance){
    const config = this.app.Config.AutoShow.get(type);
    if(!config){
        return {code:code.err.ERR_CLIENT_PARAMS_WRONG};
    }
    let cost = [];
    if(isInAdvance){
        // 计算消耗
        cost = utils.proto.encodeConfigAward(this.app.Config.Global.get(code.autoShow.GLOBAL_ID_END_IN_ADVANCE_COST).GlobalJson);
        if(!this.player.Item.isEnough(cost)){
            return {code:code.err.ERR_ITEM_COST_NOT_ENOUGH};
        }
    }

    // 结束项目
    const {res} = await this.app.rpcs.global.autoShowRemote.end({}, {uid:this.player.uid, type:type, lv:this.player.lv, isInAdvance:isInAdvance});
    if(res.code!=code.err.SUCCEEDED){
        return res;
    }

    // 设置上阵卡牌
    this.player.AutoShow.deleteData(type);

    // 增加奖励和扣除物品
    this.player.Item.modifyItem(res.reward, cost, code.reason.OP_AUTO_SHOW_END);


    return {code:code.err.SUCCEEDED, type:type, award:utils.proto.encodeAward(res.reward)};
};

/**
 * 抢单
 */
AutoShowWorkComponent.prototype.rob = async function(targetUid,type,idList){
    // 参数
    const config = this.app.Config.AutoShow.get(type);
    if(!config){
        return { code: code.err.ERR_CLIENT_PARAMS_WRONG };
    }

    const data = this.getDataObj();
    // 是否能设置上阵卡牌
    idList = idList || [];
    if(idList.length<=0){
        return {code:code.err.ERR_AUTO_SHOW_CARD_LIST_EMPTY};
    }
    // if(!this.player.AutoShow.isCanSetData(idList)){
    //     return { code: code.err.ERR_AUTO_SHOW_CARD_HAS_ON_SHOW };
    // }

    // 消耗次数够不够
    if(!this.isCanUseTimes(idList)){
        return {code:code.err.ERR_AUTO_SHOW_CARD_TIMES_LIMIT}; // 卡牌次数不足
    }

    // 推荐对象
    let recommendItem = {};
    for(const item of (data.recommendRecord || [])){
        if(item.uid == targetUid && item.type == type){
            recommendItem = item;
            break;
        }
    }
    // 判断是否抢过
    if(recommendItem.hasRobbed){
        return {code:code.err.ERR_AUTO_SHOW_HAS_ROBBED}; // 已经抢过了
    }

    // 抢单
    const {res} = await this.app.rpcs.global.autoShowRemote.rob({}, {
        maxCardPower:this.getMaxPower(), 
        targetUid:targetUid, 
        type:type,
        selfArray: this.getSelfCardArray(idList),
        selfInfo: {
            uid:this.player.uid,
            name:this.player.name
        }
    });
    if(res.code!=code.err.SUCCEEDED){
        return res;
    }
    const isWin = res.isWin;

    if(isWin){
        // 增加奖励
        this.player.Item.addItem(res.reward, code.reason.OP_AUTO_SHOW_ROB_GET);
        recommendItem.hasRobbed = true;
    }

    // 消耗卡牌次数
    const recoveryInfo = this.useTimes(idList);

    // 恢复抢单buff变成0
    
    data.robBuffTimes = 0;
    this.update(data);

    this.player.Event.emit(code.event.AUTO_SHOW_ROB.name);

    return {
        code:code.err.SUCCEEDED, 
        targetUid:targetUid.toString(),
        type:type, 
        hasRobbed:recommendItem.hasRobbed?1:0,
        robBuffTimes:data.robBuffTimes,
        recoveryInfo: recoveryInfo,
    };
};

/**
 * 购买buff
 */
AutoShowWorkComponent.prototype.buyBuff = function(){
    const data = this.getDataObj();
    const robBuffTimes = data.robBuffTimes || 0;
    const order = this.app.Config.Prestige.get(this.player.lv).Order;
    const baseCost = utils.proto.encodeConfigAward(this.app.Config.AutoShowReward.get(order).InspireCost);
    const cost = utils.item.multi(baseCost, Math.pow(2,robBuffTimes));
    if(!this.player.Item.isEnough(cost)){
        return {code:code.err.ERR_ITEM_COST_NOT_ENOUGH};
    }

    this.player.Item.deleteItem(cost, code.reason.OP_AUTO_SHOW_BUY_BUFF_COST);

    data.robBuffTimes = robBuffTimes + 1;
    this.update(data);

    return { code:code.err.SUCCEEDED, robBuffTimes:data.robBuffTimes };
};

/**
 * 推荐
 */
AutoShowWorkComponent.prototype.recommend = async function(isRefresh = false, isUseDiamond = false){
    const data = this.getDataObj();
    let result = [];
    if(isRefresh){
        if(!isUseDiamond && !this.player.Recovery.judgeRecoveryNum(code.recovery.RECOVERY_TYPE.AUTO_SHOW_ROB_REFRESH,1)){
            return {code:code.err.ERR_AUTO_SHOW_RECOMMEND_TIMES_LIMIT}; // 次数不足
        }
        let cost = [];
        if(isUseDiamond){
            cost = utils.proto.encodeConfigAward(this.app.Config.Global.get(code.autoShow.GLOBAL_ID_REFRESH_RECOMMEND).GlobalJson);
            if(!this.player.Item.isEnough(cost)){
                return {code:code.err.ERR_ITEM_COST_NOT_ENOUGH};
            }
        }
        // 抢单
        const {res} = await this.app.rpcs.global.autoShowRemote.recommend({}, {
            maxCardPower:this.getMaxPower(), 
            selfUid: this.player.uid,
            selfLevel: this.player.lv,
        });
        for(const info of res){
            if(!info.cardInfo){
                info.cardInfo = await this.__getAutoShowCardInfo(info.type, Number(info.uid));
            }
        }
        result = res;
        data.recommendRecord = res.map(info=>{return {uid:info.uid,type:info.type};});
        if(!isUseDiamond){
            this.player.Recovery.deductRecovery(code.recovery.RECOVERY_TYPE.AUTO_SHOW_ROB_REFRESH,1);
        }else{
            this.player.Item.deleteItem(cost, code.reason.OP_AUTO_SHOW_RECOMMEND_COST);
            this.player.Recovery.resetTimeout(code.recovery.RECOVERY_TYPE.AUTO_SHOW_ROB_REFRESH);
        }
        // 推荐时间
        data.recommendTime = utils.time.nowSecond();
    }else{
        // 缓存
        if(data.recommendRecord){
            // 检查推荐时间是否超时
            const recommendTimeout = this.app.Config.Global.get(code.autoShow.GLOBAL_ID_RECOMMEND_TIMEOUT).GlobalFloat;
            if(!data.recommendTime || data.recommendTime+recommendTimeout<=utils.time.nowSecond()){
                result = [];
                data.recommendRecord = [];
                delete data.recommendTime;
            }else{
                // 查询
                const {res} = await this.app.rpcs.global.autoShowRemote.getInfo({}, {
                    selfUid: this.player.uid,
                    queryList: data.recommendRecord,
                });
                for(const info of res){
                    if(!info.cardInfo){
                        info.cardInfo = await this.__getAutoShowCardInfo(info.type, Number(info.uid));
                    }
                }
                result = res;
                data.recommendRecord = res.map(info=>{return {uid:info.uid,type:info.type};});
            }
        }else{
            delete data.recommendTime;
        }
    }
    this.update(data);
    return {code:code.err.SUCCEEDED,recommendList:result, startTime:data.recommendTime || 0};
};

/*********************************recovery function*********************************/
/**
 * 唯一id
 */
AutoShowWorkComponent.prototype.genUniqueID = function(){
    return this.app.Id.genNext(code.id.KEYS.AUTO_SHOW_TIMER).toString();
};

AutoShowWorkComponent.prototype.useTimes = function(cardIdList){
    const dataObj = this.getDataObj();
    dataObj.useTimes = dataObj.useTimes || {};
    const needSetList = [];
    const nowSec = utils.time.nowSecond();
    for(const cardId of cardIdList){
        dataObj.useTimes[cardId] = dataObj.useTimes[cardId] || {};
        dataObj.useTimes[cardId].num = dataObj.useTimes[cardId].num || 0;
        const isFull = dataObj.useTimes[cardId].num <= 0 ? true : false;
        dataObj.useTimes[cardId].num++;
        if(isFull && dataObj.useTimes[cardId].num > 0){
            dataObj.useTimes[cardId].lastRecoveryTime = nowSec;
            needSetList.push(cardId);
        }
    }
    
    if (needSetList.length > 0) {
        const cd = this.app.Config.Global.get(code.autoShow.GLOBAL_ID_ROB_TIMES_RECOVERY_CD).GlobalFloat;
        // 不足上限 开启恢复计时器
        this._openTimeout(needSetList, cd);
    }
    this.update(dataObj);
    const info = this._getRecoveryInfo(cardIdList);
    return info;
};

/**
 * 恢复一次
 */
AutoShowWorkComponent.prototype.recovery = function(cardId){
    const dataObj = this.getDataObj();
    dataObj.useTimes = dataObj.useTimes || {};
    dataObj.useTimes[cardId].num--;
    if (dataObj.useTimes[cardId].num <= 0) {
        delete dataObj.useTimes[cardId];
        const uid = this.idMap[cardId];
        if(uid){
            const index = this.recoveryTimerCache[uid].idList.indexOf(cardId);
            if(index>=0){
                this.recoveryTimerCache[uid].idList.splice(index,1);
                if(this.recoveryTimerCache[uid].idList.length<=0){
                    this._closeTimeout(uid);
                }
            }
            delete this.idMap[cardId];
        }
    }
    this.update(dataObj);
    const info = this._getRecoveryInfo([cardId]);
    return info;
};

AutoShowWorkComponent.prototype.isCanUseTimes = function(cardIdList){
    const dataObj = this.getDataObj();
    const useTimesData = dataObj.useTimes || {};
    const maxNum = this.app.Config.Global.get(code.autoShow.GLOBAL_ID_ROB_TIMES_RECOVERY_LIMIT).GlobalFloat;
    for(const cardId of cardIdList){
        const num = (useTimesData[cardId] || {}).num || 0;
        if(num >= maxNum){
            return false;
        }
    }
    return true;
};

AutoShowWorkComponent.prototype.isCanRecoveryTimes = function(cardId){
    const dataObj = this.getDataObj();
    const useTimesData = dataObj.useTimes || {};
    const num = (useTimesData[cardId] || {}).num || 0;
    if(num <= 0){
        return false;
    }
    return true;
};

AutoShowWorkComponent.prototype._openTimeout = function (cardIdList, remainTime) {
    if (cardIdList.length>0) {
        const uid = this.genUniqueID();
        for(const id of cardIdList){
            this.idMap[id] = uid;
        }
        const timer = setTimeout((uid) => {
            this._recoveryProcess(uid);
        }, remainTime * 1000, uid);
        this.recoveryTimerCache[uid] = {idList:cardIdList,timer:timer};
    }
};

AutoShowWorkComponent.prototype._closeTimeout = function (uid) {
    if (this.recoveryTimerCache[uid]) {
        clearTimeout(this.recoveryTimerCache[uid].timer);
        for(const id of this.recoveryTimerCache[uid].idList){
            delete this.idMap[id];
        }
        delete this.recoveryTimerCache[uid];
    }
};

AutoShowWorkComponent.prototype._recoveryProcess = function (uid){
    const cardIdList = this.recoveryTimerCache[uid].idList.concat();
    this._closeTimeout(uid);
    const dataObj = this.getDataObj();
    dataObj.useTimes = dataObj.useTimes || {};
    const needSetList = [];
    const nowSec = utils.time.nowSecond();
    for(const cardId of cardIdList) {
        dataObj.useTimes[cardId].num--;
        if (dataObj.useTimes[cardId].num > 0) {
            dataObj.useTimes[cardId].lastRecoveryTime = nowSec;
            needSetList.push(cardId);
        }else{
            delete dataObj.useTimes[cardId];
        }
    }
    if(needSetList.length>0){
        const cd = this.app.Config.Global.get(code.autoShow.GLOBAL_ID_ROB_TIMES_RECOVERY_CD).GlobalFloat;
        // 不足上限 开启恢复计时器
        this._openTimeout(needSetList, cd);
    }
    this.update(dataObj);
    const info = this._getRecoveryInfo(cardIdList);
    this.player.Notify.notify('onNotifyAutoShowCardRecoveryInfo', { info: info });
};

AutoShowWorkComponent.prototype._getRecoveryInfo = function (cardIdList) {
    const dataObj = this.getDataObj();
    const useTimesData = dataObj.useTimes || {};
    const cd = this.app.Config.Global.get(code.autoShow.GLOBAL_ID_ROB_TIMES_RECOVERY_CD).GlobalFloat;
    const list = [];
    for(const cardId of cardIdList){
        const num = (useTimesData[cardId] || {}).num || 0;
        const lastRecoveryTime = (useTimesData[cardId] || {}).lastRecoveryTime || 0;
        const info = {
            cardId:Number(cardId),
            useNum:num,
        };
        if(lastRecoveryTime!=0){
            info.remainTime = lastRecoveryTime + cd;
        }
        list.push(info);
    }
    
    return list;
};

AutoShowWorkComponent.prototype.onClean = function(){
    for(const timer of Object.values(this.recoveryTimerCache)){
        clearTimeout(timer.timer);
    }
};

AutoShowWorkComponent.prototype.onAfterLoad = function(){
    const nowSec = utils.time.nowSecond();
    const dataObj = this.getDataObj();
    dataObj.useTimes = dataObj.useTimes || {};
    const cdTime = this.app.Config.Global.get(code.autoShow.GLOBAL_ID_ROB_TIMES_RECOVERY_CD).GlobalFloat;
    const timeClassifyCardList = {};
    for(const cardId of Object.keys(dataObj.useTimes)){
        const times = Math.floor((nowSec - dataObj.useTimes[cardId].lastRecoveryTime)/cdTime);
        dataObj.useTimes[cardId] = dataObj.useTimes[cardId] || {};
        dataObj.useTimes[cardId].num = dataObj.useTimes[cardId].num || 0;
        dataObj.useTimes[cardId].num -= times;
        if (dataObj.useTimes[cardId].num > 0) {
            dataObj.useTimes[cardId].lastRecoveryTime += times*cdTime;
            timeClassifyCardList[dataObj.useTimes[cardId].lastRecoveryTime] = timeClassifyCardList[dataObj.useTimes[cardId].lastRecoveryTime] || [];
            timeClassifyCardList[dataObj.useTimes[cardId].lastRecoveryTime].push(cardId);
        }else{
            delete dataObj.useTimes[cardId];
        }
    }
    for(const [time,needSetList] of Object.entries(timeClassifyCardList)){
        // 不足上限 开启恢复计时器
        this._openTimeout(needSetList, cdTime + Number(time) - nowSec);
    }

    this.update(dataObj);
};

/*********************************internal function*********************************/

AutoShowWorkComponent.prototype.__getAutoShowCardInfo = async function(type, targetUid){
    let autoShowData;
    if(targetUid && targetUid!=this.player.uid){
        const targetBrief = await this.app.Brief.getBrief(targetUid);
        autoShowData = targetBrief.autoShow;
    }else{
        autoShowData = this.player.get(code.player.Keys.AUTO_SHOW);
    }
    const result = [];
    for(const key of Object.keys(autoShowData[type] || {})){
        const info = autoShowData[type][key];
        result.push({
            cardId:Number(key),
            level:info.level,
            star:info.star,
            attrs:this.player.Card.returnAttribute(info.attrs),
            power:info.power,
        });
    }
    return result;
};

/**
 * 获得自己的上阵卡牌信息
 */
AutoShowWorkComponent.prototype.getSelfCardArray = function(idList){
    const selfArray = [];
    const buffList = [];
    const cardList = this.player.Card.getOwnCardList(idList);
    const data = this.getDataObj();
    const robBuffTimes = data.robBuffTimes || 0;
    const buffID = this.app.Config.Global.get(code.autoShow.GLOBAL_ID_BUY_BUFF).GlobalFloat;
    for(let i =0;i<robBuffTimes;i++){
        buffList.push(buffID);
    }
    this.app.Config.Buff.affectBattleCardAttr(cardList, buffList);
    for (const info of cardList) {
        const cardCfg = this.app.Config.Card.get(parseInt(info.cardId));
        const skillCfg = this.app.Config.Skill.getByLevel(cardCfg.Skill, info.star + 1);
        const afterAttr = info.attr;
        selfArray.push({
            id: parseInt(info.cardId),
            hp: utils.random.random(afterAttr[code.attribute.ATTR_TYPE.HP_MIN], afterAttr[code.attribute.ATTR_TYPE.HP_MAX]),
            atk: utils.random.random(afterAttr[code.attribute.ATTR_TYPE.ATTACK_MIN], afterAttr[code.attribute.ATTR_TYPE.ATTACK_MAX]),
            skill: skillCfg ? skillCfg.Id : 0,
        });
    }
    return selfArray;
};

AutoShowWorkComponent.prototype.attributeChange = function(){
    const data = this.getDataObj();
    const power = data.maxCardPower || 0;
    const nowPower = this.__getTop5PowerSum();
    if(power<nowPower){
        data.maxCardPower = nowPower;
        this.update(data);
        this.player.Notify.notify("onNotifyAutoShowCardMaxPower", {maxCardPower: data.maxCardPower});
    }
};

AutoShowWorkComponent.prototype.__getTop5PowerSum = function(){
    const list = [];
    for (const cardObj of Object.values(this.player.Card.cardDict)){
        list.push(cardObj.getPower());
    }
    list.sort((a, b) => b - a);
    let truePower = 0;
    for(const index in list){
        if(index>=5){
            break;
        }
        truePower += list[index];
    }
    return truePower;
};

AutoShowWorkComponent.prototype.getMaxPower = function(){
    const data = this.getDataObj();
    const power = data.maxCardPower || 0;
    if(power == 0){
        return this.__getTop5PowerSum();
    }
    return power;
};

/**
 * 获取玩家车展数据对象
 * @return {JSON} {xxx:xxx, ...}
 */
AutoShowWorkComponent.prototype.getDataObj = function(){
    const playerData = this.player.get(code.player.Keys.AUTO_SHOW_WORK);
    return playerData;
};

/**
 * 更新玩家车展数据库
 * @param {Object} playerData 玩家车展数据对象
 */
AutoShowWorkComponent.prototype.update = function(playerData){
    this.player.set(code.player.Keys.AUTO_SHOW_WORK, playerData);
};
