// const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const bearcat = require('bearcat');
const code = require('@code');
const utils = require('@util');

const OperateRankRush = function (app, id, type, data) {
    this.$id = 'global_OperateRankRush';
    this.$scope = 'prototype';
    this.app = app;
    this.operateId = id;
    this.type = type;
    this.data = data;
};
bearcat.extend('global_OperateRankRush', 'global_OperateBase');
module.exports = OperateRankRush;

/**
 * {
 * }
 */

OperateRankRush.prototype.init = async function () {
    this.callId = this.app.Config.OperateBaseActivity.get(this.operateId).CallId;
};

OperateRankRush.prototype.reset = async function (startMs, stopMs) {
    this.data.startMs = startMs;
    this.data.stopMs = stopMs;
    this.update();
};

OperateRankRush.prototype.stop = async function() {
    const type = this.app.Config.OperateRankingList.getCallIdRankType(this.callId);
    let rankType;
    let flowRateRankObj;
    switch(type){
    case 1:
        rankType = code.rank.RANK_KEYS.EARN;
        break;
    case 2:
        rankType = code.rank.RANK_KEYS.POWER;
        break;
    case 3:
        rankType = code.rank.RANK_KEYS.CAR;
        break;
    case 4:
        flowRateRankObj = this.app.FlowRate.getFlowRateRankList(0, 100);
        break;
    default:
        return;
    }
    let rankObj;
    if(rankType){
        rankObj = await this.app.Rank.getRanksRealTime(rankType, false);
    }else if(flowRateRankObj){
        rankObj = flowRateRankObj;
    }else{
        return;
    }

    for(const [rank,uid] of Object.entries(rankObj)){
        const cfg = this.app.Config.OperateRankingList.getRankCfg(this.callId, Number(rank));
        if(cfg){
            const reward = cfg.Reward;
            const nodeSec = utils.time.nowSecond();
            const mailConfig = this.app.Config.Mail.get(cfg.MailId);
            if(mailConfig){
                const mail = {
                    title: mailConfig.Name,
                    content: utils.format.format(mailConfig.Text, rank) || "",
                    item: reward ? utils.proto.encodeConfigAward(reward) : [],
                    type: code.mail.TYPE.SYSTEM,
                    sendTime: nodeSec,
                    expirationTime: mailConfig.ExpirationTime > 0 ? nodeSec + mailConfig.ExpirationTime : 0,
                    status: reward? code.mail.STATUS.UNRECEIVED : code.mail.STATUS.UNREAD,
                };
                await this.app.Mail.sendCustomMail(uid, mail);
            }
        }
    }
};