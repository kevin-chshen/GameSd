/**
 * @description 任务模块
 * @author jzy
 * @date 2020/04/03
 */

const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const code = require('@code');
const utils = require('@util');
const bearcat = require('bearcat');
const assert = require('assert');

const MissionComponent = function(app, player){
    this.$id = 'game_MissionComponent';
    this.$scope = 'prototype';
    this.app = app;
    this.player = player;

    // 任务缓存信息，用来判断是否需要发给前端更新数据  {[ID]:[Progress]}
    this.missionInfoCache = {};
};

module.exports = MissionComponent;
bearcat.extend('game_MissionComponent', 'game_Component');

/*************************定义新类型任务可能会用到的接口*******************/
/** 【接口编写指南】
 * ① 进度获取方式有两种：  1.直接从各个系统获取   2.使用事件注册和触发或者直接设置进度，内部使用setValue设置进度
 * ② 然后在getValueWay函数中定义进度(返回值)，这个进度可以为【任意形式】，（注：上面若使用了setValue可以用getValue方法获取）
 * ③ 默认情况下进度值直接使用上面getValueWay定义返回的值，视情况可以在valueExplain中定义进度怎么解释为一个数值
 */

/**
 * 定义值获取途径，每种类型对应的函数返回值可以为任意表现进度的形式
 * 进度的最终解释方法由valueExplain定义
 */
MissionComponent.prototype.getValueWay = function(){
    const self = this;
    return {
        // 点击住宅
        [code.mission.BEHAVIOR_TYPE.CLICK_HOUSE_TIMES]:function(){
            return self.getValue(code.mission.BEHAVIOR_TYPE.CLICK_HOUSE_TIMES) || 0;
        },
        // 建造平台 [id,id,id] id为字符串
        [code.mission.BEHAVIOR_TYPE.PLATFORM_BUILD]:function(){
            return Object.keys(self.player.LivePfBase.platforms());
        },
        // 指定平台招募人员数量 {id:num}
        [code.mission.BEHAVIOR_TYPE.PLATFORM_ID_RECRUIT]:function(){
            const platforms = self.player.LivePfBase.platforms();
            const obj = {};
            for(const key of Object.keys(platforms)){
                obj[key] = platforms[key].num;
            }
            return obj;
        },
        // 平台总招募数量
        [code.mission.BEHAVIOR_TYPE.PLATFORM_RECRUIT]:function(){
            const platforms = self.player.LivePfBase.platforms();
            let total = 0;
            for(const plat of Object.values(platforms)){
                total += plat.num || 0;
            }
            return total;
        },
        // 解锁主播
        [code.mission.BEHAVIOR_TYPE.CARD_UNLOCK]:function(){
            return Object.keys(self.player.Card.cardDict || {});
        },
        // 赚钱速度
        [code.mission.BEHAVIOR_TYPE.EARN_CASH_PER_SECOND]:function(){
            return Number(self.player.cashPerSecond);
        },
        // 拥有X个X级人才 [level,level,level]
        [code.mission.BEHAVIOR_TYPE.CARD_LEVEL_NUM]:function(){
            const list = [];
            for(const info of self.player.Card.cardGetInfo()){
                list.push(info.level);
            }
            return list;
        },
        // 主播总等级
        [code.mission.BEHAVIOR_TYPE.CARD_TOTAL_LEVEL]:function(){
            let total = 0;
            for(const info of self.player.Card.cardGetInfo()){
                total += info.level;
            }
            return total;
        },
        // 关卡进度
        [code.mission.BEHAVIOR_TYPE.DUNGEON_PROGRESS]:function(){
            return self.player.Dungeon.getMaxCompleteMatchID();
        },
        // 主线关卡
        [code.mission.BEHAVIOR_TYPE.DUNGEON]:function(){
            return self.player.Dungeon.getMaxCompleteMatchID();
        },
        // 关卡前进
        [code.mission.BEHAVIOR_TYPE.DUNGEON_FORWARD]:function(){
            return self.getValue(code.mission.BEHAVIOR_TYPE.DUNGEON_FORWARD) || 0;
        },
        // 平台扩建数量 [level,level,level]
        [code.mission.BEHAVIOR_TYPE.PLATFORM_UP_LEVEL_NUM]:function(){
            const platforms = self.player.LivePfBase.platforms();
            const result = [];
            for(const key of Object.keys(platforms)){
                if(Number(key) == code.live.PLATFORM_BASE){
                    // 过滤主平台
                    continue;
                }
                result.push(platforms[key].level);
            }
            return result;
        },
        // 指定平台扩建等级 {id:level}
        [code.mission.BEHAVIOR_TYPE.PLATFORM_UP_LEVEL]:function(){
            const platforms = self.player.LivePfBase.platforms();
            const obj = {};
            for(const key of Object.keys(platforms)){
                obj[key] = platforms[key].level;
            }
            return obj;
        },
        // 投资注资次数
        [code.mission.BEHAVIOR_TYPE.INVEST_PROGRESS]:function(){
            return self.getValue(code.mission.BEHAVIOR_TYPE.INVEST_PROGRESS) || 0;
        },
        // 等级提升
        [code.mission.BEHAVIOR_TYPE.LEVEL_UP]:function(){
            return self.player.lv;
        },
        // 团建次数
        [code.mission.BEHAVIOR_TYPE.FRIENDSHIP_TIMES]:function(){
            return self.getValue(code.mission.BEHAVIOR_TYPE.FRIENDSHIP_TIMES) || 0;
        },
        // 团建完成次数
        [code.mission.BEHAVIOR_TYPE.FRIENDSHIP_FINISH_TIMES]:function(){
            return self.getValue(code.mission.BEHAVIOR_TYPE.FRIENDSHIP_FINISH_TIMES) || 0;
        },
        // 拥有X品质豪车数量{[品质]:数量}
        [code.mission.BEHAVIOR_TYPE.CAR_QUALITY_NUM]:function(){
            const obj = {};
            for (const carObj of Object.values(self.player.Car.carDict)){
                const carId = carObj.getDBData().cId;
                const carConfig = self.app.Config.Car.get(carId);
                if(!carConfig){
                    logger.error(`豪车id[${carId}]配置不存在`);
                    continue;
                }
                const quality = carConfig.Quality;
                obj[quality] = (obj[quality] || 0) + 1;
            }
            return obj;
        },
        // 俱乐部送礼次数
        [code.mission.BEHAVIOR_TYPE.CLUB_GIFT_SEND]:function(){
            return self.getValue(code.mission.BEHAVIOR_TYPE.CLUB_GIFT_SEND) || 0;
        },
        // 俱乐部达到X级的数量  [level,level,level]
        [code.mission.BEHAVIOR_TYPE.CLUB_LEVEL_NUM]:function(){
            const list = [];
            for (const clubObj of Object.values(self.player.Club.clubDict)) {
                list.push(clubObj.getLv());
            }
            return list;
        },
        // 总战力
        [code.mission.BEHAVIOR_TYPE.TOTAL_POWER]:function(){
            return self.player.power;
        },
        // 商务区等级
        [code.mission.BEHAVIOR_TYPE.PLATFORM_MAIN_LEVEL]:function(){
            const platform = self.player.LivePfBase.platforms();
            if(platform[code.live.PLATFORM_BASE]){
                return platform[code.live.PLATFORM_BASE].level || 0;
            }else{
                return 0;
            }
        },
        // 拥有X品质及以上主播数量{[品质]:数量}
        [code.mission.BEHAVIOR_TYPE.CARD_QUALITY_NUM]:function(){
            const obj = {};
            for(const cardObj of Object.values(self.player.Card.cardDict || {})){
                const cardConfig = self.app.Config.Card.get(cardObj.cardId);
                if(!cardConfig){
                    logger.error(`卡片id[${cardObj.cardId}]配置不存在`);
                    continue;
                }
                const quality = cardConfig.Quality;
                obj[quality] = (obj[quality] || 0) + 1;
            }
            return obj;
        },
        // 拥有X阶及以上主播数量{[阶级]:数量}
        [code.mission.BEHAVIOR_TYPE.CARD_STAGE_NUM]:function(){
            const obj = {};
            for(const cardObj of Object.values(self.player.Card.cardDict || {})){
                const cardData = cardObj.getData();
                obj[cardData.stage] = (obj[cardData.stage] || 0) + 1;
            }
            return obj;
        },
        // 主播提高阶数次数
        [code.mission.BEHAVIOR_TYPE.CARD_STAGE_UP_TIMES]:function(){
            return self.getValue(code.mission.BEHAVIOR_TYPE.CARD_STAGE_UP_TIMES) || 0;
        },
        // 拥有X星级及以上主播数量{[星级]:数量}
        [code.mission.BEHAVIOR_TYPE.CARD_STAR_NUM]:function(){
            const obj = {};
            for(const cardObj of Object.values(self.player.Card.cardDict || {})){
                const cardData = cardObj.getData();
                obj[cardData.star] = (obj[cardData.star] || 0) + 1;
            }
            return obj;
        },
        // 豪车置换X品质及以上的数量{[品质]:数量}
        [code.mission.BEHAVIOR_TYPE.CAR_EXCHANGE_NUM]:function(){
            return self.getValue(code.mission.BEHAVIOR_TYPE.CAR_EXCHANGE_NUM) || {};
        },
        // 拥有X等级豪车数量{[等级]:数量}
        [code.mission.BEHAVIOR_TYPE.CAR_LEVEL_NUM]:function(){
            const obj = {};
            for (const carObj of Object.values(self.player.Car.carDict || {})){
                const level = carObj.getDBData().level;
                obj[level] = (obj[level] || 0) + 1;
            }
            return obj;
        },
        // 豪车改造次数
        [code.mission.BEHAVIOR_TYPE.CAR_REFIT_TIMES]:function(){
            return self.getValue(code.mission.BEHAVIOR_TYPE.CAR_REFIT_TIMES) || 0;
        },
        // 豪车升级次数
        [code.mission.BEHAVIOR_TYPE.CAR_UP_LEVEL_TIMES]:function(){
            return self.getValue(code.mission.BEHAVIOR_TYPE.CAR_UP_LEVEL_TIMES) || 0;
        },
        // 豪车总等级
        [code.mission.BEHAVIOR_TYPE.CAR_TOTAL_LEVEL]:function(){
            let total = 0;
            for (const carObj of Object.values(self.player.Car.carDict || {})){
                const level = carObj.getDBData().level;
                total += level;
            }
            return total;
        },
        // 投资完成项目数量
        [code.mission.BEHAVIOR_TYPE.INVEST_COMPLETE]:function(){
            const completeInfo = self.player.Invest.getInvest().completeInfo || {};
            let total = 0;
            for(const num of Object.values(completeInfo)){
                total += num;
            }
            return total;
        },
        // 主播升级次数
        [code.mission.BEHAVIOR_TYPE.CARD_LEVEL_UP_TIMES]:function(){
            return self.getValue(code.mission.BEHAVIOR_TYPE.CARD_LEVEL_UP_TIMES) || 0;
        },
        // 商店X购买次数 {shopId:xxx}
        [code.mission.BEHAVIOR_TYPE.SHOP_ID_BUY_TIMES]:function(){
            return self.getValue(code.mission.BEHAVIOR_TYPE.SHOP_ID_BUY_TIMES) || {};
        },
        // 派遣主播到指定平台 {[平台id]:[id,id,id]}
        [code.mission.BEHAVIOR_TYPE.PLATFORM_TARGET_CARD_ID]:function(){
            const platforms = self.player.LivePfBase.platforms();
            const obj = {};
            for(const platformId of Object.keys(platforms)){
                obj[platformId] = Object.keys(platforms[platformId].cards || {});
            }
            return obj;
        },
        // 派遣主播到指定平台的数量 {[平台id]:主播数量}
        [code.mission.BEHAVIOR_TYPE.PLATFORM_TARGET_CARD_NUM]:function(){
            const platforms = self.player.LivePfBase.platforms();
            const obj = {};
            for(const platformId of Object.keys(platforms)){
                obj[platformId] = Object.keys(platforms[platformId].cards || {}).length;
            }
            return obj;
        },
        // 领取通关奖励 [宝箱id]
        [code.mission.BEHAVIOR_TYPE.DUNGEON_RECEIVE_REWARD]:function(){
            return self.player.Dungeon.getHasReceiveBoxID();
        },
        // 上阵主播数量
        [code.mission.BEHAVIOR_TYPE.CARD_UP_FORMATION_NUM]:function(){
            return (self.player.formation || []).length;
        },
        // 主播装备的X品质及以上豪车数量 {品质ID: num}
        [code.mission.BEHAVIOR_TYPE.CARD_EQUIP_CAR_NUM]:function(){
            const obj = {};
            const carEquip = self.player.carInfo.carEquip || {};
            for(const carId of Object.keys(carEquip)){
                if(carEquip[carId]>0){
                    const carObj = self.player.Car.getCarObj(Number(carId));
                    if(carObj){
                        const cId = carObj.getDBData().cId;
                        const config = self.app.Config.Car.get(Number(cId));
                        if(!config){
                            logger.error(`豪车id[${cId}]配置不存在`);
                            continue;
                        }
                        const quality = config.Quality;
                        obj[quality] = (obj[quality] || 0) + 1;
                    }
                }
            }
            return obj;
        },
        // 车展开始次数
        [code.mission.BEHAVIOR_TYPE.AUTO_SHOW_START]:function(){
            return self.getValue(code.mission.BEHAVIOR_TYPE.AUTO_SHOW_START) || 0;
        },
        // 车展抢单次数
        [code.mission.BEHAVIOR_TYPE.AUTO_SHOW_ROB]:function(){
            return self.getValue(code.mission.BEHAVIOR_TYPE.AUTO_SHOW_ROB) || 0;
        },
        // 登陆天数
        [code.mission.BEHAVIOR_TYPE.LOGIN_DAYS]:function(){
            return self.player.loginDays;
        },
        // 黄金月卡领取次数
        [code.mission.BEHAVIOR_TYPE.GOLD_CARD_RECEIVE]:function(){
            return self.getValue(code.mission.BEHAVIOR_TYPE.GOLD_CARD_RECEIVE) || 0;
        },
        // 黑钻月卡领取次数
        [code.mission.BEHAVIOR_TYPE.BLACK_CARD_RECEIVE]:function(){
            return self.getValue(code.mission.BEHAVIOR_TYPE.BLACK_CARD_RECEIVE) || 0;
        },
        // 联盟历史最高等级
        [code.mission.BEHAVIOR_TYPE.GUILD_LV]:function(){
            return self.getValue(code.mission.BEHAVIOR_TYPE.GUILD_LV) || 0;
        },
        // 流量为王挑战次数
        [code.mission.BEHAVIOR_TYPE.FLOW_RATE_CHALLENGE_TIMES]:function(){
            return self.getValue(code.mission.BEHAVIOR_TYPE.FLOW_RATE_CHALLENGE_TIMES) || 0;
        },
        // 流量为王历史最高排名
        [code.mission.BEHAVIOR_TYPE.FLOW_RATE_MAX_RANK]:function(){
            return self.getValue(code.mission.BEHAVIOR_TYPE.FLOW_RATE_MAX_RANK);
        },
        // 流量为王挑战胜利次数
        [code.mission.BEHAVIOR_TYPE.FLOW_RATE_WIN_TIMES]:function(){
            return self.getValue(code.mission.BEHAVIOR_TYPE.FLOW_RATE_WIN_TIMES) || 0;
        },
        // 火力全开次数
        [code.mission.BEHAVIOR_TYPE.PLATFORM_POWER_FULL_TIMES]:function(){
            return self.getValue(code.mission.BEHAVIOR_TYPE.PLATFORM_POWER_FULL_TIMES) || 0;
        },
    };
};

/**
 * 保存的值最终解释成进度的方法，不填的话默认直接使用getValueWay里面定义的函数的返回值 （降维）
 * saveValue为getValueWay内定方法的返回值，params为任务配表TaskConditionArr参数, isTotalProgress表示这个返回值是不是总进度
 */
MissionComponent.prototype.valueExplain = function(){
    return {
        // 平台建造
        [code.mission.BEHAVIOR_TYPE.PLATFORM_BUILD]:function(saveValue, params, isTotalProgress){
            if(isTotalProgress){ return 1; }
            return saveValue.indexOf(params[0].toString())>=0?1:0;
        },
        // 指定平台招募人员数量 {id:num}
        [code.mission.BEHAVIOR_TYPE.PLATFORM_ID_RECRUIT]:function(saveValue, params, isTotalProgress){
            if(isTotalProgress){ return params[1]; }
            return saveValue[params[0]] || 0;
        },
        // 解锁主播
        [code.mission.BEHAVIOR_TYPE.CARD_UNLOCK]:function(saveValue, params, isTotalProgress){
            if(isTotalProgress){ return 1; }
            return saveValue.indexOf(params[0].toString())>=0?1:0;
        },
        // 拥有X个X级人才
        [code.mission.BEHAVIOR_TYPE.CARD_LEVEL_NUM]:function(saveValue, params, isTotalProgress){
            if(isTotalProgress){
                return params[0];
            }
            let cnt = 0;
            for(const level of saveValue){
                if(level>=params[1]){
                    cnt++;
                }
            }
            return cnt;
        },
        // 关卡进度
        [code.mission.BEHAVIOR_TYPE.DUNGEON_PROGRESS]:function(saveValue, params, isTotalProgress){
            if(isTotalProgress){
                return 1;
            }
            let cnt = 0;
            for(const checkPoint of params){
                const missionLevel = Math.floor(saveValue/10);
                const secondLevel = saveValue - missionLevel*10;
                if(missionLevel>checkPoint || (missionLevel==checkPoint&&secondLevel>=code.dungeon.MATCH_TYPE.FINAL)){
                    cnt++;
                }
            }
            return cnt;
        },
        // 主线关卡
        [code.mission.BEHAVIOR_TYPE.DUNGEON]:function(saveValue, params, isTotalProgress){
            if(isTotalProgress){
                return 1;
            }
            let cnt = 0;
            for(const checkPoint of params){
                if(saveValue>=checkPoint){
                    cnt++;
                }
            }
            return cnt;
        },
        // 平台扩建等级数量 [level,level,level]
        [code.mission.BEHAVIOR_TYPE.PLATFORM_UP_LEVEL_NUM]:function(saveValue, params, isTotalProgress){
            if(isTotalProgress){ return params[0]; }
            let cnt = 0;
            for(const level of saveValue){
                if(level>=params[1]){
                    cnt++;
                }
            }
            return cnt;
        },
        // 指定平台扩建等级 {id:level}
        [code.mission.BEHAVIOR_TYPE.PLATFORM_UP_LEVEL]:function(saveValue, params, isTotalProgress){
            if(isTotalProgress){ return params[1]; }
            return saveValue[params[0]] || 0;
        },
        // 拥有X品质及以上主播数量{[品质]:数量}
        [code.mission.BEHAVIOR_TYPE.CARD_QUALITY_NUM]:function(saveValue, params, isTotalProgress){
            if(isTotalProgress){ return params[1]; }
            let total = 0;
            for(const key of Object.keys(saveValue)){
                if(Number(key)>=params[0]){
                    total += saveValue[key];
                }
            }
            return total;
        },
        // 拥有X阶及以上主播数量{[阶级]:数量}
        [code.mission.BEHAVIOR_TYPE.CARD_STAGE_NUM]:function(saveValue, params, isTotalProgress){
            if(isTotalProgress){ return params[1]; }
            let total = 0;
            for(const key of Object.keys(saveValue)){
                if(Number(key)>=params[0]){
                    total += saveValue[key];
                }
            }
            return total;
        },
        // 拥有X星级及以上主播数量{[星级]:数量}
        [code.mission.BEHAVIOR_TYPE.CARD_STAR_NUM]:function(saveValue, params, isTotalProgress){
            if(isTotalProgress){ return params[1]; }
            let total = 0;
            for(const key of Object.keys(saveValue)){
                if(Number(key)>=params[0]){
                    total += saveValue[key];
                }
            }
            return total;
        },
        // 主播装备的X品质及以上豪车数量 {品质ID: num}
        [code.mission.BEHAVIOR_TYPE.CARD_EQUIP_CAR_NUM]:function(saveValue, params, isTotalProgress){
            if(isTotalProgress){ return params[1]; }
            let total = 0;
            for(const qId in saveValue){
                if(Number(qId)>=params[0]){
                    total += saveValue[qId];
                }
            }
            return total;
        },
        // 豪车置换X品质及以上的数量{[品质]:数量}
        [code.mission.BEHAVIOR_TYPE.CAR_EXCHANGE_NUM]:function(saveValue, params, isTotalProgress){
            if(isTotalProgress){ return params[1]; }
            let total = 0;
            for(const key of Object.keys(saveValue)){
                if(Number(key)>=params[0]){
                    total += saveValue[key];
                }
            }
            return total;
        },
        // 拥有X品质豪车数量{[品质]:数量}
        [code.mission.BEHAVIOR_TYPE.CAR_QUALITY_NUM]:function(saveValue, params, isTotalProgress){
            if(isTotalProgress){ return params[0]; }
            let total = 0;
            for(const key of Object.keys(saveValue)){
                if(Number(key)>=params[1]){
                    total += saveValue[key];
                }
            }
            return total;
        },
        // 拥有X等级豪车数量{[等级]:数量}
        [code.mission.BEHAVIOR_TYPE.CAR_LEVEL_NUM]:function(saveValue, params, isTotalProgress){
            if(isTotalProgress){ return params[1]; }
            let total = 0;
            for(const key of Object.keys(saveValue)){
                if(Number(key)>=params[0]){
                    total += saveValue[key];
                }
            }
            return total;
        },
        // 派遣主播到指定平台 {[平台id]:[id,id,id]}
        [code.mission.BEHAVIOR_TYPE.PLATFORM_TARGET_CARD_ID]:function(saveValue, params, isTotalProgress){
            if(isTotalProgress){ return 1; }
            return saveValue[params[1]].indexOf(params[0].toString())>=0?1:0;
        },
        // 派遣主播到指定平台的数量 {[平台id]:主播数量}
        [code.mission.BEHAVIOR_TYPE.PLATFORM_TARGET_CARD_NUM]:function(saveValue, params, isTotalProgress){
            if(isTotalProgress){ return params[1]; }
            return saveValue[params[0]] || 0;
        },
        // 商店X购买次数 {shopId:xxx}
        [code.mission.BEHAVIOR_TYPE.SHOP_ID_BUY_TIMES]:function(saveValue, params, isTotalProgress){
            if(isTotalProgress){ return params[1]; }
            return saveValue[params[0]] || 0;
        },
        // 领取通关奖励
        [code.mission.BEHAVIOR_TYPE.DUNGEON_RECEIVE_REWARD]:function(saveValue, params, isTotalProgress){
            if(isTotalProgress){ return 1; }
            for(const id of saveValue){
                if(Math.floor(id/10)==params[0]){
                    return 1;
                }
            }
            return 0;
        },
        // 俱乐部达到X级的数量  [level,level,level]
        [code.mission.BEHAVIOR_TYPE.CLUB_LEVEL_NUM]:function(saveValue, params, isTotalProgress){
            if(isTotalProgress){ return params[1]; }
            let cnt = 0;
            for(const level of saveValue){
                if(level>=params[0]){
                    cnt++;
                }
            }
            return cnt;
        },
        // 流量为王最高排名
        [code.mission.BEHAVIOR_TYPE.FLOW_RATE_MAX_RANK]:function(saveValue, params, isTotalProgress){
            if(isTotalProgress){ return 1; }
            if(saveValue==undefined){
                return 0;
            }
            return saveValue<=params[0]?1:0;
        },
        default:function(saveValue, params, isTotalProgress){
            if(isTotalProgress){
                return params[0];
            }
            return saveValue;
        }
    };
};

/**
 * 获取记录的值
 */
MissionComponent.prototype.getValue = function(type){
    const playerMission = this.getMission();
    const record = playerMission.record || {};
    return record[type];
};

/**
 * 记录进度值
 */
MissionComponent.prototype.setValue = function(type, value){
    const playerMission = this.getMission();
    const record = playerMission.record || {};
    record[type] = value;
    playerMission.record = record;
    this.update(playerMission);
};



/*********更新使用的事件*********/

/**
 * 注册的更新事件，事件参数只有一个，为任务分类类型
 */
MissionComponent.prototype.onInit = async function(){
    const self = this;
    //任务更新事件
    this.player.Event.on(code.event.MISSION_UPDATE.name, (...params) => { 
        new Promise((resolve , _reject)=>{
            self.updateMission(...params); 
            resolve();
        });
    });

    
    // 主播激活事件
    this.player.Event.on(code.event.CARD_ACTIVE.name, (..._params) => {
        self.player.Event.emit(code.event.MISSION_UPDATE.name, 
            code.mission.BEHAVIOR_TYPE.CARD_LEVEL_NUM, 
            code.mission.BEHAVIOR_TYPE.CARD_TOTAL_LEVEL, 
            code.mission.BEHAVIOR_TYPE.CARD_UNLOCK,
            code.mission.BEHAVIOR_TYPE.CARD_QUALITY_NUM,
            code.mission.BEHAVIOR_TYPE.CARD_STAGE_NUM,
        );
    });
    // 关卡前进事件
    this.player.Event.on(code.event.DUNGEON_FORWARD.name, (isBattleWin) => {
        const type = code.mission.BEHAVIOR_TYPE.DUNGEON_FORWARD;
        self.setValue(type, (self.getValue(type) || 0) + 1);
        if(isBattleWin){
            this.player.Event.emit(code.event.MISSION_UPDATE.name, 
                code.mission.BEHAVIOR_TYPE.DUNGEON, 
                code.mission.BEHAVIOR_TYPE.DUNGEON_PROGRESS,
                type,
            );
        }else{
            self.player.Event.emit(code.event.MISSION_UPDATE.name, type);
        }
    });
    // 领取通关奖励
    this.player.Event.on(code.event.DUNGEON_REWARD.name, (..._params) => {
        this.player.Event.emit(code.event.MISSION_UPDATE.name, 
            code.mission.BEHAVIOR_TYPE.DUNGEON_RECEIVE_REWARD, 
        );
    });
    // 赚钱速度
    this.player.Event.on(code.event.CASH_PER_SECOND_AFTER.name, (..._params) => {
        self.player.Event.emit(code.event.MISSION_UPDATE.name, code.mission.BEHAVIOR_TYPE.EARN_CASH_PER_SECOND);
    });
    // 总战力变化
    this.player.Event.on(code.event.TOTAL_POWER_UPDATE.name, (..._params) => {
        self.player.Event.emit(code.event.MISSION_UPDATE.name, code.mission.BEHAVIOR_TYPE.TOTAL_POWER);
    });
    // 等级提升
    this.player.Event.on(code.event.LEVEL_UP.name, (..._params) => {
        self.player.Event.emit(code.event.MISSION_UPDATE.name, code.mission.BEHAVIOR_TYPE.LEVEL_UP);
    });
    // 主播升级
    this.player.Event.on(code.event.CARD_UP.name, (addLevel) => {
        const type = code.mission.BEHAVIOR_TYPE.CARD_LEVEL_UP_TIMES;
        self.setValue(type, (self.getValue(type) || 0) + addLevel);
        self.player.Event.emit(code.event.MISSION_UPDATE.name,
            code.mission.BEHAVIOR_TYPE.CARD_LEVEL_NUM,
            code.mission.BEHAVIOR_TYPE.CARD_TOTAL_LEVEL,
            type
        );
    });
    // 主播升星
    this.player.Event.on(code.event.CARD_STAR.name, (..._params) => {
        self.player.Event.emit(code.event.MISSION_UPDATE.name, code.mission.BEHAVIOR_TYPE.CARD_STAR_NUM);
    });
    // 主播升阶
    this.player.Event.on(code.event.CARD_STAGE.name, (..._params) => {
        self.player.Event.emit(code.event.MISSION_UPDATE.name, 
            code.mission.BEHAVIOR_TYPE.CARD_STAGE_NUM,
        );
    });
    // 主播包装
    this.player.Event.on(code.event.CARD_PACK.name, (..._params) => {
        const type = code.mission.BEHAVIOR_TYPE.CARD_STAGE_UP_TIMES;
        self.setValue(type, (self.getValue(type) || 0) + 1);
        self.player.Event.emit(code.event.MISSION_UPDATE.name, 
            type,
        );
    });
    // 主播卡牌重置
    this.player.Event.on(code.event.CARD_RESET.name, (..._params) => {
        self.player.Event.emit(code.event.MISSION_UPDATE.name, 
            code.mission.BEHAVIOR_TYPE.CARD_STAR_NUM,
            code.mission.BEHAVIOR_TYPE.CARD_STAGE_NUM,
            code.mission.BEHAVIOR_TYPE.CARD_LEVEL_NUM,
            code.mission.BEHAVIOR_TYPE.CARD_TOTAL_LEVEL,
        );
    });
    // 主播上阵
    this.player.Event.on(code.event.CARD_UP_FORMATION.name, (..._params) => {
        self.player.Event.emit(code.event.MISSION_UPDATE.name, 
            code.mission.BEHAVIOR_TYPE.CARD_UP_FORMATION_NUM
        );
    });
    // 主播装备豪车
    this.player.Event.on(code.event.CARD_EQUIP_CAR.name, (..._params) => {
        self.player.Event.emit(code.event.MISSION_UPDATE.name, 
            code.mission.BEHAVIOR_TYPE.CARD_EQUIP_CAR_NUM
        );
    });
    // 豪车获得 {[cId]:xxx}
    this.player.Event.on(code.event.CAR_CHANGE.name, (obj) => {
        if(!obj){return;}
        self.player.Event.emit(code.event.MISSION_UPDATE.name, 
            code.mission.BEHAVIOR_TYPE.CAR_QUALITY_NUM,
        );
    });
    // 豪车置换 [{itemID:xxx,itemNum:xxx}]
    this.player.Event.on(code.event.CAR_EXCHANGE.name, (itemList) => {
        const type = code.mission.BEHAVIOR_TYPE.CAR_EXCHANGE_NUM;
        const data = self.getValue(type) || {};
        for(const item of itemList){
            const itemConfig = self.app.Config.Item.get(item.itemID);
            if(!itemConfig){
                logger.error(`物品id[${item.itemID}]配置不存在`);
                continue;
            }
            const referId = itemConfig.RelevanceId;
            const carConfig = self.app.Config.Car.get(referId);
            if(!carConfig){
                logger.error(`豪车id[${referId}]配置不存在`);
                continue;
            }
            const quality = carConfig.Quality;
            data[quality] = (data[quality] || 0) + item.itemNum;
        }
        self.setValue(type, data);
        self.player.Event.emit(code.event.MISSION_UPDATE.name, 
            type,
        );
    });
    // 豪车升级
    this.player.Event.on(code.event.CAR_UP.name, (..._params) => {
        const type = code.mission.BEHAVIOR_TYPE.CAR_UP_LEVEL_TIMES;
        self.setValue(type, (self.getValue(type) || 0) + 1);
        self.player.Event.emit(code.event.MISSION_UPDATE.name, 
            code.mission.BEHAVIOR_TYPE.CAR_LEVEL_NUM,
            code.mission.BEHAVIOR_TYPE.CAR_TOTAL_LEVEL,
            type,
        );
    });
    // 豪车改造
    this.player.Event.on(code.event.CAR_REFIT.name, (..._params) => {
        const type = code.mission.BEHAVIOR_TYPE.CAR_REFIT_TIMES;
        self.setValue(type, (self.getValue(type) || 0) + 1);
        self.player.Event.emit(code.event.MISSION_UPDATE.name, 
            type,
        );
    });
    // 豪车重置
    this.player.Event.on(code.event.CAR_RESET.name, (..._params) => {
        self.player.Event.emit(code.event.MISSION_UPDATE.name, 
            code.mission.BEHAVIOR_TYPE.CAR_LEVEL_NUM,
            code.mission.BEHAVIOR_TYPE.CAR_TOTAL_LEVEL,
        );
    });
    // 俱乐部送礼
    this.player.Event.on(code.event.CLUB_SEND_GIFT.name, (..._params) => {
        const type = code.mission.BEHAVIOR_TYPE.CLUB_GIFT_SEND;
        self.setValue(type, (self.getValue(type) || 0) + 1);
        self.player.Event.emit(code.event.MISSION_UPDATE.name, 
            type,
        );
    });
    // 俱乐部升级
    this.player.Event.on(code.event.CLUB_UP_LEVEL.name, (..._params) => {
        self.player.Event.emit(code.event.MISSION_UPDATE.name, 
            code.mission.BEHAVIOR_TYPE.CLUB_LEVEL_NUM,
        );
    });
    // 点击住宅事件
    this.player.Event.on(code.event.CLICK_MAIN_HOUSE.name, (..._params) => {
        const type = code.mission.BEHAVIOR_TYPE.CLICK_HOUSE_TIMES;
        self.setValue(type, (self.getValue(type) || 0) + 1);
        self.player.Event.emit(code.event.MISSION_UPDATE.name, 
            type,
        );
    });
    // 平台激活
    this.player.Event.on(code.event.PLATFORM_BUILD.name, (..._params) => {
        self.player.Event.emit(code.event.MISSION_UPDATE.name, 
            code.mission.BEHAVIOR_TYPE.PLATFORM_BUILD,
        );
    });
    // 平台招募
    this.player.Event.on(code.event.PLATFORM_RECRUIT.name, (..._params) => {
        self.player.Event.emit(code.event.MISSION_UPDATE.name, 
            code.mission.BEHAVIOR_TYPE.PLATFORM_ID_RECRUIT,
            code.mission.BEHAVIOR_TYPE.PLATFORM_RECRUIT,
        );
    });
    // 平台扩建
    this.player.Event.on(code.event.PLATFORM_UP_LEVEL.name, (..._params) => {
        self.player.Event.emit(code.event.MISSION_UPDATE.name, 
            code.mission.BEHAVIOR_TYPE.PLATFORM_UP_LEVEL_NUM,
            code.mission.BEHAVIOR_TYPE.PLATFORM_UP_LEVEL,
            code.mission.BEHAVIOR_TYPE.PLATFORM_MAIN_LEVEL,
        );
    });
    // 平台主播变化
    this.player.Event.on(code.event.PLATFORM_CARD_CHANGE.name, (..._params) => {
        self.player.Event.emit(code.event.MISSION_UPDATE.name, 
            code.mission.BEHAVIOR_TYPE.PLATFORM_TARGET_CARD_NUM,
            code.mission.BEHAVIOR_TYPE.PLATFORM_TARGET_CARD_ID,
        );
    });
    // 火力全开
    this.player.Event.on(code.event.POWER_FULL_OPERATE.name, (..._params) => {
        const type = code.mission.BEHAVIOR_TYPE.PLATFORM_POWER_FULL_TIMES;
        self.setValue(type, (self.getValue(type) || 0) + 1);
        self.player.Event.emit(code.event.MISSION_UPDATE.name, 
            type
        );
    });
    // 投资注资
    this.player.Event.on(code.event.INVEST_PROGRESS.name, (..._params) => {
        const type = code.mission.BEHAVIOR_TYPE.INVEST_PROGRESS;
        self.setValue(type, (self.getValue(type) || 0) + 1);
        self.player.Event.emit(code.event.MISSION_UPDATE.name, 
            type
        );
    });
    // 投资项目完成
    this.player.Event.on(code.event.INVEST_COMPLETE.name, (..._params) => {
        self.player.Event.emit(code.event.MISSION_UPDATE.name, 
            code.mission.BEHAVIOR_TYPE.INVEST_COMPLETE
        );
    });
    // 开始团建
    this.player.Event.on(code.event.FRIENDSHIP_TIMES.name, (..._params) => {
        const type = code.mission.BEHAVIOR_TYPE.FRIENDSHIP_TIMES;
        self.setValue(type, (self.getValue(type) || 0) + 1);
        self.player.Event.emit(code.event.MISSION_UPDATE.name, 
            type
        );
    });
    // 结束团建
    this.player.Event.on(code.event.FINISH_FRIENDSHIP.name, (..._params) => {
        const type = code.mission.BEHAVIOR_TYPE.FRIENDSHIP_FINISH_TIMES;
        self.setValue(type, (self.getValue(type) || 0) + 1);
        self.player.Event.emit(code.event.MISSION_UPDATE.name, 
            type
        );
    });
    // 车展开始
    this.player.Event.on(code.event.AUTO_SHOW_START.name, (..._params) => {
        const type = code.mission.BEHAVIOR_TYPE.AUTO_SHOW_START;
        self.setValue(type, (self.getValue(type) || 0) + 1);
        self.player.Event.emit(code.event.MISSION_UPDATE.name, 
            type
        );
    });
    // 车展抢单
    this.player.Event.on(code.event.AUTO_SHOW_ROB.name, (..._params) => {
        const type = code.mission.BEHAVIOR_TYPE.AUTO_SHOW_ROB;
        self.setValue(type, (self.getValue(type) || 0) + 1);
        self.player.Event.emit(code.event.MISSION_UPDATE.name, 
            type
        );
    });
    // 登陆天数变化
    this.player.Event.on(code.event.LOGIN_DAYS_CHANGE.name, (..._params) => {
        self.player.Event.emit(code.event.MISSION_UPDATE.name, 
            code.mission.BEHAVIOR_TYPE.LOGIN_DAYS
        );
    });
    // 商店购买
    this.player.Event.on(code.event.SHOP_BUY.name, (shopId) => {
        const type = code.mission.BEHAVIOR_TYPE.SHOP_ID_BUY_TIMES;
        const obj = (self.getValue(type) || {});
        obj[shopId] = (obj[shopId] || 0) + 1;
        self.setValue(type, obj);
        self.player.Event.emit(code.event.MISSION_UPDATE.name, 
            type
        );
    });
    // 月卡奖励领取
    this.player.Event.on(code.event.MONTH_CARD_RECEIVE.name, (monthCardId) => {
        let updateType;
        if(monthCardId == code.mission.GOLD_CARD_ID){
            const type = code.mission.BEHAVIOR_TYPE.GOLD_CARD_RECEIVE;
            self.setValue(type, (self.getValue(type) || 0) + 1);
            updateType = type;
        }else if(monthCardId == code.mission.BLACK_CARD_ID){
            const type = code.mission.BEHAVIOR_TYPE.BLACK_CARD_RECEIVE;
            self.setValue(type, (self.getValue(type) || 0) + 1);
            updateType = type;
        }
        self.player.Event.emit(code.event.MISSION_UPDATE.name, 
            updateType
        );
    });
    // 联盟等级变化
    this.player.Event.on(code.event.GUILD_LV_CHANGE.name, (..._params) => {
        const type = code.mission.BEHAVIOR_TYPE.GUILD_LV;
        const max = self.getValue(type) || 0;
        if(self.player.guildLv > max){
            self.setValue(type, self.player.guildLv);
            self.player.Event.emit(code.event.MISSION_UPDATE.name, 
                type,
            );
        }
    });
    // 流量为王最高排名
    this.player.Event.on(code.event.FLOW_RATE_RANK_CHANGE.name, (..._params) => {
        const type = code.mission.BEHAVIOR_TYPE.FLOW_RATE_MAX_RANK;
        const max = self.getValue(type);
        if(max==undefined || self.player.flowRateRank < max){
            self.setValue(type, self.player.flowRateRank);
            self.player.Event.emit(code.event.MISSION_UPDATE.name, 
                type,
            );
        }
    });
    // 流量为王挑战
    this.player.Event.on(code.event.FLOW_RATE_CHALLENGE.name, (isWin) => {
        const type = code.mission.BEHAVIOR_TYPE.FLOW_RATE_CHALLENGE_TIMES;
        self.setValue(type, (self.getValue(type) || 0) + 1);
        if(isWin){
            const typeWin = code.mission.BEHAVIOR_TYPE.FLOW_RATE_WIN_TIMES;
            self.setValue(typeWin, (self.getValue(typeWin) || 0) + 1);
            self.player.Event.emit(code.event.MISSION_UPDATE.name,
                type,
                typeWin
            );
        }else{
            self.player.Event.emit(code.event.MISSION_UPDATE.name,
                type,
            );
        }
    });
};


/**
 * 更新任务
 */
MissionComponent.prototype.updateMission = function(...params){
    let missionHeadIdList = [];
    const repeatList = [];
    for(const type of params){
        if(repeatList.indexOf(type)<0){
            missionHeadIdList = missionHeadIdList.concat(this.app.Config.Task.getMissionHeadByClassifyType(type));
            repeatList.push(type);
        }
    }

    const updateIdList = [];
    const playerMission = this.getMission();
    const chainRecord = playerMission.chain || {};
    // 把该分类下的正在进行的任务ID筛选出来（不需要缓存，速度很快）,已记录的和未记录为任务刚开始的
    const completeIdList = (chainRecord[code.mission.MISSION_TYPE.DAILY] || []).concat(chainRecord[code.mission.MISSION_TYPE.ACHIEVEMENT] || []);
    if(chainRecord[code.mission.MISSION_TYPE.MAIN]){
        completeIdList.push(chainRecord[code.mission.MISSION_TYPE.MAIN]);
    }
    for(const completeId of completeIdList){
        const missionIndex = missionHeadIdList.indexOf(this.app.Config.Task.getMissionBeginId(completeId));
        const curMissionId = this.app.Config.Task.getNextMissionId(completeId);
        if(missionIndex>=0){
            missionHeadIdList[missionIndex] = 0; //标记排除
        }
        if (curMissionId!=0 && repeatList.indexOf(this.app.Config.Task.get(curMissionId).ConditionId)>=0){
            updateIdList.push(curMissionId);
        }
    }
    for(const initId of missionHeadIdList){
        if(initId!=0){
            updateIdList.push(initId);
        }
    }
    // 获取进度，利用缓存判断是否需要更新
    let mainMission;
    const dailyMission = [];
    const achievement = [];
    for(const id of updateIdList){
        if(id==0){continue;}
        const config = this.app.Config.Task.get(id);
        const progress = this.getProgress(id);
        if(this._isNotifyDefineEqual(id, this.missionInfoCache[id], progress)){
            continue;
        }else{
            this.missionInfoCache[id] = progress;
        }
        switch(config.Type){
        case code.mission.MISSION_TYPE.MAIN:{
            mainMission = {missionId:id, progress:progress.toString(), totalProgress:this._getTotalProgress(id).toString()};
            break;
        }
        case code.mission.MISSION_TYPE.DAILY:{
            dailyMission.push({missionId:id, progress:progress.toString(), totalProgress:this._getTotalProgress(id).toString()});
            break;
        }
        case code.mission.MISSION_TYPE.ACHIEVEMENT:{
            achievement.push({missionId:id, progress:progress.toString(), totalProgress:this._getTotalProgress(id).toString()});
            break;
        }
        }
    }

    if(!mainMission&&dailyMission.length==0&&achievement.length==0){
        return;
    }


    this.app.get('channelService').pushMessageByUids("onNotifyMissionUpdate", {
        mainMission:mainMission,
        dailyMission:dailyMission,
        achievement:achievement,
    },[{uid: this.player.uid, sid: this.player.connectorId}]);
};

/****************************外部调用的接口****************************/

/**
 * 获取主线任务最新的已完成id，若无已完成任务返回0
 */
MissionComponent.prototype.getMaxCompleteMainMissionID = function(){
    const playerMission = this.getMission();
    const chainRecord = playerMission.chain || {};
    return chainRecord[code.mission.MISSION_TYPE.MAIN] || 0;
};

/******************************任务系统**************************************/

/** 数据结构，设计以任务分类ClassifyType为基准保存任务数据
 * {
 *      record: {               // 辅助分类类型总记录
 *          [type]: [value],
 *          1: 9,
 *      },
 *      dailyRecord: {          // 日常里分类类型记录，日常任务按类型记录每日一开始时候的数据
 *          [type]: [value],
 *      },
 *      missionStartRecord: {   // 任务开始时记录，记录任务一开始时的数据，任务结束时删除条目。   记录类型，防止配置表修改，数据错乱
 *          [id]: { type: [type], value: [value] },
 *      },
 *      chain: {                // [任务大类]:已完成任务id
 *          1(main): 2,
 *          2: [],
 *          3: [],
 *      },
 * 
 * 
 * 
 *      liveness: xxx,                  // 活跃度
 *      livenessRewardBox: []           // 已领取活跃度奖励
 *      achievementPoints: xxx,         // 成就点数
 *      achievementPointsRewardBox: [], // 已领取成就点数奖励
 *      
 * }
 */


/**
 * 根据任务大类获取当前任务状态{missionId:xxx,progress:xxx}，任务链已无任务则为{missionId:0,progress:0,preMission:xxx}
 */
MissionComponent.prototype.getMissionStatus = function(type){
    const playerMission = this.getMission();
    const chainRecord = playerMission.chain || {};
    switch(type){
    case code.mission.MISSION_TYPE.MAIN:{
        let missionId;
        let preMission;
        if(chainRecord[type]){
            missionId = this.app.Config.Task.getNextMissionId(chainRecord[type]);
            if(this.app.Config.Task.isLasterMission(chainRecord[type])){
                preMission = chainRecord[type];
            }
        }else{
            missionId = this.app.Config.Task.getInitMission(type).Id;
        }
        
        return {missionId:missionId, progress:this.getProgress(missionId).toString(), preMission:preMission, totalProgress:this._getTotalProgress(missionId).toString()};
    }
    case code.mission.MISSION_TYPE.DAILY:
    case code.mission.MISSION_TYPE.ACHIEVEMENT:{
        const resultList = [];
        const hasStartList = [];
        const chainType = chainRecord[type] || [];
        for(const completeId of chainType){
            let preMission;
            if(this.app.Config.Task.isLasterMission(completeId)){
                preMission = completeId;
            }
            hasStartList.push(this.app.Config.Task.getMissionBeginId(completeId));
            const id = this.app.Config.Task.getNextMissionId(completeId);
            resultList.push({missionId:id, progress:this.getProgress(id).toString(), preMission:preMission,totalProgress:this._getTotalProgress(id).toString()});
        }
        for(const mission of this.app.Config.Task.getInitMission(type)){
            if(hasStartList.indexOf(mission.Id)>=0){
                continue;
            }
            const missionId = mission.Id;
            resultList.push({missionId:missionId, progress:this.getProgress(missionId).toString(), totalProgress:this._getTotalProgress(missionId).toString()});
        }
        return resultList;
    }
    }
};

/**
 * 完成任务
 */
MissionComponent.prototype.completeMission = function(id){
    const cfg = this.app.Config.Task.get(id);
    if(!cfg) {return {code:code.err.ERR_MISSION_NOT_EXIST};}

    let award = cfg.Reward;
    award = utils.proto.encodeConfigAward(award);

    const bigType = cfg.Type;
    const playerMission = this.getMission();
    const chainRecord = playerMission.chain || {};
    const totalProgress = this._getTotalProgress(id);
    switch(bigType){
    case code.mission.MISSION_TYPE.MAIN:{
        let missionId;
        if(chainRecord[bigType]){
            missionId = this.app.Config.Task.getNextMissionId(chainRecord[bigType]);
        }else{
            missionId = this.app.Config.Task.getInitMission(bigType).Id;
        }
        if(missionId != id){
            return {code:code.err.ERR_MISSION_PROGRESS_NOT_EXIST};
        }
        if(this.getProgress(id)<totalProgress){
            return {code:code.err.ERR_MISSION_PROGRESS_NOT_ENOUGH};
        }
        this.player.Item.addItem(award, code.reason.OP_MISSION_COMPLETE_GET);
        chainRecord[bigType] = id;
        break;
    }
    case code.mission.MISSION_TYPE.DAILY:
    case code.mission.MISSION_TYPE.ACHIEVEMENT:{
        const initList = [];
        const hasStartList = [];
        const hasStartInitList = [];
        chainRecord[bigType] = chainRecord[bigType] || [];
        for(const completeRid of chainRecord[bigType]){
            const rid = this.app.Config.Task.getNextMissionId(completeRid);
            hasStartInitList.push(this.app.Config.Task.getMissionBeginId(completeRid));
            hasStartList.push(rid);
        }
        for(const mission of this.app.Config.Task.getInitMission(bigType)){
            if(hasStartInitList.indexOf(mission.Id)>=0){
                continue;
            }
            const missionId = mission.Id;
            initList.push(missionId);
        }
        const initIndex = initList.indexOf(id);
        const hasStartIndex = hasStartList.indexOf(id);
        if(initIndex < 0 && hasStartIndex < 0){
            return {code:code.err.ERR_MISSION_PROGRESS_NOT_EXIST};
        }
        if(this.getProgress(id)<totalProgress){
            return {code:code.err.ERR_MISSION_PROGRESS_NOT_ENOUGH};
        }
        this.player.Item.addItem(award, code.reason.OP_MISSION_COMPLETE_GET);
        if(hasStartIndex>=0){
            chainRecord[bigType][hasStartIndex] = id;
        }else if(initIndex>=0){
            chainRecord[bigType].push(id);
        }
        break;
    }
    }
    playerMission.chain = chainRecord;


    //其他任务附带属性
    switch(bigType){
    case code.mission.MISSION_TYPE.DAILY:{
        playerMission.liveness = (playerMission.liveness || 0) + cfg.Active;
        break;
    }
    case code.mission.MISSION_TYPE.ACHIEVEMENT:{
        playerMission.achievementPoints = (playerMission.achievementPoints || 0) + cfg.Achievement;
        break;
    }
    }

    //完成
    const missionStartRecord = playerMission.missionStartRecord || {};
    if(missionStartRecord[id]){
        delete missionStartRecord[id];
    }
    //如果是下一个是任务开始时计数的任务则记录当前
    let preMission;
    const currentId = this.app.Config.Task.getNextMissionId(id);
    if(!this.app.Config.Task.isLasterMission(id)){
        const currentCfg = this.app.Config.Task.get(currentId);
        const isRecordWhenStart = currentCfg.CalcType == 1?true: false;
        if(isRecordWhenStart){
            const obj = {};
            obj.type = currentCfg.ConditionId;
            obj.value = this.getTotalProgressByType(currentCfg.ConditionId);
            missionStartRecord[currentId] = utils.object.deepClone(obj);
        }
    }else{
        preMission = id;
    }
    playerMission.missionStartRecord = missionStartRecord;
    
    this.update(playerMission);

    this.player.Event.emit(code.event.MISSION_COMPLETE.name);
    this.app.Log.missionLog(this.player, id, bigType);
    if(bigType == code.mission.MISSION_TYPE.MAIN){
        this.app.Log.eventLog(this.player, id);
    }
    // 协议信息

    return {
        code:code.err.SUCCEEDED,
        missionInfo:{
            missionId:currentId, 
            progress:this.getProgress(currentId).toString(),
            preMission:preMission,
            totalProgress:this._getTotalProgress(currentId).toString(),
        },
        award:utils.proto.encodeAward(award),
        liveness:playerMission.liveness || 0,
        achievementPoints:playerMission.achievementPoints || 0
    };
};

/**
 * 获取指定任务的进度, id为0表示任务链已无下一个任务
 */
MissionComponent.prototype.getProgress = function(id){
    if(id==0){return 0;}
    const cfg = this.app.Config.Task.get(id);
    if(!cfg) {return;}
    const bigType = cfg.Type;
    const explainFunc = this.getExplainValue(cfg.ConditionId);
    const isRecordWhenStart = cfg.CalcType == 1?true: false;
    if(isRecordWhenStart){
        const total = this.getTotalProgressByType(cfg.ConditionId);
        const missionStart = this.getMissionStartRecord(cfg.Id);
        if(missionStart==undefined){
            assert.fail(`任务id[${cfg.Id}]为任务开始时开始计算进度的类型，但是却在数据库中找不到记录`);
        }
        return BigInt(explainFunc(total, cfg.ConditionValue)) - BigInt(explainFunc(missionStart, cfg.ConditionValue));
    }else{
        if(bigType==code.mission.MISSION_TYPE.DAILY){
            const total = this.getTotalProgressByType(cfg.ConditionId);
            // 每日开始时记录
            const dayStart = this.getDailyStartRecord(cfg.ConditionId);
            if(dayStart!=undefined){
                return BigInt(explainFunc(total, cfg.ConditionValue)) - BigInt(explainFunc(dayStart, cfg.ConditionValue));
            }else{
                return BigInt(explainFunc(this.getTotalProgressByType(cfg.ConditionId), cfg.ConditionValue));
            }
        }else{
            return BigInt(explainFunc(this.getTotalProgressByType(cfg.ConditionId), cfg.ConditionValue));
        }
    }
};




/**
 * 获取活跃度
 */
MissionComponent.prototype.getLiveness = function(){
    const playerMission = this.getMission();
    return playerMission.liveness || 0;
};

MissionComponent.prototype.getLivenessBox = function(){
    const playerMission = this.getMission();
    const boxes = playerMission.livenessRewardBox || [];
    return boxes.concat();
};

MissionComponent.prototype.receiveLivenessBoxReward = function(id){
    const config = this.app.Config.ExchangeReward.get(id);
    if(!config || config.Type != code.activeReward.BOX_TYPE.LIVENESS){
        return {code:code.err.ERR_CLIENT_PARAMS_WRONG};
    }
    if(this.getLiveness()<config.NeedValue){
        return {code:code.err.ERR_MISSION_LIVENESS_NOT_ENOUGH};
    }
    let award = config.Reward;
    award = utils.proto.encodeConfigAward(award);
    this.player.Item.addItem(award, code.reason.OP_MISSION_LIVENESS_GET);

    const playerMission = this.getMission();
    const boxes = playerMission.livenessRewardBox || [];
    boxes.push(id);
    playerMission.livenessRewardBox = boxes;
    this.update(playerMission);

    return {
        code:code.err.SUCCEEDED, 
        award:utils.proto.encodeAward(award),
        hasReceive: boxes,
    };
};

/**
 * 获取成就点数
 */
MissionComponent.prototype.getAchievementPoints = function(){
    const playerMission = this.getMission();
    return playerMission.achievementPoints || 0;
};

MissionComponent.prototype.getAchievementPointsBox = function(){
    const playerMission = this.getMission();
    const boxes = playerMission.achievementPointsRewardBox || [];
    return boxes.concat();
};

MissionComponent.prototype.receivePointsReward = function(id){
    const config = this.app.Config.ExchangeReward.get(id);
    if(!config || config.Type != code.activeReward.BOX_TYPE.ACHIEVEMENT){
        return {code:code.err.ERR_CLIENT_PARAMS_WRONG};
    }
    if(this.getAchievementPoints()<config.NeedValue){
        return {code:code.err.ERR_MISSION_POINT_NOT_ENOUGH};
    }
    let award = config.Reward;
    award = utils.proto.encodeConfigAward(award);
    this.player.Item.addItem(award, code.reason.OP_MISSION_ACHIEVEMENT_GET);

    const playerMission = this.getMission();
    const boxes = playerMission.achievementPointsRewardBox || [];
    boxes.push(id);
    playerMission.achievementPointsRewardBox = boxes;
    this.update(playerMission);

    return {
        code:code.err.SUCCEEDED, 
        award:utils.proto.encodeAward(award),
        hasReceive: boxes,
    };
};

/************************************internal function****************************************/

/**
 * 判断前后通知的进度是否相同，用于决定是否下发通知
 * @param {Object} beforeProgress   之前的进度，可能为undefined
 */
MissionComponent.prototype._isNotifyDefineEqual = function(id,beforeProgress,nowProgress){
    return beforeProgress==nowProgress;
};


/**
 * 总进度
 */
MissionComponent.prototype._getTotalProgress = function(id){
    if(id==0){return 0;}
    const cfg = this.app.Config.Task.get(id);
    const explainFunc = this.getExplainValue(cfg.ConditionId);
    const result = explainFunc(cfg.ConditionValue, cfg.ConditionValue, true);
    if(result==undefined){
        logger.error(`unKnow format for task id [${id}]`);
    }
    const totalProgress = BigInt(result);
    return totalProgress;
};

/**
 * 每日一开始时事件类型的值
 */
MissionComponent.prototype.getDailyStartRecord = function(type){
    const playerMission = this.getMission();
    const dailyRecord = playerMission.dailyRecord || {};
    return dailyRecord[type];
};

/**
 * 任务开始时的任务id对应类型的值
 */
MissionComponent.prototype.getMissionStartRecord = function(id){
    this.repairStartRecord(id);
    const playerMission = this.getMission();
    const missionStartRecord = playerMission.missionStartRecord || {};
    if(missionStartRecord[id]){
        return missionStartRecord[id].value;
    }
};

/**
 * 修复修改配置表引发的问题，     目前采用的类似懒更新方式，只有在获取进度值得时候才会修复
 *      1.数据类型不匹配，重置记录，类型匹配的话就采用原来的数据
 *      2.第一个任务记录类型为任务开始时记录 
 *      3.正在进行的任务记录类型由记录全局改成任务开始时记录
 * 
 */
MissionComponent.prototype.repairStartRecord = function(id){
    const playerMission = this.getMission();
    const missionStartRecord = playerMission.missionStartRecord || {};
    const config = this.app.Config.Task.get(id);
    if(missionStartRecord[id]){
        // 发现配置数据类型和数据库匹配不上时，重新记录
        if(config.ConditionId != missionStartRecord[id].type){
            missionStartRecord[id].type = config.ConditionId;
            missionStartRecord[id].value = this.getTotalProgressByType(config.ConditionId);
            playerMission.missionStartRecord = missionStartRecord;
            logger.info(`任务系统，发现配置数据id[${id}]类型和数据库匹配不上时，重新记录,\n原因：可能是任务配置表任务类型修改了`);
            this.update(playerMission);
        }
    }else{
        const isRecordWhenStart = config.CalcType == 1?true: false;
        const progressIDs = this.getProgressMissionIds();
        if(isRecordWhenStart&& progressIDs.indexOf(id)>=0){
            const obj = {};
            obj.type = config.ConditionId;
            // 针对首个任务或配置表CalcType由0变成1的情况，即配置配了任务开始时计数却没存在数据库
            obj.value = this.getTotalProgressByType(config.ConditionId);
            if(this.app.Config.Task.isFirstMission(id)){
                if(config.Type==code.mission.MISSION_TYPE.DAILY){
                    const dailyR = this.getDailyStartRecord(config.ConditionId);
                    obj.value = dailyR==undefined? obj.value:dailyR;
                }
            }
            missionStartRecord[id] = obj;
            playerMission.missionStartRecord = missionStartRecord;
            logger.info(`任务系统，发现配置数据id[${id}]配了任务开始时计数却没存在数据库，重新记录，\n原因：可能是首个任务配了任务开始时计数或正在进行的任务配置表CalcType由0变成1`);
            this.update(playerMission);
        }
    }
};

/**
 * 获取正在进行中的任务id列表(不包含已完成的任务链)
 */
MissionComponent.prototype.getProgressMissionIds = function(){
    const playerMission = this.getMission();
    const chainRecord = playerMission.chain || {};
    const idList = [];
    for(const type of Object.values(code.mission.MISSION_TYPE)){
        switch(type){
        case code.mission.MISSION_TYPE.MAIN:{
            let missionId;
            if(chainRecord[type]){
                missionId = this.app.Config.Task.getNextMissionId(chainRecord[type]);
            }else{
                missionId = this.app.Config.Task.getInitMission(type).Id;
            }
        
            if(missionId!=0){
                idList.push(missionId);
            }
            break;
        }
        case code.mission.MISSION_TYPE.DAILY:
        case code.mission.MISSION_TYPE.ACHIEVEMENT:{
            const hasStartList = [];
            const chainType = chainRecord[type] || [];
            for(const completeId of chainType){
                hasStartList.push(this.app.Config.Task.getMissionBeginId(completeId));
                const id = this.app.Config.Task.getNextMissionId(completeId);
                if(id!=0){
                    idList.push(id);
                }
            }
            for(const mission of this.app.Config.Task.getInitMission(type)){
                if(hasStartList.indexOf(mission.Id)>=0){
                    continue;
                }
                const missionId = mission.Id;
                if(missionId!=0){
                    idList.push(missionId);
                }
            }
        }
        }
    }
    return idList;
};

/**
 * 更新内存里缓存的任务信息（用来判断是否需要下发任务更新消息）
 */
MissionComponent.prototype.updateMissionInfoCache = function(...param){
    let missionInfoList = [];
    for(const item of param){
        if(item==undefined){
            continue;
        }
        missionInfoList = missionInfoList.concat(item);
    }
    for(const info of missionInfoList){
        this.missionInfoCache[info.missionId] = info.progress;
    }
    const idList = this.getProgressMissionIds();
    for(const id of Object.keys(this.missionInfoCache)){
        if(idList.indexOf(id)<0){
            delete this.missionInfoCache[id];
        }
    }
};

/**
 * 获取解释值的函数
 */
MissionComponent.prototype.getExplainValue = function(type){
    const all = this.valueExplain();
    if(all[type]){
        return all[type];
    }else{
        return all["default"];
    }
};

/**
 * 两种途径获取值，1、通过定义获取途径，2、通过设置过的记录值
 */
MissionComponent.prototype.getTotalProgressByType = function(type){
    let value;
    const ways = this.getValueWay();
    if(Object.keys(ways).indexOf(type.toString())>=0){
        value = ways[type]();
    } else {
        assert.fail(`任务分类类型 [${type}] 未定义值获得方式`);
    }
    return value;
};

/**
 * 跨天调用接口
 */
MissionComponent.prototype.onDayChange = async function (isOnTime){
    // 跨天重置日常任务累计进度
    const playerMission = this.getMission();
    const dailyRecord = {};
    for(const type of this.app.Config.Task.getMissionTypeList(code.mission.MISSION_TYPE.DAILY)){
        dailyRecord[type] = utils.object.deepClone(this.getTotalProgressByType(type));
    }
    playerMission.liveness = 0;
    playerMission.livenessRewardBox = [];
    playerMission.dailyRecord = dailyRecord;

    if(playerMission.chain){
        playerMission.chain[code.mission.MISSION_TYPE.DAILY] = [];
    }
    if(isOnTime){
        const notifyInfo = [];
        for(const mission of this.app.Config.Task.getInitMission(code.mission.MISSION_TYPE.DAILY)){
            notifyInfo.push({
                missionId:mission.Id,
                progress:this.getProgress(mission.Id).toString(), 
                totalProgress:this._getTotalProgress(mission.Id).toString()}
            );
        }
        this.player.Notify.notify('onNotifyMissionUpdate', { dailyMission:notifyInfo });
    }
    

    this.update(playerMission);
};

/**
 * 获取玩家任务对象
 * @return {JSON} {xxx:xxx, ...}
 */
MissionComponent.prototype.getMission = function()
{
    const playerMission = this.player.get(code.player.Keys.Mission) || {};
    return playerMission;
};

/**
 * 更新玩家任务数据库
 * @param {Object} playerMission 玩家任务对象
 */
MissionComponent.prototype.update = function(playerMission){
    this.player.set(code.player.Keys.Mission, playerMission);
};