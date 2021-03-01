/**
 * @description 计数器组件
 * @author linjs
 * @date 2020/04/28
 */

const bearcat = require('bearcat');
const code = require('@code');

const CounterComponent = function (app, player) {
    this.$id = 'game_CounterComponent';
    this.$scope = 'prototype';
    this.app = app;
    this.player = player;
    this.counterContainer = {};
};

module.exports = CounterComponent;
bearcat.extend('game_CounterComponent', 'game_Component');


/**
 * 角色数据加载完成时调用
 */
CounterComponent.prototype.onLoad = async function () {
    // 目前角色只需要掉落相关的计数器
    this.initContainer(code.counter.DROP_SIGN.name, (id) => { return this.dropSignIdCheck(id); });
    this.initContainer(code.counter.DROP_TIMES.name, (id) => { return this.dropTimesIdCheck(id); });
};

/**
 * 初始化容器
 */
CounterComponent.prototype.initContainer = function(name, idChecker) {
    let dataObj = this.player.counter[name];
    if (dataObj == null) {
        this.player.counter[name] = {};
        dataObj = this.player.counter[name];
    }
    const container = bearcat.getBean('logic_PlayerCounterMap', this.app, this.player, name, dataObj, idChecker);
    Object.defineProperty(this, name, { get: function () {
        return container;
    }});
};

/**
 * 玩家掉落下标id有效性检查器(只关心有效的个人下标)
 */
CounterComponent.prototype.dropSignIdCheck = function (id) {
    const config = this.app.Config.DropSign.get(id);
    if (config && config.SignType == code.drop.SIGN_TYPE.PERSON) {
        return true;
    }
    return false;
};

/**
 * 玩家掉落次数需要记录的id有效性检查器(只关心DropOne里面GivenDropId字段不为空的id)
 */
CounterComponent.prototype.dropTimesIdCheck = function (id) {
    return (this.app.Config.DropOne.isNeedRecordTimes(id));
};
