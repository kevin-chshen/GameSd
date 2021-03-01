/**
 * @description 玩家的基础组件
 * @author linjs
 * @date 2020/03/18
 */

const logger = require('pomelo-logger').getLogger('pomelo', __filename);

const Component = function (app, player) {
    this.$id = 'game_Component';
    this.$scope = "prototype";
    this.app = app;
    this.player = player;
};
module.exports = Component;

/**
 * 角色对象初始化是调用
 */
Component.prototype.onInit = async function () {
    logger.debug(`player:${this.player.uid} component: ${this.$id} onInit`);
};

/**
 * 角色数据加载完成时调用
 */
Component.prototype.onLoad = async function () {
    logger.debug(`player:${this.player.uid} component: ${this.$id} onLoad`);
};

/**
 * 加载后
*/
Component.prototype.onAfterLoad = async function() {
    logger.debug(`player:${this.player.uid} component: ${this.$id} onAfterLogin`);
};

/**
 * 角色登录时调用
 */
Component.prototype.onLogin = async function () {
    logger.debug(`player:${this.player.uid} component: ${this.$id} onLogin`);
};

/**
 * 角色登入后调用
 */
Component.prototype.onAfterLogin = async function () {
    logger.debug(`player:${this.player.uid} component: ${this.$id} onAfterLogin`);
};

/**
 * 角色重新登录时调用
 */
Component.prototype.onReLogin = async function () {
    logger.debug(`player:${this.player.uid} component: ${this.$id} onReLogin`);
};

/**
 * 角色重连时调用
 */
Component.prototype.onReConnect = async function () {
    logger.debug(`player:${this.player.uid} component: ${this.$id} onReConnect`);
};

/**
 * 角色登出调用
 */
Component.prototype.onLogout = async function (reason) {
    logger.debug(`player:${this.player.uid} component: ${this.$id} onLogout, reason:${reason}`);
};

/**
 * 角色数据清理（退出缓存）
 */
Component.prototype.onClean = async function () {
    logger.debug(`player:${this.player.uid} component: ${this.$id} onClean`);
};

/**
 * 角色跨天时调用
 * @param {Boolean} isOnTime 是否准时触发
 * @param {Integer} count 触发次数
 */
Component.prototype.onDayChange = async function (isOnTime, count) {
    logger.debug(`player:${this.player.uid} component: ${this.$id} onDayChange, isOnTime:${isOnTime}, count:${count}`);
};

/**
 * 角色跨周时调用
 * @param {Boolean} isOnTime 是否准时触发
 * @param {Integer} count 触发次数
 */
Component.prototype.onWeekChange = async function (isOnTime, count) {
    logger.debug(`player:${this.player.uid} component: ${this.$id} onWeekChange， isOnTime：${isOnTime}, count:${count}`);
};