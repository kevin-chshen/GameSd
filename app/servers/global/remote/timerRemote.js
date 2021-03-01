/**
 * @description global服计时器相关的远程调用
 * @author chenyq
 * @date 2020/05/13
 */

// const logger = require('pomelo-logger').getLogger('pomelo', __filename);

module.exports = function (app) {
    return new Remote(app);
};

const Remote = function (app) {
    this.app = app;
};

/**
 * 
 * @param {Integer} uid 角色id
 * @param {Function} cb
 */
Remote.prototype.simulateTrigger = async function (timerId, count, cb) {
    this.app.Timer.simulateTrigger(timerId, count);
    cb(null);
};
