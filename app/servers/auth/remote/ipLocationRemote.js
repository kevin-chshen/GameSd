module.exports = function (app) {
    return new Remote(app);
};

const Remote = function (app) {
    this.app = app;
};

Remote.prototype.getCityName = async function(ipAddr,cb) {
    const ret = this.app.IpLocation.getCity(ipAddr);

    cb(null, ret);
};


Remote.prototype.checkDdFileAndDownLoad = async function(cb) {
    const ret = await this.app.IpLocation.checkVersion();

    cb(null, ret);
};
