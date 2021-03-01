/**
 * @description 在线服务:目前先用redis直接检查
 * @author linjs
 * @date 2020/04/14
 */

const bearcat = require('bearcat');
const code = require('@code');

const OnlineService = function () {
    this.$id = 'logic_OnlineService';
    this.app = null;
};

module.exports = OnlineService;
bearcat.extend('logic_OnlineService', 'logic_BaseService');

/**
 * 返回玩家所在game
 */
OnlineService.prototype.whichGame = async function (uid) {
    const { err, res } = await this.app.Redis.hget(code.redis.ROLE_ON_GAME.name, uid);
    return err ? null : res;
};
