/**
 * @description game服物品相关的远程调用
 * @author chenyq
 * @date 2020/04/28
 */

const logger = require('pomelo-logger').getLogger('pomelo', __filename);

module.exports = function (app) {
    return new Remote(app);
};

const Remote = function (app) {
    this.app = app;
};

/**
 * 给玩家扣除物品 先做判断
 * @param {Integer} uid 角色id
 * @param {Object} cost 物品
 * @param {Function} cb
 */
Remote.prototype.deleteItem = async function (uid, costList, actionId, cb) {
    const player = this.app.Player.getPlayerByUid(uid);
    if (!player) {
        logger.info("itemRemote deleteItem error: player is null", uid, player);
        cb(null, false);
        return;
    }
    const itemMgr = player.Item;
    if (!itemMgr.isEnough(costList)) {
        cb(null, false);
        return;
    }
    // logger.debug("itemRemote deleteItem : ",costList);
    itemMgr.deleteItem(costList, actionId);
    cb(null, true);
};
/**
 * 给玩家增加物品
 */
Remote.prototype.addItem = async function (uid, costList, actionId, cb) {
    const player = this.app.Player.getPlayerByUid(uid);
    if (!player) {
        logger.info("itemRemote addItem error: player is null", uid, player);
        cb(null, false);
        return;
    }
    // logger.debug("itemRemote addItem : ",costList);
    player.Item.addItem(costList, actionId);
    cb(null);
};
/**
 * 道具log
 * @param {Number} uid 
 * @param {Number} 1 -1
 * @param {Number} 
 * @param {Array} itemList [{ itemID: 99, itemNum: 100 }, { itemID: 1, itemNum: 200 }]
 */
Remote.prototype.itemLog = async function (uid, opt, actionId, itemList, cb) {
    const player = this.app.Player.getPlayerByUid(uid);
    if (!player) {
        logger.info("itemRemote itemLog error: player is null", uid, player);
        cb(null, false);
        return;
    }
    if (actionId) {
        this.app.Log.itemsLog(player, opt, actionId, itemList);
    }
    cb(null);
};
/**
 * 获取玩家背包信息
 */
Remote.prototype.getItem = async function(uid, cb){
    const player = this.app.Player.getPlayerByUid(uid);
    if (!player) {
        logger.info("itemRemote getItem error: player is null", uid, player);
        cb(null, false);
        return;
    }
    const itemObj = player.Backpack.getItem();
    cb(null, itemObj);
};