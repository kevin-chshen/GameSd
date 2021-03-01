/**
 * Created by chshen on 2020/03/10
 * @note connector路由
*/
const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const code = require('@code');

/**
 * connector 路由器
*/
const ConnectorRoute = function() {
    this.$id = "ConnectorRoute";
};

/**
 * 路由到游戏服
*/
ConnectorRoute.prototype.routeGame = async function(session, msg, app) {

    // 如果session下记录了分配的Game则使用 返回
    let gameId = session.get('game');
    if (gameId) {
        return gameId;
    }

    // 没有的话, 肯定这个msg是选角色或者创建角色协议(登陆后首个发送给Game的协议)    
    const msgRoute = msg.args[0].route;
    if ("game.loginHandler.login" === msgRoute) {
        // 优先查询redis记录, 有则使用并保存到session(断线时玩家所在的game不会立即清除)                     
        const uid = session.get(code.system.SESSION_ACCOUNT_MEMBER);
        const ret = await app.Redis.hget(code.redis.ROLE_ON_GAME.name, uid);
        if (!ret.err && ret.res){
            gameId = ret.res;
            if (gameId && app.getServerById(gameId)){
                logger.debug("routeGame uid(%) on %j", uid, gameId);
                session.set('game', gameId);
                session.push('game');
                return gameId;
            }
        }
        return this.dispatchGame(msg, session, app);        
    } else if ("game.playerHandler.createRole" === msgRoute) {
        return this.dispatchGame(msg, session, app);
    } else {
        return new Error("invalid message sequence : " + msgRoute);
    }
};

/**
 *  路由选择game服
 */
ConnectorRoute.prototype.dispatchGame = function (msg, session, app) {
    const online = app.RedisCache.getCache(code.redis.GAME_ONLINE_NUM.name);
    if (!online || online.length === 0) {
        const servers = app.getServersByType(msg.serverType);
        if (servers && servers.length > 0) {
            const gameId = servers[0].id;
            logger.info("default dispatch %s for session(%d)", gameId, session.id);
            session.set("game", gameId);
            session.push("game");
            return gameId;
        }
        return new Error('can not find game server.');
    }
    online.sort((a, b) => {
        return a.count - b.count;
    });
    const gameId = online[0].server;
    if (app.getServerById(gameId)) {
        logger.debug("dispatch %s for session(%d)", gameId, session.id);
        session.set("game", gameId);
        session.push("game");
        return gameId;
    }
    return new Error("no have available game server");
};

/**
 * 路由
*/
ConnectorRoute.prototype.route = function(session, msg, app, cb) {
    this.routeGame(session, msg, app)
        .then(reply =>{
            cb(null, reply);
        }).catch(e=>{
            cb(e);
        });
};

/**
 * 获取路由
*/
ConnectorRoute.prototype.getRoute = function () {
    return this.route.bind(this);
};

module.exports = ConnectorRoute;