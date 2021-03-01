/**
 * @description global服流量为王相关的远程调用
 * @author chenyq
 * @date 2020/05/14
 */

// const logger = require('pomelo-logger').getLogger('pomelo', __filename);

module.exports = function (app) {
    return new Remote(app);
};

const Remote = function (app) {
    this.app = app;
};

/**
 * 获取排名区间
 * @param {Integer} min 
 * @param {Integer} max 
 * @param {Function} cb
 */
Remote.prototype.flowRateRank = async function (min, max, cb) {
    const res = await this.app.FlowRate.getFlowRateRankInfo(min, max);
    // logger.info("____ loginGuildProcess %d",uid, res);
    cb(null, res);
};
/**
 * 获取玩家当前排位
 */
Remote.prototype.getFlowRateRank = async function (uid, cb) {
    const res = await this.app.FlowRate.getFlowRateRank(uid);
    cb(null, res);
};
/**
 * 获取流量为王流量券购买信息
 */
Remote.prototype.getFlowRateBuyInfo = async function(uid, cb){
    const res = await this.app.FlowRate.getFlowRateBuyInfo(uid);
    cb(null, res);
};