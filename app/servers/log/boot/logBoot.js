/**
 * @description log服务器启动入口
 * @author linjs
 * @date 2020/03/31
 */

const bearcat = require('bearcat');

const LogBoot = function () {
    this.$id = 'log_LogBoot';
};
module.exports = LogBoot;
bearcat.extend('log_LogBoot', 'logic_BaseBoot');

/**
 * 服务器启动
 */
LogBoot.prototype.startServer = function (app) {
    // 注册服务
    app.Service.registerService('Config', 'logic_ConfigService', null);
    app.Service.registerService('Mysql', 'logic_MysqlService', 'Config');
    app.Service.registerService('ChatDump', 'log_ChatDumpService', null);
};
