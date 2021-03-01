/**
 * @description 
 * @author linjs
 * @date 2020/03/19
 */

const code = require('@code');
const util = require('@util');
const fs = require('fs');
const path = require('path');
const bearcat = require('bearcat');

const file = require('@mongo/mongoPay');
const mongoAccount = require('@mongo/mongoAccount');
const mongoInvest = require('@mongo/mongoInvest');

module.exports = function (app) {
    return new Handler(app);
};

const Handler = function (app) {
    this.app = app;
};

Handler.prototype.test = async function (msg, session, next) {
    //console.log(`_____MongoPay______________`, file);
    bearcat.getBean('logic_RepairService').init();
    // const index = mongoInvest.prototype._index;
    // const name = mongoInvest.prototype._collectionName;
    // const res = await this.app.db.collection(name).find({}).toArray();
    // console.log(`______test______`, name, index, res.length);
    
    // await this.app.db.collection(name).remove({});
    // res.map((mongo) =>{
    //     console.log(`______test______`, mongo[index], mongo._id);
       
    //     mongo._id = mongo[index];
    //     this.app.db.collection(name).insert(mongo);
    // });
    // const player = session.player;
    // const sqlDirPath = path.resolve(__dirname, '../../../../sql/change');
    // const files = fs.readdirSync(sqlDirPath, 'utf-8');
    // const sorted = files.sort((a, b) => {        
    //     const s1 = fs.statSync(path.resolve(sqlDirPath, a));
    //     const s2 = fs.statSync(path.resolve(sqlDirPath, b));
    //     console.log(`__________a________`, a, s1.ctime);
    //     console.log(`__________b________`, b, s2.ctime);
    //     return s1.ctime < s2.ctime;
    // });
    // console.log(`______________sorted_____`, sorted);
    // const versionList = fileList.map((fileName) => {
    //     return fileName.split('.sql').join('');
    // });
    next(null, { msg: 'test ok.' });
};

Handler.prototype.count = async function (msg, session, next) {
    const player = session.player;
    console.log(`before player [${player.uid}] count [${player.Test.getCount()}]`);
    player.Test.addCount();
    console.log(`after player [${player.uid}] count [${player.Test.getCount()}]`);
    next(null, { msg: 'test getter/setter ok.' });
};

Handler.prototype.getter = async function (msg, session, next) {
    const player = session.player;
    console.log(`before player [${player.uid}] lv [${player.lv}].`);
    player.lv = 3;
    console.log(`after player [${player.uid}] lv [${player.lv}].`);
    next(null, { msg: 'test getter/setter ok.' });
};

Handler.prototype.redis = async function (msg, session, next) {
    const redis = this.app.Redis;
    console.log('gameOnlineScore', await redis.zscore(code.redis.GAME_ONLINE_NUM.name, this.app.getServerId()));
    await redis.hset([code.redis.TEST.name, "1"], 'name', 'hello');
    await redis.hset([code.redis.TEST.name, "1"], 'num', 123);
    await redis.hset([code.redis.TEST.name, "2"], 'name', 'hell2');
    await redis.hset([code.redis.TEST.name, "2"], 'num', 456);
    console.log('test.Name1', await redis.hget([code.redis.TEST.name, '1'], 'name'));
    console.log('test.Num1', await redis.hget([code.redis.TEST.name, '1'], 'num'));
    console.log('test.Name2', await redis.hget([code.redis.TEST.name, '2'], 'name'));
    console.log('test.Num2', await redis.hget([code.redis.TEST.name, '2'], 'num'));

    next(null, { msg: 'test redis ok.' });
};

Handler.prototype.event = async function (msg, session, next) {
    const player = session.player;
    player.Event.emit(code.event.LEVEL_UP.name, { oldLv: 1, newLv: 2 });
    next(null, { msg: 'test event ok.' });
};

Handler.prototype.brief = async function (msg, session, next) {
    const player = session.player;
    player.Brief.test();
    const brief = await this.app.Brief.getBrief(player.uid);
    console.log(`player [${player.uid}] test: ${JSON.stringify(brief.test)} lv: ${brief.lv}`);
    const brief2 = await this.app.Brief.getBriefGroup([player.uid, player.uid + 1, player.uid - 1]);
    console.log(`player uids:${[player.uid, player.uid + 1, player.uid - 1]} brief:${JSON.stringify(brief2)}`);
    brief2.map((info) => {
        if (info) {
            console.log(`player [${info.uid}] version: ${info.version} type: ${typeof info.test}`);
        }
    });
    next(null, { msg: 'test brief ok.' });
};

Handler.prototype.alias = async function (msg, session, next) {
    const code = require('@code');
    const playerCode = require('@code/playerCode');
    const util = require('@util');
    const randomUtil = require('@util/randomUtil');
    const MongoPlayer = require('@mongo/mongoPlayer');
    console.log(`code:${code.player.Keys.NAME},playerCode:${playerCode.Keys.NAME}`);
    console.log(`util:${util.random.random(1, 10)} randomUtil:${randomUtil.random(1, 10)}`);
    console.log(`mongoPlayer:${typeof (MongoPlayer)}`);
    next(null, { msg: 'test alias ok.' });
};

Handler.prototype.mail = async function (msg, session, next) {
    next(null, { msg: 'test mail ok.' });
};

Handler.prototype.wordFilter = async function (msg, session, next) {
    const str = "aa护照";
    const list = [];
    for (const info of this.app.Config.WordFilter.values()) {
        list.push(info.Name);
    }
    const l = list.some(function (word) {
        return str.includes(word);
    });
    console.log("__________l", str, l);
    next(null, { msg: 'test wordFilter ok.' });
};

Handler.prototype.time = async function (msg, session, next) {
    console.log("_____当前时间戳(毫秒)", Date.now());
    console.log("_____当前日期", new Date());
    console.log("_____当天时间戳(毫秒)", new Date().getTime());
    const moment = require('moment');
    moment.locale('zh-cn');
    const nowDay = moment();
    console.log("_____当前时间年份", nowDay.format('YYYY'));
    console.log("_____当前时间日期", nowDay.format('YYYY-MM-DD HH:mm:ss'));
    console.log("_____当前时间格式化", moment(Date.now()).format('YYYY-MM-DD HH:mm:ss'));
    console.log("_____当天0点时间戳(秒)", moment(undefined).startOf('day').unix());
    console.log("_____当天0点时间格式化", moment(undefined).startOf('day').format('YYYY-MM-DD HH:mm:ss'));
    console.log("_____当天23:59时间戳(秒)", moment().endOf('day').unix());
    console.log("_____当天23:59时间格式化", moment().endOf('day').format('YYYY年MM月DD日 HH时mm分ss秒'));

    console.log("_____isSameDay1", util.time.isSameDay(1590650314017));
    console.log("_____isSameDay2", util.time.isSameDay({ year: 2010, month: 0, day: 5, hour: 15, minute: 10, second: 3, millisecond: 123 }));
    console.log("_____isSameDay3", util.time.isSameDay(1590650314017, Date.now()));
    console.log("_____isSameDay4", util.time.isSameDay(1590650314, 1590650014));
    console.log("_____isSameDay5", util.time.isSameDay(1590650314017, 1590650310017));

    console.log("_____当天0点时间戳(秒)", util.time.curDayStartUnix());
    console.log("_____当天0点时间格式化", moment({ year: 2010, month: 0, day: 5, hour: 15, minute: 10, second: 3, millisecond: 123 }).startOf('day').format('YYYY-MM-DD HH:mm:ss'));
    console.log("_____当天23:59时间戳(秒)", util.time.curDayEndUnix());
    console.log("_____当天23:59时间格式化", moment().endOf('day').format('YYYY-MM-DD HH:mm:ss'));

    console.log("_____当前日期", util.time.getDateString());
    console.log("_____当前日期", util.time.getDateString(1586361600000));

    next(null, { msg: 'test time ok.' });
};

Handler.prototype.config = async function (msg, session, next) {
    const config = this.app.Config;
    const prestige = config.Prestige.keys();
    const max = Math.max(...prestige);
    const max1 = config.Prestige.keyMax();
    const max2 = Math.max([]);
    const max3 = Math.max(...[0]);
    console.log("_____max", max, max1, max2, max3);

    // 测试依赖加载
    console.log(`all related with 501 is ${config.DropOne.getRelatedSign(501)}`);
    console.log(`person related with 501 is ${config.DropOne.getRelatedPersonSign(501)}`);
    console.log(`server related with 501 is ${config.DropOne.getRelatedServerSign(501)}`);

    next(null, { msg: 'test configMax ok.' });
};

Handler.prototype.id = async function (msg, session, next) {
    for (let index = 0; index < 1; index++) {
        console.log('gen id', index, this.app.Id.genNext(code.id.KEYS.CHAT));
    }

    next(null, { msg: 'test id ok' });
};

Handler.prototype.recovery = async function (msg, session, next) {
    const player = session.player;
    //判断恢复次数是否足够
    const r1 = player.Recovery.judgeRecoveryNum(1, 100);
    const r2 = player.Recovery.judgeRecoveryNum(1, { 106: 5 });
    const r3 = player.Recovery.judgeRecoveryNum(3, 100);
    console.log("recovery", r1, r2, r3);
    next(null, { msg: 'test recovery ok' });
};

Handler.prototype.object = async function (msg, session, next) {
    // const player = session.player;
    //判断恢复次数是否足够
    const initData = { lv: 1, exp: 0, dict: { k: 10 }, list: [1, 2, [3, 4, 5], { "a": 1, "b": 2 }] };
    const a = util.object.deepClone(initData);
    const b = util.object.deepClone(initData);
    console.log("____b", b);
    a.lv = 2;
    a.dict[22] = 22;
    a.dict.k = 20;
    a.list[0] = 20;
    a.list.push(100);
    a.list[3].a = 66;
    a.list[3].c = 88;
    b.lv = 3;
    initData.dict[22] = 222;
    console.log("____initData", initData);
    console.log("____a", a);
    console.log("____b", b);
    const c = util.object.deepClone(undefined);
    console.log("____c", c);
    const d = util.object.deepClone(123);
    console.log("____d", d);
    const e = util.object.deepClone([1, 2, [3, 4, 5], { "a": 1, "b": 2 }]);
    console.log("____e", e);
    next(null, { msg: 'test object ok' });
};

Handler.prototype.helper = async function (msg, session, next) {
    this.app.Helper.Base.test();
    this.app.Helper.Drop.test();
    next(null, { msg: 'test helper ok.' });
};

Handler.prototype.counter = async function (msg, session, next) {
    const counter = session.player.Counter.DropSign.get(31);
    console.log('current', session.player.Counter.DropSign.getCounterGroup([31, 32, 33]));
    counter.add();
    console.log('after add', counter.get());
    counter.reset();
    console.log('after reset', counter.get());
    next(null, { msg: 'test counter ok.' });
};

Handler.prototype.chat = async function (msg, session, next) {
    const chat = this.app.Chat;
    chat.worldSysChat('世界系统消息');
    chat.worldSysTpltChat(1, ['鱼与熊掌']);
    chat.guildSysChat(session.player.guildId, '公会系统消息');
    chat.guildSysChat(session.player.guildId, 1, ['鱼与熊掌']);
    chat.privateSysChat(session.player.uid, '个人频道系统消息');
    chat.privateSysChat(session.player.uid, 1, ['鱼与熊掌']);
    chat.bannerSysChat('跑马灯系统消息');
    chat.bannerSysTpltChat(1, ['鱼与熊掌']);
    next(null, { msg: 'test chat ok.' });
};

Handler.prototype.guild1 = async function (msg, session, next) {
    const player = session.player;
    await player.Item.addItem([{ itemID: 1102, itemNum: 3 }, { itemID: 1102, itemNum: 7 }]);
    console.log("添加联盟贡献");

    next(null, { msg: 'test guild ok.' });
};
Handler.prototype.guild2 = async function (msg, session, next) {
    const player = session.player;
    const isTrue = player.Item.isEnough([{ itemID: 1102, itemNum: 20 }, { itemID: 1102, itemNum: 30 }, { itemID: 1, itemNum: 10 }]);
    console.log("判断联盟贡献是否足够", isTrue);
    if (isTrue) {
        console.log("扣除联盟贡献");
        player.Item.deleteItem([{ itemID: 1102, itemNum: 50 }]);
    }
    next(null, { msg: 'test guild ok.' });
};

Handler.prototype.flowrate = async function (msg, session, next) {
    const min = msg.min;
    const max = msg.max;
    const res = await this.app.rpcs.global.flowRateRemote.flowRateRank({}, min, max);
    console.log("流量为王排行:", res.res);
    this.app.Config.FlowrateRank.getOfflineReward(2697, 100);
    this.app.Config.FlowrateRank.getOfflineReward(2859, 100);
    next(null, { msg: 'test flowrate ok.' });
};

Handler.prototype.car = async function (msg, session, next) {
    const player = session.player;
    // player.Car.updateCarTopThree();
    // const brief = await this.app.Brief.getBrief(100200000010026);
    // console.log("缩略信息 获取豪车前三数据 carTopThree=", brief.carTopThree);
    const info = player.Car.getQuickCompoundCost([102, 103, 104, 105]);
    console.log("豪车测试：：：", info);
    next(null, { msg: 'test car ok' });
};

Handler.prototype.autoShow = async function (msg, session, next) {
    const player = session.player;
    console.log(player.AutoShow.deleteData(1));
    next(null, { msg: 'test autoShow ok' });
};

Handler.prototype.guildBuild = async function (msg, session, next) {
    await this.app.rpcs.global.timerRemote.simulateTrigger({}, code.guild.GUILD_ON_DAY_TIMER, 1);
    next(null, { msg: 'test guildBuild ok' });
};

Handler.prototype.battle = async function (msg, session, next) {
    const player = session.player;
    const selfArray = [{
        id: 101,
        hp: 1000,
        atk: 100,
        skill: 10105,
    }];
    const playerInfo = { uid: session.uid, name: player.get(code.player.Keys.NAME) };
    const bossInfo = { uid: 0, name: "测试" };
    const bossArray = [{
        id: 1,
        hp: 1000,
        atk: 80,
        skill: 10105,
    }];
    console.log(`${JSON.stringify(selfArray)}__________${JSON.stringify(bossArray)}`);
    for (let index = 0; index < 10000; ++index) {
        console.log(`____________index_______`, index);
        this.app.rpcs.battle.battleRemote.startCustomizedBattle(
            {},
            code.battle.BATTLE_TYPE.DUNGEON,
            playerInfo,
            selfArray,
            bossInfo,
            bossArray,
            [{ itemID: 1, itemNum: 100 }],
            [],
            [{ id: 1, hp: 1200, atk: 99 }],
        ).then(({ err, res }) => {
            if (err) {
                console.log(err);
            }
            console.log(`reward__________${JSON.stringify(res.award)}`);
            console.log(`${JSON.stringify(res.selfArray)}__________${JSON.stringify(res.enemyArray)}`);
        });
    }
    next(null, { msg: 'test battle ok' });
};

Handler.prototype.protoEncode = async function (msg, session, next) {
    const obj = {
        1: 10,
        99: 20,
        3: 30,
    };
    const list = [
        { 1: 10, 2: 20, 3: 30 },
        { 10: 100, 20: 200, 99: 300 },
        { 100: 1000, 99: 2000, 300: 3000 },
    ];
    const list2 = [
        { 1: 10 },
        { 99: 100 },
        { 100: 1000 },
    ];
    console.log(util.proto.encodeConfigAward(obj));
    console.log(util.proto.encodeConfigAward(list));
    console.log(util.proto.encodeConfigAward(list2));
    next(null, { msg: 'test protoEncode ok' });
};

Handler.prototype.logs = async function (msg, session, next) {
    const player = session.player;
    this.app.Log.itemsLog(player, 1, 1, [{ itemID: 99, itemNum: 100 }, { itemID: 1, itemNum: 200 }]);
    next(null, { msg: 'test logs ok' });
};

/**
 * 行为日志表插入数据
 * 添加 H_获取途径宏定义-BonusReason 时，需添加dict.sql中dict_action插入数据 或者使用该接口重新导出所有sql再一并修改
 */
Handler.prototype.bonusReasonToSql = async function (msg, session, next) {
    const configList = this.app.Config.BonusReason.values();
    let s = '';
    for (const config of configList) {
        //(101,'创角初始物品',3,0),
        s += '(' + config.Id + ',\'' + config.Name + '\',3,0),\n';
        s += '(' + config.Id + ',\'' + config.Name + '\',4,0),\n';
    }
    console.log(s);
    next(null, { msg: 'bonusReason dict_action insert sql generate ok!' });
};
/**
 * 物品日志表插入数据
 * 添加物品时使用 添加至dict.sql
 */
Handler.prototype.itemToSql = async function (msg, session, next) {
    const configList = this.app.Config.Item.values();
    let s = '';
    for (const config of configList) {
        //(1,'钻石',3,0),(2,'金币',1,0),...
        s += '(' + config.Id + ',\'' + config.Name + '\',' + config.Color + ',0),\n';
    }
    console.log(s);
    next(null, { msg: 'item dict_item insert sql generate ok!' });
};

Handler.prototype.cross = async function (msg, session, next) {
    const result = await this.app.CrossRpc.crossGame.testRemote.test({});
    console.log(`_____________${JSON.stringify(result)}_____________`);
    next(null, { msg: 'ok' });
};

/**
 * 日志表插入数据
 * 
 */
Handler.prototype.taskToSql = async function (msg, session, next) {
    const configList = this.app.Config.Task.values();
    let s = '';
    for (const config of configList) {
        if(config.Type == 1 && config.Id <= 10489){
            s += '(' + config.Id + ',' + config.PostpositionId + ',\'' + config.Describe + '\',0,\'\',1),\n';
        }
    }
    console.log(s);
    next(null, { msg: 'task dict_link_step insert sql generate ok!' });
};