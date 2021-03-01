/**
 * @description 主线关卡消息模块
 * @author jzy
 * @date 2020/03/13
 */

const code = require('@code');
const utils = require('@util');

module.exports = function(app) {
    return new Handler(app);
};

const Handler = function(app) {
    this.app = app;
};

Handler.prototype.getDungeonInfo = function(msg, session, next){
    const player = session.player;
    if (!player) { next(null); return; }

    const data = {
        matchID: player.Dungeon.getMaxCompleteMatchID(),
        progress: player.Dungeon.getProgress(),
        hasReceiveBoxID: player.Dungeon.getHasReceiveBoxID(),
        eventID: player.Dungeon.getDungeon().eventID || 0,
    };
    next(null,data);
};

Handler.prototype.encourageDungeon = async function(msg, session, next){
    const player = session.player;
    if (!player) { next(null); return; }
    const data = await player.Dungeon.encourage();
    next(null,data);
};

Handler.prototype.chooseEventDungeon = async function(msg, session, next){
    const player = session.player;
    if (!player) { next(null); return; }
    const data = await player.Dungeon.chooseEvent(msg.para);
    next(null,data);
};


Handler.prototype.receiveBoxRewardDungeon = function(msg, session, next){
    const player = session.player;
    if (!player) { next(null); return; }
    const data = player.Dungeon.receiveBoxReward(msg.id);
    next(null,data);
};

Handler.prototype.enterBattle = function(msg, session, next){
    const player = session.player;
    const currentMatchID = player.Dungeon.getCurrentMatchID();
    const config = this.app.Config.Checkpoint.get(currentMatchID);
    // 不是决赛类型
    if(!config || config.Type!=code.dungeon.MATCH_TYPE.FINAL){
        next(null, {code:code.err.ERR_DUNGEON_CAN_NOT_BATTLE});
        return;
    }

    //根据身价消耗物品
    const totalPower = player.Card.getTotalPower();
    if(totalPower == 0){
        next(null, { code: code.err.ERR_CARD_FORMATION_NOT_ENOUGH });
        return;
    }
    const cost = (BigInt(config.Cost) * BigInt(config.Power) / BigInt(totalPower)).toString();
    const commonCost = {itemID:code.dungeon.ENCOURAGE_COST_ITEM_ID,itemNum:cost};
    if(!player.Item.isEnough(commonCost)){
        next(null, { code: code.err.ERR_DUNGEON_ENCOURAGE_COST_NUM });
        return;
    }

    const selfArray = player.Card.getCardBattleInfo();
    if (selfArray.length <= 0) {
        next(null, { code: code.err.ERR_CARD_FORMATION_NOT_ENOUGH });
        return;
    }
    const bossArray = [{
        id:config.ModelId,
        hp:config.BossHp,
        atk: config.BossAttack,
        skill: this.app.Config.Model.get(config.ModelId).Skill,
    }];
    const successReward = utils.proto.encodeConfigAward(config.Reward);
    const playerInfo = {uid:session.uid, name:player.get(code.player.Keys.NAME)};
    const bossInfo = {uid:0, name: this.app.Config.Model.get(config.ModelId).Name};

    player.Item.deleteItem(commonCost, code.reason.OP_DUNGEON_BATTLE_GET);

    next(null, {code:code.err.SUCCEEDED});
    this.app.rpcs.battle.battleRemote.startBattleWithClientParams(
        session, 
        code.battle.BATTLE_TYPE.DUNGEON, 
        playerInfo, 
        selfArray, 
        bossInfo, 
        bossArray, 
        successReward,
        [currentMatchID.toString()],
    ).then(({err,res})=>{
        const isWin = res.isWin;
        if(err){
            return;
        }
        player.Dungeon.battleEnd(isWin);
    });
};