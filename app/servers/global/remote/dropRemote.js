/**
 * @description 掉落相关远程调用
 * @author linjs
 * @date 2020/04/30
 */

module.exports = function (app) {
    return new Remote(app);
};

const Remote = function (app) {
    this.app = app;
};

/**
 * 全局掉落:涉及到全局计数器的掉落
 * 统一由global服管理,dropInfo的结构如下
 * @param {Integer} id DropOne表id
 * @param {Integer} times 当前该id已经掉落多少次(有特殊掉落的条目需要)
 * @param {Integer} sex 玩家性别
 * @param {Object} sign 玩家相关的掉落下标
 * @param {Integer} payLv 玩家的付费等级
 * @param {Boolean} trace 是否显示掉落信息
 * 要返回的result必须包含以下字段:
 * @param {Integer} times 完成本次掉落之后,新的掉落次数数值
 * @param {Boolean} bModify 玩家的掉落下标数值是否发生了变动
 * @param {Array} item 掉落出来的物品列表 [{itemId, itemNum}]
 * @param {Object} newSign 修改后的掉落下标数值
 * @param {Array} traceInfo 掉落信息
 */
Remote.prototype.drop = async function (dropInfo, cb) {
    const result = this.app.Drop.drop(dropInfo);
    cb(null, result);
};

Remote.prototype.dropBatch = async function (dropInfoList, cb) {
    cb(null, dropInfoList.map(dropInfo=>this.app.Drop.drop(dropInfo)));
};

/**
 * 重设所有全局掉落计数器
 */
Remote.prototype.resetSign = async function (cb) {
    // 掉落计数
    const allSign = this.app.Config.DropSign.keys();
    allSign.map( (id) => {
        this.app.Counter.DropSign.set(id, 0);
    });
    cb(null);
};

