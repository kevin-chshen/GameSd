/**
 * @description auth服务器启动入口
 * @author linjs
 * @date 2020/03/30
 */

const bearcat = require('bearcat');
const pomelo = require('pomelo');

const AuthBoot = function () {
    this.$id = 'auth_AuthBoot';
};

module.exports = AuthBoot;
bearcat.extend('auth_AuthBoot', 'logic_BaseBoot');

/**
 * 服务器启动
 */
AuthBoot.prototype.startServer = function (app) {
    app.set('connectorConfig', {
        connector: pomelo.connectors.hybridconnector
    });

    app.Service.registerService('Config', 'logic_ConfigService', null);
    app.Service.registerService('Redis', 'logic_RedisService', null);
    app.Service.registerService('Mongo', 'logic_MongoService', null);
    app.Service.registerService('Helper', 'logic_HelperService', null);
    app.Service.registerService('Item', 'auth_ItemService', null);
    app.Service.registerService('Player', 'auth_PlayerService', null);
    app.Service.registerService('Pay', 'auth_PayService', null);
    app.Service.registerService('WebFnSdk', 'auth_WebService', null);
    app.Service.registerService('Ban', 'auth_BanService', null);
    app.Service.registerService('Mail', 'auth_MailService', null);
    app.Service.registerService('Announcement', 'auth_AnnouncementService', null);
    app.Service.registerService('IpLocation', 'auth_IpLocationService', null);
    
};
