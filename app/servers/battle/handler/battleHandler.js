/**
 * @description 战斗协议
 * @author jzy
 * @date 2020/03/26
 */

module.exports = function(app) {
    return new Handler(app);
};

const Handler = function(app) {
    this.app = app;
};


Handler.prototype.getBattleRecord = async function(msg, session, next){
    next(null,await this.app.BattleData.getBattleRecord(msg.id));
};