/**
 * @description 角色缩略信息组件
 * @author linjs
 * @date 2020/03/25
 */

const bearcat = require('bearcat');
const code = require('@code');

const BriefComponent = function (app, player) {
    this.$id = 'game_BriefComponent';
    this.$scope = 'prototype';
    this.app = app;
    this.player = player;
};

module.exports = BriefComponent;
bearcat.extend('game_BriefComponent', 'game_Component');

/**
 * 初始化
 */
BriefComponent.prototype.onInit = async function () {
    this.player.Event.on(code.event.LEVEL_UP.name, (...params) => { this.onLevelUp(...params); });
    this.player.Event.on(code.event.RENAME.name, (...params) => { this.onRename(...params); });
    this.player.Event.on(code.event.TOTAL_POWER_UPDATE.name, (...params) => { this.onTotalPowerChange(...params); });
    this.player.Event.on(code.event.MANIFESTO_MODIFY.name, (...params) => { this.onManifestoModify(...params); });
    this.player.Event.on(code.event.LAST_LOGOUT_TIME_UPDATE.name, (...params) => { this.onLastLogoutTimeUpdate(...params); });
    this.player.Event.on(code.event.LAST_LOGIN_TIME_UPDATE.name, (...params) => { this.onLastLoginTimeUpdate(...params); });
    this.player.Event.on(code.event.BATTLE_MEMBER_UPDATE.name, (...params) => { this.onBattleMemberUpdate(...params); });
    this.player.Event.on(code.event.CAR_TOP_THREE_UPDATE.name, (...params) => { this.onCarTopThreeUpdate(...params); });
    this.player.Event.on(code.event.AUTO_SHOW_DATA_UPDATE.name, (...params) => { this.autoShowDataUpdate(...params); });
    this.player.Event.on(code.event.CASH_PER_SECOND_AFTER.name, (...params) => { this.cashPerSecondAfter(...params); });
    this.player.Event.on(code.event.VIP_CHANGED.name, (...params) => { this.vipChanged(...params); });
    this.player.Event.on(code.event.BAN_CHAT_CHANGED.name, (...params) => { this.banChatEndTsUpdate(...params); });
};

/**
 * 角色登录时调用
 */
BriefComponent.prototype.onAfterLoad = async function () {
    // 遍历所有属性,更新所有数据到redis
    const brief = code.brief.initBriefFromPlayerData(this.player.getDataObj());
    // 一起设置到玩家属性上
    await this.app.Redis.hmset([code.redis.ROLE_BRIEF.name, this.player.uid], brief);
};

/**
 * 更新属性,直接修改到redis的ROLE_BRIEF对应的属性上去,
 */
BriefComponent.prototype.update = function (key, value) {
    const strValue = code.brief.isJsonProp(key) ? JSON.stringify(value) : value;
    this.app.Redis.hset([code.redis.ROLE_BRIEF.name, this.player.uid], key, strValue);
};

// 回调函数
/**
 * 玩家等级提升
 */
BriefComponent.prototype.onLevelUp = function (info) {
    this.update(code.brief.LV.name, info.newLv);
};

BriefComponent.prototype.onRename = function (info) {
    this.update(code.brief.NAME.name, info.name);
};

BriefComponent.prototype.onTotalPowerChange = function(){
    this.update(code.brief.POWER.name, this.player.power);
};

BriefComponent.prototype.onManifestoModify = function(){
    this.update(code.brief.MANIFESTO.name, this.player.manifesto);
};

BriefComponent.prototype.onLastLogoutTimeUpdate = function(){
    this.update(code.brief.LAST_LOGOUT_TIME.name, this.player.lastLogoutTime);
};

BriefComponent.prototype.onLastLoginTimeUpdate = function(){
    this.update(code.brief.LAST_LOGIN_TIME.name, this.player.lastLoginTime);
};

BriefComponent.prototype.onBattleMemberUpdate = function(){
    this.update(code.brief.BATTLE_MEMBER.name, this.player.battleMember);
};

BriefComponent.prototype.onCarTopThreeUpdate = function(){
    this.update(code.brief.CAR_TOP_THREE.name, this.player.carTopThree);
};

BriefComponent.prototype.autoShowDataUpdate = function(){
    this.update(code.brief.AUTO_SHOW.name, this.player.autoShow);
};

BriefComponent.prototype.cashPerSecondAfter = function(){
    this.update(code.brief.CASH_PER_SECOND.name, this.player.cashPerSecond);
};

BriefComponent.prototype.vipChanged = function() {
    this.update(code.brief.VIP.name, this.player.vip);
};

BriefComponent.prototype.test = function () {
    this.update(code.brief.TEST.name, {msg:'123', msg2:[1,2,3]});
};

BriefComponent.prototype.banChatEndTsUpdate = function() {
    this.update(code.brief.BAN_CHAT_END_TS.name, this.player.ban.banChatTs || 0);
    
}
