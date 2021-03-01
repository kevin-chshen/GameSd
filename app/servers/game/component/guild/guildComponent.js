const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const bearcat = require('bearcat');
const code = require('@code');

const GuildComponent = function(app, player){
    this.$id = 'game_GuildComponent';
    this.$scope = 'prototype';
    this.app = app;
    this.player = player;
};

module.exports = GuildComponent;
bearcat.extend('game_GuildComponent', 'game_Component');


GuildComponent.prototype.onAfterLogin = async function (){
    // 登录公会处理
    const player = this.player;
    const { err, res } = await this.app.rpcs.global.guildRemote.loginGuildProcess({}, player.uid);
    if (err) {
        logger.error(`this.app.rpcs.global.guildRemote.loginGuildProcess ${player.uid} get error`);
    }
    else {
        player.guildId = res.guildId || 0;
        player.Event.emit(code.event.GUILD_ID_UPDATE.name);
        player.contribute = res.contribute || 0;
        player.technologyAdd = res.technologyAdd || {};
        player.guildLv = res.guildLv;
        const data = [{ itemID: code.guild.GUILD_ITEM_ID.CONTRIBUTE, itemNum: String(player.contribute) }];
        this.app.get('channelService').pushMessageByUids("onSyncOtherItemNotify", {data: data}, [{ uid: player.uid, sid: player.connectorId }]);
    }
};

GuildComponent.prototype.onLogout = async function (_reason) {
    // 离线公会处理
    await this.app.rpcs.global.guildRemote.logoutGuildProcess({}, this.player.uid);
};