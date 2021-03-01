/**
 * @description Mongodb服务
 * @author linjs
 * @date 2020/03/30
 */

const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const bearcat = require('bearcat');
const mongoClient = require('mongodb').MongoClient;
// const assert = require('assert');
const path = require("path");
const MongoDataBase = require("./mongoDataBase");

const MongoService = function () {
    this.$id = 'logic_MongoService';
    this.app = null;
    this.mongoClient = null;
};

module.exports = MongoService;
bearcat.extend('logic_MongoService', 'logic_BaseService');

/**
 * 初始化mongo服务
 */
MongoService.prototype.init = async function () {
    // 设置好app,后续DBData会需要用到
    const app = this.app;
    MongoDataBase.app = app;
    logger.debug( "set MongoDataBase's app" );
    //mongodb://[username:password@]host1[:port1][,host2[:port2],...[,hostN[:portN]]][/[database][?options]]
    const mongoConfig = app.SystemConfig.mongo;
    const dbName = mongoConfig.db;
    this.mongoClient = await mongoClient.connect(mongoConfig.url, {useNewUrlParser: true, useUnifiedTopology: true});
    const serverId = app.getServerId();
    logger.info(`server id [${serverId}] connected correctly to mongo server`);
    const db = this.mongoClient.db(dbName);
    app.set("db", db, true);
    const sync = require('pomelo-sync-plugin');
    app.use(sync, {sync: {
        path: app.getBase() + "/app/logic/mongo/mapping",
        dbclient: db,
        interval : mongoConfig.interval
    }});
    // return await new Promise((resolve) => {
    //     mongoClient.connect(mongoConfig.url, {useNewUrlParser: true, useUnifiedTopology: true}, function(err, dbConn) {
    //         assert.equal(null, err);
    //         const serverId = app.getServerId();
    //         logger.info(`server id [${serverId}] connected correctly to mongo server`);
    //         const db = dbConn.db(dbName);
    //         app.set("db", db, true);
    
    //         const sync = require('pomelo-sync-plugin');
    //         app.use(sync, {sync: {
    //             path: app.getBase() + "/app/logic/mongo/mapping",
    //             dbclient: db,
    //             interval : mongoConfig.interval
    //         }});
    //         resolve();
    //     });
    // });
};

/**
 * 关闭服务
 */
MongoService.prototype.shutdown = async function (_reason) {
    const sync = this.app.get("sync");
    // 将缓存中的数据立即写入数据库
    await new Promise((resolve , _reject)=>{
        sync.sync();
        const interval = setInterval(function(){
            if (sync.isDone()) {
                clearInterval(interval);
                resolve();
            }
        }, 200);
    });
    this.mongoClient.close();
    this.app.set('db', null, true);
};

/**
 * 获取表名
 * @param {String} url 连接字符串
 */
MongoService.prototype.getDbName = function (url) {
    return path.basename(url);
};
