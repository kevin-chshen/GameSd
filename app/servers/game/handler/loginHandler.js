/**
 * Created by chshen on 2020/03/16.
 * @note: 登录
 */

const MongoPlayer = require("@mongo/mongoPlayer");
const MongoAccount = require("@mongo/mongoAccount");
const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const code = require("@code");
const util = require('@util');

module.exports = function(app) {
    return new Handler(app);
};

const Handler = function(app) {
    this._app = app;
};

/**
 * 玩家登陆角色
 *
 * @param {Object} msg
 * @param {Object} session
 * @param {Function} next next step callback
 *
 */
Handler.prototype.login = async function (_msg, session, next) {
    const uid = Number(session.get(code.system.SESSION_ACCOUNT_MEMBER));
    if (!uid){
        logger.error("player login failed, session(%j) uid empty, must entry connector first", session.id);
        next('account error', { code: code.err.FAILED });
        return;
    }
    logger.info("player login uid:%d", uid);
    
    // mongoAccount 做缓存，避免重复读表
    const mongoData = await MongoAccount.query({ uid: Number(uid) });
    if (!mongoData || !mongoData[0]) {
        logger.error(`entry handler player load mongo account failed, player ${this.uid}`);
        next("account not found", { code: code.err.FAILED });
        return;
    }
    // 封号检测
    const forbidTs = mongoData[0].get('forbidTs') || 0;
    if (forbidTs > util.time.nowSecond()) {
        
        next(null, { code: code.err.ERR_GATE_ACCOUNT_FORBID, forbidEndTime: forbidTs});
        return;
    }

    let dataObj;
    const player = this._app.Player.getPlayerByUid(uid);
    // 玩家缓存信息
    if (player) {
        dataObj = player.getDataObj();
    }   
    // 从数据库中读取
    else {        
        const ret = await MongoPlayer.query({uid: uid});
        if (ret.length == 0){
            logger.info("login : uid(%s) no exist, need to create role", uid);
            // 提示创角
            next(null, { code: code.err.ERR_LOGIN_NO_ROLE});
            return;
        }
        dataObj = ret[0];
    }
    // 记录玩家所在的节点
    await this._app.Redis.watch(code.redis.ROLE_ON_CONNECTOR.name);
    const retCode = await this.checkRoleOnConnector(this._app, uid, session.frontendId);            
    await this._app.Redis.unwatch(code.redis.ROLE_ON_CONNECTOR.name);
    if (retCode != code.err.SUCCEEDED) {
        next(null, { code: retCode});
        return;
    }
    let bindOk = true;
    if (uid != session.uid) {
        await new Promise((resolve, reject) => {
            // session 绑定uid
            session.bind(uid, err => {
                if (err) {
                    logger.error(`player(${uid}) login failed, session bind failed, err:(%j)`, err);
                    reject(new Error("bind error"));
                }
                resolve();
            });
        }).catch(_e => {
            logger.info("player login failed, session(%s) bind uid(%j)", session.id, uid);
            next(`login error`, { code: code.err.FAILED });
            bindOk = false;
        });
    }
    if (bindOk) {
        this._app.Player.addPlayer(uid, session, dataObj).then((newPlayer) => {
            const openServerTs = this._app.SystemConfig.getServerOpenTs();
            const roleBase = this.loginSucceed(newPlayer);
            next(null, { 
                code: code.err.SUCCEEDED,
                rolebase: roleBase,
                serverTime: util.time.nowSecond(),
                serverOpenTime: openServerTs,
                banChatEndTime: newPlayer.ban.banChatTs || 0,  // 禁言结束时间
            });

            logger.debug("player login success, session(%s) bind uid(%j)", session.id, uid);

            // 登录日志
            this._app.Log.loginLog(newPlayer);
            // 用户信息日志
            this._app.Log.playerLog(newPlayer);
        });
    }
};

/**
 * 检测玩家是否已经登录链接服
 * @param {Object} app
 * @param {String} uid 玩家的唯一id
 * @param {string} frontendId pomelo前端id
*/
Handler.prototype.checkRoleOnConnector = async function (app, uid, frontendId) {    
    const ret = await app.Redis.hget(code.redis.ROLE_ON_CONNECTOR.name, uid);
    if (ret.res && ret.res != frontendId) {
        logger.warn("login : player(%d) already login, in other game, frontendId %j", uid, frontendId);
        return code.err.ERR_LOGIN_ALREADY_LOGIN;
    }
    const setRet = await app.Redis.hset(code.redis.ROLE_ON_CONNECTOR.name, uid, frontendId);
    if (setRet.err){
        logger.error("player(%d) login failed, redis exec err = %j", uid, ret.err);
        return code.err.FAILED;
    }
    return code.err.SUCCEEDED;
};

/**
 * 登录成功
 * @param {Object} player
 * @param {Object} session
 * @return {Object} roleBase
*/
Handler.prototype.loginSucceed = function (player) {
    const money = [];
    const none = code.currency.CURRENCY_ID.NONE;
    const currencyIds = code.currency.CURRENCY_ID;
    for (const key in currencyIds) {
        const coinId = currencyIds[key];
        let value = 0;
        if (coinId != none) {
            value = player.Currency.get(coinId);
        }
        money.push(value);
    }
    const roleBase = {
        uid: player.uid.toString(),
        name: player.name,
        sex: player.sex,
        level: player.lv,
        power: player.power.toString(),
        roleHeadIcon: player.headImageId,
        saveCashPreSecond: player.cashPerSecond.toString(),
        cashMoney: player.Currency.get(code.currency.BIG_CURRENCY_ID.CASH).toString(),
        moneyArr: money,
        vipLv: player.vip,
        vipExp: player.vipExp
    };
    logger.debug("login handler, player base info", roleBase);

    return roleBase;
};