/**
 * @description 新手引导
 * @author jzy
 * @date 2020/06/23
 */

module.exports = function (app) {
    return new Handler(app);
};

const Handler = function (app) {
    this.app = app;
};

Handler.prototype.getInfo = async function (msg, session, next){
    next(null, session.player.Guide.getGuideInfo());
};

Handler.prototype.set = async function (msg, session, next){
    next(null, session.player.Guide.setGuide(msg.key, msg.value));
};