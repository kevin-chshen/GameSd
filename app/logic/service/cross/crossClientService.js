/**
 * @description 跨服连接客户端
 * @author jzy
 * @date 2020/07/02
 */

const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const bearcat = require('bearcat');
const Client = require('pomelo-rpc').client;
const code = require('@code');
const path = require('path');
const {rpcAsyncTrans} = require('../../../lib/asyncRpc');

const CrossClientService = function () {
    this.$id = 'logic_CrossClientService';
    this.app = null;

    this.client = null;
    this.serversList = [];
};

module.exports = CrossClientService;
bearcat.extend('logic_CrossClientService', 'logic_BaseService');

CrossClientService.prototype.init = async function () {
    if(this.app.SystemConfig.crossEnv){
        await this.loadClient();
        const config = require(path.join(this.app.getBase(),'/config/',this.app.SystemConfig.crossEnv,'/servers.json'));
        this.addServers(config);
        this.app[code.cross.CROSS_APP_NAME] = rpcAsyncTrans(this.client.proxies.user);
    }
};

CrossClientService.prototype.loadClient = async function () {
    const opts = {};
    opts.routeContext = this.serversList;  // 作为路由函数第三个参数
    opts.router = this.routeFunc.bind(this);
    opts.context = this.app;
    opts.interval = 30;
    opts.bufferMsg = false;
    if (this.app.enabled('rpcDebugLog')) {
        opts.rpcDebugLog = true;
        opts.rpcLogger = require('pomelo-logger').getLogger('rpc-debug', __filename);
    }

    this.client = Client.create(opts);

    const self = this;
    await new Promise((resolve,reject)=>{
        self.client.start(function(err) {
            if(err){
                logger.error(err);
                self.client.stop();
                self.client = null;
                self.serversList = [];
                reject();
                return;
            }
            resolve();
        });
    }); 
};

CrossClientService.prototype.shutdown = async function (_reason) {
    if(this.client){
        this.client.stop();
        this.client = null;
        this.serversList = [];
    }
};

/**
 * 增加跨服节点，重复id节点过滤并警告
 * @param {Array} addServers {"cross": [{id: "cross-server-99", host: "127.0.0.1", port: 9999}]}
 */
CrossClientService.prototype.addServers = function(addServers){
    addServers = this._convertToServerList(addServers);
    const records = [];
    const servers = [];
    for(const each of addServers){
        const exist = this.serversList.find(info =>
            info.id == each.id
        );
        if(exist != undefined){
            logger.warn(`${JSON.stringify(each)} 跨服配置已存在，无法增加，存在的配置：\n${exist}`);
            continue;
        }
        records.push({
            namespace: 'user', 
            serverType: each.serverType, 
            path: path.join(this.app.getBase(), '/app/servers/', each.serverType, 'remote'),
        });
        servers.push(each);
        this.serversList.push(each);
    }
    this.client.addProxies(records);
    this.client.addServers(servers);
};

CrossClientService.prototype._convertToServerList = function(config){
    const result = [];
    for(const serverType of Object.keys(config)){
        for(const each of config[serverType]){
            result.push({
                id:each.id,
                serverType:serverType,
                host:each.host,
                port:each.port,
            });
        }
    }
    return result;
};

/**
 * 跨服rpc路由
 * @param {Object} routeParam 路由参数
 * @param {Object} msg rpc调用参数
 * @param {Object} routeContext this.serversList  所有的跨服路由节点
 * @param {Function} cb 回调
 */
CrossClientService.prototype.routeFunc = function(routeParam, msg, routeContext, cb) {
    cb(null, routeContext[0].id);
};