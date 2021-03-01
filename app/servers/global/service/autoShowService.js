/**
 * @description 车展数据管理服务
 * @author jzy
 * @date 2020/05/21
 */
const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const bearcat = require('bearcat');
const code = require('@code');
const utils = require('@util');
const mongoAutoShow = require('@mongo/mongoAutoShow');

const AutoShowService = function () {
    this.$id = 'global_AutoShowService';
    this.app = null;

    this.mainCache = {};        // this.mainCache[uid][type] = data;
    this.botCache = {};         // this.botCache[selfUid][uid][type] = data;
    this.botBattleInfo = {};
};

module.exports = AutoShowService;
bearcat.extend('global_AutoShowService', 'logic_BaseService');

/**
 * 开始车展调用
 */
AutoShowService.prototype.start = async function(remoteInfo){
    const {uid, type, startTime, rewardTypeIndex} = remoteInfo;
    if(this.get(uid, type)){
        return {code:code.err.ERR_AUTO_SHOW_PROJECT_EXIST}; // 项目已存在
    }
    const data = this.add(uid, type);
    data.update({startTime:startTime, rewardTypeIndex:rewardTypeIndex});
    return {code:code.err.SUCCEEDED, autoShowItemInfo: await this.__getInfo(data)};
};

/**
 * 结束车展调用
 */
AutoShowService.prototype.end = function(remoteInfo){
    const {uid, type, lv, isInAdvance} = remoteInfo;
    const data = this.get(uid, type);
    if(!data){
        return {code:code.err.ERR_AUTO_SHOW_PROJECT_NOT_EXIST}; // 项目不存在
    }
    const rewardTypeIndex = data.get("rewardTypeIndex");
    const startTime = data.get("startTime");
    const beAttackedTimes = data.get("beAttackedTimes");
    const config = this.app.Config.AutoShow.get(type);

    // 计算时间
    const onShowTime = (Math.floor(Date.now()-startTime)/1000);
    const maxTime = config.ExhibitionTime[rewardTypeIndex];
    if(!isInAdvance&&onShowTime<maxTime){
        return {code:code.err.ERR_AUTO_SHOW_PROJECT_NOT_END}; // 展出未结束
    }else if(isInAdvance&&onShowTime>=maxTime){
        return {code:code.err.ERR_AUTO_SHOW_PROJECT_HAS_END}; // 展出已结束
    }
    const timeRate = Math.min(onShowTime/maxTime,1);

    // 计算奖励
    const itemID = config.RewardType[rewardTypeIndex];
    const order = this.app.Config.Prestige.get(lv).Order;
    const baseReward = utils.proto.encodeConfigAward({[itemID]:this.app.Config.AutoShowReward.get(order).Reward[itemID]});
    const rate = Math.max(10000 - beAttackedTimes*config.BeRobbedRatio, 0);
    let reward = rate==0?[]:utils.item.multi(baseReward,rate,10000);
    if(isInAdvance){
        reward = utils.item.multi(reward, timeRate);
    }

    this.delete(uid, type);
    return {code:code.err.SUCCEEDED, reward:reward};
};

/**
 * 抢单
 */
AutoShowService.prototype.rob = async function(remoteInfo){
    const {maxCardPower, targetUid, type, selfArray, selfInfo} = remoteInfo;
    const data = this.get(targetUid, type);
    const botData = this._getBotAutoShowInfo(selfInfo.uid, targetUid, type);
    if(!data && !botData){
        this.app.Notify.notify(selfInfo.uid, "onNotifyAutoShowClear", {infoList:[{k:targetUid.toString(),v:type}]});
        return {code:code.err.ERR_AUTO_SHOW_PROJECT_NOT_EXIST}; // 项目不存在
    }
    const isBot = data==undefined?true:false;
    let rewardTypeIndex;
    let startTime;
    let beAttackedTimes;
    let beAttackedRecord;
    if(isBot){
        rewardTypeIndex = botData.rewardTypeIndex;
        startTime = botData.startTime;
        beAttackedTimes = botData.beAttackedTimes;
        beAttackedRecord = botData.beAttackedRecord;
    }else{
        rewardTypeIndex = data.get("rewardTypeIndex");
        startTime = Math.floor(data.get("startTime")/1000);
        beAttackedTimes = data.get("beAttackedTimes");
        beAttackedRecord = data.get("beAttackedRecord");
    }
    const config = this.app.Config.AutoShow.get(type);
    

    // 可被抢单次数
    if(beAttackedTimes+1>config.BeRobbedTimes){
        return {code:code.err.ERR_AUTO_SHOW_ROB_TIMES_LIMIT}; // 可被抢单次数已达上限
    }

    // 计算时间
    const onShowTime = utils.time.nowSecond()-startTime;
    const maxTime = config.ExhibitionTime[rewardTypeIndex];
    if(onShowTime>=maxTime){
        return {code:code.err.ERR_AUTO_SHOW_PROJECT_HAS_END}; // 展出已结束
    }

    // 难度系数
    let rate;
    let targetBrief;
    if(isBot){
        rate = this._getBotDifficultyRate(selfInfo.uid, targetUid, type, maxCardPower);
    }else{
        targetBrief = await this.app.Brief.getBrief(targetUid);
        rate = this.getDifficultyRate(targetBrief, type, maxCardPower);
    }
    
    
    let difficultyIndex;
    if(rate<config.Difficulty[0]){
        difficultyIndex = 0;
    }else if (rate>=config.Difficulty[config.Difficulty.length-1]){
        difficultyIndex = config.Difficulty.length-2;
    }else {
        for(let i=0;i<config.Difficulty.length-1;i++){
            if(rate >= config.Difficulty[i] && rate < config.Difficulty[i+1]){
                difficultyIndex = i;
                break;
            }
        }
    }
    // 计算奖励
    let level;
    let botBattleInfo;
    if(isBot){
        botBattleInfo = this._getBotBattleInfo(selfInfo.uid, targetUid, type);
        level = botBattleInfo.enemyInfo.lv;
    }else{
        level = targetBrief.lv;
    }
    const itemID = config.RewardType[rewardTypeIndex];
    const basePrestige = {itemID:code.currency.CURRENCY_ID.REPUTATION,itemNum:config.BasePrestige[rewardTypeIndex]};
    const order = this.app.Config.Prestige.get(level).Order;
    const baseReward = utils.proto.encodeConfigAward({[itemID]:this.app.Config.AutoShowReward.get(order).Reward[itemID]});
    const reward = utils.item.multi(baseReward.concat(basePrestige), config.RobbedRatio[difficultyIndex], 10000);

    // 战斗
    let enemyInfo;
    let enemyArray;
    if(isBot){
        enemyInfo = {uid:botBattleInfo.enemyInfo.uid, name:botBattleInfo.enemyInfo.name};
        enemyArray = botBattleInfo.enemyArray;
    }else{
        enemyInfo = { uid:targetBrief.uid, name:targetBrief.name };
        enemyArray = this.getTargetBattleCardInfo(targetBrief, type);
    }
    const {err,res} = await this.app.rpcs.battle.battleRemote.startBattle(
        {}, 
        code.battle.BATTLE_TYPE.AUTO_SHOW, 
        selfInfo,
        selfArray, 
        enemyInfo,
        enemyArray, 
        reward,
    );
    let isWin;
    if(err){
        isWin = false;
        logger.error(err);
    }else{
        isWin = res.isWin;
    }
    const award = res.award;

    if(isBot){
        if(isWin){
            botData.beAttackedTimes = beAttackedTimes+1;
        }
    }else{
        // 数据库
        const dbObj = {};
        if(isWin){
            // 抢单成功 被抢次数+1
            dbObj.beAttackedTimes = beAttackedTimes+1;
        }

        // 抢单记录
        const newRecord = {
            uid:selfInfo.uid,
            name:selfInfo.name,
            isWin:isWin,
            time:Date.now(),
        };
        beAttackedRecord.push(newRecord);
        dbObj.beAttackedRecord = beAttackedRecord;

        // 修改数据
        data.update(dbObj);
        //通知
        this.app.Notify.notify(targetUid, "onNotifyAutoShowBeRobbed", {
            uid:targetUid.toString(),
            type:type,
            beAttackedTimes:data.get("beAttackedTimes"),
            newBattleRecord:{
                uid:newRecord.uid.toString(),
                name:newRecord.name.toString(),
                isWin:newRecord.isWin?1:0,
                time:Math.floor(newRecord.time/1000),
            },
        });
    }
    

    return {code:code.err.SUCCEEDED, isWin:isWin, reward:award};
};

/**
 * 推荐
 */
AutoShowService.prototype.recommend = async function(remoteInfo){
    const { maxCardPower, selfUid, selfLevel } = remoteInfo;
    const difficultyList = {}; // difficultyList[difficulty] = [1,1,1];
    const outDiffList = [];
    // 筛选
    for(const [uid, typeObj] of Object.entries(this.mainCache)){
        if(uid==selfUid){ continue; }
        for(const [type, data] of Object.entries(typeObj)){
            const config = this.app.Config.AutoShow.get(type);
            const startTime = data.get("startTime");
            const rewardTypeIndex = data.get("rewardTypeIndex");
            const beAttackedTimes = data.get("beAttackedTimes");
            if((Date.now()-startTime)/1000>=config.ExhibitionTime[rewardTypeIndex]){
                // 过滤掉已结束车展
                continue;
            }
            if(beAttackedTimes+1>config.BeRobbedTimes){
                // 过滤掉不能再抢单的车展
                continue;
            }

            const targetBrief = await this.app.Brief.getBrief(uid);
            const rate = this.getDifficultyRate(targetBrief, type, maxCardPower);
            const rateList = config.Difficulty;
            const info = await this.__getInfo(data);
            if(rate<rateList[0] || rate>=rateList[rateList.length-1]){
                outDiffList.push(info);
            }else {
                for(let i=0;i<rateList.length-1;i++){
                    if(rate >= rateList[i] && rate < rateList[i+1]){
                        difficultyList[i] = difficultyList[i] || [];
                        difficultyList[i].push(info);
                        break;
                    }
                }
            }
        }
    }

    const weight = code.autoShow.DIFFICULTY_RATE_LIST.concat();
    let isOutDiff = true;
    for(let i = 0; i < weight.length; i++){
        if(!difficultyList[i] || difficultyList[i].length <= 0){
            weight[i] = 0;
        }else{
            isOutDiff = false;
        }
    }
    let result = [];
    for(let i = 0;i<code.autoShow.RANDOM_RECOMMEND_NUM; i++){
        if(isOutDiff){
            result = result.concat(utils.random.randomArrayElements(outDiffList, code.autoShow.RANDOM_RECOMMEND_NUM - i));
            break;
        }
        const typeIndex = utils.random.randomWeight(weight);
        const infoIndex = utils.random.random(0,difficultyList[typeIndex].length-1);
        const info = difficultyList[typeIndex][infoIndex];
        // 过滤已选中
        difficultyList[typeIndex].splice(infoIndex,1);
        if(difficultyList[typeIndex].length <=0 ){ 
            weight[typeIndex]=0;
            isOutDiff = true;
            for(const tempList of Object.values(difficultyList)){
                if(tempList.length>0){
                    isOutDiff = false;
                }
            }
        }

        result.push(info);
    }

    // 如果刷新出来的result数量还是小于最大推荐数量，则生成机器人
    result = result.concat(this.getRandomBotInfo(selfUid, selfLevel, maxCardPower, code.autoShow.RANDOM_RECOMMEND_NUM-result.length));
    
    return result;
};

/**
 * 获取信息
 */
AutoShowService.prototype.getInfo = async function(remoteInfo){
    const { selfUid, queryList, isSelfQuery } = remoteInfo;
    const result = [];
    for(const {uid,type,hasRobbed} of queryList){
        const data = this.get(uid,type);
        const botData = this._getBotAutoShowInfo(selfUid, uid, type);
        let info;
        if(data){
            info = await this.__getInfo(data, isSelfQuery?true:false);
        }else if (botData){
            info = botData;
        }
        if(info){
            info.hasRobbed = hasRobbed?1:0;
            result.push(info);
        }
    }
    return result;
};


AutoShowService.prototype.__getInfo = async function(data, isGetBattleRecord = false){
    const uid = data.get("uid");
    const brief = await this.app.Brief.getBrief(uid);
    const obj = {
        uid:uid.toString(),
        type:data.get("type"),
        rewardTypeIndex:data.get("rewardTypeIndex"),
        startTime:Math.floor(data.get("startTime")/1000),
        playerName:brief.name,
        beAttackedTimes:data.get("beAttackedTimes"),
        isBot:0,
        targetLevel:brief.lv,
    };
    if(isGetBattleRecord){
        // const config = this.app.Config.AutoShow.get(obj.type);
        // const onShowTime = utils.time.nowSecond()-obj.startTime;
        // const maxTime = config.ExhibitionTime[obj.rewardTypeIndex];
        // if(onShowTime>=maxTime){
        const beAttackedRecord = data.get("beAttackedRecord");
        obj.battleRecord = beAttackedRecord.map(info=>{return {
            uid:info.uid.toString(),
            name:info.name,
            isWin:info.isWin?1:0,
            time:Math.floor(info.time/1000)
        };});
        // }
    }
    return obj;
};


AutoShowService.prototype.getDifficultyRate = function(targetBrief, type, maxCardPower){
    let totalPower = 0;
    for(const info of Object.values(targetBrief.autoShow[type] || {})){
        totalPower += info.power;
    }
    return 10000*totalPower/maxCardPower;
};

AutoShowService.prototype.getTargetBattleCardInfo = function(targetBrief, type){
    const targetArray = [];
    for(const [id,info] of Object.entries(targetBrief.autoShow[type] || {})){
        const cardCfg = this.app.Config.Card.get(parseInt(id));
        if(cardCfg){
            const skillCfg = this.app.Config.Skill.getByLevel(cardCfg.Skill, info.star + 1);
            const afterAttr = info.attrs;
            targetArray.push({
                id: parseInt(id),
                hp: utils.random.random(afterAttr[code.attribute.ATTR_TYPE.HP_MIN], afterAttr[code.attribute.ATTR_TYPE.HP_MAX]),
                atk: utils.random.random(afterAttr[code.attribute.ATTR_TYPE.ATTACK_MIN], afterAttr[code.attribute.ATTR_TYPE.ATTACK_MAX]),
                skill: skillCfg ? skillCfg.Id : 0,
            });
        }
    }
    return targetArray;
};

/*********************************bot function********************************/

AutoShowService.prototype.getRandomBotInfo = function(selfUid, level, playerPower, num){
    this._deleteBotInfo(selfUid);
    if(num<=0){ return []; }
    const allAutoShow = this.app.Config.AutoShow.values();
    const result = [];
    const totalPowerList = [];
    const configList = [];
    for(let i=0;i<num;i++){
        const config = allAutoShow[utils.random.random(0,allAutoShow.length-1)];
        const difficulty = utils.random.randomWeight(code.autoShow.DIFFICULTY_RATE_LIST.concat());
        const totalPower = Math.floor(utils.random.random(config.Difficulty[difficulty],config.Difficulty[difficulty+1])*playerPower/10000);
        totalPowerList.push(totalPower);
        configList.push(config);
    }
    
    const bossList = this.app.Config.CardArray.getRandomAutoShowBot(level, totalPowerList, num);
    for(const i in bossList){
        const boss = bossList[i];
        const config = configList[i];
        const obj = {
            uid:boss.enemyInfo.uid.toString(),
            type:config.Id,
            rewardTypeIndex:utils.random.random(0,config.RewardType.length-1),
            startTime:utils.time.nowSecond(),
            playerName:boss.enemyInfo.name,
            beAttackedTimes:0,
            isBot: 1,
            cardInfo:this._covertBotArray(boss.enemyInfo, boss.enemyArray),
            targetLevel:boss.enemyInfo.lv,
        };
        result.push(obj);
        this._addBotInfo(selfUid, boss.enemyInfo.uid,config.Id,obj,boss);
    }
    return result;
};

AutoShowService.prototype._addBotInfo = function(selfUid, uid, type, autoShowInfo, battleInfo){
    this.botCache[selfUid] = this.botCache[selfUid] || {};
    this.botCache[selfUid][uid] = this.botCache[selfUid][uid] || {};
    this.botCache[selfUid][uid][type] = autoShowInfo;
    this.botBattleInfo[selfUid] = this.botBattleInfo[selfUid] || {};
    this.botBattleInfo[selfUid][uid] = this.botBattleInfo[selfUid][uid] || {};
    this.botBattleInfo[selfUid][uid][type] = battleInfo;
};

AutoShowService.prototype._getBotAutoShowInfo = function(selfUid, uid, type){
    if(this.botCache[selfUid] && this.botCache[selfUid][uid]){
        return this.botCache[selfUid][uid][type];
    }
};

AutoShowService.prototype._getBotBattleInfo = function(selfUid, uid, type){
    if(this.botBattleInfo[selfUid] && this.botBattleInfo[selfUid][uid]){
        return this.botBattleInfo[selfUid][uid][type];
    }
};

AutoShowService.prototype._getBotDifficultyRate = function(selfUid, uid, type, maxCardPower){
    const battleInfo = this._getBotBattleInfo(selfUid, uid, type);
    return 10000*battleInfo.enemyInfo.power/maxCardPower;
};

AutoShowService.prototype._deleteBotInfo = function(selfUid){
    delete this.botCache[selfUid];
    delete this.botBattleInfo[selfUid];
};

AutoShowService.prototype._covertBotArray = function(botInfo, botArray){
    const result = [];
    for(const i in botArray){
        const info = botArray[i];
        result.push({
            cardId:info.id,
            level:botInfo.lv,
            star:0,
            attrs:{
                hpMin:info.hp,
                hpMax:info.hp,
                attackMin:info.atk,
                attackMax:info.atk,
            },
            power:botInfo.eachPower[i],
        });
    }
    return result;
};


/******************************internal function******************************/

/**
 * 初始化把所有数据加载到内存
 */
AutoShowService.prototype.init = async function(){
    const res = await mongoAutoShow.query({});
    for(const data of res){
        const uid = data.get('uid');
        const type = data.get('type');
        this.mainCache[uid] = this.mainCache[uid] || {};
        this.mainCache[uid][type] = data;
    }
};

AutoShowService.prototype.get = function(uid, type){
    if(this.mainCache[uid]){
        return this.mainCache[uid][type];
    }
};

AutoShowService.prototype.add = function(uid, type){
    const data = new mongoAutoShow({ uid:uid, type:type });
    this.mainCache[uid] = this.mainCache[uid] || {};
    this.mainCache[uid][type] = data;
    data.update();
    return data;
};

AutoShowService.prototype.delete = function(uid, type){
    if(!this.mainCache[uid]){
        return;
    }
    const data = this.mainCache[uid][type];
    if(!data){
        return;
    }
    data.delete();
    delete this.mainCache[uid][type];
};