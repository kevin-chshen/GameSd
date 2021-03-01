/**
 * @description 战斗数据服务
 * @author jzy
 * @date 2020/05/07
 */

const bearcat = require('bearcat');
const code = require('@code');
const MongoBattle = require('@mongo/mongoBattle');
const ObjectID = require('mongodb').ObjectID;

const Service = function () {
    this.$id = 'battle_BattleDataService';
    this.app = null;
};

module.exports = Service;
bearcat.extend('battle_BattleDataService', 'logic_BaseService');
Service.prototype.cleanCacheTime = code.mongoBaseService.DEFAULT_CLEAN_CACHE_TIME_MS;  // 清理间隔
Service.prototype.dataLeaveTime = code.mongoBaseService.DEFAULT_DATA_LEAVE_TIME_MS;    // 数据的存活时长

/**
 * 统一查询的接口 key _id
 */
Service.prototype.query = async function(idList){
    const result = [];
    const queryList = [];
    for(const id of idList){
        if(this.mongoDataCache[id]){
            this.mongoDataCache[id].time = Date.now();
            result.push(this.mongoDataCache[id].data);
        }else{
            queryList.push({_id:ObjectID(id)});
        }
    }
    if(queryList.length>0){
        const mongoResult = await MongoBattle.query(queryList);
        if(mongoResult.length>0){
            for(const data of mongoResult){
                this.mongoDataCache[data.ID()] = {data: data, time: Date.now()};
                result.push(data);
            }
        }
    }
    return result;
};

/**
 * 创建一个新的战斗记录
 */
Service.prototype.create = function(){
    const data = new MongoBattle();
    const now = Date.now();
    // 只会在非查询服创建，因此不需要缓存
    // this.mongoDataCache[data.ID()] = {data: data, time: now};
    data.update({createTime: now});
    return data;
};

/**
 * 获取战斗记录信息
 */
Service.prototype.getBattleRecord = async function(id){
    if(!ObjectID.isValid(id)){
        return {code:code.err.ERR_CLIENT_PARAMS_WRONG};
    }
    const data = (await this.query([id]))[0];
    if(data == null){return {code:code.err.ERR_BATTLE_RECORD_EXPIRED};}
    const battle = data.dbValue();
    return {
        code:code.err.SUCCEEDED,
        battleRecord:{
            battleType:battle.battleType,
            playerName:battle.playerInfo.name,
            enemyName:battle.enemyInfo.name,
            playerCardInfo:battle.playerArray,
            enemyCardInfo:battle.enemyArray,
            roundRecord:battle.roundRecord,
            win:battle.winUid,
            award:battle.award,
        }
    };
};

/****************************internal function*****************************************/

Service.prototype.initBase = function() {
    this.mongoDataCache = {};
    this.onlineTimer = setInterval(()=>{ this._cleanCache(); }, this.cleanCacheTime);
};

Service.prototype._cleanCache = function(){
    if (!this.mongoDataCache || Object.keys(this.mongoDataCache).length <= 0){ return; }

    for(const uid of Object.keys(this.mongoDataCache)){
        const dateTime = this.mongoDataCache[uid].time;
        if(dateTime+this.dataLeaveTime<=Date.now()){
            delete this.mongoDataCache[uid];
        }
    }
};

Service.prototype.shutdownBase = function () {
    // 清除定时器
    clearInterval(this.onlineTimer);
};


/****************************clear battle data*****************************/
//TODO