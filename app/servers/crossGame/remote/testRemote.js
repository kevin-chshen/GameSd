module.exports = function (app) {
    return new Remote(app);
};

const Remote = function (app) {
    this.app = app;
};


Remote.prototype.test = function (cb){
    console.log("_____________test___________________");
    cb(null,true);
};