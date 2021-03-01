/**
 * @description 服务器启动文件
 * @author linjs
 * @date 2020/03/30
 */

const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const bearcat = require('bearcat');
const util = require('@util');

const Bootstrap = function() {
    this.$id = 'logic_Bootstrap';
    this.app = null;
};

module.exports = Bootstrap;

/**
 * 启动服务器
 */
Bootstrap.prototype.startServer = async function (app) {
    const serverType = app.getServerType();
    logger.info(`server id [${app.getServerId()}] type [${serverType}] start.`);

    // 优先启动 ServiceManager
    const serviceManager = bearcat.getBean('logic_ServiceManager');
    serviceManager.init(app);

    // 接着读取系统配置
    await serviceManager.registerAndStartService('SystemConfig', 'logic_SystemConfigService');

    // 根据服务器类型启动:注册一些服务
    const enterId = `${serverType}_${util.str.upperFirst(serverType)}Boot`;
    bearcat.getBean(enterId).startServer(app);

    // 真正启动注册的服务
    await app.Service.startServices();
};
