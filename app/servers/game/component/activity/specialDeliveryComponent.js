/**
 * @description 特邀派送
 * @author jzy
 * @date 2020/06/01
 */

// const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const bearcat = require('bearcat');
const code = require('@code');
const utils = require('@util');

const SpecialDeliveryComponent = function(app, player) {
    this.$id = 'game_SpecialDeliveryComponent';
    this.$scope = 'prototype';
    this.app = app;
    this.player = player;
};
bearcat.extend('game_SpecialDeliveryComponent', 'game_Component');
module.exports = SpecialDeliveryComponent;

/**
 * 数据类型
 *  []
 */

SpecialDeliveryComponent.prototype.onDayChange = function(){
    this.player.specialDelivery = [];
};

SpecialDeliveryComponent.prototype.receive = function(index){
    const id = this.app.Config.Global.get(code.specialDelivery.GLOBAL_ID_ACTIVITY_TIME_ID).GlobalArray[index];
    if(!id){
        return {code:code.err.ERR_CLIENT_PARAMS_WRONG};
    }
    if(this.player.specialDelivery.indexOf(id)>=0){
        return {code:code.err.ERR_SPECIAL_DELIVERY_HAS_RECEIVE};
    }
    if(!this.app.Activity.isActivityOpen(id)){
        return {code:code.err.ERR_SPECIAL_DELIVERY_HAS_NOT_OPEN};
    }
    const reward = utils.proto.encodeConfigAward(this.app.Config.Global.get(code.specialDelivery.GLOBAL_ID_REWARD).GlobalJson);
    this.player.Item.addItem(reward, code.reason.OP_SPECIAL_DELIVERY_RECEIVE_GET);
    this.player.specialDelivery.push(id);
    return {code:code.err.SUCCEEDED};
};


SpecialDeliveryComponent.prototype.assistReceive = function(index){
    const id = this.app.Config.Global.get(code.specialDelivery.GLOBAL_ID_ACTIVITY_TIME_ID).GlobalArray[index];
    if(!id){
        return {code:code.err.ERR_CLIENT_PARAMS_WRONG};
    }
    if(this.player.specialDelivery.indexOf(id)>=0){
        return {code:code.err.ERR_SPECIAL_DELIVERY_HAS_RECEIVE};
    }
    if(!this._isActivityOver(id)){
        return {code:code.err.ERR_SPECIAL_DELIVERY_HAS_NOT_END};
    }
    const cost = utils.proto.encodeConfigAward(this.app.Config.Global.get(code.specialDelivery.GLOBAL_ID_ASSIST_COST).GlobalJson);
    if(!this.player.Item.isEnough(cost)){
        return {code:code.err.ERR_ITEM_COST_NOT_ENOUGH};
    }
    const reward = utils.proto.encodeConfigAward(this.app.Config.Global.get(code.specialDelivery.GLOBAL_ID_REWARD).GlobalJson);
    this.player.Item.modifyItem(reward, cost, code.reason.OP_SPECIAL_DELIVERY_ASSIST_RECEIVE);
    this.player.specialDelivery.push(id);
    return {code:code.err.SUCCEEDED};
};

SpecialDeliveryComponent.prototype._isActivityOver = function(id) {
    const timer = this.app.Activity.findTimer(id);
    if(timer){
        const nowMs = utils.time.nowMS();
        if(!utils.time.isSameDay(nowMs, timer.stopMs)){
            return true;
        }else{
            return nowMs >= timer.stopMs;
        }
    }else{
        return true;
    }
};