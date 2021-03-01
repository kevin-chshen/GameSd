/**
 * @description 特邀派送
 * @author jzy
 * @date 2020/06/01
 */

const code = require('@code');

module.exports = function (app) {
    return new Handler(app);
};

const Handler = function (app) {
    this.app = app;
};

Handler.prototype.getInfo = async function (msg, session, next) {
    next(null, {hasReceiveList:this.__getList(session.player)});
};
Handler.prototype.receive = async function (msg, session, next) {
    const result = session.player.SpecialDelivery.receive(msg.index);
    if(result.code==code.err.SUCCEEDED){
        result.hasReceiveList = this.__getList(session.player);
    }
    next(null, result);
};
Handler.prototype.assistReceive = async function (msg, session, next) {
    const result = session.player.SpecialDelivery.assistReceive(msg.index);
    if(result.code==code.err.SUCCEEDED){
        result.hasReceiveList = this.__getList(session.player);
    }
    next(null, result);
};

Handler.prototype.__getList = function(player){
    const idList = this.app.Config.Global.get(code.specialDelivery.GLOBAL_ID_ACTIVITY_TIME_ID).GlobalArray;
    const result = [];
    for(const id of player.specialDelivery){
        const index = idList.indexOf(id);
        if(index>=0){
            result.push(index);
        }
    }
    return result;
};