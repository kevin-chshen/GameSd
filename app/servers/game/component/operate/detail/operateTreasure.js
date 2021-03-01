/**
 * @description 全民夺宝
 * @author jzy
 * @date 2020/06/11
 */
const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const bearcat = require('bearcat');
const code = require('@code');
const utils = require('@util');

const OperateTreasure = function (app, player, id, type, data) {
    this.$id = 'game_OperateTreasure';
    this.$scope = 'prototype';
    this.app = app;
    this.player = player;
    this.operateId = id;
    this.type = type;
    this.data = data;
};
bearcat.extend('game_OperateTreasure', 'game_OperateBase');
module.exports = OperateTreasure;

/**
 * {
 *      freeDrawTimes: 1,
 *      totalDrawTimes: 10,
 *      hasReceive:[],
 * }
 */

const DRAW_ONCE = 0;// 抽奖一次枚举
const DRAW_TEN = 1; // 抽奖十次枚举
const DRAW_ITEM_ID = 109; // 用于抽奖的抽奖物品ID 
const TREASURE_MAX_RECORD_NUM = 6;  // 获奖记录最大数量

OperateTreasure.prototype.init = function () {
    this.callId = this.app.Config.OperateBaseActivity.get(this.operateId).CallId;
};

OperateTreasure.prototype.onDayChange = function (isOnTime){
    this._sendUnReceiveMail();
    this.data.freeDrawTimes = 0;
    this.data.totalDrawTimes = 0;
    this.data.hasReceive = [];
    if(isOnTime){
        this.player.Notify.notify("OnNotifyOperateTreasureData",{
            actId: this.operateId,
            freeDrawTimes:this.data.freeDrawTimes,
            totalDrawTimes:this.data.totalDrawTimes,
            hasReceive:this.data.hasReceive,
        });
    }
};
OperateTreasure.prototype.stop = function (){
    this._sendUnReceiveMail();
};

OperateTreasure.prototype.reset = function (startMs) {
    this.data.startMs = startMs;
    this._sendUnReceiveMail();
    this.data.freeDrawTimes = 0;
    this.data.totalDrawTimes = 0;
    this.data.hasReceive = [];
};

OperateTreasure.prototype._sendUnReceiveMail = function(){
    const config = this.app.Config.OperateTreasure.get(this.callId);
    const totalTimes = this.data.totalDrawTimes || 0;
    const hasReceive = this.data.hasReceive || [];
    const awardList = [];
    const receiveList = [];
    for(let index in config.CumulativeTimes){
        index = Number(index);
        if(totalTimes>=config.CumulativeTimes[index]&&hasReceive.indexOf(index)<0){
            awardList.push(config.AccumulateReward[index] || {});
            receiveList.push(index);
        }
    }
    if(awardList.length>0){
        const reward = awardList;

        this.data.hasReceive = hasReceive.concat(receiveList);
        this.sendMail(config.MailId, reward, 0);
    }
};

/**
 * 抽奖
 */
OperateTreasure.prototype.draw = async function(drawType, returnFunc){
    let freeDrawTimes = this.data.freeDrawTimes || 0;
    const totalDrawTimes = this.data.totalDrawTimes || 0;
    let cost = [];
    const config = this.app.Config.OperateTreasure.get(this.callId);
    let times;
    switch(drawType){
    case DRAW_ONCE:{
        if(freeDrawTimes==0){
            freeDrawTimes = freeDrawTimes + 1;
            times = 1;
        }else{
            times = 1;
            cost = utils.proto.encodeConfigAward(config.Cost);
        }
        break;
    }
    case DRAW_TEN:{
        times = 10;
        cost = utils.proto.encodeConfigAward(config.CostTen);
        break;
    }
    default:
        return {code:code.err.ERR_CLIENT_PARAMS_WRONG};
    }
    if(!this.player.Item.isEnough(cost)){
        return {code:code.err.ERR_ITEM_COST_NOT_ENOUGH};
    }
    const dropList = [];
    for(let i = 0; i<times; i++){
        dropList.push(config.DropId);
    }
    const award = await this.player.Drop.dropBatch(dropList);

    // 奖池增加
    const {err,res} = await this.app.Redis.incrby(code.redis.DIAMOND_POOL.name, config.JackpotAdd * times);
    if(err){
        logger.error(`钻石奖池增加失败，err ${JSON.stringify(err)}`);
        return {code:code.err.FAILED};
    }

    this.player.Item.modifyItem(award, cost, code.reason.OP_OPERATE_TREASURE_DRAW, ()=>{
        this.data.totalDrawTimes = totalDrawTimes + times;
        this.data.freeDrawTimes = freeDrawTimes;

        const protoAward = utils.proto.encodeAward(award, false);
        const notifyAward = this._filterNotify(protoAward, config.AnnouncementId);
        if(notifyAward.length>0){
            this._addRewardRecord(this.player.name, notifyAward);
            this.app.Notify.broadcast("OnNotifyOperateTreasureDrawInfo",{
                name: this.player.name,
                award: notifyAward,
            });
            for(const item of notifyAward){
                const itemConfig = this.app.Config.Item.get(item.itemID);
                if(itemConfig){
                    this.app.Chat.bannerSysTpltChat(401, [this.player.name, this.app.Config.Item.getColorName(item.itemID), item.itemNum]);
                }
            }
        }
        returnFunc({
            code:code.err.SUCCEEDED,
            freeDrawTimes:freeDrawTimes,
            totalDrawTimes:this.data.totalDrawTimes,
            award:protoAward,
            diamondPool:Number(res),
        });
    });
};

/**
 * 领取累计抽奖奖励
 */
OperateTreasure.prototype.receive = async function(index, returnFunc){
    const config = this.app.Config.OperateTreasure.get(this.callId);
    const totalTimes = this.data.totalDrawTimes || 0;
    const hasReceive = this.data.hasReceive || [];
    if(hasReceive.indexOf(index)>=0){
        return {code:code.err.ERR_OPERATE_TREASURE_HAS_RECEIVE};
    }
    if(config.CumulativeTimes[index]==undefined){
        return {code:code.err.ERR_CLIENT_PARAMS_WRONG};
    }
    if(totalTimes<config.CumulativeTimes[index]){
        return {code:code.err.ERR_OPERATE_TREASURE_DRAW_TIMES_NOT_ENOUGH};
    }
    const award = utils.proto.encodeConfigAward(config.AccumulateReward[index] || {});

    this.player.Item.addItem(award, code.reason.OP_OPERATE_TREASURE_RECEIVE, ()=>{
        hasReceive.push(index);
        this.data.hasReceive = hasReceive;
        returnFunc({
            code:code.err.SUCCEEDED,
            hasReceive:hasReceive,
        });
    });
};

/**
 * 购买抽奖道具
 */
OperateTreasure.prototype.buyDrawItem = async function(num){
    const config = this.app.Config.OperateTreasure.get(this.callId);
    const eachCost = utils.proto.encodeConfigAward(config.Price);
    const cost = utils.item.multi(eachCost,num);
    if(!this.player.Item.isEnough(cost)){
        return {code:code.err.ERR_ITEM_COST_NOT_ENOUGH};
    }
    const award = [{itemID:DRAW_ITEM_ID,itemNum:num}];
    this.player.Item.modifyItem(award, cost, code.reason.OP_OPERATE_TREASURE_BUY);
    return {code:code.err.SUCCEEDED};
};

/**********************************奖池记录***********************************/

OperateTreasure.prototype._addRewardRecord = async function(name, awardList){
    const strList = [];
    const nowTime = utils.time.nowSecond();
    for(const award of awardList){
        strList.push(JSON.stringify({name:name, award:award, time:nowTime}));
    }
    
    const {res,err} = await this.app.Redis.lpush([code.redis.DIAMOND_POOL_RECORD.name, this.operateId], ...strList);
    if(err){
        logger.error(`全民夺宝获奖记录增加失败，err ${JSON.stringify(err)}`);
        return;
    }
    if(res > TREASURE_MAX_RECORD_NUM){
        await this.app.Redis.ltrim([code.redis.DIAMOND_POOL_RECORD.name, this.operateId], 0, TREASURE_MAX_RECORD_NUM-1);
    }
};

OperateTreasure.prototype._filterNotify = function(protoAward, idList){
    const result = [];
    for(const item of protoAward){
        if(idList.indexOf(item.itemID)>=0){
            result.push(item);
        }
    }
    return result;
};

OperateTreasure.prototype.getRewardRecord = async function(){
    const {res,err} = await this.app.Redis.lrange([code.redis.DIAMOND_POOL_RECORD.name, this.operateId], 0, TREASURE_MAX_RECORD_NUM-1);
    const result = [];
    if(err){
        logger.error(`全民夺宝获奖记录获取失败，err ${JSON.stringify(err)}`);
        return result;
    }
    for(const str of res){
        result.push(JSON.parse(str));
    }
    return result;
};