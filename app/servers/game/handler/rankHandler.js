/**
 * @description 排行榜
 * @author jzy
 * @date 2020/05/20
 */

module.exports = function(app) {
    return new Handler(app);
};

const Handler = function(app){
    this.app = app;
};

Handler.prototype.getRankWorshipInfo = function(msg, session, next){
    const player = session.player;
    next(null,player.Rank.getWorshipInfo());
};
Handler.prototype.rankWorship = function(msg, session, next){
    const player = session.player;
    next(null,player.Rank.worship(msg.mainType, msg.secondType));
};