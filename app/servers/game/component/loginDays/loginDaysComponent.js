/**
 * @description 登陆天数
 * @author jzy
 * @date 2020/06/03
 */

// const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const bearcat = require('bearcat');
const utils = require('@util');
const code = require('@code');


const LoginDaysComponent = function(app, player) {
    this.$id = 'game_LoginDaysComponent';
    this.$scope = 'prototype';
    this.app = app;
    this.player = player;
};
bearcat.extend('game_LoginDaysComponent', 'game_Component');
module.exports = LoginDaysComponent;


LoginDaysComponent.prototype.onAfterLoad = async function(){
    if(!utils.time.isSameDay(utils.time.nowMS(), this.player.lastLogoutTime)){
        this.player.loginDays++;
    }
};

LoginDaysComponent.prototype.onDayChange = async function (isOnTime, _){
    if(isOnTime){
        this.player.loginDays++;
        this.player.Event.emit(code.event.LOGIN_DAYS_CHANGE.name);
    }
};