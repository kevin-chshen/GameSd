/**
 * @description 每日签到
 * @author jzy
 * @date 2020/05/29
 */

const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const bearcat = require('bearcat');
const code = require('@code');
const utils = require('@util');

const OperateDailySign = function (app, player, id, type, data) {
    this.$id = 'game_OperateDailySign';
    this.$scope = 'prototype';
    this.app = app;
    this.player = player;
    this.operateId = id;
    this.type = type;
    this.data = data;
};
bearcat.extend('game_OperateDailySign', 'game_OperateBase');
module.exports = OperateDailySign;

/**
 * {
 *      hasReceiveMax:10;
 *      lastReceiveTime:xxx,
 *      buyTimes:2,     // 补签次数
 * }
 */

OperateDailySign.prototype.init = function () {
    this.callId = this.app.Config.OperateBaseActivity.get(this.operateId).CallId;
};
OperateDailySign.prototype.reset = function (startMs) {
    this.data.startMs = startMs;
    this.data.hasReceiveMax = 0;
    this.data.buyTimes = 0;
    this.data.lastReceiveTime = 0;

};
OperateDailySign.prototype.onDayChange = function (){
};

/**
 * 签到
 */
OperateDailySign.prototype.signIn = function(){
    if(this._isTodayReceive()){
        return {code:code.err.ERR_OPERATE_DAILY_SIGN_HAS_SIGN};
    }
    const hasReceiveMax = this.data.hasReceiveMax || 0;
    const signId = this.callId*100+(hasReceiveMax+1);
    const config = this.app.Config.OperateSign.get(signId);
    if(!config){
        logger.error(`每日签到配置表id[${signId}]不存在`);
        return {code:code.err.FAILED};
    }
    const reward = this._getReward(config);
    this.player.Item.addItem(reward, code.reason.OP_OPERATE_DAILY_SIGN_GET);
    this.data.hasReceiveMax = hasReceiveMax+1;
    this.data.lastReceiveTime = Date.now();
    return {
        code:code.err.SUCCEEDED, 
        award:utils.proto.encodeAward(reward),
        hasReceiveMax:this.data.hasReceiveMax,
        lastReceiveTime:utils.time.nowSecond(),
    };
};

/**
 * 补签
 */
OperateDailySign.prototype.assistSignIn = function(){
    if(!this._isTodayReceive()){
        return {code:code.err.ERR_OPERATE_DAILY_SIGN_HAS_NOT_SIGN};
    }
    const day = this._getPassDay();
    const hasReceiveMax = this.data.hasReceiveMax || 0;
    if(hasReceiveMax>day){
        return {code:code.err.ERR_OPERATE_DAILY_SIGN_ASSIST_LIMIT};
    }
    const signId = this.callId*100+(hasReceiveMax+1);
    const config = this.app.Config.OperateSign.get(signId);
    if(!config){
        logger.error(`每日签到配置表id[${signId}]不存在`);
        return {code:code.err.FAILED};
    }
    // 补签消耗
    const times = this.data.buyTimes || 0;
    const cost = this.app.Config.BuyingTimes.getCost(6, times + 1);
    if(!cost){
        return {code:code.err.ERR_OPERATE_DAILY_SIGN_ASSIST_LIMIT};
    }
    const costItem = utils.proto.encodeConfigAward(cost);
    if(!this.player.Item.isEnough(costItem)){
        return {code:code.err.ERR_ITEM_COST_NOT_ENOUGH};
    }
    // 签到奖励
    const reward = this._getReward(config);

    this.player.Item.modifyItem(reward, costItem, code.reason.OP_OPERATE_DAILY_SIGN_ASSIST);
    this.data.hasReceiveMax = hasReceiveMax+1;
    this.data.buyTimes = times+1;
    return {
        code:code.err.SUCCEEDED, 
        award:utils.proto.encodeAward(reward),
        hasReceiveMax:this.data.hasReceiveMax,
        buyTimes:this.data.buyTimes,
    };
};


OperateDailySign.prototype._getReward = function(config){
    let reward = utils.proto.encodeConfigAward(config.Reward);
    if(config.VipMultiple.length>=2 && this.player.vip>=config.VipMultiple[0]){
        reward = utils.item.multi(reward,config.VipMultiple[1]);
    }
    return reward;
};


OperateDailySign.prototype._getPassDay = function(){
    return utils.time.durDays(this.data.startMs, utils.time.nowMS());
};

OperateDailySign.prototype._isTodayReceive = function(){
    return utils.time.isSameDay(this.data.lastReceiveTime || 0, Date.now());
};