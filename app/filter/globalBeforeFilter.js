/**
 * @description 为global服的session附加过滤器
 * @author chenyq
 * @date 2020/07/09
 */

module.exports = function (app) {
    return new GlobalBeforeFilter(app);
};

const GlobalBeforeFilter = function (app) {
    this.app = app;
};

GlobalBeforeFilter.prototype.before = function (msg, session, next) {
    if (session.uid) {
        // 路由 锁判断
        if (this.app.Lock.judgeLock(msg.__route__, session)) {
            // 请求太频繁 转ErrorHandler
            next(`lock`);
            return;
        }
    }
    next();
};