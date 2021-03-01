/**
 * @description 通告消息
 * @author jzy
 * @date 2020/04/22
 */

// const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const code = require("@code");

module.exports = function (app) {
    return new Handler(app);
};

const Handler = function (app) {
    this.app = app;
};


Handler.prototype.getInvestInfo = async function (msg, session, next){
    const player = session.player;
    const result = await this.app.rpcs.global.investRemote.getProjectInfo({},player.uid);
    const projectInfo = result.res;
    next(null,{
        investList:player.Invest.getInvestList(),
        completeInfo:player.Invest.getCompleteInfo(),
        projectInfo:projectInfo,
        current:player.Invest.getCurrentInvestInfo(),
        recoveryInfo: player.Recovery.getRecoveryInfo(code.recovery.RECOVERY_TYPE.INVEST),
        isFirstTime: player.Invest.getInvest().firstTimeFinish?0:1,
    });
};

Handler.prototype.refreshInvest = function (msg, session, next){
    next(null, session.player.Invest.refreshListRequest());
};

Handler.prototype.attendInvest = function (msg, session, next){
    next(null, session.player.Invest.selectInvest(msg.id));
};

Handler.prototype.investProgress = function (msg, session, next){
    next(null, session.player.Invest.investProgress());
};

Handler.prototype.readyInvest = async function (msg, session, next){
    next(null, await session.player.Invest.investReady(msg.name));
};

Handler.prototype.selfInvest = async function (msg, session, next){
    next(null, await session.player.Invest.investSelf(msg.id));
};

Handler.prototype.togetherInvest = async function (msg, session, next){
    next(null, await session.player.Invest.investTogether(msg.id, msg.targetID));
};

Handler.prototype.getRecommendInvest = async function (msg, session, next){
    next(null, await session.player.Invest.recommend());
};