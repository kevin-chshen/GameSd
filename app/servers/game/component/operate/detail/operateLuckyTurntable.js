/**
 * @description 转盘活动模块
 * @author chshen
 * @data 2020/05/26
 */
const bearcat = require('bearcat');

/**
 * 数据结构
 * {
 *      startMs: 活动开始时间
 *      draws: []               // 抽取奖列表
 * }
*/
const OperateLuckyTurntable = function (app, player, id, type, data) {
    this.$id = 'game_OperateTurntable';
    this.$scope = 'prototype';
    this.app = app;
    this.player = player;
    this.operateId = id;
    this.type = type;

    data = data || {};
    data.startMs = data.startMs || 0;
    data.draws = data.draws || [];
    this.data = data;
};
bearcat.extend('game_OperateTurntable', 'game_OperateBase');
module.exports = OperateLuckyTurntable;


OperateLuckyTurntable.prototype.reset = function(startMs) {
    this.data.startMs = startMs;
    this.data.draws = [];
};

/**
 * 获取已抽奖次数
*/
OperateLuckyTurntable.prototype.drawsSize = function() {
    return this.data.draws.length;
};

/**
 * 添加已抽奖ID 
*/
OperateLuckyTurntable.prototype.addDraw = function (id) {
    return this.data.draws.push(id);
};