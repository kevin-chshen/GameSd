/**
 * @description 服务器生命周期函数基础类
 * @author linjs
 * @date 2020/05/11
 */

const logger = require('pomelo-logger').getLogger('pomelo', __filename);

/**
 * 启动之前
 * @param {Object} app 本app
 * @param {Function} cb 回调函数
 */
module.exports.beforeStartup = function(app, cb) {
    // do some operations before application start up
    logger.info(`server [${app.getServerType()}] id [${app.getServerId()}] beforeStartup.`);
    cb();
};

/**
 * 启动之后
 * @param {Object} app 本app
 * @param {Function} cb 回调函数
 */
module.exports.afterStartup = function(app, cb) {
    // do some operations after application start up
    logger.info(`server [${app.getServerType()}] id [${app.getServerId()}] afterStartup.`);
    app.Service.afterStartServices().then(()=>{
        logger.info(`server [${app.getServerType()}] id [${app.getServerId()}] afterStartup ok.`);
        cb();
    }).catch(error =>{
        logger.info(`server [${app.getServerType()}] id [${app.getServerId()}] afterStartup with error: ${JSON.stringify(error)} => ${error.stack}.`);
        cb();
    });
};

/**
 * 关闭之前
 * @param {Object} app 本app
 * @param {Function} cb 回调函数
 */
module.exports.beforeShutdown = function(app, cb) {
    // do some operations before application shutdown down
    logger.info(`server [${app.getServerType()}] id [${app.getServerId()}] beforeShutdown.`);
    app.Service.stopServices('normal').then( () => {
        logger.info(`server [${app.getServerType()}] id [${app.getServerId()}] shutdown ok.`);
        cb();
    }).catch(error => {
        logger.info(`server [${app.getServerType()}] id [${app.getServerId()}] shutdown with error: ${JSON.stringify(error)} => ${error.stack}.`);
        cb();
    });
};

/**
 * 所有服务启动之后
 * @param {Object} app 本app
 */
module.exports.afterStartAll = function(app) {
    logger.info(`server [${app.getServerType()}] id [${app.getServerId()}] afterStartAll.`);
    // do some operations after all applications start up
    app.Service.afterStartAllServices().then(()=>{
        logger.info(`server [${app.getServerType()}] id [${app.getServerId()}] afterStartAll ok.`);
    }).catch(error =>{
        logger.info(`server [${app.getServerType()}] id [${app.getServerId()}] afterStartAll with error: ${JSON.stringify(error)} => ${error.stack}.`);
    });
};
