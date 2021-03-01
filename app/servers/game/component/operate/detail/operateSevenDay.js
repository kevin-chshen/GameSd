/**
 * @description 七日登陆
 * @author jzy
 * @date 2020/06/08
 */

// const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const bearcat = require('bearcat');
const code = require('@code');
const utils = require('@util');

const OperateSevenDay = function (app, player, id, type, data) {
    this.$id = 'game_OperateSevenDay';
    this.$scope = 'prototype';
    this.app = app;
    this.player = player;
    this.operateId = id;
    this.type = type;
    this.data = data;
};
bearcat.extend('game_OperateSevenDay', 'game_OperateBase');
module.exports = OperateSevenDay;

/**
 * {
 *      hasReceive:[1,2,3,4,5,6,7],
 * }
 */

OperateSevenDay.prototype.init = function () {
    this.callId = this.app.Config.OperateBaseActivity.get(this.operateId).CallId;
};
OperateSevenDay.prototype.reset = function (startMs) {
    this.data.startMs = startMs;
    this.data.hasReceive = [];
};

OperateSevenDay.prototype.signIn = function (day, returnFunc){
    const maxDay = utils.time.durDays(this.data.startMs, utils.time.nowMS()) + 1;
    if(day>maxDay){
        return {code:code.err.ERR_OPERATE_SEVEN_DAY_NOT_ENOUGH_DAY};
    }
    const hasReceiveList = this.data.hasReceive || [];
    if(hasReceiveList.indexOf(day)>=0){
        return {code:code.err.ERR_OPERATE_SEVEN_DAY_HAS_RECEIVE};
    }
    const config = this.app.Config.OperateLoginReward.get(this.callId*100+day);
    if(!config){
        return {code:code.err.ERR_CONFIG_NOT_EXIST};
    }
    const award = utils.proto.encodeConfigAward(config.Reward);

    this.player.Item.addItem(award, code.reason.OP_OPERATE_SEVEN_SIGN_GET, ()=>{
        hasReceiveList.push(day);
        this.data.hasReceive = hasReceiveList;
        returnFunc({
            code:code.err.SUCCEEDED, 
            hasReceive: this.data.hasReceive,
            award:utils.proto.encodeAward(award),
        });
    });
    
};