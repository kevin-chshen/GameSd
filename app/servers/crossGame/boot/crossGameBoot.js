/**
 * @description master服务器启动入口
 * @author linjs
 * @date 2020/03/31
 */

const bearcat = require('bearcat');
const pomelo = require('pomelo');

const Boot = function () {
    this.$id = 'crossGame_CrossGameBoot';
};
module.exports = Boot;
bearcat.extend('crossGame_CrossGameBoot', 'logic_BaseBoot');

/**
 * 服务器启动
 */
Boot.prototype.startServer = function (app) {
    app.set('connectorConfig', {
        connector: pomelo.connectors.hybridconnector,
        setNoDelay : true,
    });
};
