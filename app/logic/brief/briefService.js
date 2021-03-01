/**
 * @description 玩家缩略信息服务
 * @author linjs
 * @date 2020/03/27
 */

const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const bearcat = require('bearcat');
const code = require('@code');
const MongoPlayer = require('@mongo/mongoPlayer');

const BriefService = function () {
    this.$id = 'logic_BriefService';
    this.app = null;
};

module.exports = BriefService;
bearcat.extend('logic_BriefService', 'logic_BaseService');

/**
 * 异步获取玩家缩略信息
 * @param {Integer} uid 玩家的uid
 * @return {Json|null} 玩家缩略信息
 */
BriefService.prototype.getBrief = async function (uid) {
    const {err, res} = await this.app.Redis.hgetall([code.redis.ROLE_BRIEF.name, uid]);
    if (err) {
        logger.warn(`uid [${uid}] get brief async error:[${JSON.stringify(err)}]`);
        return null;
    }
    if (res && res.version == code.brief.CURRENT_VERSION) {
        // 能够拿到数据,并且数据的版本号是对的,则返回
        return bearcat.getBean('logic_PlayerBrief', res);
    } else {
        // 否则从数据库加载
        return await this._loadBrief(uid);
    }
};

/**
 * 更新属性,直接修改到redis的ROLE_BRIEF对应的属性上去,
 */
BriefService.prototype.update = function (uid, key, value) {
    const strValue = code.brief.isJsonProp(key) ? JSON.stringify(value) : value;
    this.app.Redis.hset([code.redis.ROLE_BRIEF.name, uid], key, strValue);
};

/**
 * 获取一组玩家的缩略信息,没有的返回null
 * @param {Array} uids 玩家的uid列表
 * @return {Array} 玩家缩略信息列表,不存在的为null
 */
BriefService.prototype.getBriefGroup = async function (uids) {
    return await Promise.all( uids.map( async (uid) => { return await this.getBrief(uid); } ));
};

/**
 * 加载某个角色的brief
 */
BriefService.prototype._loadBrief = async function (uid) {
    const data = await MongoPlayer.query({uid : Number(uid)});
    if (data.length != 0) {
        const playerData = data[0];
        const brief = code.brief.initBriefFromPlayerData(playerData);
        await this.app.Redis.hmset([code.redis.ROLE_BRIEF.name, uid], brief);
        return bearcat.getBean('logic_PlayerBrief', brief);
    } else {
        return null;
    }
};