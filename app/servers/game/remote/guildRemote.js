/**
 * @description game服公会相关的远程调用
 * @author chenyq
 * @date 2020/04/28
 */

const code = require('@code');

module.exports = function (app) {
    return new Remote(app);
};

const Remote = function (app) {
    this.app = app;
};

/**
 * 通知玩家公会变更 (包括离线成员)
 * @param {Integer} uid 角色id
 * @param {Integer} guildId 物品
 * @param {Function} cb
 */
Remote.prototype.changeGuildInfo = async function (uid, info, cb) {
    const player = this.app.Player.getPlayerByUid(uid);
    if (!player) {
        cb("player not exist");
        return;
    }
    player.guildId = info.guildId;
    if (info.beforeGuildId != info.guildId) {
        const isOnTime = true;
        player.Event.emit(code.event.GUILD_ID_UPDATE.name, info.beforeGuildId, isOnTime);
    }
    player.contribute = info.contribute;
    const beforeLv = player.guildLv;
    player.guildLv = info.guildLv;
    if(beforeLv!=info.guildLv){
        player.Event.emit(code.event.GUILD_LV_CHANGE.name);
    }
    const data = [{ itemID: code.guild.GUILD_ITEM_ID.CONTRIBUTE, itemNum: String(player.contribute) }];
    this.app.get('channelService').pushMessageByUids("onSyncOtherItemNotify", { data: data }, [{ uid: player.uid, sid: player.connectorId }]);
    cb(null);
};
/**
 * 通知玩家公会科技加成变更
 * @param {Integer} uid 角色id
 * @param {Object} technologyAdd { recruitAdd: {id:val,...}, cardAdd: {career:{attr},...} };
 * @param {Number} career 影响该职业的主播
 */
Remote.prototype.changeTechnologyAdd = async function (uid, technologyAdd, career, cb) {
    const player = this.app.Player.getPlayerByUid(uid);
    if (!player) {
        cb("player not exist");
        return;
    }
    player.technologyAdd = technologyAdd;
    // 属性计算 重新计算卡牌属性
    player.Card.CalcTechnologyAttribute(career);
    cb(null);
};

/**
 * 通知公会数据变更
 * @param {Integer} uid 角色id
 * @param {Integer} data { guildLv: 1 }
 * @param {Function} cb
 */
Remote.prototype.changeGuildData = async function (uid, data, cb) {
    const player = this.app.Player.getPlayerByUid(uid);
    if (!player) {
        cb("player not exist");
        return;
    }
    const beforeLv = player.guildLv;
    player.guildLv = data.guildLv;
    if(beforeLv!=data.guildLv){
        player.Event.emit(code.event.GUILD_LV_CHANGE.name);
    }

    cb(null);
};

/**
 * 通知公会公告和宣言编辑
 * @param {Integer} uid 角色id
 * @param {Integer} msg 
 * @param {Function} cb
 */
Remote.prototype.guildDump = async function (uid, guildId, data, cb) {
    const player = this.app.Player.getPlayerByUid(uid);
    if (!player) {
        cb("player not exist");
        return;
    }
    const res = data.replace(/[\r\n\s\f\t]/g, " ");
    const retMsg = `--${guildId}--${res}`
    const msg = {
        channelId: code.chat.CHANNEL.NONE,
        text: retMsg,
        msgType: 0,
        targetUid: 0,
    };
    this.app.Log.chatLog(player, msg);
    cb(null);
};