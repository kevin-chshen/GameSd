/**
 * @description testComponent
 * @author linjs
 * @date 2020/03/19
 */

const bearcat = require('bearcat');
const code = require('@code');

const TestComponent = function (app, player) {
    this.$id = 'game_TestComponent';
    this.$scope = 'prototype';
    this.app = app;
    this.player = player;
    this.count = 0;
};

module.exports = TestComponent;
bearcat.extend('game_TestComponent', 'game_Component');

TestComponent.prototype.onInit = async function () {

};

TestComponent.prototype.addCount = function() {
    this.count++;
};

TestComponent.prototype.getCount = function () {
    return this.count;
};
