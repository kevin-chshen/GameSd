/**
 * @description 车展协议
 * @author jzy
 * @date 2020/05/25
 */

const code = require('@code');
const utils = require('@util');

module.exports = function(app) {
    return new Handler(app);
};

const Handler = function(app) {
    this.app = app;
};

Handler.prototype.getInfo = async function (msg, session, next){
    next(null, await session.player.AutoShowWork.getInfo());
};

Handler.prototype.start = async function (msg, session, next){
    next(null, await session.player.AutoShowWork.start(msg.type,msg.rewardTypeIndex,msg.cardList));
};

Handler.prototype.end = async function (msg, session, next){
    next(null, await session.player.AutoShowWork.end(msg.type, msg.isInAdvance==1?true:false));
};

Handler.prototype.rob = async function (msg, session, next){
    next(null, await session.player.AutoShowWork.rob(Number(msg.targetUid) ,msg.type, msg.cardList));
};

Handler.prototype.buyBuff = async function (msg, session, next){
    next(null, session.player.AutoShowWork.buyBuff());
};

Handler.prototype.recommend = async function (msg, session, next){
    next(null, await session.player.AutoShowWork.recommend(msg.isRefresh==1?true:false, msg.isUseDiamond==1?true:false));
};
Handler.prototype.addRobTimes = async function (msg, session, next){
    const player = session.player;
    const cardId = msg.cardId;
    if(!player.AutoShowWork.isCanRecoveryTimes(cardId)){
        next(null, {code:code.err.ERR_AUTO_SHOW_CARD_TIMES_FULL});
        return;
    }
    const cost = utils.proto.encodeConfigAward(this.app.Config.Global.get(code.autoShow.GLOBAL_ID_RECOVERY_COST).GlobalJson);
    if(!player.Item.isEnough(cost)){
        return {code:code.err.ERR_ITEM_COST_NOT_ENOUGH};
    }
    player.Item.deleteItem(cost, code.reason.OP_AUTO_SHOW_BUY_TIMES_COST);
    const info = player.AutoShowWork.recovery(cardId);
    next(null, {code:code.err.SUCCEEDED,recoveryInfo:info});
};