/**
 * @description 玩家服务
 * @author linjs
 * @date 2020/03/18
 */

const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const bearcat = require('bearcat');
const code = require('@code');

const PlayerService = function () {
    this.$id = 'game_PlayerService';
    this.$scope = "singleton";
    this.app = null;
    this.players = {};
    this.logoutPlayers = [];
};
module.exports = PlayerService;
bearcat.extend('game_PlayerService', 'logic_BaseService');

/**
 * 服务初始化
 */
PlayerService.prototype.init = function () {
    // 定时清理玩家数据缓存
    this.cleanPlayerCacheTimer = setInterval(this.cleanPlayerCache, code.player.CHECK_CLEAN_CACHE_TIME_MS, this);

    // 监听计数器重置事件
    const timerIds = this.app.Config.Timer.getPersonTimerIds();
    timerIds.map((timerId) => {
        this.app.Timer.register(timerId, 0, false, (...args) => {
            this.onServerEvent([code.event.RECUR_TIMER.name, timerId], ...args);
        });
    });
    // 运营活动
    const operateIds = this.app.Config.OperateBaseActivity.getIds();
    operateIds.map((operateId) => {
        this.app.Event.on([code.eventServer.OPERATE_START_TIMER.name, operateId], 0, (...args)=>{
            this.onServerEvent([code.event.OPERATE_START_TIMER.name, operateId], ...args);
        });
        this.app.Event.on([code.eventServer.OPERATE_STOP_TIMER.name, operateId], 0, (...args) => {
            this.onServerEvent([code.event.OPERATE_STOP_TIMER.name, operateId], ...args);
        });
    });
};

/**
 * 服务关闭:通知玩家服务器关闭
 * @param {String} reason 关闭原因
 */
PlayerService.prototype.shutdown = async function (reason) {
    clearInterval(this.cleanPlayerCacheTimer);
    return await Promise.all(Object.values(this.players).map( player => {
        // 通知所有玩家服务器关闭,调用onLogout,onClean
        return player.shutdown(reason);
    }));
};

/**
 * 获取在线玩家(包含处于离线状态,网络断开的)
 * @param {Integer} uid 角色uid
 * @return {JSON}
 */
PlayerService.prototype.onServerEvent = function (event, ...args) {
    for (const player of Object.values(this.players)) {
        if (player) {
            player.Event.emit(event, ...args);
        }

    }
};

/**
 * 获取在线玩家(包含处于离线状态,网络断开的)
 * @param {Integer} uid 角色uid
 * @return {JSON}
 */
PlayerService.prototype.getPlayerByUid = function (uid) {
    return this.players[uid];
};

/**
 * 获取在线玩家(不包含离线状态的玩家)
 * @param {Integer} uid 角色uid
 * @return {Object}
 */
PlayerService.prototype.getOnlinePlayerByUid = function (uid) {
    const player = this.players[uid];
    if (null || this.logoutPlayers.includes(uid)) {
        return null;
    }
    return player;
};

/**
 * 获取一批玩家(包含处于离线状态,网络断开的)
 * @param {Array} uids 角色uid列表
 * @return {Array}
 */
PlayerService.prototype.getPlayerByUids = function (uids) {
    return uids.reduce((total, current) => {
        const player = this.players[current];
        if (player) {
            total.push(player);
        }
    }, []);
};

/**
 * 获取一批玩家(不包含离线状态的玩家)
 * @param {Array} uids 角色uid列表
 * @return {Array}
 */
PlayerService.prototype.getPlayerByUids = function (uids) {
    return uids.reduce((total, current) => {
        const player = this.players[current];
        if (player && !this.logoutPlayers.includes(current)) {
            total.push(player);
        }
    }, []);
};

/**
 * 获取所有在线玩家
 * @return {JSON}
 */
PlayerService.prototype.getPlayers = function () {
    return this.players;
};

/**
 * 玩家进入游戏世界
 * @param {Integer} uid 玩家id
 * @param {Object} session 玩家session
 * @param {MongoPlayer} playerData 玩家的持久化数据{MongoPlayer}
 * @return {Player} 玩家实例
 */
PlayerService.prototype.addPlayer = async function (uid, session, dataObj) {
    const uidIndex = Object.keys(this.players).indexOf(uid.toString());
    logger.debug(`playerService: add player uid = ${uid} uidIndex = ${uidIndex}`);
    let player = null;
    if (uidIndex < 0) {
        // 新增玩家数据
        player = bearcat.getBean('game_Player', this.app, uid);
        // 通知各个组件玩家初始化完成
        await player.init();
        // 通知各个组件加载数据
        await player.load(dataObj);
        // 数据加载后处理
        await player.afterLoad();
        this.players[uid] = player;

        // 增加在线人数
        await this.app.Redis.zincrby(code.redis.GAME_ONLINE_NUM.name, 1, this.app.getServerId());

        // 登录的时候上传数据，缺点是多做了无用的存储，好处是具有自动修复功能，即使后台数据出错，也能够因为玩家重新登录而修复
        const act = player.accountData;
        const key = [code.redis.MY_LOGIN_SERVERS.name, act.account, act.platform];
        this.app.RedisMyLogin.hset(key, act.serverId, act.agentId);
    } else {
        // 玩家已经在列表里面
        // 取消离线状态
        const index = this.logoutPlayers.indexOf(uid);
        if (index >= 0) {
            this.logoutPlayers.splice(index, 1);
        }

        player = this.players[uid];
    }

    // 设置登录时间
    player.lastLoginTime = Date.now();
    player.Event.emit(code.event.LAST_LOGIN_TIME_UPDATE.name);

    // 断线重连
    if (player.sid && player.sid == session.id) {
        await player.reConnect();
    }
    // 重新登录,登录时已经处理了顶号踢人，因此这里不会再进入
    else if (uidIndex != -1 && player.sid && player.sid != session.id) {
        // 旧链接踢下线
        if (player.connectorId && player.sid) {
            // 旧的链接存在才剔除,不同connector,直接剔除
            this.app.backendSessionService.kickBySid(player.connectorId, player.sid);
            logger.warn(`playerService reLogin kick uid:${player.uid}, sid:${player.sid}, connector:${player.connectorId}`);
        }
        await player.reLogin();
    }
    else {
        // 通知所有组件,玩家登录成功
        await player.login();

        // 设置玩家所在的game服
        await this.app.Redis.hset(code.redis.ROLE_ON_GAME.name, uid, this.app.getServerId());
    }

    // 设置前端connector
    await this.app.Redis.hset(code.redis.ROLE_ON_CONNECTOR.name, uid, session.frontendId);

    // 设置链接ID
    player.connectorId = session.frontendId;
    // 设置sessionId，可用于检测顶号
    player.sid = session.id;

    // 玩家登录后
    await player.afterLogin();

    return player;
};

/**
 * 玩家离线
 * @param {Integer} uid	角色uid
 * @param {String} reason 离线原因
 * @return {void}
 */
PlayerService.prototype.playerLogout = async function (uid, reason) {
    const player = this.players[uid];
    if (player) {

        // 保存退出时间
        await player.logout(reason);

        // 离线队列
        if (reason != 'reLogin') {
            this.logoutPlayers.push(uid);
        }
    } else {
        // 没有玩家数据
        logger.info("playerService playerLogout : not exist player(%d) info, add into logoutPlayers failed", uid);
    }
};

/**
 * 检查玩家在线状态
 * @param {Object} self
 * @return {Void}
 */
PlayerService.prototype.cleanPlayerCache = async function (self) {
    if (!self.players || Object.keys(self.players).length <= 0)
        return;

    const removeUids = [];
    for (const uid of self.logoutPlayers) {
        const player = self.players[uid];
        if (!player) {
            removeUids.push(uid);
            continue;
        }

        // 在线缓存时间
        const cacheTimeMS = Date.now() - player.lastLogoutTime;
        if (cacheTimeMS - code.player.LEAVE_DATA_CACHE_TIME_MS < 0) {
            continue;
        }
        removeUids.push(uid);
        await player.clean();
        await player.flush();
        await player.deInit();
        delete self.players[uid];

        self.app.Redis.hdel(code.redis.ROLE_ON_GAME.name, uid);

        // 减少在线人数
        self.app.Redis.zincrby(code.redis.GAME_ONLINE_NUM.name, -1, self.app.getServerId());

        logger.info(`playerService player:${uid} leave server, delete form players`);
    }

    if (removeUids.length > 0) {
        for (const uid of removeUids) {
            const index = self.logoutPlayers.indexOf(uid);
            if (index != -1) {
                self.logoutPlayers.splice(index, 1);
            }
        }
        self.app.Event.clean(removeUids);
    }
};