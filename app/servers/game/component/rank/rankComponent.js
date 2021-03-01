/**
 * @description 排行榜
 * @author jzy
 * @date 2020/05/11
 */

const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const bearcat = require('bearcat');
const code = require('@code');
const utils = require('@util');
const assert = require('assert');

const RankComponent = function (app, player) {
    this.$id = 'game_RankComponent';
    this.$scope = 'prototype';
    this.app = app;
    this.player = player;
};

module.exports = RankComponent;
bearcat.extend('game_RankComponent', 'game_Component');

/**
 * 初始化
 */
RankComponent.prototype.onInit = async function () {
    this.player.Event.on(code.event.TOTAL_POWER_UPDATE.name, (...params) => { this.onTotalPowerChange(...params); });
    this.player.Event.on(code.event.CASH_PER_SECOND_AFTER.name, (...params) => { this.onCashPerSecondAfter(...params); });
    this.player.Event.on(code.event.CAR_TOP_THREE_UPDATE.name, (...params) => { this.onCarTopThreeUpdate(...params); });

    // 公会id变化
    this.player.Event.on(code.event.GUILD_ID_UPDATE.name, (...params) => { this.onGuildIdUpdate(...params); });
    // 功能开启
    for(const key of Object.values(code.rank.RANK_KEYS)){
        this.player.Event.on([code.event.SYSTEM_OPEN.name, key.personOpenKey], (...params) => { this.onSystemOpen(key, ...params); });
    }
    
};

RankComponent.prototype.onCashPerSecondAfter = function(oldValue, newValue){
    this.update(code.rank.RANK_KEYS.EARN, oldValue, newValue);
};
RankComponent.prototype.onTotalPowerChange = function(oldValue, newValue){
    this.update(code.rank.RANK_KEYS.POWER, oldValue, newValue);
};
RankComponent.prototype.onCarTopThreeUpdate = function(){
    this.update(code.rank.RANK_KEYS.CAR);
};

/***********************************internal function************************************/

/**
 * 更新调用
 * @param Key code.rank.RANK_KEYS的类型
 * @param score 对应的值，选填，不填默认使用code.rank.RANK_KEYS定义的值获取方式
 */
RankComponent.prototype.update = async function(Key, beforeScore, score){
    let value = null;
    const playerData = this.player.getDataObj();
    if(score){
        value = score;
    } else if (Key.playerKey) {
        value = playerData.get(Key.playerKey);
    } else if (Key.computeFunc) {
        value = Key.computeFunc(playerData);
    } else {
        value = null;
    }
    // 根据分数差值更新联盟排行榜
    if(Key.isLeague && value > 0){
        if(beforeScore==undefined){
            assert.fail("包含联盟排行榜，需要变化前的分数");
        }
        const beforeValue = beforeScore;
        const guildID = this.player.guildId;
        if(guildID!=0 && guildID){
            if(beforeValue==undefined || beforeValue == null || value==undefined || value == null){
                logger.error(`game league rank beforeValue [${beforeValue}], value [${value}], redisKey [${Key.redisKey}]`);
            }
            await this.app.Redis.zincrby([code.redis.RANK.name, Key.redisKey, code.rank.LEAGUE_SUFFIX], value - beforeValue, guildID);
        }
    }
    // 更新个人榜数据
    if(value >= code.rank.MIN_SCORE_VALUE && (Key.personOpenKey == undefined || (Key.personOpenKey&&playerData.get(code.player.Keys.SYSTEM_OPENS)[Key.personOpenKey]))){
        await this.app.Redis.zadd([code.redis.RANK.name, Key.redisKey, code.rank.PERSON_SUFFIX], value, this.player.uid);
    }
};

// /**
//  * 角色登录时调用
//  */
// RankComponent.prototype.onLogin = async function () {
//     for(const Key of Object.values(code.rank.RANK_KEYS)){
//         this.update(Key);
//     }
// };

/**
 * 联盟id变化时修改数据
 */
RankComponent.prototype.onGuildIdUpdate = async function(beforeGuildId,isOnTime) {
    if(!isOnTime){
        // 离线变换公会id的不在这里处理
        return;
    }
    const playerData = this.player.getDataObj();
    this.app.RankUpdate.guildIDChangedRankUpdate(this.player.uid, this.player.guildId, beforeGuildId, playerData);
};

/**
 * 系统开启
 */
RankComponent.prototype.onSystemOpen = function(key){
    let value = null;
    const playerData = this.player.getDataObj();
    if (key.playerKey) {
        value = playerData.get(key.playerKey);
    } else if (key.computeFunc) {
        value = key.computeFunc(playerData);
    } else {
        value = null;
    }
    if(value >= code.rank.MIN_SCORE_VALUE){
        this.app.Redis.zadd([code.redis.RANK.name, key.redisKey, code.rank.PERSON_SUFFIX], value, this.player.uid);
    }
};





/*******************************其他单人业务相关***********************************/

/**
 * 数据结构
 * {
 *      [type] 个人 or 联盟: [id,id,id] 榜单类型id
 * }
 */

RankComponent.prototype.getWorshipInfo = function(){
    const dataObj = this.getRank();
    return { personStatus:dataObj[code.rank.RANK_MAIN_TYPE.PERSON], leagueStatus:dataObj[code.rank.RANK_MAIN_TYPE.LEAGUE] };
};

RankComponent.prototype.worship = function(mainType, secondType){
    switch(mainType){
    case code.rank.RANK_MAIN_TYPE.PERSON:{
        if(Object.values(code.rank.RANK_SECOND_TYPE).indexOf(secondType)<0){
            return {code:code.err.ERR_RANK_WRONG_SECOND_TYPE};
        }
        break;
    }
    case code.rank.RANK_MAIN_TYPE.LEAGUE:{
        if(Object.values(code.rank.RANK_SECOND_TYPE_LEAGUE).indexOf(secondType)<0){
            return {code:code.err.ERR_RANK_WRONG_SECOND_TYPE};
        }
        break;
    }
    default:{
        return {code:code.err.ERR_RANK_WRONG_MAIN_TYPE};
    }
    }
    
    const dataObj = this.getRank();
    const hasList = dataObj[mainType] || [];
    if(hasList.indexOf(secondType)>=0){
        return {code:code.err.ERR_RANK_HAS_WORSHIP};
    }

    const award = utils.proto.encodeConfigAward(this.app.Config.Global.get(code.rank.GLOBAL_ID_WORSHIP).GlobalJson);
    this.player.Item.addItem(award, code.reason.OP_RANK_WORSHIP_GET);

    hasList.push(secondType);
    dataObj[mainType] = hasList;
    this.updateData(dataObj);
    return {code:code.err.SUCCEEDED, hasWorshipList:hasList, mainType:mainType, award:utils.proto.encodeAward(award)};
};

RankComponent.prototype.onDayChange = async function (_isOnTime){
    const dataObj = this.getRank();
    for(const mainType of Object.values(code.rank.RANK_MAIN_TYPE)){
        dataObj[mainType] = [];
    }
    this.updateData(dataObj);
};

/**
 * 获取玩家排行对象
 * @return {JSON}
 */
RankComponent.prototype.getRank = function()
{
    const playerRank = this.player.get(code.player.Keys.RANK) || {};
    return playerRank;
};

/**
 * 更新玩家排行数据库
 * @param {Object} playerRank 玩家排行对象
 */
RankComponent.prototype.updateData = function(playerRank){
    this.player.set(code.player.Keys.RANK, playerRank);
};