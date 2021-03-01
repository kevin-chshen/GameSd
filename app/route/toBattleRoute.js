/**
 * @description 到battle服的路由
 * @author jzy
 * @date 2020/06/17
 */

// const logger = require('pomelo-logger').getLogger('pomelo', __filename);
// const code = require('@code');
const utils = require('@util');

const ToBattleRoute = function() {
    this.$id = "ToBattleRoute";
};
module.exports = ToBattleRoute;

/**
 * 如果服务器只有一个那就都取同一个节点访问，如果多个服务器，那么取第一个节点作为查询服，后面的节点作为战斗服
 */

ToBattleRoute.prototype.GetBattleRouter = function(param, msg, app, cb){
    let rawServers = app.getServersByType(msg.serverType);

    let servers = [];
    if(rawServers && rawServers.length > 1){
        for(let i = 1; i<rawServers.length; i++){
            servers.push(rawServers[i]);
        }
    }else{
        servers = rawServers;
    }
    
    if (servers && servers.length > 0) {
        const server = servers[utils.random.random(0, servers.length - 1)];
        const id = server.id;
        cb(null, id);
    }else{
        cb(new Error(`can not find ${msg.serverType} server.`));
    }
};

ToBattleRoute.prototype.GetBattleQueryRouter = function(param, msg, app, cb){
    const servers = app.getServersByType(msg.serverType);
    if (servers && servers.length > 0) {
        const server = servers[0];
        const id = server.id;
        cb(null, id);
    }else{
        cb(new Error(`can not find ${msg.serverType} server.`));
    }
    
};