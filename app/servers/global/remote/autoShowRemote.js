module.exports = function(app) {
    return new Remote(app);
};

const Remote = function(app) {
    this.app = app;
};

Remote.prototype.start = async function (remoteInfo, cb){
    cb(null, await this.app.AutoShow.start(remoteInfo));
};

Remote.prototype.end = async function (remoteInfo, cb){
    cb(null, this.app.AutoShow.end(remoteInfo));
};

Remote.prototype.rob = async function (remoteInfo, cb){
    cb(null, await this.app.AutoShow.rob(remoteInfo));
};

Remote.prototype.recommend = async function (remoteInfo, cb){
    cb(null, await this.app.AutoShow.recommend(remoteInfo));
};

Remote.prototype.getInfo = async function (remoteInfo, cb){
    cb(null, await this.app.AutoShow.getInfo(remoteInfo));
};