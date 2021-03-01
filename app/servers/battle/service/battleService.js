/**
 * @description 战斗管理器
 * @author jzy
 * @date 2020/03/27
 */

const code = require('@code');
const assert = require('assert');
const utils = require('@util');
const bearcat = require('bearcat');

const Service = function(){
    this.$id = 'battle_BattleService';

    // this.playerBattleIdObj = {};
    // uid --> battle
    this.playerCurrentBattle = {};

    this.pvpCurDataObj = {};
};

module.exports = Service;
bearcat.extend('battle_BattleService', 'logic_BaseService');


/**
 * pve不记录，pvp记录，战斗流程全自动
 * @param {Object} playerInfo {uid:xxx, name:xxx}
 * @param {Array} array [{id:xxx,hp:xxx,atk:xxx,skill:xxx}]
 * @param {Object} enemyInfo {uid:xxx, name:xxx} 若为PVE则敌人UID放空
 * @param {Array} enemyArray [{id:xxx,hp:xxx,atk:xxx,skill:xxx}]
 * @param {Enum} enemyType
 */
Service.prototype.addBattle = async function(playerInfo, array, enemyInfo, enemyArray, enemyType, playerMaxArray, enemyMaxArray){
    if(code.battle.isPVP(enemyType)){
        // 新建战斗
        const battleDataObj = this.app.BattleData.create();
        const battleObj= {
            battleType: enemyType,
            playerInfo: playerInfo,
            playerArray: array,
            enemyInfo: enemyInfo,
            enemyArray: enemyArray,
            playerMaxArray: playerMaxArray,
            enemyMaxArray: enemyMaxArray,
        };
        battleDataObj.update(battleObj);
    
        this.pvpCurDataObj[playerInfo.uid] = battleDataObj;
        this.playerCurrentBattle[playerInfo.uid] = battleObj;
    }else{
        const battleObj = {
            battleType: enemyType,
            playerInfo: playerInfo,
            playerArray: array,
            enemyInfo: enemyInfo,
            enemyArray: enemyArray,
            playerMaxArray: playerMaxArray,
            enemyMaxArray: enemyMaxArray,
        };
        this.playerCurrentBattle[playerInfo.uid] = battleObj;
    }
};

Service.prototype.getBattle = function(uid){
    return this.playerCurrentBattle[uid];
};

Service.prototype.getBattlePvpDB = function(uid){
    return this.pvpCurDataObj[uid];
};

Service.prototype.exitBattle = function(uid){
    // pvp
    if(this.pvpCurDataObj[uid]){
        delete this.pvpCurDataObj[uid];
    }
    delete this.playerCurrentBattle[uid];
};

/**
 * 应用战斗
 * 关于array   [{id:xxx,hp:xxx,atk:xxx,skill:xxx}]
 */
Service.prototype.applyBattle = function(uid, frontEndId, successReward, clientParams){
    const battle = this.getBattle(uid);
    // 数组深拷贝
    const selfArray = this.copyAttrArray(battle.playerArray);
    const enemyArray = this.copyAttrArray(battle.enemyArray);
    const roundRecord = [];
    //己方先手
    let attacker = code.battle.ATTACKER.PLAYER;

    let roundEnd = true;
    let recordAttacker;
    let recordPlayerSkill;             // 记录玩家技能id
    let playerSkillEffectSelfIds = []; // 玩家技能影响自身id
    let playerSkillEffectOtherIds = [];// 玩家技能影响对方id
    let recordEnemySkill;              // 记录敌人技能id
    let enemySkillEffectSelfIds = [];  // 敌人技能影响自身id
    let enemySkillEffectOtherIds = []; // 敌人技能影响对方id
    let playerCardInfo = [];           // 玩家卡片信息
    let enemyCardInfo = [];            // 敌人卡片信息
    const recordPlayerSkillReleaseCache = {};  // 记录玩家是否释放过技能
    const recordEnemySkillReleaseCache = {};   // 记录敌人是否释放过技能
    while(0 < selfArray.length && 0 < enemyArray.length){
        //回合结束标志放在开始表示新回合的开始
        if(roundEnd){
            //回合初始化
            recordAttacker = attacker;
            playerCardInfo = [];
            enemyCardInfo = [];
            recordPlayerSkill = 0;
            playerSkillEffectSelfIds = [];
            playerSkillEffectOtherIds = [];
            recordEnemySkill = 0;
            enemySkillEffectSelfIds = [];
            enemySkillEffectOtherIds = [];
            //放技能
            let playerResult, enemyResult;
            if(attacker==code.battle.ATTACKER.PLAYER){
                playerResult = this.applySkill(selfArray, enemyArray, playerCardInfo, enemyCardInfo, recordPlayerSkillReleaseCache);
                enemyResult = this.applySkill(enemyArray, selfArray, enemyCardInfo, playerCardInfo, recordEnemySkillReleaseCache);
            }else if(attacker==code.battle.ATTACKER.ENEMY){
                enemyResult = this.applySkill(enemyArray, selfArray, enemyCardInfo, playerCardInfo, recordEnemySkillReleaseCache);
                playerResult = this.applySkill(selfArray, enemyArray, playerCardInfo, enemyCardInfo, recordPlayerSkillReleaseCache);
            }else{
                assert.fail(`未知攻击方`);
            }
            recordPlayerSkill = playerResult.skill;
            playerSkillEffectSelfIds = playerResult.self;
            playerSkillEffectOtherIds = playerResult.other;
            recordEnemySkill = enemyResult.skill;
            enemySkillEffectSelfIds = enemyResult.self;
            enemySkillEffectOtherIds = enemyResult.other;
            roundEnd = false;
        }
        
        //普通攻击
        let selfRound = Math.floor(selfArray[0].hp/enemyArray[0].atk + 1);
        let enemyRound = Math.floor(enemyArray[0].hp/selfArray[0].atk + 1);
        if(selfRound==enemyRound){
            if(attacker==code.battle.ATTACKER.PLAYER){
                selfRound = selfRound - 1.5 > 0 ? selfRound - 1.5 : 0;
            }else if(attacker==code.battle.ATTACKER.ENEMY){
                enemyRound = enemyRound - 1.5 > 0 ? enemyRound - 1.5 : 0;
            }else{
                assert.fail(`未知攻击方`);
            }
        }else{
            const minRound = selfRound>enemyRound?enemyRound:selfRound;
            selfRound = minRound;
            enemyRound = minRound;
        }
        const selfSubHp = Math.floor(enemyArray[0].atk * selfRound);
        const enemySubHp = Math.floor(selfArray[0].atk * enemyRound);
        selfArray[0].hp -= selfSubHp;
        enemyArray[0].hp -= enemySubHp;
        selfArray[0].hp += 1;
        enemyArray[0].hp += 1;
        const playerAtkResult = [];
        const enemyAtkResult = [];
        if(selfArray[0].hp <= 0){
            selfArray[0].hp = 0;
            this.appendToList(playerAtkResult, selfArray[0]);
            this.appendToList(enemyAtkResult, enemyArray[0]);
            selfArray.shift();
            roundEnd = true;
            attacker = code.battle.ATTACKER.PLAYER;
        }else if(enemyArray[0].hp <= 0){
            enemyArray[0].hp = 0;
            this.appendToList(playerAtkResult, selfArray[0]);
            this.appendToList(enemyAtkResult, enemyArray[0]);
            enemyArray.shift();
            roundEnd = true;
            attacker = code.battle.ATTACKER.ENEMY;
        }
        // 记录普攻结果
        if(roundEnd){
            this.simpleAppendToList(playerCardInfo, playerAtkResult[0]);
            this.simpleAppendToList(enemyCardInfo, enemyAtkResult[0]);
        }
        

        //回合结束
        if(roundEnd){
            roundRecord.push({
                attacker:recordAttacker,
                playerSkill:recordPlayerSkill,
                playerSkillEffectSelfIds:playerSkillEffectSelfIds,
                playerSkillEffectOtherIds:playerSkillEffectOtherIds,
                enemySkill:recordEnemySkill,
                enemySkillEffectSelfIds:enemySkillEffectSelfIds,
                enemySkillEffectOtherIds:enemySkillEffectOtherIds,
                playerCardInfo:playerCardInfo,
                enemyCardInfo:enemyCardInfo,
            });
        }
    }
    const success = 0 < selfArray.length;
    const itemAward = success?successReward:[];
    const award = utils.proto.encodeAward(itemAward);
    const winUid = success?battle.playerInfo.uid.toString():battle.enemyInfo.uid.toString();
    //通知战斗消息
    this.app.get('channelService').pushMessageByUids("onNotifyStatusBattle", {battleRecord:{
        battleType:battle.battleType,
        playerName:battle.playerInfo.name,
        enemyName:battle.enemyInfo.name,
        playerCardInfo:battle.playerArray,
        enemyCardInfo:battle.enemyArray,
        playerMaxArray: battle.playerMaxArray,
        enemyMaxArray: battle.enemyMaxArray,
        roundRecord:roundRecord,
        win:winUid,
        award:award,
        clientParams:clientParams,
    }},[{uid: uid, sid: frontEndId}]);


    let battleID;
    if(code.battle.isPVP(battle.battleType)){
        const dataObj = this.getBattlePvpDB(battle.playerInfo.uid);
        dataObj.update({
            roundRecord: roundRecord,
            winUid: winUid,
            award: award,
        }, true);
        battleID = dataObj.ID().toString();
    }

    return {isWin:success, award:itemAward, battleID:battleID, selfArray:selfArray, enemyArray:enemyArray };
};

/**
 * 使用技能
 */
Service.prototype.applySkill = function(selfArray, otherArray,selfRecordList,otherRecordList,recordSkillReleaseCache){
    let skillResult;
    let recordPlayerSkill;
    // 已释放过技能就不再释放
    if(recordSkillReleaseCache[selfArray[0].id]){
        recordPlayerSkill = 0;
    } else {
        skillResult = this.app.Config.Skill.applyEffect(selfArray[0].skill, selfArray, otherArray, selfArray[0].id);
        recordPlayerSkill = skillResult? selfArray[0].skill:0;
        if(recordPlayerSkill != 0){
            recordSkillReleaseCache[selfArray[0].id] = recordPlayerSkill;
        }
    }
    
    //变化的id
    const selfChanges = [];
    const otherChanges = [];
    if(skillResult){
        this.appendToList(selfRecordList, skillResult.self);
        this.appendToList(otherRecordList, skillResult.other);
        for(const info of skillResult.self){
            selfChanges.push(info.id);
        }
        for(const info of skillResult.other){
            otherChanges.push(info.id);
        }
    }
    
    return {skill:recordPlayerSkill, self:selfChanges, other:otherChanges};
};

/**
 * 追加到消息协议，仅包含id、hp、atk
 */
Service.prototype.appendToList = function(List, cardInfos){
    let cardInfoList = [];
    if(Array.isArray(cardInfos)){
        cardInfoList = cardInfos;
    }else{
        cardInfoList = [cardInfos];
    }
    for(const cardInfo of cardInfoList){
        let findFlag = false;
        for(const info of List){
            if(info.id == cardInfo.id){
                info.hp = cardInfo.hp;
                info.atk = cardInfo.atk;
                findFlag = true;
                break;
            }
        }
        if(!findFlag){
            List.push({
                id:cardInfo.id,
                hp:cardInfo.hp,
                atk:cardInfo.atk,
            });
        }
        
    }
};

Service.prototype.simpleAppendToList = function(List, cardInfos){
    let cardInfoList = [];
    if(Array.isArray(cardInfos)){
        cardInfoList = cardInfos;
    }else{
        cardInfoList = [cardInfos];
    }
    for(const cardInfo of cardInfoList){
        List.push({
            id:cardInfo.id,
            hp:cardInfo.hp,
            atk:cardInfo.atk,
        });
    }
};

/**
 * 深拷贝战斗数据对象
 */
Service.prototype.copyAttrArray = function(array){
    const result = [];
    for(const info of array){
        result.push({
            id:info.id,
            hp:info.hp,
            atk:info.atk,
            skill:info.skill,
        });
    }
    return result;
};