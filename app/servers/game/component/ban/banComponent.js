/**
 * @description 封禁组件
 * @author chshen
 * @date 2020/06/09
 */

const bearcat = require('bearcat');
const util = require('@util');
const code = require('@code');

const BanComponent = function (app, player) {
    this.$id = 'game_BanComponent';
    this.$scope = 'prototype';
    this.app = app;
    this.player = player;
};

module.exports = BanComponent;
bearcat.extend('game_BanComponent', 'game_Component');

BanComponent.prototype.onLoad = function() {
    if (Object.keys(this.player.ban).length == 0) {
        this.player.ban = {
            banChatTs:0,
            reason: '',
        };
    }
    const uid = this.player.uid;
    this.app.rpcs.global.offlineRemote.takeOfflineBanChat({}, uid).then(param =>{
        if (param.err || !param.res || param.res.banDate == null) {
            return;
        }
        let timestamp = Number(param.res.banDate);
        if (param.res.status == 0) {
            timestamp = 0;
        }
        this.banChat(timestamp, param.res.reason);
    });
};

BanComponent.prototype.banChat = function(timestamp, reason) {
    this.player.ban.banChatTs = timestamp;
    this.player.ban.reason = reason;
    this.player.Event.emit(code.event.BAN_CHAT_CHANGED.name);
};

/**
 * 是否
 * return {Boolean}
*/
BanComponent.prototype.isBanChat = function() {
    const second = util.time.nowSecond();
    return this.player.ban.banChatTs > second;
};