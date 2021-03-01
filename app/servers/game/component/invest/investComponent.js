/**
 * @description 投资
 * @author jzy
 * @date 2020/04/21
 */

const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const code = require('@code');
const utils = require('@util');
const bearcat = require('bearcat');
const assert = require("assert");

const InvestComponent = function(app, player){
    this.$id = 'game_InvestComponent';
    this.$scope = 'prototype';
    this.app = app;
    this.player = player;
};

module.exports = InvestComponent;
bearcat.extend('game_InvestComponent', 'game_Component');

/** 数据结构
 *  randomList: {                            // 随机出的列表
 *                  [id]:{
 *                          investID:xxx,
 *                          color:xxx,
 *                       }
 *              },
 *  current: {                               // 当前选中投资
 *              id:xxx,
 *              investID:xxx,
 *              color:xxx,
 *              progress:xxx,
 *           },
 *  completeInfo:{                           // 已完成信息
 *                  [investID]:[times],
 *               }
 *  recommendBot:{
 *                  [id]:[projectInfo],
 *               }
 */

/** 
 * 获取列表协议信息
 */
InvestComponent.prototype.getInvestList = function(){
    let randomList = {};
    const dataObj = this.getInvest();
    const oldList = dataObj.randomList || {};
    if(Object.keys(oldList).length<=0){
        this.refreshInvestList();
        randomList = dataObj.randomList;
    }else{
        randomList = oldList;
    }
    
    const protoList = [];
    for(const key of Object.keys(randomList)){
        protoList.push({
            id:key,
            investID:randomList[key].investID,
            color:randomList[key].color,
        });
    }
    return protoList;
};

/**
 * 获取已完成协议信息
 */
InvestComponent.prototype.getCompleteInfo = function(){
    const dataObj = this.getInvest();
    const completeInfo = dataObj.completeInfo || {};
    const result = [];
    for(const each of Object.keys(completeInfo)){
        result.push({
            investID:parseInt(each),
            times:completeInfo[each],
        });
    }
    return result;
};

/**
 * 刷新列表请求
 */
InvestComponent.prototype.refreshListRequest = function(){
    const cost = utils.proto.encodeConfigAward(this.app.Config.Global.get(code.invest.REFRESH_COST_GLOBAL_ID).GlobalJson);
    if(!this.player.Item.isEnough(cost)){
        return {code:code.err.ERR_INVEST_COST_ITEM_NOT_ENOUGH};
    }
    this.player.Item.deleteItem(cost, code.reason.OP_INVEST_REFRESH_COST);
    this.refreshInvestList();
    return {code:code.err.SUCCEEDED, investList:this.getInvestList()};
};

/**
 * 选中通告
 */
InvestComponent.prototype.selectInvest = function(id){
    const dataObj = this.getInvest();
    //判断有无选中项目存在
    if(dataObj.current){
        return {code:code.err.ERR_INVEST_HAS_PROGRESS};
    }
    //判断id存不存在
    if(!dataObj.randomList || !dataObj.randomList[id]){
        return {code:code.err.ERR_CLIENT_PARAMS_WRONG};
    }
    const current = {
        id:id,
        investID:dataObj.randomList[id].investID,
        color:dataObj.randomList[id].color,
        progress:"0",
    };
    dataObj.current = current;
    this.update(dataObj);

    return { code:code.err.SUCCEEDED, current:this.getCurrentInvestInfo() };
};

/**
 * 获取当前通告信息
 */
InvestComponent.prototype.getCurrentInvestInfo = function(){
    const dataObj = this.getInvest();
    if(!dataObj.current){
        return;
    }
    return {
        id: dataObj.current.id,
        investID: dataObj.current.investID,
        color: dataObj.current.color,
        progress: dataObj.current.progress,
    };
};

/**
 * 投资进度
 */
InvestComponent.prototype.investProgress = function(){
    const dataObj = this.getInvest();
    //判断有无项目
    if(!dataObj.current){
        return {code:code.err.ERR_INVEST_HAS_NOT_PROGRESS};
    }
    const prestigeCfg = this.app.Config.Prestige.get(this.player.lv);
    const investCfg = this.app.Config.Invest.get(dataObj.current.investID);
    
    let total;
    let eachTimesCost;
    if(!dataObj.firstTimeFinish){
        total = BigInt(utils.proto.encodeConfigAward(this.app.Config.Global.get(code.invest.GLOBAL_ID_FIRST_TIME_TOTAL).GlobalJson)[0].itemNum);
        eachTimesCost = utils.proto.encodeConfigAward(this.app.Config.Global.get(code.invest.GLOBAL_ID_FIRST_TIME_EACH_COST).GlobalJson);
    }else{
        total = BigInt(utils.proto.encodeConfigAward(prestigeCfg.InvestTotalCost)[0].itemNum);
        eachTimesCost = utils.proto.encodeConfigAward(prestigeCfg.InvestCost);
    }
    // 判断进度
    const progress = BigInt(dataObj.current.progress || 0);
    if(progress>=total){
        return {code:code.err.ERR_INVEST_PROGRESS_FULL};
    }
    const disProgress = total - progress;

    // 判断消耗
    if(disProgress<=BigInt(eachTimesCost[0].itemNum)){
        eachTimesCost[0].itemNum = disProgress.toString();
        if(!this.player.Item.isEnough(eachTimesCost)){
            return {code:code.err.ERR_INVEST_COST_ITEM_NOT_ENOUGH};
        }
    }else{
        if(!this.player.Item.isEnough(eachTimesCost)){
            return {code:code.err.ERR_INVEST_COST_ITEM_NOT_ENOUGH};
        }
        eachTimesCost[0].itemNum = (
            BigInt(eachTimesCost[0].itemNum)
            *BigInt(investCfg.CostValue[utils.random.random(0,investCfg.CostValue.length-1)])
            /BigInt(10000)
        ).toString();
    }

    const eachTimesReward = utils.proto.encodeConfigAward(prestigeCfg.InvestReward);
    //消耗次数够不够
    if(!this.player.Recovery.judgeRecoveryNum(code.recovery.RECOVERY_TYPE.INVEST,1)){
        return {code:code.err.ERR_INVEST_PROGRESS_TIMES_NOT_ENOUGH};
    }

    //修改数据
    this.player.Recovery.deductRecovery(code.recovery.RECOVERY_TYPE.INVEST,1);
    this.player.Item.modifyItem(eachTimesReward,eachTimesCost, code.reason.OP_INVEST_PROGRESS);
    dataObj.current.progress = (BigInt(progress) + BigInt(eachTimesCost[0].itemNum)).toString();
    this.update(dataObj);
    this.player.Event.emit(code.event.INVEST_PROGRESS.name);
    return {code:code.err.SUCCEEDED, progress:dataObj.current.progress, cost:eachTimesCost};
};

/**
 * 通告杀青
 */
InvestComponent.prototype.investReady = async function(name){
    const dataObj = this.getInvest();
    //是否存在当前项目
    if(!dataObj.current){
        return {code:code.err.ERR_INVEST_HAS_NOT_PROGRESS};
    }
    // 当前项目进度满了吗
    let total;
    if(!dataObj.firstTimeFinish){
        total = BigInt(utils.proto.encodeConfigAward(this.app.Config.Global.get(code.invest.GLOBAL_ID_FIRST_TIME_TOTAL).GlobalJson)[0].itemNum);
    }else{
        const prestigeCfg = this.app.Config.Prestige.get(this.player.lv);
        total = utils.proto.encodeConfigAward(prestigeCfg.InvestTotalCost)[0].itemNum;
    }
    
    if(dataObj.current.progress<total){
        return {code:code.err.ERR_INVEST_PROGRESS_NOT_FULL};
    }

    // 加入project
    const info = {
        id:dataObj.current.id,
        investID:dataObj.current.investID,
        color:dataObj.current.color,
        playerUid:this.player.uid.toString(),
        playerName:this.player.name,
        playerLevel:this.player.lv,
        name:name,
    };
    const {res,err} = await this.app.rpcs.global.investRemote.addProject({},this.player.uid,info);
    if(err){
        logger.error(`增加投资项目失败, uid [${this.player.uid}], info: ${JSON.stringify(info)}`);
        return {code:code.err.FAILED};
    }
    if(res.code!=code.err.SUCCEEDED){
        return {code:res.code};
    }
    delete dataObj.current;
    dataObj.firstTimeFinish = true;
    this.update(dataObj);

    // 刷新列表
    this.refreshInvestList();
    return {
        code:code.err.SUCCEEDED, 
        newProject:info,
        investList: this.getInvestList(),
        isFirstTime: dataObj.firstTimeFinish?0:1,
    };
};

/**
 * 立即通告 
 */
InvestComponent.prototype.investSelf = async function(id){
    const {res,err} = await this.app.rpcs.global.investRemote.investSelf({}, this.player.uid, id);
    if(err){
        logger.error(err);
        return {code:code.err.FAILED};
    }
    if(res.code!=code.err.SUCCEEDED){
        return {code:res.code};
    }

    this.finishInvest(...res.finishParams);
    delete res.finishParams;
    return res;
};

/**
 * 联合通告
 */
InvestComponent.prototype.investTogether = async function(id, targetID){
    const dataObj = this.getInvest();
    if(dataObj.recommendBot && Object.keys(dataObj.recommendBot).indexOf(targetID)>=0){
        // 机器人
        const {res,err} = await this.app.rpcs.global.investRemote.investSelfBot({}, this.player.uid, id);
        if(err){
            logger.error(err);
            return {code:code.err.FAILED};
        }
        if(res.code!=code.err.SUCCEEDED){
            return {code:res.code};
        }
        const finishType = code.invest.FINISH_TYPE.GLOBAL;
        this.finishInvest(...res.finishParams, 
            finishType, 
            dataObj.recommendBot[targetID].investID, 
            dataObj.recommendBot[targetID].color
        );
        res.finishType = finishType;
        delete res.finishParams;
        delete dataObj.recommendBot[targetID];
        this.update(dataObj);
        return res;
    }else{
        // 其他玩家
        const {res,err} = await this.app.rpcs.global.investRemote.investTogether({}, this.player.uid, id, targetID);
        if(err){
            logger.error(err);
            return {code:code.err.FAILED};
        }
        if(res.code!=code.err.SUCCEEDED){
            return {code:res.code};
        }

        this.finishInvest(...res.finishParams);
        delete res.finishParams;
        return res;
    }
};

/**
 * 上市投资时调用
 */
InvestComponent.prototype.finishInvest = function(investID,color,playerLevel,type, targetInvestID, targetColor){
    const config = this.app.Config.Invest.get(investID);
    assert(config, `通告配置id[${investID}]不存在`);
    assert(Object.values(code.invest.COLOR_TYPE).indexOf(color)>=0, `通告品质类型[${color}]不存在`);
    // 金币奖励
    const prestigeCfg = this.app.Config.Prestige.get(playerLevel);
    const coinReward = utils.proto.encodeConfigAward(prestigeCfg.InvestReward);
    let addCooperationRate;
    let targetInvestCfg;
    switch(type){
    case code.invest.FINISH_TYPE.GLOBAL:
    case code.invest.FINISH_TYPE.FRIEND:
    case code.invest.FINISH_TYPE.GUILD:{
        addCooperationRate = config.UniteAddition[type];
        targetInvestCfg = this.app.Config.Invest.get(targetInvestID);
        break;
    }
    default:
        addCooperationRate = 0;
        break;
    }
    let projectAdditions = config.CharacterAddition.length > color? config.CharacterAddition[color]: 0;
    if(targetInvestCfg){
        projectAdditions += targetInvestCfg.CharacterAddition.length > targetColor? targetInvestCfg.CharacterAddition[targetColor]: 0;
    }
    coinReward[0].itemNum = Math.floor(coinReward[0].itemNum * config.RewardValue[color] * (
        10000
        +projectAdditions
        +addCooperationRate
    )/10000);
    // 附加物品奖励
    const itemReward = utils.proto.encodeConfigAward(config.CharacterReward.length > color? config.CharacterReward[color]:{});
    let targetItemReward = [];
    if(targetInvestCfg){
        targetItemReward = utils.proto.encodeConfigAward(targetInvestCfg.CharacterReward.length > targetColor? targetInvestCfg.CharacterReward[targetColor]:{});
    }

    const totalReward = coinReward.concat(itemReward).concat(targetItemReward);

    // 修改数据
    this.player.Item.addItem(totalReward, code.reason.OP_INVEST_FINISH_GET);
    const dataObj = this.getInvest();
    const completeInfo = dataObj.completeInfo || {};
    completeInfo[investID] = (completeInfo[investID] || 0) + 1;
    dataObj.completeInfo = completeInfo;
    this.update(dataObj);
    this.player.Event.emit(code.event.INVEST_COMPLETE.name);
    // 通知变化
    this.player.Notify.notify("onNotifyInvestCompleteInfo",{completeInfo:[{investID:investID,times:completeInfo[investID]}]});
    return totalReward;
};

/**
 * 推荐
 */
InvestComponent.prototype.recommend = async function(){
    const {res,err} = await this.app.rpcs.global.investRemote.recommend({}, this.player.uid);
    if(err){
        logger.error(err);
        return {result:[]};
    }
    let result = res;
    const MIN_NUM = 3;
    if(res.length<MIN_NUM){
        const dataObj = this.getInvest();
        const bots = {};
        const unlockList = this.getUnlockRandomInvestIDs(MIN_NUM - res.length);
        for(const i in unlockList){
            const obj = this.getRandomOneInvest(unlockList[i]);
            bots[i] = {
                id: i.toString(),
                investID: obj.investID, 
                color: obj.color, 
                playerUid: "0",
                playerName: this.app.Config.RoleName.getRandomName(
                    this.player.sex==code.player.SexType.MALE?
                        code.player.SexType.FEMALE:
                        code.player.SexType.MALE
                ),
                playerLevel: 0,
                name: this.app.Config.InvestName.getRandomName(obj.investID),
                tags: [code.invest.FINISH_TYPE.GLOBAL],
                isBot: 1,
            };
        }
        dataObj.recommendBot = bots;
        result = result.concat(Object.values(bots));
    }
    return {result:result};
};

/**
 * 刷新列表(程序内部自己使用)
 */
InvestComponent.prototype.refreshInvestList = function(){
    const dataObj = this.getInvest();
    const randomList = {};
    const unlockList = this.getUnlockRandomInvestIDs(code.invest.MAX_INVEST_NUM);
    for(const investID of unlockList){
        const obj = this.getRandomOneInvest(investID);
        const id = this.genUniqueID();
        randomList[id] = obj;
    }
    dataObj.randomList = randomList;
    this.update(dataObj);
};


/********************************internal function************************************/

/**
 * 随机一个和品质
 */
InvestComponent.prototype.getRandomOneInvest = function(investID){
    const obj = {};
    obj.investID = investID;
    const allColor = Object.values(code.invest.COLOR_TYPE);
    obj.color = allColor[utils.random.randomWeight(this.app.Config.Invest.get(investID).ColorWeight)];
    return obj;
};

/**
 * 获取解锁的投资id列表
 * @returns {Array} id列表
 */
InvestComponent.prototype.getUnlockRandomInvestIDs = function(num){
    const dataObj = this.getInvest();
    const completeInfo = dataObj.completeInfo || {};
    const resultList = [];
    const weightList = [];
    for(const [key, value] of this.app.Config.Invest.entries()){
        let isCanAdd = true;
        for(const needID of Object.keys(value.Condition)){
            const completeTimes = completeInfo[needID] || 0;
            if(completeTimes < value.Condition[needID]){
                isCanAdd = false;
                break;
            }
        }
        if(isCanAdd){
            resultList.push(parseInt(key));
            weightList.push(value.TypeExtract);
        }
    }
    const finalList = [];
    for(let i=0;i<num;i++){
        finalList.push(resultList[utils.random.randomWeight(weightList)]);
    }
    return finalList;
};

/**
 * 唯一id
 */
InvestComponent.prototype.genUniqueID = function(){
    return this.app.Id.genNext(code.id.KEYS.INVEST).toString();
};


/**
 * 获取玩家投资数据对象
 * @return {Object} {xxx:xxx, ...}
 */
InvestComponent.prototype.getInvest = function()
{
    const playerInvest = this.player.get(code.player.Keys.INVEST) || {};
    return playerInvest;
};

/**
 * 更新玩家投资数据库
 * @param {Object} playerInvest 玩家投资数据对象
 */
InvestComponent.prototype.update = function(playerInvest){
    this.player.set(code.player.Keys.INVEST, playerInvest);
};
