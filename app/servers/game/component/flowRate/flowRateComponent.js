const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const bearcat = require('bearcat');

const GuildComponent = function(app, player){
    this.$id = 'game_FlowRateComponent';
    this.$scope = 'prototype';
    this.app = app;
    this.player = player;
};

module.exports = GuildComponent;
bearcat.extend('game_FlowRateComponent', 'game_Component');


GuildComponent.prototype.onAfterLogin = async function (){
    const player = this.player;
    const { err, res } = await this.app.rpcs.global.flowRateRemote.getFlowRateRank({}, player.uid);
    if (err) {
        logger.error(`this.app.rpcs.global.flowRateRemote.getFlowRateRank ${player.uid} get error`);
    }
    else {
        player.flowRateRank = res || 0;

    }
};