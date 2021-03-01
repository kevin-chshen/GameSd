/**
 * Created by chshen on 2020/03/17.
 */
const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const code = require('@code');
const util = require('@util');
const MongoPlayer = require('@mongo/mongoPlayer');

module.exports = function(app) {
    return new Handler(app);
};

const Handler = function(app){
    this._app = app;
};


/**
 * 创建角色
 *
 * @param {Object} msg
 * @param {Object} session
 * @param {Function} next next step callback
*/
Handler.prototype.createRole = async function (msg, session, next) {
    const name = String(msg.name);
    const sex = msg.sex;
    const skin = msg.skin;
    const character = msg.character;
    const uid = Number(session.get(code.system.SESSION_ACCOUNT_MEMBER));
    if (name == null || sex == null){
        logger.warn("uid(%s) createRole failed, use illegal name(%s), sex %j", uid, name, sex);
        return;
    }
    // 敏感字符
    if (this._app.Config.WordFilter.query(name)) {
        next(null, { code: code.err.ERR_CREATE_ROLE_NAME });
        return;
    }
    // 检测名字 字符
    // if (code.player.NAME_REG.test(name.replace(/[\u4e00-\u9fa5]/g, "aa"))) {
    //     logger.warn("uid(%s) createRole failed, use illegal name(%s)", uid, name);
    //     next(null, { code: code.err.ERR_CREATE_ROLE_NAME });
    //     return;
    // }
    // 名字长度
    if (name.length == 0 || name.length > 32){
        logger.warn("uid(%s) createRole failed, use illegal name(%s)", uid, name);
        next(null, { code: code.err.ERR_CREATE_ROLE_NAME });
    } 
    if (name.indexOf(' ') >= 0) {
        next(null, { code: code.err.ERR_CREATE_ROLE_NAME_NOT_SPACE });
        return;
    }
    // 敏感字符

    // 数据库查重
    const queryName = await MongoPlayer.query({ name: name });
    if (queryName.length>0){
        logger.warn("uid(%s) createRole failed, use repeat name(%s)", uid, name);
        next(null, { code: code.err.ERR_CREATE_ROLE_NAME_EXIST });
        return;
    }

    // 检测性别
    if (sex != code.player.SexType.MALE && sex != code.player.SexType.FEMALE) {
        logger.warn("uid(%s) createRole failed, use illegal sex(%s)", uid, sex);
        next(null, { code: code.err.ERR_CREATE_ROLE_SEX });
        return;
    }    

    // 检查皮肤
    const skinConfig = this._app.Config.CreateRole.get(skin);
    if(!skinConfig || skinConfig.Sex != sex){
        next(null, { code: code.err.ERR_CREATE_ROLE_SKIN });
        return;
    }

    // 检查性格
    const characterConfig = this._app.Config.Character.get(character);
    if(!characterConfig){
        next(null, { code: code.err.ERR_CREATE_ROLE_CHARACTER });
        return;
    }

    // 检测角色是否存在        
    const ret = await MongoPlayer.query({ uid: uid});
    if (ret.length > 0) {
        logger.error("uid(%s) createRole failed, role exist ret = %j", uid, ret);
        next(null, { code: code.err.ERR_CREATE_ROLE_EXIST });
        return;
    }

    // 简单处理初始化角色信息,拓展多角色再做细化
    const headImageId = skin;
    const caption = this._app.Config.TextCaptions.get(util.random.random(10001,10013)) || {};
    // 数据库插入数据(立即入库), 默认从1级开始
    const playerInitData = { 
        uid: uid, 
        name: name, 
        sex: sex, 
        lv: 1, 
        power : 0,
        headImageId: headImageId,
        createTime: util.time.nowSecond(),
        manifesto: caption.Text || "",
        character:character,
    };
    const playerDataObj = new MongoPlayer();
    // 等待更新成功
    await new Promise((resolve, reject) =>{
        playerDataObj.update(playerInitData, true, null, (err, res) => {
            if (err) {
                reject(err);
            }
            resolve(res);
        });
    }).catch(e =>{
        logger.error(`loginHandler uid:${uid} update player data error, err:${e}`, e);
    });

    await this._app.Redis.hset(code.redis.ROLE_ON_CONNECTOR.name, uid, session.frontendId);

    // 初始化
    let bindOk = true;
    await new Promise((resolve, reject) => {
        session.bind(uid, err => {
            if (err) {
                logger.error("uid(%s) create role failed, session bind uid failed", uid);
                reject();
            }
            resolve();
        });
    }).catch(_e => {
        logger.error(`playerHandler uid:${uid} create role failed`);
        next('create error', { code: code.err.ERR_CREATE_ROLE_INIT });

        bindOk = false;
    });

    if (bindOk) {
        // 插入的数据缺少完全初始化
        const data = await MongoPlayer.query({ uid: uid });
        // 创角成功进行初始化
        if (data.length != 0) {
            this._app.Player.addPlayer(uid, session, data[0]).then(player => {
                logger.info("uid(%s) create role success", uid);

                // 增加默认物品
                const defaultItem = util.proto.encodeConfigAward(this._app.Config.Global.get(code.player.GLOBAL_ID_CREATE_ROLE_DEFAULT_ITEM).GlobalJson);
                player.Item.addItem(defaultItem, code.reason.OP_CREATE_ROLE, null, false);

                // 通知创建成（默认进入游戏）
                next(null, { code: code.err.SUCCEEDED, uid: String(uid), name: name });

                // 创角日志
                this._app.Log.roleLog(player);
                // 用户信息日志
                this._app.Log.playerLog(player);
            });
        }
        else {
            logger.error(`loginHandler uid:${uid} query player data error`);
            next(null, { code: code.err.FAILED});
        }
    }
};


/**
 * 获取服务器时间
 */
Handler.prototype.getServerTimeSecond = async function (msg, session, next){
    next(null,{
        time: util.time.nowSecond()
    });
};