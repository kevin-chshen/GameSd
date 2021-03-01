/**
 * @description 0元礼包活动模块,运营模块只是一个入口，实际业务不走运营活动流程
 * @author chshen
 * @data 2020/05/29
 */
const bearcat = require('bearcat');
/**
 * 数据结构
 * {
 *      startMs: 活动开始时间
 *      fetchIds: []        // 奖励领取列表,第几天
 *      payId:0             // 付费Id
 *      giftFetch: false,   // 0元礼包是否领取
 * }
*/
const OperateZeroGift = function (app, player, id, type, data) {
    this.$id = 'game_OperateZeroGift';
    this.$scope = 'prototype';
    this.app = app;
    this.player = player;
    this.operateId = id;
    this.type = type;
    this.data = data;
};
bearcat.extend('game_OperateZeroGift', 'game_OperateBase');
module.exports = OperateZeroGift;