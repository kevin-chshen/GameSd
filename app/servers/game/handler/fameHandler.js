/**
 * @description 头衔消息模块
 * @author chenyq
 * @date 2020/04/08
 */
const logger = require('pomelo-logger').getLogger('pomelo', __filename);

// let pomelo = require('pomelo');
const code = require('@code');
const util = require('@util');
const MongoPlayer = require('@mongo/mongoPlayer');

module.exports = function (app) {
    return new Handler(app);
};

const Handler = function (app) {
    this.app = app;
};
/**
 * 获取头衔信息
 */
Handler.prototype.fameGetInfo = function (msg, session, next) {
    const player = session.player;
    if (!player) { next(null); return; }
    const lv = player.lv;
    const config = this.app.Config.Prestige.get(lv);
    let isGetDaily = 0;
    // 今日奖励已领取
    if (player.Fame.isGetDailyReward(config)) {
        isGetDaily = 1;
    }
    const manifesto = player.manifesto || "";
    logger.info(`player:${player.uid} fameGetInfo isGetDaily:${isGetDaily} manifesto:${manifesto}`);
    next(null, { code: code.err.SUCCEEDED, isGetDaily: isGetDaily, manifesto: manifesto });
};
/**
 * 头衔升阶
 */
Handler.prototype.fameUpgrade = function (msg, session, next) {
    const player = session.player;
    if (!player) { next(null); return; }
    const lv = player.lv;
    const config = this.app.Config.Prestige.get(lv);
    const newLv = lv + 1;
    // 获取下一阶配置
    const nextConfig = this.app.Config.Prestige.get(newLv);
    if (!nextConfig) {
        next(null, { code: code.err.ERR_FAME_MAX });
        return;// 头衔已满阶5701
    }
    if (config.Order == nextConfig.Order) {
        player.Event.emit(code.event.FAME_UP.name);
        next(null, { code: code.err.ERR_FAME_UPGRADE_QUERY });
        return;
    }
    // 名望是否足够
    const reputation = player.Currency.get(code.currency.CURRENCY_ID.REPUTATION);
    if (reputation < nextConfig.PrestigeValue) {
        next(null, { code: code.err.ERR_FAME_REPUTATION });
        return;// 名望不足5702
    }
    // 秒收益是否足够
    const cashPerSecond = player.cashPerSecond;
    if (BigInt(cashPerSecond) < BigInt(nextConfig.MakeMoneySpeed)) {
        next(null, { code: code.err.ERR_FAME_SECOND_INCOME });
        return;// 秒收益不足5703
    }
    // 判断每日奖励是否已领取
    if (!player.Fame.isGetDailyReward(config)) {
        next(null, { code: code.err.ERR_FAME_DAILY_NOT_GET });
        return;// 每日奖励未领取5704
    }
    player.Fame.fameUpgrade([newLv]);
    player.Event.emit(code.event.FAME_UP.name);
    logger.info(`player:${player.uid} fameUpgrade:${lv} => ${newLv}`);
    const isGetDaily = player.Fame.isGetDailyReward(nextConfig) ? 1 : 0;
    next(null, { code: code.err.SUCCEEDED, isGetDaily: isGetDaily });
};
/**
 * 头衔每日奖励领取
 */
Handler.prototype.getDailyReward = function (msg, session, next) {
    const player = session.player;
    if (!player) { next(null); return; }
    const lv = player.lv;
    const config = this.app.Config.Prestige.get(lv);
    // 阶数相同，领取同一天才是今日已领取
    if (player.Fame.isGetDailyReward(config)) {
        next(null, { code: code.err.ERR_FAME_DAILY_GET });
        return;// 今日奖励已领取5705
    }
    player.fameDailyReward = { order: config.Order, lastTime: Date.now() };
    player.Item.addItem(util.proto.encodeConfigAward(config.EverydayReward), code.reason.OP_FAME_DAILY_REWARD_GET);
    logger.info(`player:${player.uid} getDailyReward lv:${lv} reward:${JSON.stringify(config.EverydayReward)}`);
    next(null, { code: code.err.SUCCEEDED });
};
/**
 * 修改名称
 */
Handler.prototype.rename = async function (msg, session, next) {
    const player = session.player;
    if (!player) { next(null); return; }
    const name = msg.name;
    // 与原名称一致 无需修改
    if (player.name === name) {
        next(null, { code: code.err.ERR_FAME_RENAME });
        return;// 5706
    }
    // 名字长度 4001
    if (name === undefined || name.length === 0 || name.length > 32) {
        next(null, { code: code.err.ERR_CREATE_ROLE_NAME });
        return;
    }
    if (name.indexOf(' ') >= 0) {
        next(null, { code: code.err.ERR_CREATE_ROLE_NAME_NOT_SPACE });
        return;
    }
    // 敏感字符
    if (this.app.Config.WordFilter.query(name)) {
        next(null, { code: code.err.ERR_FAME_RENAME_WORD_FILTER });
        return;// 5707
    }
    // 数据库查重 4003
    const queryName = await MongoPlayer.query({ name: name });
    if (queryName.length != 0) {
        next(null, { code: code.err.ERR_CREATE_ROLE_NAME_EXIST });
        return;
    }
    // TODO 改名卡消耗
    const globalInfo = this.app.Config.Global.get(code.fame.FAME_RENAME_COST);
    const costList = util.proto.encodeConfigAward([globalInfo.GlobalJson]);
    const itemMgr = player.Item;
    if (!itemMgr.isEnough(costList)) {
        next(null, { code: code.err.ERR_FAME_RENAME_COST });
        return; // 改名卡消耗不足5708
    }
    itemMgr.deleteItem(costList, code.reason.OP_FAME_RENAME_COST);
    player.name = name;
    player.Event.emit(code.event.RENAME.name, { name: name });
    logger.info(`player:${player.uid} rename name:${name}`);
    next(null, { code: code.err.SUCCEEDED });
};
/**
 * 修改宣言
 */
Handler.prototype.alterManifesto = function (msg, session, next) {
    const player = session.player;
    if (!player) { next(null); return; }
    const manifesto = msg.manifesto;
    // 宣言一致，无需修改
    if (player.manifesto === manifesto) {
        next(null, { code: code.err.ERR_FAME_MANIFESTO });
        return;// 5709
    }
    // 宣言长度
    if (manifesto === undefined || manifesto.length > 50) {
        next(null, { code: code.err.ERR_FAME_MANIFESTO_LENGTH });
        return;// 5710
    }
    // 是否被禁言了
    if (player.Ban.isBanChat()) {
        next(null, { code: code.err.ERR_CHAT_BAN });
        return;
    }
    // 敏感字符
    if (this.app.Config.WordFilter.query(manifesto)) {
        next(null, { code: code.err.ERR_FAME_MANIFESTO_WORD_FILTER });
        return;// 5711
    }
    player.manifesto = manifesto;
    player.Event.emit(code.event.MANIFESTO_MODIFY.name);
    logger.info(`player:${player.uid} alterManifesto manifesto:${manifesto}`);
    // 记录个性宣言
    const data = {
        channelId: code.chat.CHANNEL.NONE,
        text: manifesto.replace(/[\r\n\s\f\t]/g, " "),
        msgType: 0,
        targetUid: 0,
    };
    this.app.Log.chatLog(player, data);
    next(null, { code: code.err.SUCCEEDED });
};

