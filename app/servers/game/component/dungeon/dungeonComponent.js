/**
 * @description 主线关卡
 * @author jzy
 * @date 2020/03/21
 */

// let logger = require('pomelo-logger').getLogger('pomelo', __filename);

const code = require('@code');
const protoUtils = require('@util/protoUtils.js');
const bearcat = require('bearcat');
const assert = require("assert");
const util = require('@util');

const DungeonComponent = function(app, player){
    this.$id = 'game_DungeonComponent';
    this.$scope = 'prototype';
    this.app = app;
    this.player = player;
};

module.exports = DungeonComponent;
bearcat.extend('game_DungeonComponent', 'game_Component');

/** 数据结构
 * {
 *      matchID: 111,                // 最大已完成赛事ID
 *      progress: 10,                // 当前赛事进度
 *      hasReceiveBoxID: [115,125],  // 已领取
 *      eventID: 0,                  // 随机出来的待执行事件，事件执行完需要把该eventID置为0
 *      critTimes: [],               // index -> 次数
 * }
 */

/**
  * 打赏
  */
DungeonComponent.prototype.encourage = async function(){
    const currentMatchID = this.getCurrentMatchID();
    if(!this.app.Config.Checkpoint.IsCanEncourage(currentMatchID)){
        return {code:code.err.ERR_DUNGEON_CAN_NOT_ENCOURAGE};
    }

    //若有事件还未执行，不变化，返回事件ID
    const dungeon = this.getDungeon();
    let eventID = dungeon.eventID || 0;
    if(eventID>0){
        return {
            code:code.err.SUCCEEDED,
            curMatchID:currentMatchID,
            matchID:dungeon.matchID,
            progress:dungeon.progress,
            eventID:eventID,
            times:1,
        };
    }

    const config = this.app.Config.Checkpoint.get(currentMatchID);

    //根据身价消耗物品
    const totalPower = this.player.Card.getTotalPower();
    if(totalPower == 0){
        return {code: code.err.ERR_CARD_FORMATION_NOT_ENOUGH};
    }
    const cost = (BigInt(config.Cost) * BigInt(config.Power) / BigInt(totalPower)).toString();
    const commonCost = {itemID:code.dungeon.ENCOURAGE_COST_ITEM_ID,itemNum:cost};
    if(!this.player.Item.isEnough(commonCost)){
        return {code:code.err.ERR_DUNGEON_ENCOURAGE_COST_NUM};
    }

    // 进度奖励
    let increaseAward = protoUtils.encodeConfigAward(config.IncreaseReward);

    // 计算暴击
    let times = 1;
    const critTimes = dungeon.critTimes || [];
    for(const index in config.SuccessValue){
        const curTimes = critTimes[index]==undefined? 1 : critTimes[index];
        const rate = curTimes * config.SuccessValue[index];
        if(util.random.random(1,10000)<=rate){
            critTimes[index] = 1;
            times = config.Multiple[index];
            break;
        }else{
            critTimes[index] = curTimes + 1;
        }
    }
    if(times>1){
        increaseAward = util.item.multi(increaseAward, times);
    }

    //计算进度
    const beforeProgress = dungeon.progress || 0;
    let recordMatchID = dungeon.matchID || 0;
    let progress = beforeProgress + config.Increase * times;

    // 结算奖励
    let finalReward = [];
    for (const node of config.NodeArr) {
        if(beforeProgress<node&&progress>=node){
            switch(config.EventType){
            case code.dungeon.EVENT_TYPE.GET_REWARD:{
                finalReward = protoUtils.encodeConfigAward(config.Reward);
                break;
            }
            case code.dungeon.EVENT_TYPE.CHOOSE:
            case code.dungeon.EVENT_TYPE.DISPATCH:
                eventID = this.app.Config.Checkpoint.GetRandomEventID(currentMatchID);
                break;
            }
            break;
        }
    }

    let progressFull = false;
    // 进度节点奖励
    let nodeAward = [];
    if(progress >= code.dungeon.MATCH_MAX_PROGRESS){
        progress = code.dungeon.MATCH_MAX_PROGRESS;
        nodeAward = nodeAward.concat(protoUtils.encodeConfigAward(config.NodeReward));
        nodeAward = nodeAward.concat(await this.player.Drop.dropBatch(config.NodeDropId));
        progress = 0;
        recordMatchID = currentMatchID;
        progressFull = true;
    }

    

    //增加删除物品
    if(!this.player.Item.isEnough(commonCost)){
        return {code:code.err.ERR_ITEM_COST_NOT_ENOUGH};
    }
    this.player.Item.modifyItem(increaseAward.concat(finalReward).concat(nodeAward), commonCost, code.reason.OP_DUNGEON_ENCOURAGE);

    //修改主线关卡表
    dungeon.matchID = recordMatchID;
    dungeon.progress = progress;
    dungeon.eventID = eventID;
    dungeon.critTimes = critTimes;
    this.update(dungeon);

    // 任务更新
    if(currentMatchID!=dungeon.matchID){
        this.player.Event.emit(code.event.MISSION_UPDATE.name, code.mission.BEHAVIOR_TYPE.DUNGEON);
    }
    // 关卡前进事件
    this.player.Event.emit(code.event.DUNGEON_FORWARD.name);
    
    if(progressFull){
        this.app.Log.dungeonLog(this.player, dungeon.matchID);
    }

    return {code:code.err.SUCCEEDED,
        curMatchID:currentMatchID,
        matchID:dungeon.matchID,
        progress:dungeon.progress,
        award:protoUtils.encodeAward(finalReward), 
        eventID:eventID,
        nodeAward:protoUtils.encodeAward(nodeAward),
        times:times,
    };
};

/**
 * 事件选择
 * @param {Number} para 事件参数，选择id或派遣人物id
 */
DungeonComponent.prototype.chooseEvent = async function(para){
    const dungeon = this.getDungeon();
    const eventID = dungeon.eventID || 0;
    if(eventID == 0){
        //事件不存在
        return {code:code.err.ERR_DUNGEON_EVENT_NOT_EXIST};
    }
    const currentMatchID = this.getCurrentMatchID();
    if(!currentMatchID){
        //赛事不存在
        return {code:code.err.ERR_DUNGEON_NOT_EXIST};
    }
    const config = this.app.Config.Checkpoint.get(currentMatchID);
    if(config.EventType == code.dungeon.EVENT_TYPE.GET_REWARD){
        //赛事不可抽取事件
        return {code:code.err.ERR_DUNGEON_CAN_NOT_DRAW};
    }
    const self = this;
    let award;
    let cost;
    let indexList;
    let success;
    switch(config.EventType){
    case code.dungeon.EVENT_TYPE.CHOOSE:{
        const chooseCfg = self.app.Config.EventChoose.get(para);
        if(!chooseCfg || chooseCfg.EventId!=eventID){
            //参数和选择事件ID不匹配
            return {code:code.err.ERR_DUNGEON_PARAM_NOT_MATCH};
        }
        const result = self.app.Config.EventChoose.getRandomAward(para);
        award = result.award;
        cost = result.cost;
        const res = await this.app.Item.exchangeDropItem(this.player, award);
        if(res.code!=code.err.SUCCEEDED){
            return {code:res.code};
        }
        const costRes = await this.app.Item.exchangeDropItem(this.player, cost);
        if(costRes.code!=code.err.SUCCEEDED){
            return {code:costRes.code};
        }
        award = res.award;
        cost = costRes.award;
        indexList = result.indexList;
        break;
    }
    case code.dungeon.EVENT_TYPE.DISPATCH:{
        const rate = this.player.Card.getCardPower(para) / config.Power;
        const result = self.app.Config.EventSend.getRandomAward(eventID, para, rate);
        award = await this.player.Drop.dropBatch(result.dropList);
        success = result.success?1:0;
        break;
    }
    }

    //增加删除物品
    if(cost && !this.player.Item.isEnough(cost)){
        return {code:code.err.ERR_ITEM_COST_NOT_ENOUGH};
    }
    if(cost){
        this.player.Item.modifyItem(award, cost, code.reason.OP_DUNGEON_CHOOSE_EVENT);
    }else{
        this.player.Item.addItem(award, code.reason.OP_DUNGEON_CHOOSE_EVENT_GET);
    }
    

    //修改主线关卡表    2020/6/20 修改：完成事件不改进度
    // dungeon.matchID = currentMatchID;
    // dungeon.progress = 0;
    dungeon.eventID = 0;
    this.update(dungeon);

    this.player.Event.emit(code.event.MISSION_UPDATE.name, code.mission.BEHAVIOR_TYPE.DUNGEON);

    const result = {
        code:code.err.SUCCEEDED,
        para:para,
        success:success,
        award:protoUtils.encodeAward(award),
        indexList:indexList,
        matchID: dungeon.matchID,
        progress: dungeon.progress,
        eventID: dungeon.eventID,
    };
    return result;
};

/**
 * 领取奖励
 */
DungeonComponent.prototype.receiveBoxReward = function(id){
    const rewardCfg = this.app.Config.Checkpoint.get(id);
    //不是奖励类型
    if(!rewardCfg || rewardCfg.Type!=code.dungeon.MATCH_TYPE.REWARD){
        return {code:code.err.ERR_DUNGEON_BOX_REWARD_TYPE};
    }
    const hasCompleteMatchID = this.getMaxCompleteMatchID();
    //奖励领取条件未达标
    if(hasCompleteMatchID + code.dungeon.MATCH_TYPE.REWARD - code.dungeon.MATCH_TYPE.FINAL < id){
        return {code:code.err.ERR_DUNGEON_BOX_LOCK};
    }
    //奖励已领取
    const hasReceiveList = this.getHasReceiveBoxID();
    if(hasReceiveList.indexOf(id)>=0){
        return {code:code.err.ERR_DUNGEON_BOX_HAS_OPEN};
    }

    const award = protoUtils.encodeConfigAward(rewardCfg.Reward);
    //增加奖励
    this.player.Item.addItem(award, code.reason.OP_DUNGEON_BOX_REWARD_GET);

    //修改数据
    const dungeon = this.getDungeon();
    hasReceiveList.push(id);
    dungeon.hasReceiveBoxID = hasReceiveList;
    this.update(dungeon);
    this.player.Event.emit(code.event.DUNGEON_REWARD.name);
    this.app.Log.dungeonLog(this.player, id);
    return {
        code: code.err.SUCCEEDED,
        hasReceiveBoxID: dungeon.hasReceiveBoxID,
        award: protoUtils.encodeAward(award),
    };
};


/**
 * 战斗结束
 */
DungeonComponent.prototype.battleEnd = function(isWin){
    const currentMatchID = this.getCurrentMatchID();
    const config = this.app.Config.Checkpoint.get(currentMatchID);
    assert(config.Type==code.dungeon.MATCH_TYPE.FINAL, `战斗结束，但是当前赛事不是决赛类型，当前赛事ID[${currentMatchID}]`);
    const dungeon = this.getDungeon();
    if(isWin){
        dungeon.matchID = currentMatchID;
        dungeon.progress = 0;
        this.update(dungeon);
        const finalReward = protoUtils.encodeConfigAward(config.Reward);
        this.player.Item.addItem(finalReward, code.reason.OP_DUNGEON_BATTLE_GET);
        this.app.Log.dungeonLog(this.player, dungeon.matchID);
    }
    
    const data = {
        matchID:dungeon.matchID,
        progress:dungeon.progress,
    };
    this.app.get('channelService').pushMessageByUids("onNotifyBattleResultDungeon", data,
        [{uid: this.player.uid, sid: this.player.connectorId}]);
    
    if(isWin){
        // 关卡前进事件
        this.player.Event.emit(code.event.DUNGEON_FORWARD.name, true);
    }
};

/**
 * 获取当前比赛id
 */
DungeonComponent.prototype.getCurrentMatchID = function(){
    const dungeon = this.getDungeon();
    let matchID;
    if(dungeon.matchID){
        matchID = this.app.Config.Checkpoint.GetNextMatchID(dungeon.matchID);
    }else{
        matchID = this.app.Config.Checkpoint.GetInitMatchID();
    }
    return matchID;
};

/**
 * 最大已完成赛事ID
 */
DungeonComponent.prototype.getMaxCompleteMatchID = function(){
    const dungeon = this.getDungeon();
    return dungeon.matchID || 0;
};

/**
 * 获取当前比赛进度
 */
DungeonComponent.prototype.getProgress = function(){
    const dungeon = this.getDungeon();
    return dungeon.progress || 0;
};

/**
 * 获取已经触发的随机事件，没有则为0
 */
DungeonComponent.prototype.getEventID = function(){
    const dungeon = this.getDungeon();
    return dungeon.eventID || 0;
};

/**
 * 已领取宝箱ID
 */
DungeonComponent.prototype.getHasReceiveBoxID = function(){
    const dungeon = this.getDungeon();
    return dungeon.hasReceiveBoxID || [];
};

/**
 * 获取玩家主线数据对象
 * @return {JSON} {xxx:xxx, ...}
 */
DungeonComponent.prototype.getDungeon = function()
{
    const playerDungeon = this.player.get(code.player.Keys.DUNGEON) || {};
    return playerDungeon;
};



/**
 * 更新玩家主线数据库
 * @param {Object} playerDungeon 玩家主线数据对象
 */
DungeonComponent.prototype.update = function(playerDungeon){
    this.player.set(code.player.Keys.DUNGEON, playerDungeon);
};
