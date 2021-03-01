/**
 * @description gm命令服务
 * @author linjs
 * @date 2020/05/11
 */
const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const code = require('@code');
const utils = require('@util');
const bearcat = require('bearcat');
const util = require('@util');
const fs = require('fs');
const path = require('path');

const GmService = function () {
    this.$id = 'game_GmService';
    this.app = null;
};

module.exports = GmService;
bearcat.extend('game_GmService', 'logic_BaseService');

/**
 * { 命令名 : 命令函数(player玩家,param参数字符串组), ...}
 * 函数默认不返回表示成功，有返回需要带code表示操作结果
 * 
 * 请同步更新文档 Develop/文档/GM命令.xlsx
 */

//物品 [物品ID,物品数量]
GmService.prototype.item = function (player, param) {
    if (param.length < 2) {
        return { code: code.err.ERR_COMMAND_PARAM_WRONG };
    }
    const itemID = parseInt(param[0]);
    if (!this.app.Config.Item.get(itemID)) {
        return { code: code.err.ERR_ITEM_NO_EXIST };
    }
    const itemNum = parseInt(param[1]);
    const item = { itemID: itemID, itemNum: itemNum }; 
    // if(!player.Item.isCanAdd(item)){
    //     return { code: code.err.ERR_ITEM_ILLEGAL_NUM };
    // }
    player.Item.addItem(item, code.reason.OP_ITEM_GM);
};

//扣钱 [物品ID,物品数量]
GmService.prototype.subMoney = function(player, param){
    if (param.length < 2) {
        return { code: code.err.ERR_COMMAND_PARAM_WRONG };
    }
    const itemID = parseInt(param[0]);
    const cfg = this.app.Config.Item.get(itemID);
    if (!cfg || cfg.Type!=code.item.ITEM_TYPE.CURRENCY) {
        return { code: code.err.ERR_COMMAND_PARAM_WRONG };
    }
    let itemNum = parseInt(param[1]);
    if(!player.Currency.isEnough(itemID,itemNum)){
        itemNum = player.Currency.get(itemID);
    }
    player.Currency.delete(itemID,itemNum, code.reason.OP_SUB_MONEY_GM);
};

//清除背包
GmService.prototype.clearBag = function (player, _param) {
    player.Backpack.deleteItemByID(Object.keys(player.Backpack.getItem()));
};

//主线关卡 [已完成最大关卡ID]
GmService.prototype.dungeon = function (player, param) {
    if (param.length < 1) {
        return { code: code.err.ERR_COMMAND_PARAM_WRONG };
    }
    const matchCompleteID = parseInt(param[0]);
    const cfg = this.app.Config.Checkpoint.get(matchCompleteID);
    if (!cfg || cfg.Type == code.dungeon.MATCH_TYPE.REWARD) {
        return { code: code.err.ERR_COMMAND_PARAM_WRONG };
    }
    const dungeon = player.Dungeon.getDungeon();
    dungeon.matchID = matchCompleteID;
    dungeon.progress = 0;
    player.Dungeon.update(dungeon);
    player.Notify.notify('onNotifyBattleResultDungeon', {
        matchID: dungeon.matchID,
        progress: dungeon.progress,
    });
};

//添加卡牌
GmService.prototype.card = function (player, param) {
    if (param.length < 1) {
        return { code: code.err.ERR_COMMAND_PARAM_WRONG };
    }
    for (const cardId of param) {
        player.Card.addNewCard(parseInt(cardId));
    }
};

//添加豪车
GmService.prototype.car = function (player, param) {
    if (param.length < 1) {
        return { code: code.err.ERR_COMMAND_PARAM_WRONG };
    }
    for (const carId of param) {
        player.Car.addNewCar(parseInt(carId));
    }
};

//修改头衔等级
GmService.prototype.lv = function (player, param) {
    if (param.length < 1) {
        return { code: code.err.ERR_COMMAND_PARAM_WRONG };
    }
    const lv = parseInt(param[0]);
    player.Fame.AlterLv((lv && lv >= 1) ? lv : 1);
};

// 增加邮件
GmService.prototype.mail = async function (player, param) {
    if (param.length < 1) {
        return { code: code.err.ERR_COMMAND_PARAM_WRONG };
    }
    const tpltId = parseInt(param[0]);
    const uid = param.length > 1 ? parseInt(param[1]) : player.uid;
    await this.app.Mail.sendTpltMail(uid, tpltId);

};

GmService.prototype.cashPerSecond = function(player, param) {
    const cashPerSecond = param[0];
    const oldValue = player.cashPerSecond;
    player.cashPerSecond = cashPerSecond;
    player.Event.emit(code.event.CASH_PER_SECOND_AFTER.name, oldValue, cashPerSecond);
    // 同步更新
    player.Notify.notify('onSyncCashPerSecondNotify', {
        data: player.cashPerSecond
    });
};

// 增加全局邮件
GmService.prototype.globalMail = async function (player, param) {
    const len = param.length;
    if (len < 2) {
        return { code: code.err.ERR_COMMAND_PARAM_WRONG };
    }
    const mail = {
        title: param[0],
        content: param[1],
        item: len >= 3 ? JSON.parse(param[2]) : [],
        type: code.mail.TYPE.OPERATE,
    };
    await this.app.rpcs.global.mailRemote.sendGlobalMail({}, mail);
};

// 增加扣除恢复次数 num>0 增加 num<0 扣除
GmService.prototype.recovery = function (player, param) {
    if (param.length < 2) {
        return { code: code.err.ERR_COMMAND_PARAM_WRONG };
    }
    const id = parseInt(param[0]);
    const num = parseInt(param[1]);
    if(num > 0){
        player.Recovery.addRecovery(id, num, code.reason.OP_RECOVERY_ADD_GM);
    }
    else if(num < 0){
        player.Recovery.deductRecovery(id, -num, code.reason.OP_RECOVERY_DEDUCT_GM);
    }
};

// 添加直播事件
GmService.prototype.addLivePfe = function(player, param) {
    /**
     * game.gmHandler.executeCommand
        {cmd:'addLivePfe', param:['1','1']}
        添加事件，事件满则不再添加
        param[0] 1:感谢事件 2:派遣 3:推销 4:选中
    */
    if (param.length != 1) {
        return { code: code.err.ERR_COMMAND_PARAM_WRONG };
    }
    const eventType = parseInt(param[0]);
    // 选中不同的触发器
    player.LivePfEvent.addSpecialEvent(eventType);
};

// 掉落物品,默认加到包裹
GmService.prototype.drop = async function (player, param) {
    if (param.length < 1) {
        return { code: code.err.ERR_COMMAND_PARAM_WRONG };
    }
    const dropId = parseInt(param[0]);
    const times = param.length > 1 ? parseInt(param[1]) : 1;
    const addItem = param.length > 2 ? parseInt(param[2]) : true;
    const trace = param.length > 3 ? parseInt(param[3]) : false;
    const {item, traceInfo} = await player.Drop.dropTimes(dropId, times, trace);
    if (addItem) {
        player.Item.addItem(item, 0);
    }
    console.log(`drop result for id [${dropId}] times [${times}]:`);
    const allItem = {};
    item.map( ({itemID, itemNum}) => {
        allItem[itemID] = (allItem[itemID] ? allItem[itemID] + itemNum : itemNum);
    });
    const strResult = 'result:' + JSON.stringify(allItem);
    const strTraceInfo = 'traceInfo:' + JSON.stringify(traceInfo);
    console.log(`${strResult}`);
    console.log(`${strTraceInfo}`);
    const regex = /"/gi;
    return (strResult + strTraceInfo).replace(regex, '');
}; 

// 重置掉落计数器
GmService.prototype.resetDrop = async function (player, _param) {
    // 掉落计数
    const allSign = this.app.Config.DropSign.keys();
    allSign.map( (id) => {
        player.Counter.DropSign.set(id, 0);
    });

    // 掉落次数
    const allTimes = this.app.Config.DropOne.getNeedRecordTimes();
    allTimes.map( (id) => {
        player.Counter.DropTimes.set(id, 0);
    });

    // 重置全局的掉落计数器
    await this.app.rpcs.global.dropRemote.resetSign({});
};

// 刷新神秘
GmService.prototype.mysteryRefresh = function (player, param) {
    const shopId = param[0];
    const mystery = player.Shop.getMystery(shopId);
    mystery.refresh(true);
};

// 触发跨天
GmService.prototype.onDayChange = function(player, _param) {
    player.dayChange(true,1);
};

// 触发计时器
GmService.prototype.timerService = function(player, param) {
    const timerId = param[0];
    let count = param[1] || 0;
    const cfg = this.app.Config.Timer.get(timerId);
    const serverLastTriggerMs = this.app.Timer.getLastTriggerMs(timerId);
    player.recurTimer[timerId] = serverLastTriggerMs - 2000;
    if (count == 0) {
        count = this.app.Timer.calTriggerCount(timerId, player.recurTimer[timerId], serverLastTriggerMs);
    }
    if(cfg.UseType == 0){
        this.app.Timer.simulateTrigger(timerId, count);
    }
    else{
        this.app.rpcs.global.timerRemote.simulateTrigger({}, timerId, count);
    }
};

// 触发计时器
GmService.prototype.timerService2 = function (player, param) {
    const timerId = param[0];
    const serverLastTriggerMs = this.app.Timer.getLastTriggerMs(timerId);
    player.recurTimer[timerId] = serverLastTriggerMs - 2000;
    const cfg = this.app.Config.Timer.get(timerId);
    this.app.Timer.doTimer(player.recurTimer[timerId], cfg);
};

// 大宝剑
GmService.prototype.dabaojian = function (player, _param) {
    // 添加物品
    const items = this.app.Config.Global.get(1).GlobalJson;
    player.Item.addItem(util.proto.encodeConfigAward(items));
    // 设置关卡进度
    this.dungeon(player, ['2511']);
};

// 创建临时商店
GmService.prototype.createTemporary = function (player, param) {
    const shopId = param[0];
    const x = player.ShopTemporary.createShop(shopId, 4);
    console.log("________x_________", player.uid, x);
};

// 销毁临时商店
GmService.prototype.destroyTemporary = function (player, param) {
    const shopId = param[0];
    player.ShopTemporary.destroyShopId(shopId);
};

// vip等级
GmService.prototype.vipLv = function (player, param) {
    player.vip = Number(param[0]);
    player.Notify.notify('onSyncVipNotify', {
        vipLv: Number(param[0]),
        vipExp: 0
    });
    this.app.Brief.update(player.uid, code.brief.VIP.name, player.vip);
    player.Event.emit(code.event.VIP_CHANGED.name);
    player.Event.emit(code.event.RECOVERY_MAX_CHANGE.name);
    console.log(player.vip);
};

// 模拟充值
GmService.prototype.simulatePay = function(player, param) {
    const payId = Number(param[0]);
    const Amount = this.app.Config.Pay.get(payId).Rmb;
    const uid = player.uid;
    const params = {
        order_id : this.app.Id.genNext(),
        game_id : 0,
        server_id : player.accountData.serverId,
        fnpid : player.accountData.platform,
        uid : player.accountData.account,
        pay_way: code.global.PAY_WAY_GM,
        amount : Amount,
        callback_info: [payId, uid, 'gm'].join('_'),
        order_status : "S",
        failed_desc : "",
        gold : -1,
    };
    this.app.rpcs.auth.payRemote.simulatePay({}, params);
};

// 开启活动
GmService.prototype.operateStart = function(_player, param) {
    const id = param[0];
    const nowMs = util.time.nowMS();
    const timer = {
        id : id,
        time: nowMs,
        isStart: true,
        startMs: nowMs,
        stopMs: nowMs + 600000,
    };
    this.app.Event.emit([code.event.OPERATE_START_TIMER.name, id], timer);
};

// 关闭活动
GmService.prototype.operateStop = function (_player, param) {
    const id = param[0];
    const nowMs = util.time.nowMS();
    const timer = {
        id: id,
        time: nowMs,
        isStart: true,
        startMs: nowMs - 600000,
        stopMs: nowMs,
    };
    this.app.Event.emit([code.event.OPERATE_STOP_TIMER.name, id], timer);
};

// 购买投资
GmService.prototype.addNumBuyInvestFunds = function (_player, _param) {
    this.app.rpcs.activityRemote.addNumBuyInvestFunds();
};

// 重置所有任务
GmService.prototype.resetTask = function(player, _param){
    const missionData = player.Mission.getMission();
    delete missionData["record"];
    delete missionData["dailyRecord"];
    delete missionData["missionStartRecord"];
    delete missionData["chain"];
    player.Mission.update(missionData);
    player.Notify.notify("onNotifyMissionUpdate",{
        mainMission:player.Mission.getMissionStatus(code.mission.MISSION_TYPE.MAIN),
        dailyMission:player.Mission.getMissionStatus(code.mission.MISSION_TYPE.DAILY),
        achievement:player.Mission.getMissionStatus(code.mission.MISSION_TYPE.ACHIEVEMENT),
    });
};

/**
 * 设置公会项目活动中状态
 * projectState 1
 * projectState 2 donation  (donation可为空 默认0)
 * projectState 3 curHp  (curHp可为空 默认最大Hp)
 * projectState 4
 * projectState 5 不等活动直接结算奖励
 */
GmService.prototype.projectState = async function (player, param) {
    const uid = player.uid;
    const state = param[0];
    const val = param[1];
    await this.app.rpcs.global.guildProjectRemote.setProjectState({}, uid, state, val);
};

/**
 * 主线任务调关
 */
GmService.prototype.mainTask = function (player, param) {
    if (param.length < 1) {
        return { code: code.err.ERR_COMMAND_PARAM_WRONG };
    }
    const mainMissionID = Number(param[0]);
    const cfg = this.app.Config.Task.get(mainMissionID);
    if(cfg.Type!=code.mission.MISSION_TYPE.MAIN){
        return { code: code.err.ERR_COMMAND_PARAM_WRONG };
    }
    const missionData = player.Mission.getMission();
    const chain = missionData["chain"] || {};
    chain[code.mission.MISSION_TYPE.MAIN] = mainMissionID;
    missionData["chain"] = chain;
    player.Mission.update(missionData);
    player.Event.emit(code.event.MISSION_COMPLETE.name);
    player.Notify.notify("onNotifyMissionUpdate",{
        mainMission:player.Mission.getMissionStatus(code.mission.MISSION_TYPE.MAIN),
    });
};

GmService.prototype.banner = function (player, param){
    this.app.Chat.bannerSysChat(param[0].toString());
};
GmService.prototype.bannerTplt = function (player, param){
    const id = Number(param[0]);
    this.app.Chat.bannerSysTpltChat(id, param.slice(1));
};

// 修改开服时间 sot:2020-07-13,10,0,0
GmService.prototype.sot = async function (_player, _param) {
    const file = path.resolve(__dirname + "./../../../../config/development/system.json");
    fs.readFile(file, function (err, data) {
        if (err) {
            console.log(err);
            return false;
        }
        console.log(data.toString());
        const res = JSON.parse(data);
        res.serverOpenTime = `${_param[0]} ${_param[1]}:${_param[2]}:${_param[3]}`;
        fs.writeFile(file, JSON.stringify(res,null,2), function (err) {
            if (err) {
                console.log(err);
                return false;
            }
        });
    });
    
};

//const moment = require('moment');
GmService.prototype.test = async function (_player, _param) {
    const openServerStr = this.app.SystemConfig.getServerOpenStr();
    const diffDay = util.time.timeStrFormNowDay(openServerStr);
    console.log(`______________day_____`, openServerStr, diffDay);
};

GmService.prototype.banChat = async function (player, _param) {
    const timestamp = Number(_param[0]);
    const reason = "reason";
    player.Ban.banChat(timestamp, reason);
    player.Notify.notify('onSyncChatBanEndTime', {
        banChatEndTime: timestamp
    });
    this.app.rpcs.global.offlineRemote.cleanOfflinePrivateChat({}, player.uid);
    // 全服广播
    this.app.rpcs.global.notifyRemote.broadcast({}, 'onSyncChatBanRoleId', {
        uid: String(player.uid)
    });
};


GmService.prototype.dropTest = async function (player, param){
    if (param.length < 2) {
        return { code: code.err.ERR_COMMAND_PARAM_WRONG };
    }
    const dropId = Number(param[0]);
    const times = Number(param[1]);
    const trace = true;
    const {item} = await player.Drop.dropTimes(dropId, times, trace);

    const info = {};
    for(const each of item){
        info[each.itemID] = (info[each.itemID] || 0) + 1;
    }

    let str = '';
    for(const each of Object.keys(info)){
        const leftStr = this.app.Config.Item.get(each).Name + " - " + String(each);
        const rightStr = String(info[each]) + " 次";
        str += `${leftStr}\t\t\t:\t${rightStr}\n`;
    }
    // console.log(JSON.stringify(traceInfo,null,2));
    this.app.Mail.sendMail(player.uid,`dropTest:${dropId},${times}`,str,[]);
};

// gm drawLuckTurntableTest:1,10000
GmService.prototype.drawLuckTurntableTest = function(player, param) {
    const callId = param[0];
    const times = param[1];
    let str = "";
    let data5w = 0;
    let data4w = 0;
    let data3w = 0;
    let data2w = 0;
    let data1w = 0;
    let data0w = 0;
    for (let i = 0; i < times; ++i){
        const multi = [];
        let diamond = 0;
        for (let index = 1; index < 8; ++index) {
            const cfg = this.app.Config.OperateLuckyTurntable.getCfg(callId, index);
            const cost = util.proto.encodeConfigAward(cfg.Cost);
            const res = this.app.Config.OperateLuckyTurntable.randomRewards(callId, index);
            diamond = diamond - cost[0].itemNum + res.diamond;
            multi.push(res.multi); 
        }
        str += multi.join(',')  + "|" + diamond + "\n";
        if (diamond > 50000) {
            data5w += 1;
        } else if (diamond > 40000) {
            data4w += 1;
        } else if (diamond > 30000) {
            data3w += 1;
        } else if (diamond > 20000) {
            data2w += 1;
        } else if (diamond > 10000) {
            data1w += 1;
        } else {
            data0w += 1;
        }
    }
    console.log(`____________data5w_______`, data5w);
    console.log(`____________data4w_______`, data4w);
    console.log(`____________data3w_______`, data3w);
    console.log(`____________data2w_______`, data2w);
    console.log(`____________data1w_______`, data1w);
    console.log(`____________data0w_______`, data0w);
    const file = "E:/draw.txt";
    fs.writeFile(file, str, function (err) {
        if (err) {
            console.log(err);
            return false;
        }
    });
};

/**
 * 清除公会退出cd
 * clearcd 1
 */
GmService.prototype.clearcd = function (player, _param) {
    const uid = player.uid;
    this.app.rpcs.global.guildRemote.clearLeaveTime({}, uid);
};

GmService.prototype.testFriendship = async function (player, param) {
    if (param.length < 3) {
        return { code: code.err.ERR_COMMAND_PARAM_WRONG };
    }
    const stair = param[0];
    const index = param[1];
    const times = param[2];


    const data = player.Friendship.getFriendship();
    const ID = data.ID || 0;
    const totalCfg = this.app.Config.FriendshipLine.getConfig(ID, stair, index);
    const friendshipCfg = this.app.Config.Friendship.get(totalCfg.friendshipID);
    const boss =  this.app.Config.CardArray.getRandomBossArray(
        friendshipCfg.CardUseType,
        player.lv,
        player.Friendship._getBasePower(),
        totalCfg.difficulty,
        friendshipCfg.AttributeValue,
    );
    let resultStr = "";
    const allPromise = [];
    let winTimes = 0;
    let falseTimes = 0;
    for(let index = 0; index<times; index++){
        const playerInfo = {uid:index, name:player.name};
        allPromise.push(this.app.rpcs.battle.battleRemote.startBattle(
            {}, 
            code.battle.BATTLE_TYPE.FRIENDSHIP, 
            playerInfo,
            player.Friendship.getSelfBattleCards(), 
            boss.bossInfo, 
            boss.bossArray, 
            [],
        ).then(({err,res})=>{
            let isWin;
            if(err){
                isWin = false;
                logger.error(err);
            }else{
                isWin = res.isWin;
            }
            if(isWin){
                winTimes ++;
            }else{
                falseTimes ++;
            }
            resultStr += `${index}\t\t\tisWin:${isWin}\n`;
        }));
        
    }
    await Promise.all(allPromise);
    const allResultStr = `胜利次数：${winTimes}\t\t\t失败次数：${falseTimes}\n`;
    this.app.Mail.sendMail(player.uid,`FriendshipTest:${stair},${index},${times}`,allResultStr, []);
    require('fs').writeFileSync(
        require('path').join(this.app.getBase(),'/logs/',Date.now().toString()),
        `FriendshipTest:${stair},${index},${times}\n` + allResultStr+resultStr, 
        {encoding: 'utf8'}
    );
};

