/**
 * @description 掉落相关的计数器
 * @author linjs
 * @date 2020/04/28
 */

const bearcat = require('bearcat');

const DropSignCounter = function (owner, id, dataObj) {
    this.$id = 'logic_DropSignCounter';
    this.$scope = 'prototype';
    this.owner = owner;
    this.id = id;
    this.dataObj = dataObj || this.createInitObj();
};

module.exports = DropSignCounter;
bearcat.extend('logic_DropSignCounter', 'logic_BaseCounter');

