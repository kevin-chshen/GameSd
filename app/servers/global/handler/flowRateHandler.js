/**
 * @description 流量为王消息
 * @author chenyq
 * @date 2020/05/07
 */

// const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const code = require('@code');
// const util = require('@util');

module.exports = function (app) {
    return new Handler(app);
};

const Handler = function (app) {
    this.app = app;
};
/**
 * 获取信息
 */
Handler.prototype.flowRateGetInfo = async function (msg, session, next) {
    const uid = session.uid;
    const isRefresh = msg.isRefresh || 0;
    const [flowRateList, offlineTime, buyNum, nextTime] = await this.app.FlowRate.flowRateGetInfo(uid, isRefresh == 1);
    next(null, { code: code.err.SUCCEEDED, flowRateList: flowRateList, offlineTime: offlineTime, buyNum: buyNum, nextTime: nextTime });
};
/**
 * 挑战
 */
Handler.prototype.flowRateChallenge = async function (msg, session, next) {
    const rank = msg.rank;
    const challengeUid = msg.challengeUid;
    const returnCode = await this.app.FlowRate.flowRateChallenge(session, rank, challengeUid);
    next(null, { code: returnCode });
};
/**
 * 扫荡
 */
Handler.prototype.flowRateSweep = async function (msg, session, next) {
    const uid = session.uid;
    const rank = msg.rank;
    const returnCode = await this.app.FlowRate.flowRateSweep(uid, rank);
    next(null, { code: returnCode });
};
/**
 * 领取离线奖励
 */
Handler.prototype.flowRateOfflineReward = async function (msg, session, next) {
    const uid = session.uid;
    const [returnCode, offlineTime, awardList] = await this.app.FlowRate.flowRateOfflineReward(uid);
    next(null, { code: returnCode, offlineTime: offlineTime, awardList: awardList });
};
/**
 * 获取战报
 */
Handler.prototype.flowRateBattleRecord = async function (msg, session, next) {
    const uid = session.uid;
    const recordList = await this.app.FlowRate.flowRateBattleRecord(uid);
    next(null, { code: code.err.SUCCEEDED, recordList: recordList });
};
/**
 * 购买流量券
 */
Handler.prototype.flowRateBuy = async function (msg, session, next) {
    const uid = session.uid;
    const [returnCode, buyNum] = await this.app.FlowRate.flowRateBuy(uid);
    next(null, { code: returnCode, buyNum: buyNum });
};