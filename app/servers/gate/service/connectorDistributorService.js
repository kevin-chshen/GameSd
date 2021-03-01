/**
 * created by chshen on 2020/03/12
 * note 提供connector服务器信息
*/
const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const code = require('@code');
const bearcat = require('bearcat');

const ConnectorDistributorService = function() {
    this.$id = 'gate_ConnectorDistributorService';
    this.app = null;
};

module.exports = ConnectorDistributorService;
bearcat.extend('gate_ConnectorDistributorService', 'logic_BaseService');

/**
 * 获取可用的connector
 * @return {String} connectorId
 */
ConnectorDistributorService.prototype.getUsableConnector = async function () {            
    // select the least player of connector
    const redisCache = this.app.RedisCache;
    let connectors = redisCache.getCache(code.redis.CONNECTOR_ONLINE_NUM.name);
    // 立即查，我们前面已经设定1分钟刷新一次缓存，因此当前情况是为了处理内部测试1分钟内可以登录的问题
    if (connectors == null || connectors.length <= 0) {
        // 立即加载一次缓存
        await redisCache.updateCache(code.redis.CONNECTOR_ONLINE_NUM.name);
        connectors = redisCache.getCache(code.redis.CONNECTOR_ONLINE_NUM.name);
        logger.info("load connector cache with %j", connectors);
    }
    
    if (connectors == null || connectors.length <= 0) {
        logger.error("connector distributor, distributor is empty");
        return null;
    }
    connectors.sort((a, b)=> {
        a.count - b.count;
    });
    for (let index = 0; index < connectors.length; index++) {
        const connectorId = connectors[index]["server"];
        const loginNum = connectors[index]["count"];
        if (this.app.getServerById(connectorId) && loginNum < code.system.NUM_MAX_SERVER_CONNECTOR) {
            return connectorId;
        }
    }

    return null;
};
