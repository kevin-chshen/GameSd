module.exports = function (app) {
    return new Remote(app);
};

const Remote = function (app) {
    this.app = app;
};

Remote.prototype.onlineActivityList = async function (cb){
    cb(null, this.app.Operate.onlineActivityList());
};