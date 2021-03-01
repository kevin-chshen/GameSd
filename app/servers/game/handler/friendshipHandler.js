/**
 * @description 团建消息
 * @author jzy
 * @date 2020/05/06
 */
const code = require('@code');
const utils = require('@util');

module.exports = function(app) {
    return new Handler(app);
};

const Handler = function(app) {
    this.app = app;
};

Handler.prototype.getFriendshipInfo = async function(msg, session, next){
    next(null, session.player.Friendship.getFriendshipInfo());
};
Handler.prototype.start = async function(msg, session, next){
    next(null, session.player.Friendship.startLine());
};
Handler.prototype.moveAction = async function(msg, session, next){
    next(null, await session.player.Friendship.moveAction(msg.nextIndex));
};
Handler.prototype.retryBattle = async function(msg, session, next){
    next(null, await session.player.Friendship.retryBattle());
};
Handler.prototype.getSelectBuff = async function(msg, session, next){
    next(null, session.player.Friendship.getSelectBuffList());
};
Handler.prototype.selectBuff = async function(msg, session, next){
    next(null, session.player.Friendship.selectBuff(msg.buffID));
};
Handler.prototype.finishShopping = async function(msg, session, next){
    next(null, session.player.Friendship.finishShopping());
};
Handler.prototype.receiveStageReward = async function(msg, session, next){
    next(null, session.player.Friendship.receiveStageAward());
};
Handler.prototype.enterNextStage = async function(msg, session, next){
    next(null, session.player.Friendship.enterNextStage(msg.difficulty));
};
Handler.prototype.finish = async function(msg, session, next){
    next(null, session.player.Friendship.finish());
};
Handler.prototype.buyBuff = async function(msg, session, next){
    next(null, session.player.Friendship.buyBuff());
};
Handler.prototype.buyTimes = async function(msg, session, next){
    next(null, session.player.Friendship.addBuyTimes());
};