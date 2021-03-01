/**
 * @description 投资计划活动模块
 * @author chshen
 * @data 2020/05/25
 */
const bearcat = require('bearcat');

const ActInvestFundsComponent = function(app, player) {
    this.$id = 'game_ActInvestFundsComponent';
    this.$scope = 'prototype';
    this.app = app;
    this.player = player;
};
bearcat.extend('game_ActInvestFundsComponent', 'game_Component');
module.exports = ActInvestFundsComponent;

/**
 * 登录
*/
ActInvestFundsComponent.prototype.onLoad = function() {
    if (Object.keys(this.player.actInvestFunds).length == 0) {
        this.player.actInvestFunds = {
            invest: false,
            fetches: []
        };
    }
};

/**
 * 获取投资基金数据
*/
ActInvestFundsComponent.prototype.getFetches = function() {
    return this.player.actInvestFunds.fetches || [];
};

/**
 * 设置已投资
*/
ActInvestFundsComponent.prototype.setInvest = function() {
    this.player.actInvestFunds.invest = true;
};

/**
 * 是否已投资
*/
ActInvestFundsComponent.prototype.hasInvest = function () {
    return this.player.actInvestFunds.invest || false;
};

/**
 * 奖励是否已领取
*/
ActInvestFundsComponent.prototype.hasFetchId = function(id) {
    if (this.player.actInvestFunds.fetches) {
        return this.player.actInvestFunds.fetches.indexOf(id) > -1;
    }
    return true;
};

/**
 * 设置奖励已领取
*/
ActInvestFundsComponent.prototype.setFetchId = function (id) {
    if (!this.player.actInvestFunds.fetches) {
        this.player.actInvestFunds.fetches = [];
    }
    return this.player.actInvestFunds.fetches.push(id);
};