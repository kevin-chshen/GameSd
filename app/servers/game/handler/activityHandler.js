/**
 * @description 活动模块
 * @author chshen
 * @date 2020/05/25
 */
const util = require('@util');

module.exports = function (app) {
    return new Handler(app);
};

const Handler = function (app) {
    this.app = app;
};

// 查询在线的活动ID列表
Handler.prototype.query = function(msg, session, next) {

    const activityList = [];
    const list = this.app.Activity.onlineActivityList();
    for (const [id, timer] of Object.entries(list)) {
        activityList.push({
            id: Number(id),
            startMs: util.time.ms2s(timer.startMs),
            stopMs: util.time.ms2s(timer.stopMs),
        });
    }
    next(null, { infos: activityList });
};