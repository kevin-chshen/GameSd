/**
 * @description 全局运营活动子模块模板
 * @author jzy
 * @date 2020/06/09
 */

const logger = require('pomelo-logger').getLogger('pomelo', __filename);

const OperateBase = function (app, id, type, data) {
    this.$id = 'global_OperateBase';
    this.$scope = 'prototype';
    this.app = app;
    this.operateId = id;
    this.type = type;
    this.data = data;
};
module.exports = OperateBase;

/**
 * 初始化
*/
OperateBase.prototype.init = async function () {
    logger.debug(`OperateBase init :${this.$id}`);
};

/**
 * 获取活动Id
*/
OperateBase.prototype.getId = function () {
    logger.debug(`OperateBase getId :${this.$id}`);
    return this.operateId;
};

/**
 * 获取活动类型
*/
OperateBase.prototype.getType = function () {
    logger.debug(`OperateBase getType :${this.$id}`);
    return this.type;
};

/**
 * 获取活动数据
*/
OperateBase.prototype.getData = function() {
    // logger.debug(`OperateBase getData :${this.$id}`);
    return this.data;
};

OperateBase.prototype.start = async function() {
    logger.debug(`OperateBase start :${this.$id}`);
};

OperateBase.prototype.stop = async function () {
    logger.debug(`OperateBase stop :${this.$id}`);
};

/**
 * 重置数据
*/
OperateBase.prototype.reset = async function (startMs, stopMs) {
    logger.debug(`OperateBase reset :${this.$id}`);
    this.data.startMs = startMs;
    this.data.stopMs = stopMs;
    this.update();
};

/**
 * 获取活动开始时间
*/
OperateBase.prototype.getStartMs = function () {
    logger.debug(`OperateBase getStartMs :${this.$id}`);
    return this.data.startMs || 0;
};

/**
 * 更新数据
 */
OperateBase.prototype.update = function(){
    const dbData = this.app.OperateGlobal.getDbData(this.operateId);
    dbData.update({data:this.data});
};