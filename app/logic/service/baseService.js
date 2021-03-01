/**
 * @description 基础服务
 * @author linjs
 * @date 2020/03/21
 */

const logger = require('pomelo-logger').getLogger('pomelo', __filename);

const BaseService = function () {
    this.$id = 'logic_BaseService';
    this.app = null;
};

module.exports = BaseService;

/**
 * 服务初始化:由服务管理器调用
 * @param {Object} app pomelo app
 */
BaseService.prototype.serviceStart = async function (app) {
    logger.info(`server id [${app.getServerId()}] service [${this.$id}] start.`);
    this.app = app;
    this.initBase();
    return await this.init();
};

/**
 * 初始化基类:由服务的基类实现,有些类需要继承其他的父类,导致父类没地方初始化
 */
BaseService.prototype.initBase = function () {

};

/**
 * 服务初始化:由子类实现,默认什么都不做
 */
BaseService.prototype.init = async function () {
    
};

/**
 * 服务启动后:部分业务基于pomelo内部服务启动后才能执行
*/
BaseService.prototype.afterStartUp = async function() {

};

/**
 * 所有服务启动后才能执行
*/
BaseService.prototype.afterStartAll = async function() {

};

/**
 * 服务关闭
 * @param {String} reason 关闭原因
 */
BaseService.prototype.serviceStop = async function (reason) {
    logger.info(`server id [${this.app.getServerId()}] service [${this.$id}] shutdown with [${reason}]`);
    this.shutdownBase(reason);
    return await this.shutdown(reason);
};

/**
 * 关闭基类:由服务的基类实现,有些类需要继承其他的父类,导致父类没地方关闭
 */
BaseService.prototype.shutdownBase = function (_reason) {

};

/**
 * 服务关闭:由子类实现,默认什么都不做
 * @param {String} reason 关闭原因
 */
BaseService.prototype.shutdown = async function (_reason) {
    
};


