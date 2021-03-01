/**
 * @description 掉落相关的计数器
 * @author linjs
 * @date 2020/04/28
 */

const bearcat = require('bearcat');

const DropCounter = function (owner, id, dataObj) {
    this.$id = 'logic_DropCounter';
    this.$scope = 'prototype';
    this.owner = owner;
    this.id = id;
    this.dataObj = dataObj || this.createInitObj();
};

module.exports = DropCounter;
bearcat.extend('logic_DropCounter', 'logic_BaseCounter');
