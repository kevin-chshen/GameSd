/**
 * @description global服公会全球项目相关的远程调用
 * @author chenyq
 * @date 2020/06/02
 */

// const logger = require('pomelo-logger').getLogger('pomelo', __filename);

module.exports = function (app) {
    return new Remote(app);
};

const Remote = function (app) {
    this.app = app;
};

/**
 * 设置活动时间内全球项目状态
 * @param {Integer} uid 角色id
 * @param {Function} cb
 */
Remote.prototype.setProjectState = async function (uid, state, val, cb) {
    await this.app.GuildProject.gmSetProjectState(uid, Number(state), Number(val));
    // logger.info("____ loginGuildProcess %d",uid, res);
    cb(null);
};
