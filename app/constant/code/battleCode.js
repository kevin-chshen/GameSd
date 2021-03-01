/**
 * @description 战斗
 * @author jzy
 * @date 2020/03/30
 */

const battleDefine = {
    // 战斗类型
    BATTLE_TYPE : {
        DUNGEON : 0,
        CLUB : 1,
        FRIENDSHIP: 2,
        FLOWRATE: 3,
        AUTO_SHOW: 4,
        GUILD_PROJECT:5,
        PVP:99,
    },

    // 攻击方
    ATTACKER : {
        PLAYER : 0,  //自己
        ENEMY : 1,  //敌人
    },

};

/**
 * 定义为pvp的列表
 */
const pvpList = [
    battleDefine.BATTLE_TYPE.PVP,
    battleDefine.BATTLE_TYPE.FLOWRATE,
];

const isPVP = function(type){
    if(pvpList.indexOf(type)>=0){
        return true;
    }else{
        return false;
    }
};

module.exports = {
    ...battleDefine,
    isPVP,
};