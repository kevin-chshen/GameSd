/**
 * @description 
 * @author linjs
 * @date 2020/04/14
 */

const bearcat = require('bearcat');

const NotifyComponent = function (app, player) {
    this.$id = 'game_NotifyComponent';
    this.$scope = 'prototype';
    this.app = app;
    this.player = player;
};

module.exports = NotifyComponent;
bearcat.extend('game_NotifyComponent', 'game_Component');

/**
 * 通知自身
 * @param {String} msgName 消息名称
 * @param {Object} msgData 消息内容
 */
NotifyComponent.prototype.notify = function (msgName, msgData) {
    this.app.get('channelService').pushMessageByUids(msgName, msgData,
        [{ uid: this.player.uid, sid: this.player.connectorId }]);
};


