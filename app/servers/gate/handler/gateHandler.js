/**
 * created by chshen on 20020/03/11
 * 网关服handler
*/
const code = require('@code');
const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const MongoAccount = require("@mongo/mongoAccount");
const util = require('@util');
const md5 = require("md5");

module.exports = function(app) {
    return new Handler(app);
};

const Handler = function(app) {
    this._app = app;
};

Handler.prototype.queryServerList = async function (msg, session, next) {
    const account = String(msg.account);
    const loginType = msg.loginType;
    const platform = msg.platform;
    let accountUid;
    if (platform == null || account == null){
        next('query server list error', { code: code.err.FAILED });
        return;
    }
    // TEST内部登陆
    if (loginType === code.auth.LOGIN_TYPE.TEST) {
        const res = await this._app.rpcs.auth.authRemote.verifyTest(session, account, msg.token);
        if (res.err) {
            logger.info("login test account auth failed, account:(%s), verify: %j, err:%j", account, msg.token, err);
            next("test verify failed", { code: code.err.FAILED });
            return;
        }
        accountUid = account;
    }
    // 蜂鸟sdk登陆
    else if (loginType === code.auth.LOGIN_TYPE.FN_SDK) {
        const ret = await this._app.rpcs.auth.authRemote.verifyFNSDK(session, msg.name, msg.token, msg.ext);
        if (ret.err || !ret.res) {
            logger.info("login fn sdk account auth failed, account:(%s), verify:(%s)", account, msg.name, msg.token, msg.ext);
            next("fn sdk verify failed", { code: code.err.FAILED });
            return;
        }
        accountUid = ret.res.account_name;
    }
    else {
        logger.error("login type no define, account:(%s), verify:(%s)", account, msg.name, msg.token, msg.ext);
        next("login type error", { code: code.err.FAILED });
        return;
    }
    const key = [code.redis.MY_LOGIN_SERVERS.name ,accountUid, platform];
    const { err, res } = await this._app.RedisMyLogin.hgetall(key, accountUid);
    if (err || !res) {
        next('query server list error', { code: code.err.FAILED });
        return;
    }
    const servers = [];
    for (const serverId of Object.keys(res)) {
        servers.push(Number(serverId));
    }
    const list = servers.sort((a, b) => { return a - b; });
    next(null, { code: code.err.SUCCEEDED, serverList: list });
};

Handler.prototype.queryEntry = async function(msg, session, next) {
    const account = String(msg.account);
    const loginType = msg.loginType;
    const platform = msg.platform;
    const serverId = msg.serverId;
    const agentId = msg.agentId;
    const deviceId = msg.deviceId;
    const clientVersion = msg.clientVersion;
    const clientInfo = msg.clientInfo;
    const bgpUrl = msg.bgp;
    if (!this._app.get('allServersStartOver')) {
        next('server not open', { code: code.err.ERR_GATE_MAINTAIN});
        return;
    }
    // 前端配置处理后打开
    if (!account || !loginType || !platform || !serverId || !agentId || !deviceId || !clientVersion || !clientInfo) {
        logger.info(`gateHandler queryEntry client params error!`);
        next('param error', { code: code.err.ERR_GATE_PARAM });
        return;
    }
    if (!this._app.SystemConfig.isValidServerId(serverId)) {
        logger.warn(`gateHandler queryEntry serverId:${serverId} not valid`);
        next('server error', { code: code.err.ERR_GATE_PARAM });
        return;
    }
    if (!this._app.SystemConfig.isValidAgentId(agentId)) {
        logger.warn(`gateHandler queryEntry agentId:${agentId} not valid`);
        next('agent id error', { code: code.err.ERR_GATE_PARAM });
        return;
    }

    let accountName, sdkResult;
    // TEST内部登陆
    if (loginType === code.auth.LOGIN_TYPE.TEST) {
        const res = await this._app.rpcs.auth.authRemote.verifyTest(session, account, msg.token);
        if (res.err) {
            logger.error("login test account auth failed, account:(%s), verify: %j, res.err %j", account, msg.token, res.err);
            next("test verify failed", { code: code.err.ERR_GATE_PARAM });
            return;
        }
        accountName = account;
        sdkResult = '';
    }
    // 蜂鸟sdk登陆
    else if (loginType === code.auth.LOGIN_TYPE.FN_SDK){
        if (this._app.get('env') == 'production') {
            const version = this._app.Config.ClientVersion.getVersion();
            const verList = version.split('.');
            const clientVerList = clientVersion.split('.');
            for (let index = 0, len = verList.length; index < len; ++index) { 
                const clientVer = Number(clientVerList[index]);
                const ver = Number(verList[index]);
                if (isNaN(clientVer)) {
                    logger.warn(`queryEntry need version:${version}, clientVersion:${clientVersion}`);
                    next(null, { code: code.err.ERR_GATE_VERSION });
                    return;
                }
                if (clientVer < ver) {
                    logger.warn(`queryEntry need version:${version}, clientVersion:${clientVersion}`);
                    next(null, { code: code.err.ERR_GATE_VERSION });
                    return;
                } else if (clientVer > ver) {
                    break;
                }
            }
        }
        const ret = await this._app.rpcs.auth.authRemote.verifyFNSDK(session, msg.name, msg.token, msg.ext);
        if (ret.err || !ret.res) {
            logger.error("login fn sdk account auth failed, account:(%s), verify:(%s), ret.err:(%j)", account, msg.name, msg.token, msg.ext, ret.err);
            next('fn verify failed', { code: code.err.ERR_GATE_FN_SDK_VERIFY });
            return;
        }
        accountName = ret.res.account_name;
        sdkResult = ret.res.sdk_result;
    } else{
        logger.error("login type no define, account:(%s), verify:(%s)", account, msg.name, msg.token, msg.ext);
        next("login type error", { code: code.err.ERR_GATE_PARAM });
        return;
    }
    const ip = session.__session__.__socket__.remoteAddress.ip.split(':')[3];
    let uid, accountData = {};
    // 获取uid
    logger.info(`gate handler create account ${accountName}, server:${serverId}, platform:${platform}, agentId:${agentId}`);
    const dataObj = await MongoAccount.query({ account: accountName, serverId: Number(serverId), platform: String(platform), agentId: Number(agentId) });
    if (dataObj.length == 0) {
        const uidRet = await this._app.Redis.hincrby(code.redis.MAX_PLAYER_UID.name, serverId, 1);
        if (uidRet.err) {
            // 分配失败减1
            logger.error("account(%s) create uid failed, err = %j", account, uidRet.err);
            this._app.Redis.hincrby(code.redis.MAX_PLAYER_UID.name, serverId, -1);
            next("error", { code: code.err.ERR_GATE_PARAM });
            return;
        }
        uid = uidRet.res;

        // 记录数据
        accountData = {
            account: accountName,
            serverId: serverId,
            platform: platform,
            agentId: agentId,
            uid: uid,
            regTime: util.time.nowSecond(),
            regIp: ip,
            loginType: loginType
        };
    } else {
        uid = dataObj[0]._data.uid;
    }
    // 更新数据
    accountData.deviceId = deviceId;
    accountData.clientVersion = clientVersion;
    accountData.loginType = loginType;
    accountData.userIp = ip;
    accountData.sdkResult = sdkResult;
    let ci;
    ci = await new Promise((resolve) => {
        resolve(JSON.parse(clientInfo));
    }).catch(_e => {
        logger.info(`uid${uid} client info format error`);
    });
    if (!ci) {
        ci = {};
    }
    // 前段信息
    accountData.clientInfo = { 
        device: ci.device || "pc",      // 设备端：android、 ios 、web、 pc
        os: ci.os || "",                  // 手机操作系统，如：android、iOS
        os_version: ci.os_version || "0.0.0.0",      // 操作系统版本号，如：2.3.4
        device_name: ci.device_name || "",   // 设备名称，如：三星GT-S5830
        screen: ci.screen || "",      // 屏幕分辨率，如：480*800
        mno: ci.mno || "",               // 移动网络运营商 (mobile network operators)，如：中国移动、中国联通
        nm: ci.nm || "",                  // 联网方式(Networking mode)，如：3G、WIFI
        did: ci.did || "",               // 用户设备ID
        user_name: ci.user_name || account, // 平台帐号名（平台账号ID 是account)
        fngid: ci.fngid || "",         // 游戏game id
    },
    logger.info("gate handler account(%s) uid(%j)", account, uid);
    if (dataObj.length == 0){
        const mAccount = (new MongoAccount);
        await mAccount.updateImmediately(accountData);
    } else {
        await dataObj[0].updateImmediately(accountData);
    }

    const token = md5(uid.toString(), code.system.ACCOUNT_VERIFY_CODE2);
    const key = [code.redis.ACCOUNT_DISPATCHED_CONNECTOR.name, uid];
    // redis 锁
    await this._app.Redis.watch(key);
    // 获取链接ID
    const res = await this._getConnectorId(uid, this._app, token, key).catch(e => {
        logger.error('account(%s) entry failed, get connectorId catch err = %s', accountName, e);
    });
    await this._app.Redis.unwatch(key);
    if (!res || res.ret != code.err.SUCCEEDED){
        const error = res.ret ? res.ret : code.err.ERR_GATE_PARAM;
        next("error", { code: error});
        return;
    }
    const connectorId = res.connector;
    const connectorInfo = this._app.getServerById(connectorId);
    if (!connectorInfo){
        logger.info('account(%s) entry failed, connectorId = %s, connectorInfo = %s', account, connectorId, JSON.stringify(connectorInfo));
        next("error", { code: code.err.ERR_GATE_CONNECTOR_SERVER });
        return;
    }
    // 获取connector 的 host 和 port
    const ret = this._getConnectorGbpUrl(bgpUrl, connectorInfo);
    const reply = { 
        code: code.err.SUCCEEDED,
        host: ret.host,
        port: Number(ret.port),
        account: accountName,
        token: token
    };
    next(null, reply);
};

/**
 * 获取链接ID
 * @param {String} uid
 * @param {Object} app
 * @param {String} account 账号
 * @return {String} 链接Id
*/
Handler.prototype._getConnectorId = async function(uid, app, token, key){
    const connectorKeyRet = await app.Redis.hget(key, 'connector');
    if (connectorKeyRet.err) {
        logger.error('uid(%s) entry failed, get connector redis failed', uid);
        return { ret: code.err.ERR_GATE_CONNECTOR_SERVER };
    }
    let connectorId = connectorKeyRet.res;
    // 已有链接
    if (connectorId && app.getServerById(connectorId)) {
        logger.info('uid(%s) entry success, connectorId exist', uid);
        // 用于限时登陆
        const setRet = await this.__setAuthCodeExpired(app, uid, token, key);
        if (!setRet) {
            return { ret: code.err.ERR_GATE_PARAM };
        }
        return { ret: code.err.SUCCEEDED, connector: connectorId };
    }

    // 玩家已有connector 链接， 这是来自 game的 connector环，防止一个玩家处在多个connector中
    if (!connectorId) {
        const retConnector = await app.Redis.hget(code.redis.ROLE_ON_CONNECTOR.name, uid);
        if (!retConnector.err && retConnector.res) {
            logger.warn("login : player(%d) already login, in  %j connector ", uid, retConnector.res);
            connectorId = retConnector.res;
        }
    }
    // 获取可用的链接
    if (!connectorId) {
        connectorId = await app.ConnectorDistributor.getUsableConnector();
    }
    if (!connectorId) {
        logger.error('uid(%s) entry failed, no connector', uid);
        return { ret: code.err.ERR_GATE_CONNECTOR_SERVER };
    }

    const list = [['hset', key, 'connector', connectorId], ['hset', key, 'count', 0]];
    const multiRet = await app.Redis.multi(list);
    if (multiRet.err) {
        logger.error('uid(%s) entry failed, regain connector redis failed', uid);
        return { ret: code.err.ERR_GATE_PARAM };
    }

    if (!multiRet.res) {
        const connectorKeyRet2 = await app.Redis.hget(key, "connector");
        if (connectorKeyRet2.err) {
            logger.error('uid(%s) entry failed, regain connector redis failed', uid);
            return { ret: code.err.ERR_GATE_CONNECTOR_SERVER };
        }
        connectorId = connectorKeyRet2.res;
    }

    // 用于限时登陆
    const setRet = await this.__setAuthCodeExpired(app, uid, token, key);
    if (!setRet) {
        return { ret: code.err.ERR_GATE_PARAM };
    }

    return { ret: code.err.SUCCEEDED, connector: connectorId }; 
};

/**
 * 设置验证过期时间
 * @param {Object} app 
 * @param {Integer} uid
 * @param {String} token
 * @param {String} key
 * @return {Boolean}
 */
Handler.prototype.__setAuthCodeExpired = async function (app, uid, token, key) {    
    // set connector success， set expire time, regain connector set expire again
    app.Redis.expire(key, code.redis.ACCOUNT_DISPATCHED_CONNECTOR.timeoutSec);

    const tokenKey = [code.redis.AUTHORITY_CODE_OF_ACCOUNT.name, token];
    const setRes = await app.Redis.set(tokenKey, uid, 'EX', code.redis.AUTHORITY_CODE_OF_ACCOUNT.timeoutSec, 'NX');
    if (setRes.err) {
        logger.error('uid(%s) entry failed, add token(%s) to redis failed, err = %s', uid, token, JSON.stringify(setRes.err));
        return false;
    }
    return true;
};

// 获取connector的gbp host 和 port
Handler.prototype._getConnectorGbpUrl = function (bgpUrl, connectorInfo) {
    logger.info(`gateHandler queryEntry getConnectorGbpUrl `, bgpUrl);
    const con = {
        host: connectorInfo.clientHost,
        port: connectorInfo.clientPort,
    };
    const gateInfo = this._app.getServerById(this._app.serverId);
    if (!gateInfo.bgp || !connectorInfo.bgp) {
        logger.info(`gateHandler queryEntry getConnectorGbpUrl `, connectorInfo);
        return con;
    }
    const gateBgpList = gateInfo.bgp.split(',');
    let index = 0;
    for (let len = gateBgpList.length; index < len; ++index) {
        if (gateBgpList[index] == bgpUrl) {
            break;
        }
    }
    // 没有bgp数据则默认走原来的connector
    if (index == gateBgpList.length) {
        return con;
    }
    const bgpInfo = connectorInfo.bgp;

    const list = bgpInfo.split(',');
    if (list.length <= index) {
        return con;
    }
    const res = list[index].split(':');
    if (res.length == 0) {
        return con;
    }
    return { host: res[0], port: res[1] };
};

