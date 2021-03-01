/**
 * Created by chshen 2020/03/16
 * connector handler
*/
const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const code = require('@code');
const MongoAccount = require("@mongo/mongoAccount");

module.exports = function(app) {
    return new Handler(app);
};

const Handler = function(app) {
    this._app = app;
};


/**
 * 本地公网ip
*/
Handler.prototype._intranetIps = function () {
    return ['110.80.15.38'];
};

/**
 * 检测登录权限
*/
Handler.prototype._checkEntryRight = function (session) {

    const env = this._app.get('env');
    if (env == 'production') {
        // 开服时间未到 但是在白名单范围内 则允许登录
        const ip = session.__session__.__socket__.remoteAddress.ip.split(':')[3];
        const allowIps = this._intranetIps();
        if (Date.now() < this._app.SystemConfig.getServerOpenMs() && allowIps.indexOf(ip) == -1) {
            return false;
        }
    }
    return true;
};

/**
 * 客户端连入
 *
 * @param  {Object}   msg     request message
 * @param  {Object}   session current session object
 * @param  {Function} next    next step callback
 * @return {Void}
 */
Handler.prototype.entry = async function(msg, session, next) {
    const token = msg.token;
    const tokenKey = [code.redis.AUTHORITY_CODE_OF_ACCOUNT.name, token];

    // 账号记录的token 不为空
    const ret = await this._app.Redis.get(tokenKey);
    if (ret.err || !ret.res){
        logger.error("session(%d) token(%j) not pass gate or token expired", session.id, token);
        next("error token", { code: code.err.ERR_CONNECTOR_TOKEN, token: token });
        return;
    }
    if (!this._checkEntryRight(session)) {
        next("error right", { code: code.err.ERR_CONNECTOR_SERVER_NO_OPEN });
        return;
    }
    // 删除redis记录的账号
    await this._app.Redis.del(tokenKey);
    const uid = ret.res;
    const self = this;
    if (this._app.get('sessionService').getByUid(uid)) {
        const frontendId = session.frontendId;
        this._app.get('channelService').pushMessageByUids("onNotifyReplaced", {}, [{ uid: Number(uid), sid: frontendId }]);
        await new Promise((resolve) =>{
            self._app.get('sessionService').kick(uid, "reLogin", function (err) {
                logger.info(`entry handler, kick uid:${uid}, err:${err}`);
                resolve();
            });
        });
    }

    // 设置登录成功标记
    session.set(code.system.SESSION_ACCOUNT_MEMBER, uid);
    // 绑定离线事件
    session.on('closed', (session, reason)=>{
        self.onUserLeave(self._app, reason, session);
    });
    let retPushAll;
    retPushAll = await new Promise((resolve, reject) => {
        session.pushAll((err) =>{
            if (err){
                logger.error("uid (%s) enter failed, push error, err = %s", uid, err);
                reject(false);                
            }
            resolve(true);
        });
    }).catch(e =>{ retPushAll = e; });
    if (!retPushAll){
        next(null, { code: code.err.ERR_CONNECTOR_ENTER, token: token });
        return;
    }

    // 防止二次链接过程中误清除下次的超时链接, 同时又有清除超时标记的作用
    const key = [code.redis.ACCOUNT_DISPATCHED_CONNECTOR.name, uid];
    const countRet = await this._app.Redis.hget(key, 'count');
    if (countRet.err || !countRet.res){
        logger.error("player(%j) entry failed, persist failed, err = %s", uid, countRet.err);
        next("error", {code : code.err.FAILED});
        return;
    }
    
    if (countRet.res == "0") {
        this._app.Redis.persist(key);
    }
    this._app.Redis.hincrby(key, "count", 1);

    // 设置成功链接数
    await this._app.Redis.zincrby(code.redis.CONNECTOR_ONLINE_NUM.name, 1, this._app.getServerId());

    const mongoData = await MongoAccount.query({ uid: Number(uid) });
    if (!mongoData || !mongoData[0]) {
        logger.error(`entry handler player load mongo account failed, player ${this.uid}`);
        next("account not found", { code: code.err.FAILED });
        return;
    }

    const sdkResult = mongoData[0].get('sdkResult');
    const reply = { code: code.err.SUCCEEDED, token: token, sessionId: session.id, sdkResult: sdkResult };
    next(null, reply);
};


/**
 * User log out handler
 * @param {Object} app
 * @param {String} reason
 * @param {Object} session current session object
 *
 */
Handler.prototype.onUserLeave = async function (app, reason, session) {
    if (!session) {
        logger.error("account(%j) leave failed, session is null", uid);
        return;
    }
    // 减少在线人数
    await app.Redis.zincrby(code.redis.CONNECTOR_ONLINE_NUM.name, -1, app.getServerId());
    const uid = session.uid;
    if (uid)
    {
        // 移除connector链接记录
        if (reason != 'reLogin'){
            await app.Redis.hdel(code.redis.ROLE_ON_CONNECTOR.name, uid);
        }
        // 清除redis缓存的key表
        const key = [code.redis.ACCOUNT_DISPATCHED_CONNECTOR.name, uid];
        const ret = await app.Redis.hincrby(key, 'count', -1);
        if (!ret.err && ret.res <= 0){
            app.Redis.del(key);
        }

        await app.rpcs.game.playerRemote.playerLogout(session, uid, reason);
    }
};
