/**
 * @description 投资系统远程调用
 * @author jzy
 * @date 2020/04/24
 */

module.exports = function (app) {
    return new Remote(app);
};

const Remote = function (app) {
    this.app = app;
};


Remote.prototype.addProject = async function (uid, info, cb){
    cb(null, await this.app.Invest.addProject(uid,info));
};

Remote.prototype.getProjectInfo = async function (uid, cb){
    cb(null, await this.app.Invest.getProjectInfo(uid));
};

Remote.prototype.investSelf = async function (uid, id, cb){
    cb(null, await this.app.Invest.investSelf(uid, id));
};
Remote.prototype.investSelfBot = async function (uid, id, cb){
    cb(null, await this.app.Invest.investSelfBot(uid, id));
};

Remote.prototype.investTogether = async function (uid, id, targetID, cb){
    cb(null, await this.app.Invest.investTogether(uid, id, targetID));
};

Remote.prototype.recommend = async function (uid, cb){
    cb(null, await this.app.Invest.recommend(uid));
};