/**
 * @description 战斗服远程调用模块
 * @author jzy
 * @date 2020/03/27
 */

const code = require('@code');
const logger = require('pomelo-logger').getLogger('pomelo', __filename);

module.exports = function(app) {
    return new Remote(app);
};

const Remote = function(app) {
    this.app = app;
};


Remote.prototype.startBattle = async function(
    type, 
    playerInfo, 
    array, 
    enemyInfo, 
    enemyArray, 
    successReward,
    cb
){
    this.__startBattle(type, 
        playerInfo, 
        array, 
        enemyInfo, 
        enemyArray, 
        successReward,
        [],
        [],
        [],
        cb);
};

Remote.prototype.startBattleWithClientParams = async function(
    type, 
    playerInfo, 
    array, 
    enemyInfo, 
    enemyArray, 
    successReward,
    clientParams,
    cb
){
    this.__startBattle(type, 
        playerInfo, 
        array, 
        enemyInfo, 
        enemyArray, 
        successReward,
        [],
        [],
        clientParams,
        cb);
};

Remote.prototype.startCustomizedBattle = async function(
    type, 
    playerInfo, 
    array, 
    enemyInfo, 
    enemyArray, 
    successReward,
    playerStartArray,
    enemyStartArray,
    cb
){
    this.__startBattle(type, 
        playerInfo, 
        array, 
        enemyInfo, 
        enemyArray, 
        successReward,
        playerStartArray,
        enemyStartArray,
        [],
        cb);
};

/**
 * pve不记录，pvp记录，战斗流程全自动
 * @param {Object} playerInfo {uid:xxx, name:xxx}
 * @param {Array} array [{id:xxx,hp:xxx,atk:xxx,skill:xxx}]
 * @param {Object} enemyInfo {uid:xxx, name:xxx} 若为PVE则敌人UID放空
 * @param {Array} enemyArray [{id:xxx,hp:xxx,atk:xxx,skill:xxx}]
 * @param {Array} successReward 用于记录的胜利奖励  [{itemID:xxx,itemNum:xxx}]
 * @param {Array} playerMaxArray 初始进攻方的的最大血量（可选，仅作显示用，不填默认为初始卡牌信息）  [{id:xxx,hp:xxx,atk:xxx}]
 * @param {Array} enemyMaxArray  初始防守方的的最大血量（可选，仅作显示用，不填默认为初始卡牌信息）  [{id:xxx,hp:xxx,atk:xxx}]
 * @param {Array} clientParams  客户端参数列表, 成员需要可以转成字符串
 * @param {Enum} type
 * @returns {Object}    isWin 是否胜利
 *                      award 奖励信息
 *                      battleID 战斗记录id (pvp才有, pve情况下为undefined)
 *                      selfArray 结束时进攻方卡牌状态 [{id:xxx,hp:xxx,atk:xxx,skill:xxx}]
 *                      enemyArray 结束时防守方卡牌状态 [{id:xxx,hp:xxx,atk:xxx,skill:xxx}]
 */
Remote.prototype.__startBattle = async function(
    type, 
    playerInfo, 
    array, 
    enemyInfo, 
    enemyArray, 
    successReward,
    playerMaxArray,
    enemyMaxArray,
    clientParams,
    cb
){
    if(!code.battle.isPVP(type)){
        //PVE敌人UID变成0
        enemyInfo.uid = 0;
    }
    await this.app.Battle.addBattle(playerInfo, array, enemyInfo, enemyArray, type, playerMaxArray, enemyMaxArray);
    const frontId = await this.app.Redis.hget(code.redis.ROLE_ON_CONNECTOR.name, playerInfo.uid);
    if(frontId.err){
        logger.error(frontId.err);
        cb(frontId.err);
        return;
    }
    for(const i in clientParams){
        clientParams[i] = clientParams[i].toString();
    }
    const result = this.app.Battle.applyBattle(playerInfo.uid, frontId.res, successReward, clientParams);
    
    this.app.Battle.exitBattle(playerInfo.uid);
    //通知
    cb(null, {
        isWin:result.isWin, 
        award:result.award, 
        battleID:result.battleID, 
        selfArray:result.selfArray, 
        enemyArray:result.enemyArray
    });
};