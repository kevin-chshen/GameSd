/**
 * @description 服务管理器
 * @author linjs
 * @date 2020/03/16
 */

const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const bearcat = require('bearcat');
const assert = require('assert');
const util = require('@util');

const ServiceManager = function () {
    this.$id = 'logic_ServiceManager';
    this.app = null;
    this.services = {};
    this.stopServicesInfo = {};
};

module.exports = ServiceManager;

/**
 * 服务状态
 */
const ServiceStatue = {
    wait: 0,        // 等待初始化
    init: 1,        // 正在初始化
    finish: 2       // 完成初始化
};

/**
 * 服务管理器初始化
 */
ServiceManager.prototype.init = function (app) {
    this.app = app;
    app.set('Service', this, true);
};

/**
 * 注册启动服务
 * @param {String} serviceName 服务名称,启动完成后 app.serviceName 可以直接访问
 * @param {String} bearcatId bearcat的$id
 * @param {String|Array} dependencies 依赖的服务名称
 */
ServiceManager.prototype.registerService = function (serviceName, bearcatId, dependencies) {
    assert(this.services[serviceName] == null, `service [${serviceName}] is already start.`);
    this.services[serviceName] = {
        name: serviceName,
        bearcatId: bearcatId,
        dependencies: dependencies,
        status: ServiceStatue.wait,
        startTimeStamp: 0,
        needCheckAllFinish: true,
        promise: null,
    };
    // 设置getter函数
    Object.defineProperty(this.app, serviceName, { get: function() {
        const service = bearcat.getBean(bearcatId);
        if (service) {
            return service;
        } else {
            logger.error(`service [${serviceName}:${bearcatId}] is not exist`);
            return null;
        }
    }});
};

/**
 * 注册并启动一个服务
 * 
 */
ServiceManager.prototype.registerAndStartService = function (serviceName, bearcatId) {
    assert(this.services[serviceName] == null, `service [${serviceName}] is already start.`);
    this.services[serviceName] = {
        name: serviceName,
        bearcatId: bearcatId,
        dependencies: null,
        status: ServiceStatue.init,
        startTimeStamp: 0,
        needCheckAllFinish: false,  // 单独注册的不需要检查是否全部完成
        promise: null
    };
    // 设置getter函数
    Object.defineProperty(this.app, serviceName, { get: function() {
        const service = bearcat.getBean(bearcatId);
        if (service) {
            return service;
        } else {
            logger.error(`service [${serviceName}:${bearcatId}] is not exist`);
            return null;
        }
    }});

    const promise = this._makeStartPromise(serviceName, this.app.getServerId(), this.app);
    this.services[serviceName].promise = promise;
    return promise;
};

/**
 * 启动所有服务
 */
ServiceManager.prototype.startServices = async function () {
    // 计算启动顺序,保证依赖项一定比自己更早生成
    const needStart = [];
    const startOrder = [];
    for (const {name, dependencies, status} of Object.values(this.services)) {
        if (status == ServiceStatue.wait) {
            needStart.push({name, dependencies});
        }
    }
    const isReady = function (dependencies) {
        if (null == dependencies) {
            return true;
        } else if (Array.isArray(dependencies)) {
            return dependencies.every((dep) => startOrder.indexOf(dep) >= 0);
        } else {
            return startOrder.indexOf(dependencies) >= 0;
        }
    };
    let service = needStart.shift();
    while (service) {
        if (isReady(service.dependencies)) {
            startOrder.push(service.name);
        } else {
            // 依赖还没在启动队列里
            needStart.push(service);
        }
        service = needStart.shift();
    }
    // 生成Promise
    const promiseVec = [];
    for (const name of startOrder) {
        const promise = this._makeStartPromise(name, this.app.getServerId(), this.app);
        this.services[name].promise = promise;
        promiseVec.push(promise);
    }
    return Promise.all(promiseVec);
};

/**
 * 启动服后的服务
 */
ServiceManager.prototype.afterStartServices = async function () {
    for (const {name} of Object.values(this.services)) {
        this.app[name].afterStartUp();
    }
};

/**
 * 所有服务启动后
 */
ServiceManager.prototype.afterStartAllServices = async function () {
    for (const {name} of Object.values(this.services)) {
        this.app[name].afterStartAll();
    }
};

/**
 * 关闭所有服务
 */
ServiceManager.prototype.stopServices = async function (reason) {
    // 根据启动依赖,分析关闭顺序
    this._parseStopDeps();
    // 根据关闭顺序,关闭所有服务
    return this._makeStopOrder(reason);
};

// 辅助函数

/**
 * 生成服务启动Promise
 * @param {String} serviceName 要启动的服务名称
 * @param {String} serverId 服务器id
 * @param {Object} app pomelo app
 * @return {Promise}
 */
ServiceManager.prototype._makeStartPromise = function(serviceName, serverId, app) {
    const info = this.services[serviceName];
    return new Promise((resolve, reject) => {
        // 先检查依赖
        const depPromise = this._makeDepsPromise(info.dependencies);
        depPromise.then(() => {
            // 记录启动时间
            info.startTimeStamp = Date.now();
            info.status = ServiceStatue.init;
            bearcat.getBean(info.bearcatId).serviceStart(app).then(() => {
                const useTime = Date.now() - info.startTimeStamp;
                logger.info(`server id [${serverId}] service [${serviceName}] start ok, use [${useTime}ms].`);
                info.status = ServiceStatue.finish;
                resolve(serviceName);
            }).catch(err => {
                logger.error(`server id [${serverId}] service [${serviceName}] start error [${JSON.stringify(err)}].`);
                reject(err);
            });
        });
    });
};

/**
 * 根据依赖组合依赖的Promise
 * @param {null|String|Array} dependencies 依赖的服务 
 */
ServiceManager.prototype._makeDepsPromise = function (dependencies) {
    if (dependencies == null) {
        return Promise.resolve();
    } else if (Array.isArray(dependencies)) {
        return Promise.all(dependencies.map((name) => this.services[name].promise));
    } else {
        return this.services[dependencies].promise;
    }
};

/**
 * 根据启动的依赖关系,分析关闭的依赖
 * @returns {Object} name => {name,deps,promise}
 */
ServiceManager.prototype._parseStopDeps = function () {
    // 先初始化
    Object.values(this.services).map(({name}) => {
        this.stopServicesInfo[name] = {
            name: name,
            promise: null,
            dependencies: [],
            startTimeStamp: 0,
            status: ServiceStatue.init
        };
    });
    // mongodb和redis的处理成最后2个关闭,其它service可能需要保存服务
    const mongoService = this.stopServicesInfo['Mongo'];
    const redisService = this.stopServicesInfo['Redis'];
    // 倒置依赖,启动时A依赖B,现在变成B要等A先关闭
    Object.values(this.services).map(({name, dependencies}) => {
        if (Array.isArray(dependencies)) {
            dependencies.map( targetName => {
                if (!this.stopServicesInfo[targetName].dependencies.includes(name)) {
                    this.stopServicesInfo[targetName].dependencies.push(name);
                }
            });
        } else if (util.str.isString(dependencies)) {
            if (!this.stopServicesInfo[dependencies].dependencies.includes(name)) {
                this.stopServicesInfo[dependencies].dependencies.push(name);
            }
        }
        // mongodb和redis要等到大家都关闭了,才能关闭
        if (name != 'Redis' && name != 'Mongo') {
            if (mongoService && !mongoService.dependencies.includes(name)) {
                mongoService.dependencies.push(name);
            }
            if (redisService && !redisService.dependencies.includes(name)) {
                redisService.dependencies.push(name);
            }
        }
    });
};

/**
 * 根据依赖,生成服务关闭顺序
 */
ServiceManager.prototype._makeStopOrder = function (reason) {
    // 根据依赖,生成所有的promise
    const needStop = [];
    const stopOrder = [];
    Object.values(this.stopServicesInfo).map( ({name, dependencies}) => {
        needStop.push({name, dependencies});
    });
    const isReady = function (dependencies) {
        if (dependencies.length == 0) {
            return true;
        } else {
            return dependencies.every((deps) => stopOrder.includes(deps));
        }
    };
    let service = needStop.shift();
    while (service) {
        if (isReady(service.dependencies)) {
            stopOrder.push(service.name);
        } else {
            // 依赖还没在启动队列里
            needStop.push(service);
        }
        service = needStop.shift();
    }
    // 生成Promise
    const promiseVec = [];
    for (const name of stopOrder) {
        const promise = this._makeStopPromise(name, this.app.getServerId(), this.app, reason);
        this.stopServicesInfo[name].promise = promise;
        promiseVec.push(promise);
    }
    return Promise.all(promiseVec);
};

/**
 * 生成服务关闭Promise
 * @param {String} serviceName 要启动的服务名称
 * @param {String} serverId 服务器id
 * @param {Object} app pomelo app
 * @return {Promise}
 */
ServiceManager.prototype._makeStopPromise = function(serviceName, serverId, app, reason) {
    const info = this.stopServicesInfo[serviceName];
    return new Promise((resolve) => {
        // 先检查依赖
        const depPromise = this._makeStopDepsPromise(info.dependencies);
        depPromise.then(() => {
            // 记录启动时间
            info.startTimeStamp = Date.now();
            info.status = ServiceStatue.init;
            const service = app[serviceName];
            if (service) {
                service.serviceStop(reason).then( () => {
                    const useTime = Date.now() - info.startTimeStamp;
                    logger.info(`server id [${serverId}] service [${serviceName}] stop ok, use [${useTime}ms].`);
                    info.status = ServiceStatue.finish;
                    resolve();
                }).catch( err => {
                    logger.error(`server id [${serverId}] service [${serviceName}] stop error [${err}] with: ${err.stack}`);
                    // 不报错,只打印错误
                    info.status = ServiceStatue.finish;
                    resolve();
                });
            } else {
                logger.error(`server id [${serverId}] service [${serviceName}] stop error because service not exist, use [0ms].`);
                info.status = ServiceStatue.finish;
                resolve();
            }
        });
    });
};

/**
 * 根据依赖组合依赖的Promise
 * @param {null|String|Array} dependencies 依赖的服务 
 */
ServiceManager.prototype._makeStopDepsPromise = function (dependencies) {
    if (dependencies.length > 0) {
        return Promise.all(dependencies.map((name) => this.stopServicesInfo[name].promise));
    } else {
        return Promise.resolve();
    }
};
