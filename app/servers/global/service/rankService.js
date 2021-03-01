/**
 * @description 排行榜服务
 * @author jzy
 * @date 2020/05/12
 */

const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const bearcat = require('bearcat');
const code = require('@code');
const mongoPlayer = require('@mongo/mongoPlayer');

const RankService = function () {
    this.$id = 'global_RankService';
    this.app = null;

    // 查询结果缓存
    this.queryCache = {};
};

module.exports = RankService;
bearcat.extend('global_RankService', 'logic_BaseService');

/**
 * 获取自身排名
 * @param {Number} uid 自己的uid
 * @param {Enum} key code.rank.RANK_KEYS.xxx    例如 code.rank.RANK_KEYS.EARN 赚钱榜
 */
RankService.prototype.getSelfRank = async function(uid, key){
    const isLeague = false;
    const cacheRes = await this._getCacheRes(key, isLeague);
    const selfRank = cacheRes.id2info[uid];
    return selfRank;
};

/**
 * 获取自身排名
 * @param {Number} guildId 自己公会ID
 * @param {Enum} key code.rank.RANK_KEYS.xxx    例如 code.rank.RANK_KEYS.EARN 赚钱榜
 */
RankService.prototype.getSelfLeagueRank = async function(guildId, key){
    const isLeague = true;
    const cacheRes = await this._getCacheRes(key, isLeague);
    const guildRank = cacheRes.id2info[guildId];
    return guildRank;
};

/**
 * 获取实时排名列表，[rank]:id     id为uid或公会id
 */
RankService.prototype.getRanksRealTime = async function(key, isLeague){
    this._cleanCache();
    const cacheRes = await this._getCacheRes(key, isLeague);
    const rankObj = {};
    for(let index = 0; index < cacheRes.maxNum; index++){
        const id = cacheRes.rank2id[index + 1];
        const rank = cacheRes.id2info[id].rank;
        rankObj[rank] = id;
    }
    return rankObj;
};

/**
 * 获取排行榜信息
 */
RankService.prototype.getRankList = async function(uid, key, isLeague, page) {
    const cacheRes = await this._getCacheRes(key, isLeague);

    const beginIndex = page * code.rank.PAGE_OFFSET;
    const endIndex = Math.min((page + 1) * code.rank.PAGE_OFFSET, cacheRes.maxNum);
    const infoList = [];
    for(let index = beginIndex; index<endIndex; index++){
        const id = cacheRes.rank2id[index + 1];
        const rank = cacheRes.id2info[id].rank;
        const score = cacheRes.id2info[id].score;
        let data;
        if(isLeague){
            data = await this.getGuildRankInfo(id,rank,score);
        }else{
            data = await this.getRankInfo(id,rank,score);
        }
        if(data){
            infoList.push(data);
        }
    }
    let selfInfo;
    if(isLeague){
        const guildId = await this.app.Guild.getGuildId(uid);
        const guildRank = cacheRes.id2info[guildId];
        if(guildRank){
            selfInfo = await this.getGuildRankInfo(guildId, guildRank.rank, guildRank.score);
        }
    }else{
        const rank = cacheRes.id2info[uid];
        if(rank){
            selfInfo = await this.getRankInfo(uid,rank.rank,rank.score);
        }
    }
    return {code:code.err.SUCCEEDED, rankInfo:infoList, selfInfo:selfInfo};
};

/**
 * 获取缓存数据
 */
RankService.prototype._getCacheRes = async function(key, isLeague){
    const comboRedisKey = [code.redis.RANK.name, key.redisKey, (isLeague?code.rank.LEAGUE_SUFFIX:code.rank.PERSON_SUFFIX)];
    const cacheKey = comboRedisKey.join('_');
    let cacheRes;
    if(this.queryCache[cacheKey]){
        cacheRes = this.queryCache[cacheKey];
    }else{
        const {err, res} = await this.app.Redis.zrevrange(
            comboRedisKey,
            0,
            code.rank.RANK_MAX_NUM,
            true
        );
        if (err) {
            logger.error(`rankService get rank type [${key.redisKey}] async error:[${JSON.stringify(err)}]`);
            return {code:code.err.FAILED};
        }
        const resList = res || [];
        cacheRes = {};
        cacheRes.id2info = {};
        cacheRes.rank2id = {};
        cacheRes.maxNum = parseInt(resList.length/2);
        for(let index = 0; index*2<resList.length; index++){
            const id = Number(resList[index*2]);
            const rank = index + 1;
            const score = resList[index*2 + 1];
            cacheRes.rank2id[rank] = id;
            cacheRes.id2info[id]={
                rank:rank,
                score:score,
            };
        }
        this.queryCache[cacheKey] = cacheRes;
    }
    return cacheRes;
};

RankService.prototype.getRankInfo = async function(uid, rank, score){
    const brief = await this.app.Brief.getBrief(uid);
    const obj = {
        rank:rank,
        uid:uid.toString(),
        score:score.toString(),
        level:brief?brief.lv:0,
        name:brief?brief.name:"",
        vip:brief?brief.vip:0,
        roleId:brief?brief.headImageId:0,
    };
    obj.guildName = await this.app.Guild.getGuildName(uid);
    return obj;
};

RankService.prototype.getGuildRankInfo = async function(guildId, rank, score){
    const guildInfo = await this.app.Guild.getGuildByGuildId(guildId);
    if(guildInfo){
        const brief = await this.app.Brief.getBrief(guildInfo.championsUid);
        const obj = {
            rank:rank,
            score:score.toString(),
            level:guildInfo.lv,
            name:guildInfo.name,
            badge:guildInfo.badge,
            champions:guildInfo.champions,
            roleId:brief?brief.headImageId:0,
        };
        return obj;
    }
    return undefined;
};


/*****************************************************************/

/**
 * 初始化
 */
RankService.prototype.init = async function () {
    const updateList = [];
    const {err, res} = await this.app.Redis.hgetall(code.redis.RANK_VERSION.name);
    if (err) {
        logger.warn(`rankService get RankVersion async error:[${JSON.stringify(err)}]`);
        return;
    }
    const rankVersion = res || {};
    for(const key of Object.keys(code.rank.RANK_KEYS)){
        //检查排行榜数据版本号，对不上记到待更新versionMap内
        const info = code.rank.RANK_KEYS[key];
        if(rankVersion[info.redisKey] != info.dataVersion){
            logger.warn(`\n\t排行榜[${info.redisKey}]数据版本号不匹配,当前版本为[${info.dataVersion}],记录的版本为[${rankVersion[info.redisKey]}]`);
            updateList.push(info);
        }
    }

    // 初始化数据
    if(updateList.length>0){
        let playerDataList = await mongoPlayer.query();
        for(const {dataVersion,redisKey,personOpenKey,playerKey,computeFunc,isLeague} of updateList){
            if(isLeague){
                // 重置删除该联盟排行表
                await this.app.Redis.del([code.redis.RANK.name, redisKey, code.rank.LEAGUE_SUFFIX]);
            }
            await this.app.Redis.del([code.redis.RANK.name, redisKey, code.rank.PERSON_SUFFIX]);

            for(const playerData of playerDataList){
                let value = null;
                if (playerKey) {
                    value = playerData.get(playerKey);
                } else if (computeFunc) {
                    value = computeFunc(playerData);
                } else {
                    value = null;
                }
                if(isLeague && value > 0){
                    const guildID = await this.app.Guild.getGuildId(playerData.get(code.player.Keys.UID));
                    if(guildID!=0){
                        await this.app.Redis.zincrby([code.redis.RANK.name, redisKey, code.rank.LEAGUE_SUFFIX], value, guildID);
                    }
                }
                if(value >= code.rank.MIN_SCORE_VALUE && (personOpenKey==undefined || (personOpenKey&&playerData.get(code.player.Keys.SYSTEM_OPENS)[personOpenKey]))){
                    await this.app.Redis.zadd([code.redis.RANK.name, redisKey, code.rank.PERSON_SUFFIX], value, playerData.get(code.player.Keys.UID));
                }
            }
            await this.app.Redis.hset(code.redis.RANK_VERSION.name, redisKey, dataVersion);
        }
        playerDataList = null;
    }
    

    this.initQueryCacheTimer();
};

/**
 * 缓存清除定时器
 */
RankService.prototype.initQueryCacheTimer = function(){
    this.queryCache = {};
    this.onlineTimer = setInterval(()=>{ this._cleanCache(); }, code.rank.CACHE_CLEAN_TIME);
};

RankService.prototype._cleanCache = function(){
    this.queryCache = {};
};

RankService.prototype.shutdown = function () {
    // 清除定时器
    clearInterval(this.onlineTimer);
};

