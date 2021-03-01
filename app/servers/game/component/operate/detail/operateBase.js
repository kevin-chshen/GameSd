/**
 * @description 运营活动基础数据模块
 * @author chshen
 * @data 2020/05/25
 */
const logger = require('pomelo-logger').getLogger('pomelo', __filename);

const OperateBase = function (app, player, id, type, data) {
    this.$id = 'game_OperateBase';
    this.$scope = 'prototype';
    this.app = app;
    this.player = player;
    this.operateId = id;
    this.type = type;
    this.data = data;
};
module.exports = OperateBase;

/**
 * 初始化
*/
OperateBase.prototype.init = function () {
    logger.debug(`OperateBase init :${this.$id},player:${this.player.uid}`);
};

/**
 * 获取活动Id
*/
OperateBase.prototype.getId = function () {
    logger.debug(`OperateBase getId :${this.$id},player:${this.player.uid}`);
    return this.operateId;
};

/**
 * 获取活动类型
*/
OperateBase.prototype.getType = function () {
    logger.debug(`OperateBase getType :${this.$id},player:${this.player.uid}`);
    return this.type;
};

/**
 * 获取活动数据
*/
OperateBase.prototype.getData = function() {
    logger.debug(`OperateBase getData :${this.$id},player:${this.player.uid}`);
    return this.data;
};

/**
 * 每日
*/
OperateBase.prototype.onDayChange = function (_isOnTime, _count) {
    logger.debug(`OperateBase onDayChange :${this.$id},player:${this.player.uid}`);
};

OperateBase.prototype.start = function() {
    logger.debug(`OperateBase start :${this.$id},player:${this.player.uid}`);
};

OperateBase.prototype.stop = function () {
    logger.debug(`OperateBase stop :${this.$id},player:${this.player.uid}`);
};

/**
 * 重置数据
*/
OperateBase.prototype.reset = function (startMs, _stopMs) {
    logger.debug(`OperateBase reset :${this.$id},player:${this.player.uid}`);
    this.data.startMs = startMs;
};

/**
 * 获取活动开始时间
*/
OperateBase.prototype.getStartMs = function () {
    logger.debug(`OperateBase getStartMs :${this.$id},player:${this.player.uid}`);
    return this.data.startMs || 0;
};


/**
 * 发送邮件
*/
OperateBase.prototype.sendMail = function (mailId, reward, param) {
    this.app.Mail.sendOperateActivityMail(this.player.uid, mailId, reward, param);
};

/**
 * 发送重复充值邮件
*/
OperateBase.prototype.sendMailRepeatPay = function (mailId, diamond, name) {
    this.app.Mail.sendMailRepeatPay(this.player.uid, mailId, diamond, name);
};