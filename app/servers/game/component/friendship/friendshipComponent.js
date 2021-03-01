/**
 * @description 团建
 * @author jzy
 * @date 2020/04/27
 */

const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const bearcat = require('bearcat');
const code = require("@code");
const utils = require("@util");
const assert = require("assert");

const FriendshipComponent = function(app, player){
    this.$id = 'game_FriendshipComponent';
    this.$scope = 'prototype';
    this.app = app;
    this.player = player;
};

module.exports = FriendshipComponent;
bearcat.extend('game_FriendshipComponent', 'game_Component');

/** 数据结构
 *  isStart:true,   // 是否开始团建了
 *  ID:112,         // 路线
 *  stair:0,        // 阶层
 *  index:0,        // 阶层所在索引
 *  status:0,       // 格子状态
 *  shopIDs:[],     // 路线随机的商店实例id
 *  buffList:[],    // buff列表
 *  path:[0,0,1]    // path[stair] 阶层对应的选择
 *  buyBuffTimes:0, // 购买buff次数
 * 
 *  basePower:xxx,  // 基础身价
 *  dailyBasePower:xxx // 每日基础身价
 *  historyMaxPower:xxx, //历史最高身价
 *  buyTimes:0,
 *  
 *  selectBuffList = [],
 */

/****************************************************************/

FriendshipComponent.prototype.onInit = async function () {
    this.player.Event.on(code.event.TOTAL_POWER_UPDATE.name, (...params) => { this.onTotalPowerChange(...params); });
};

FriendshipComponent.prototype.onLogin = async function (){
    const data = this.getFriendship();
    if(data.isStart){
        // 热更新路线内新增商店配置
        const exclude = [];
        if(!data.shopIDs){
            data.shopIDs = [];
        }
        data.shopIDs.map((item)=>{
            if(!exclude[item.stair]){
                exclude[item.stair] = [];
            }
            exclude[item.stair][item.index] = true;
        });
        data.shopIDs = data.shopIDs.concat(this._createShopList(data.ID, exclude));
        this.update(data);
    }
};

/**
 * 更新历史最高身价
 */
FriendshipComponent.prototype.onTotalPowerChange = function(){
    const data = this.getFriendship();
    const totalPower = this.player.Card.getTotalPower();
    const max = data.historyMaxPower || 0;
    if(totalPower>max){
        data.historyMaxPower = totalPower;
        this.update(data);
    }
};

/**
 * 获取当前团建状态信息
 */
FriendshipComponent.prototype.getFriendshipInfo = function(){
    const data = this.getFriendship();
    const obj = {
        isStart: data.isStart? 1:0,
        nodeInfo: this.getNodeInfo(),
        referencePower: this._getBasePower(),
        buyTimes: data.buyTimes || 0,
        expireTime:Math.floor(this.app.Timer.getTriggerMS(this.app.Config.Timer.get(1))/1000) + 24*60*60,// 隔天
    };
    return obj;
};

/**
 * 开始团建
 */
FriendshipComponent.prototype.startLine = function(){
    const data = this.getFriendship();
    if(data.isStart){
        return {code:code.err.ERR_FRIENDSHIP_START};
    }
    // 消耗团建次数
    const cost = utils.proto.encodeConfigAward(this.app.Config.Global.get(code.friendship.GLOBAL_COST_FRIENDSHIP_TIME_ITEM).GlobalJson);
    const times = cost[0]?cost[0].itemNum:0;
    if(!this.player.Recovery.judgeRecoveryNum(code.recovery.RECOVERY_TYPE.FRIENDSHIP,times)){
        return {code:code.err.ERR_FRIENDSHIP_TIMES_NOT_ENOUGH};
    }
    //修改数据
    this.player.Recovery.deductRecovery(code.recovery.RECOVERY_TYPE.FRIENDSHIP,times, code.reason.OP_FRIEND_SHIP_START_COST);
    // 初始化
    const obj=data;
    obj.isStart = true;
    obj.ID = this.app.Config.FriendshipLine.getInitID();
    obj.stair = 0;
    obj.index = 0;
    obj.status = code.friendship.STATUS_TYPE.IDLE;
    obj.shopIDs = this._createShopList(obj.ID);
    obj.buffList = [];
    obj.buyBuffTimes = 0;
    obj.path = [];
    obj.selectBuffList = [];
    obj.basePower = obj.dailyBasePower || 0;
    this.update(obj);
    this.player.Notify.notify("OnNotifyReferencePowerFriendship", { referencePower: this._getBasePower()});
    return {code:code.err.SUCCEEDED, nodeInfo: this.getNodeInfo(), isStart: 1};
};

/**
 * 行动，最后一层只可能是boss战斗，所以商店和休息格结束后必定为IDLE状态
 */
FriendshipComponent.prototype.moveAction = async function(nextIndex){
    const data = this.getFriendship();
    if(!data.isStart){
        return {code:code.err.ERR_FRIENDSHIP_NOT_START};
    }
    let status = data.status;
    if(status != code.friendship.STATUS_TYPE.IDLE){
        return {code:code.err.ERR_FRIENDSHIP_STATUS_WRONG};
    }
    const ID = data.ID || 0;
    const stair = data.stair || 0;
    const index = data.index || 0;
    let buffList = data.buffList || [];
    if(!this.app.Config.FriendshipLine.checkNext(ID, stair, index, nextIndex)){
        return {code:code.err.ERR_FRIENDSHIP_NEXT_STEP_WRONG};
    }

    const nextStair = stair + 1;
    const totalCfg = this.app.Config.FriendshipLine.getStepCost(ID, nextStair, nextIndex, this.player.lv);
    if(!this.player.Item.isEnough(totalCfg.cost)){
        return {code:code.err.ERR_FRIENDSHIP_ITEM_NOT_ENOUGH};
    }
    const friendshipCfg = this.app.Config.Friendship.get(totalCfg.friendshipID);
    let isFight = false;
    switch(totalCfg.type){
    case code.friendship.GRID_TYPE.BATTLE:
        isFight = true;
        break;
    case code.friendship.GRID_TYPE.SHOP:
        status = code.friendship.STATUS_TYPE.SHOP;
        break;
    case code.friendship.GRID_TYPE.REST:{
        buffList = buffList.concat(Object.keys(friendshipCfg.BuffArray));
        status = code.friendship.STATUS_TYPE.IDLE;
        break;
    }
    default:
        assert.fail("未知格子类型");
    }
    this.player.Item.deleteItem(totalCfg.cost, code.reason.OP_FRIEND_SHIP_MOVE_ACTION_COST);
    data.stair=nextStair,
    data.index=nextIndex,
    data.buffList=buffList,
    data.status=status,
    data.path.push(index);
    this.update(data);
    if(isFight){
        await this.startBattle(); // 直接开始战斗
    }
    return {code:code.err.SUCCEEDED, nodeInfo: this.getNodeInfo()};
};

/**
 * 重试战斗
 */
FriendshipComponent.prototype.retryBattle = async function(){
    const data = this.getFriendship();
    if(!data.isStart){
        return {code:code.err.ERR_FRIENDSHIP_NOT_START};
    }
    const status = data.status;
    if(status != code.friendship.STATUS_TYPE.BATTLE_FAIL){
        return {code:code.err.ERR_FRIENDSHIP_STATUS_WRONG};
    }
    const ID = data.ID || 0;
    const stair = data.stair || 0;
    const index = data.index || 0;
    const totalCfg = this.app.Config.FriendshipLine.getStepCost(ID, stair, index, this.player.lv);
    if(totalCfg.type!=code.friendship.GRID_TYPE.BATTLE){
        return {code:code.err.ERR_FRIENDSHIP_TYPE_NOT_MATCH};
    }
    if(!this.player.Item.isEnough(totalCfg.cost)){
        return {code:code.err.ERR_FRIENDSHIP_ITEM_NOT_ENOUGH};
    }

    this.player.Item.deleteItem(totalCfg.cost, code.reason.OP_FRIEND_SHIP_RETRY_BATTLE_COST);
    await this.startBattle();
    return {code:code.err.SUCCEEDED, status:data.status};
};

/**
 * 获得战斗完选择buff列表
 */
FriendshipComponent.prototype.getSelectBuffList = function(){
    const data = this.getFriendship();
    let selectBuffList = data.selectBuffList || [];
    // 修复配置忘记配置buff表的问题
    if(selectBuffList.length<=0 && status == code.friendship.STATUS_TYPE.SELECT_BUFF){
        data.selectBuffList = this.getRandomBuffList();
        this.update(data);
        selectBuffList = data.selectBuffList;
    }
    return {list:selectBuffList.concat()};
};

/**
 * 选择buff
 */
FriendshipComponent.prototype.selectBuff = function(buffID){
    const data = this.getFriendship();
    if(!data.isStart){
        return {code:code.err.ERR_FRIENDSHIP_NOT_START};
    }
    const status = data.status;
    if(status != code.friendship.STATUS_TYPE.SELECT_BUFF){
        return {code:code.err.ERR_FRIENDSHIP_STATUS_WRONG};
    }
    if(data.selectBuffList.indexOf(buffID)<0){
        return {code:code.err.ERR_FRIENDSHIP_BUFF_ID_NOT_MATCH};
    }
    const buffList = data.buffList || [];
    buffList.push(buffID);
    data.buffList = buffList;
    if(this.app.Config.FriendshipLine.isFinalStair(data.ID,data.stair)){
        // 楼层boss打败并选择buff后等待领奖
        data.status = code.friendship.STATUS_TYPE.WAIT_RECEIVE_REWARD;
    }else{
        data.status = code.friendship.STATUS_TYPE.IDLE;
    }
    
    data.selectBuffList = [];
    this.update(data);
    return {code:code.err.SUCCEEDED, buffID:buffID, buffList:buffList, status:data.status};
};

/**
 * 结束购买
 */
FriendshipComponent.prototype.finishShopping = function(){
    const data = this.getFriendship();
    if(!data.isStart){
        return {code:code.err.ERR_FRIENDSHIP_NOT_START};
    }
    const status = data.status;
    if(status != code.friendship.STATUS_TYPE.SHOP){
        return {code:code.err.ERR_FRIENDSHIP_STATUS_WRONG};
    }
    data.status = code.friendship.STATUS_TYPE.IDLE;
    this.update(data);
    return {code:code.err.SUCCEEDED, status:data.status};
};

/**
 * 领取阶层奖励
 */
FriendshipComponent.prototype.receiveStageAward = function(){
    const data = this.getFriendship();
    if(!data.isStart){
        return {code:code.err.ERR_FRIENDSHIP_NOT_START};
    }
    const status = data.status;
    if(status != code.friendship.STATUS_TYPE.WAIT_RECEIVE_REWARD){
        return {code:code.err.ERR_FRIENDSHIP_STATUS_WRONG};
    }
    const stage = this.app.Config.FriendshipLine.get(data.ID).Floor;
    const difficulty = this.app.Config.FriendshipLine.get(data.ID).Difficulty;
    let index;
    if(stage==3&&difficulty==2){
        index = code.friendship.REWARD_BOX_TYPE.STAGE3HARD;
    }else{
        index = stage;
    }
    const order = this.app.Config.Prestige.get(this.player.lv).Order;
    const award = utils.proto.encodeConfigAward(this.app.Config.FriendshipReward.get(order).BoxReward[index]);
    this.player.Item.addItem(award, code.reason.OP_FRIEND_SHIP_STAGE_GET);
    if(this.app.Config.FriendshipLine.isFinalStage(data.ID)){
        data.status = code.friendship.STATUS_TYPE.FINISH;
    }else{
        data.status = code.friendship.STATUS_TYPE.WAIT_ENTER_NEXT_STAGE;
    }
    this.update(data);
    return {code:code.err.SUCCEEDED, award:utils.proto.encodeAward(award), status:data.status};
};

/**
 * 进入下一层
 */
FriendshipComponent.prototype.enterNextStage = function(difficulty){
    const data = this.getFriendship();
    if(!data.isStart){
        return {code:code.err.ERR_FRIENDSHIP_NOT_START};
    }
    const status = data.status;
    if(status != code.friendship.STATUS_TYPE.WAIT_ENTER_NEXT_STAGE){
        return {code:code.err.ERR_FRIENDSHIP_STATUS_WRONG};
    }
    const floor = this.app.Config.FriendshipLine.get(data.ID).Floor + 1;
    // 多难度时候检查有没有传难度值
    const isMultiDiff = this.app.Config.FriendshipLine.isStageMultiDifficulty(floor);
    if(isMultiDiff && difficulty == undefined){
        return {code:code.err.ERR_CLIENT_PARAMS_WRONG};
    }
    if(!isMultiDiff){
        difficulty = undefined;
    }
    const id = this.app.Config.FriendshipLine.getRandomID(floor, difficulty);
    if(id == undefined){
        return {code:code.err.ERR_CLIENT_PARAMS_WRONG};
    }
    this._closeShop((data.shopIDs || []).concat());
    data.ID = id,
    data.stair = 0;
    data.index = 0;
    data.path = [];
    data.status = code.friendship.STATUS_TYPE.IDLE;
    data.shopIDs = this._createShopList(id);
    this.update(data);
    return {code:code.err.SUCCEEDED, nodeInfo:this.getNodeInfo()};
};

/**
 * 结束团建
 */
FriendshipComponent.prototype.finish = function(){
    const data = this.getFriendship();
    if(!data.isStart){
        return {code:code.err.ERR_FRIENDSHIP_NOT_START};
    }
    this._closeShop((data.shopIDs || []).concat());
    data.isStart = false;
    this.update(data);

    this.player.Event.emit(code.event.FINISH_FRIENDSHIP.name);
    
    return {code:code.err.SUCCEEDED, isStart:data.isStart?1:0};
};

/**
 * 开始战斗调用
 */
FriendshipComponent.prototype.startBattle = async function(){
    const boss = this.getBossBattleInfo();
    const playerInfo = {uid:this.player.uid, name:this.player.name};
    const data = this.getFriendship();
    const ID = data.ID || 0;
    const stair = data.stair || 0;
    const index = data.index || 0;
    const totalCfg = this.app.Config.FriendshipLine.getStepAward(ID, stair, index, this.player.lv);
    const successReward = this._buffAward(totalCfg.award);
    await this.app.rpcs.battle.battleRemote.startBattle(
        {}, 
        code.battle.BATTLE_TYPE.FRIENDSHIP, 
        playerInfo,
        this.getSelfBattleCards(), 
        boss.bossInfo, 
        boss.bossArray, 
        successReward,
    ).then(({err,res})=>{
        let isWin;
        if(err){
            isWin = false;
            logger.error(err);
        }else{
            isWin = res.isWin;
        }
        const award = res.award;
        this.battleEnd(isWin, award);
    });
};

/**
 * 购买buff
 */
FriendshipComponent.prototype.buyBuff = function(){
    const data = this.getFriendship();
    if(!data.isStart){
        return {code:code.err.ERR_FRIENDSHIP_NOT_START};
    }
    const times = data.buyBuffTimes || 0;
    const cost = this.app.Config.BuyingTimes.getCost(code.friendship.BUY_BUFF_BUY_TIMES_TYPE, times + 1);
    if(cost){
        const costItem = utils.proto.encodeConfigAward(cost);
        if(!this.player.Item.isEnough(costItem)){
            return {code:code.err.ERR_ITEM_COST_NOT_ENOUGH};
        }
        const buffID = this.app.Config.Global.get(code.friendship.GLOBAL_BUY_BUFF_ID).GlobalFloat;

        this.player.Item.deleteItem(costItem, code.reason.OP_FRIEND_SHIP_BUY_BUFF_COST);
        const buffList = data.buffList || [];
        data.buffList = buffList.concat(buffID);
        data.buyBuffTimes = times + 1;
        this.update(data);

        return {code:code.err.SUCCEEDED,buffList:data.buffList.concat(),buyBuffTimes:data.buyBuffTimes};
    }else{
        return {code:code.err.ERR_FRIENDSHIP_BUY_BUFF_TIMES_FULL};
    }
};

/***************************团建次数相关函数*******************************/

/**
 * 增加购买次数
 */
FriendshipComponent.prototype.addBuyTimes = function(){
    const times = 1;
    if(!this.player.Friendship.isCanBuyTimes(times)){
        return {code:code.err.ERR_FRIENDSHIP_BUY_TIMES_FULL};
    }
    const data = this.getFriendship();
    const hasBuyTimes = data.buyTimes||0;
    const cost = this.app.Config.BuyingTimes.getCost(code.friendship.BUY_FRIENDSHIP_TIMES_TYPE, hasBuyTimes + 1);
    const costItem = utils.proto.encodeConfigAward(cost || {});
    if(!this.player.Item.isEnough(costItem)){
        return {code:code.err.ERR_ITEM_COST_NOT_ENOUGH};
    }
    
    this.player.Item.deleteItem(costItem, code.reason.OP_FRIEND_SHIP_BUY_TIMES_COST);
    this.player.Recovery.addRecovery(code.recovery.RECOVERY_TYPE.FRIENDSHIP, times, code.reason.OP_FRIEND_SHIP_BUY_TIMES_GET);
    data.buyTimes = hasBuyTimes + times;
    this.update(data);
    return { code:code.err.SUCCEEDED, buyTimes: data.buyTimes };
};

/**
 * 判断是否能够购买次数
 */
FriendshipComponent.prototype.isCanBuyTimes = function(times){
    const data = this.getFriendship();
    const buyTimes = data.buyTimes || 0;
    if(buyTimes + times > this.app.Config.Vip.get(this.player.vip).FriendshipNum){
        return false;
    }else{
        return true;
    }
};

/**
 * 跨天更新次数，基准战力
 */
FriendshipComponent.prototype.onDayChange = async function (isOnTime){
    const data = this.getFriendship();
    //基准战力更新
    data.dailyBasePower = data.historyMaxPower || 0;

    //次数更新
    data.buyTimes = 0;

    this.update(data);
    // 登陆更新的话不发
    if(isOnTime){
        this.player.Notify.notify("OnNotifyTimesFriendship", { buyTimes: data.buyTimes });
    }
};

/******************************internal function******************************/

/**
 * 战斗结束后调用
 */
FriendshipComponent.prototype.battleEnd = function(isWin, award){
    const data = this.getFriendship();
    if(isWin){
        //随机buff表
        data.selectBuffList = this.getRandomBuffList();
        //加奖励
        this.player.Item.addItem(award, code.reason.OP_FRIEND_SHIP_BATTLE_GET);
        //修改格子状态
        if(this.app.Config.FriendshipLine.isFinalStair(data.ID,data.stair) && this.app.Config.FriendshipLine.isFinalStage(data.ID)){
            data.status = code.friendship.STATUS_TYPE.WAIT_RECEIVE_REWARD;
        }else{
            data.status = code.friendship.STATUS_TYPE.SELECT_BUFF;
        }
        
        this.update(data);
        // 战斗胜利算一次团建
        this.player.Event.emit(code.event.FRIENDSHIP_TIMES.name);
    }else{
        data.status = code.friendship.STATUS_TYPE.BATTLE_FAIL;
        this.update(data);
    }
    // this.player.Notify.notify("OnNotifyNodeStatusFriendship", {status:data.status});
};

/**
 * 随机获取buff列表供选择
 */
FriendshipComponent.prototype.getRandomBuffList = function(){
    const data = this.getFriendship();
    const ID = data.ID || 0;
    const stair = data.stair || 0;
    const index = data.index || 0;
    const totalCfg = this.app.Config.FriendshipLine.getConfig(ID, stair, index);
    const friendshipCfg = this.app.Config.Friendship.get(totalCfg.friendshipID);
    const buffList = utils.random.randomArrayElementsWeight(
        Object.keys(friendshipCfg.BuffArray),
        Object.values(friendshipCfg.BuffArray),
        code.friendship.SELECT_BUFF_NUM
    );
    for(let i = 0;i<buffList.length;i++) {
        buffList[i] = parseInt(buffList[i]);
    }
    return buffList;
};

/**
 * 获得自己的战斗卡牌数据
 */
FriendshipComponent.prototype.getSelfBattleCards = function(){
    const data = this.getFriendship();
    const buffList = data.buffList || [];
    const selfArray = [];
    const cardList = this.player.Card.getCardList(false);
    this.app.Config.Buff.affectBattleCardAttr(cardList, buffList.concat());
    cardList.sort(function (left, right) {
        return right.power - left.power;
    });
    for (const info of cardList) {
        const cardCfg = this.app.Config.Card.get(parseInt(info.cardId));
        if(cardCfg){
            const skillCfg = this.app.Config.Skill.getByLevel(cardCfg.Skill, info.star + 1);
            const afterAttr = info.attr;
            selfArray.push({
                id: parseInt(info.cardId),
                hp: utils.random.random(afterAttr[code.attribute.ATTR_TYPE.HP_MIN], afterAttr[code.attribute.ATTR_TYPE.HP_MAX]),
                atk: utils.random.random(afterAttr[code.attribute.ATTR_TYPE.ATTACK_MIN], afterAttr[code.attribute.ATTR_TYPE.ATTACK_MAX]),
                skill: skillCfg ? skillCfg.Id : 0,
            });
        }
    }
    return selfArray;
};

/**
 * 获取战斗boss信息 {bossInfo:xxx,bossArray:[]}
 */
FriendshipComponent.prototype.getBossBattleInfo = function(){
    const data = this.getFriendship();
    const ID = data.ID || 0;
    const stair = data.stair || 0;
    const index = data.index || 0;
    const totalCfg = this.app.Config.FriendshipLine.getConfig(ID, stair, index);
    const friendshipCfg = this.app.Config.Friendship.get(totalCfg.friendshipID);
    return this.app.Config.CardArray.getRandomBossArray(
        friendshipCfg.CardUseType,
        this.player.lv,
        this._getBasePower(),
        totalCfg.difficulty,
        friendshipCfg.AttributeValue,
    );
};

/**
 * 获取当前团建节点信息
 */
FriendshipComponent.prototype.getNodeInfo = function(){
    const data = this.getFriendship();
    if(data.ID==undefined){
        return undefined;
    }
    return {
        ID:data.ID,
        stair:data.stair,
        index:data.index,
        status:data.status,
        buffList:(data.buffList || []).concat(),
        path:(data.path || []).concat(),
        buyBuffTimes:data.buyBuffTimes || 0,
        shopInfo:data.shopIDs,
    };
};

/**
 * 对收益buff
 */
FriendshipComponent.prototype._buffAward = function(itemListInfo){
    const data = this.getFriendship();
    const buffList = data.buffList || [];
    const totalBuff  = this.app.Config.Buff.calcFriendshipBenefitBuff(buffList);
    const outItemList = [];
    
    for(const item of itemListInfo){
        outItemList.push(utils.item.multi(item, 10000 + (totalBuff[item.itemID] || 0), 10000));
    }
    return outItemList;
};

/**
 * 获取基准战力
 */
FriendshipComponent.prototype._getBasePower = function(){
    const data = this.getFriendship();
    const basePower = data.basePower || 0;
    const minPower = this.app.Config.Global.get(code.friendship.GLOBAL_MIN_POWER_ID).GlobalFloat;
    return basePower>minPower?basePower:minPower;
};

/**
 * 创建商店列表
 * @param {Array} exclude exclude[stair][index]
 */
FriendshipComponent.prototype._createShopList = function(lineId, exclude = []){
    const list = this.app.Config.FriendshipLine.getShopList(lineId);
    const result = [];
    for(const info of list){
        const shopId = info.shopId;
        if(exclude[info.stair] && exclude[info.stair][info.index]){
            continue;
        }
        result.push({
            stair:info.stair,
            index:info.index,
            shopId:this.player.ShopTemporary.createShop(shopId, code.friendship.PER_SHOP_ITEM_NUM),
        });
    }
    return result;
};

/**
 * 关闭商店
 */
FriendshipComponent.prototype._closeShop = function(shopIDList){
    for(const info of shopIDList){
        const instanceId = info.shopId;
        this.player.ShopTemporary.destroyShopUid(instanceId);
    }
};

/**
 * 更新玩家团建数据对象
 * @param {Object} player 玩家对象
 * @param {Object} dataObj 数据对象
 */
FriendshipComponent.prototype.update = function(dataObj){
    this.player.set(code.player.Keys.FRIENDSHIP,dataObj);
};


/**
 * 获取玩家团建数据对象
 * @return {Object} {xxx:xxx, ...}
 */
FriendshipComponent.prototype.getFriendship = function(){
    const dataObj = this.player.get(code.player.Keys.FRIENDSHIP) || {};
    return dataObj;
};