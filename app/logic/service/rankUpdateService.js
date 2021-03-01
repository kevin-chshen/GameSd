/**
 * @description 排行榜更新服务
 * @author jzy
 * @date 2020/05/13
 */

const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const bearcat = require('bearcat');
const code = require('@code');
const mongoPlayer = require('@mongo/mongoPlayer');

const RankService = function () {
    this.$id = 'logic_RankUpdateService';
    this.app = null;
};

module.exports = RankService;
bearcat.extend('logic_RankUpdateService', 'logic_BaseService');

/**
 * 更新联盟排行榜 redis 表
 */
RankService.prototype.guildIDChangedRankUpdate = async function(uid, currentGuildId, beforeGuildId, playerData){
    if(currentGuildId == beforeGuildId){
        return;
    }
    for(const {redisKey,isLeague,playerKey,computeFunc,briefKey,computeBriefFunc} of Object.values(code.rank.RANK_KEYS)){
        if(!isLeague){
            continue;
        }
        let currentValue;
        let caseType;  // 1 走缩略   2 走数据库   3 内存       优先级 3>1>2
        if(playerData){
            caseType = 3;
        }else if (briefKey){
            caseType = 1;
        }else{
            caseType = 2;
        }
        switch(caseType){
        case 1:{
            // 有快速通道走快速通道获取
            const brief = await this.app.Brief.getBrief(uid);
            if(computeBriefFunc){
                currentValue = computeBriefFunc(brief[briefKey]);
            }else{
                currentValue = brief[briefKey];
            }
            break;
        }
        case 2:{
            // 从数据库取得
            playerData = await mongoPlayer.query({uid:uid})[0];
            currentValue = await this._getValueByPlayerData(playerKey,playerData,computeFunc);
            break;
        }
        case 3:{
            // 直接从内存取
            currentValue = await this._getValueByPlayerData(playerKey,playerData,computeFunc);
        }
        }

        if(currentValue==undefined || currentValue == null){
            logger.error(`game league rank currentValue [${currentValue}], caseType [${caseType}], redisKey [${redisKey}]`);
        }
        
        if(beforeGuildId!=0 && beforeGuildId && currentValue>0){
            const {res} = await this.app.Redis.zincrby([code.redis.RANK.name, redisKey, code.rank.LEAGUE_SUFFIX], -currentValue, beforeGuildId);
            if(Number(res)<=0){
                await this.app.Redis.zrem([code.redis.RANK.name, redisKey, code.rank.LEAGUE_SUFFIX], beforeGuildId);
            }
        }
        if(currentGuildId!=0 && currentGuildId && currentValue>0){
            await this.app.Redis.zincrby([code.redis.RANK.name, redisKey, code.rank.LEAGUE_SUFFIX], currentValue, currentGuildId);
        }
    }
};


RankService.prototype._getValueByPlayerData = async function(playerKey,playerData,computeFunc){
    // 直接算
    let value = null;
    if (playerKey) {
        value = playerData.get(playerKey);
    } else if (computeFunc) {
        value = computeFunc(playerData);
    }
    return value;
};