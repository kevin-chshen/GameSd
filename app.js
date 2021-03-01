/**
 * @description app 启动
 * @date 2020/03/30
 */

/**
 * 载入之前
 */
function beforeLoad() {
    require('module-alias/register');
}
beforeLoad();

const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const bearcat = require('bearcat');
const pomelo = require('pomelo');
const {rpcAsync, rpcAsyncTrans} = require('./app/lib/asyncRpc');
const code = require('@code');

/**
 * Init app for client.
 */
const app = pomelo.createApp();
app.set('name', 'ShangDaoServer');

/**
 * 错误处理
 */
process.on('uncaughtException', function (err) {
    logger.error('Caught exception: ' + err.stack);
});

/**
 * Promise未捕获的错误处理
 */
process.on('unhandledRejection', function (err, p) {
    logger.error(`Caught unhandledRejection Promise: ${JSON.stringify(p)}`);
    throw err;
});

/**
 * Init bearcat for client.
 */
const contextPath = require.resolve('./context.json');
bearcat.createApp([contextPath], {
    BEARCAT_HOT: 'on'
});

/**
 * 关闭bearcat的日志输出,采用pomelo的日志机制
 */
process.env.BEARCAT_LOGGER = "off";

/**
 * 启动bearcat
 */
bearcat.start(() => {
    // handler 热更新开关
    app.set("serverConfig", {
        reloadHandlers: true
    });

    // remote 热更新开关
    app.set("remoteConfig", {
        reloadRemotes: true
    });

    /**
     * 当一个服所有进程全部启动完毕时,通知每个进程设置allServersStartOver为true.可利用该标识防止玩家在服务器启动过程中登进游戏.
     */
    app.event.on('start_all', function () {
        app.rpcs = rpcAsyncTrans(app.rpc);
        app.set('allServersStartOver', true);
    });

    /**
     * 开始初始化服务
     */
    bearcat.getBean('logic_Bootstrap').startServer(app).then(() => {
        /**
         * 服务启动完成
         */
        logger.info(`server id [${app.getServerId()}] type [${app.getServerType()}] start finish.`);

        /**
         * 启动进程,并在进程启动成功后
         */
        app.start(function () {
            app.rpcs = rpcAsyncTrans(app.rpc);
            app.rpcAsync = rpcAsync;

            // 设置进程名.进程名加上平台和服ID标识,用于一机多服
            const config = app.SystemConfig;
            process.title = `${code.system.ABBR}-${config.getPlatform()}-s${config.getServerId()}-${app.getServerId()}`;
        });
    }).catch(err => {
        console.error(`startServer error: ${err}`);
    });
});
