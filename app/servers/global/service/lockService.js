/* eslint-disable indent */
/**
 * @description 联盟数据服务
 * @author chenyq
 * @date 2020/04/24
 */

const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const bearcat = require('bearcat');
// const code = require('@code');
// const util = require('@util');

const LockService = function () {
    this.$id = 'global_LockService';
    this.app = null;
    this.lock = {};
};

module.exports = LockService;
bearcat.extend('global_LockService', 'logic_BaseService');

LockService.prototype.init = function () {
    // 需要处理的handler列表
    this.route = [
        'global.leagueHandler.leagueCreate',
        'global.leagueHandler.leagueDissolve',
        'global.leagueHandler.leagueExit', 
        'global.leagueHandler.leagueJoin',
        'global.leagueHandler.leagueKickOut',
        'global.leagueHandler.leagueTransfer',
        'global.leagueHandler.leagueBuild',
        'global.leagueHandler.leagueGetBuildBox',
        'global.leagueHandler.leagueTechnologyUpgrade',
        'global.leagueProjectHandler.projectOpen',
        'global.leagueProjectHandler.projectDonation',
        'global.leagueProjectHandler.projectNegotiate',
        'global.leagueProjectHandler.projectAccredit',
        'global.flowRateHandler.flowRateChallenge',
    ];
    logger.info("global_LockService init");
};
/**
 * 设置handler锁
 */
LockService.prototype.setLock = function (route, session) {
    if (this.route.includes(route)) {
        if (!this.lock[route]) {
            this.lock[route] = {};
        }
        this.lock[route][session.id] = Date.now();
    }
};
/**
 * 判断handler锁
 */
LockService.prototype.judgeLock = function (route, session) {
    if (this.lock[route] && this.lock[route][session.id]) {
        const nowTime = Date.now();
        if (this.lock[route][session.id] && nowTime - Number(this.lock[route][session.id] || 0) < 5000) {
            return true;
        }
    }
    this.setLock(route, session);
    return false;
};
/**
 * 解除handler锁
 */
LockService.prototype.unLock = function (route, session) {
    if (this.lock[route] && this.lock[route][session.id]) {
        delete this.lock[route][session.id];
    }
};

