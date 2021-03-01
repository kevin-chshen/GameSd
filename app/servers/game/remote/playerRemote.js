/**
 * Created by chshen on 2020/03/19.
 * @note: player remote
 */

const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const code = require('@code');

module.exports = function (app) {
    return new Remote(app);
};

const Remote = function (app) {
    this.app = app;
};

/**
 * 玩家下线
 * @param {Integer} uid 玩家uid
 * @param {String} reason 离线原因
 * @param {Function} cb 回调函数
 * @return {Void}
 */
Remote.prototype.playerLogout = async function (uid, reason, cb) {
    await this.app.Player.playerLogout(uid, reason);

    cb(null);
};

Remote.prototype.getOnlinePlayerUids = async function (cb) {
    const players = this.app.Player.getPlayers();

    const list = Object.values(players).map((player) => { return { uid: player.uid, vip: player.vip }; });
    cb(null, list);
};

/**
 * 获取玩家详细信息
 */
Remote.prototype.getPlayerDetail = async function (uid, cb) {
    const player = this.app.Player.getPlayerByUid(uid);
    if (!player) {
        logger.info("playerRemote gePlayerDetail error: player is null", uid, player);
        cb(null, {});
        return;
    }
    // 获取俱乐部赠礼、赠礼重置次数 礼券恢复、礼券购买
    // 流量为王、团建
    const data = {
        currency: player.currency,
        power: player.power,
        cashPerSecond: player.cashPerSecond,
        vip: player.vip,
        vipExp: player.vipExp,
        livePlatforms: player.livePlatforms,
        clubPostcardBuyNum: player.clubPostcardBuyNum,
        clubPostcardLastTime: player.clubPostcardLastTime,
        clubInfo: player.clubInfo,
        friendship: player.friendship,
        dayPay: player.dayPay,
        lastPayTime: player.lastPayTime,
    };
    cb(null, data);
};

Remote.prototype.getCarDBData = async function (uid, cb) {
    const player = this.app.Player.getPlayerByUid(uid);
    if (!player) {
        logger.info("playerRemote getCarInfo error: player is null", uid, player);
        cb(null, {});
        return;
    }
    if (!player.carInfo || !player.carInfo.carList) {
        cb(null, {});
        return;
    }
    cb(null, player.carInfo.carList);
};

/**
 * 获取玩家是否被禁言
 */
Remote.prototype.isBanChat = function(uid, cb){
    const player = this.app.Player.getPlayerByUid(uid);
    if (!player) {
        logger.info("playerRemote isBanChat error: player is null", uid, player);
        cb(null, {});
        return;
    }
    if (player.Ban.isBanChat()) {
        cb(null, true);
        return;
    }
    cb(null, false);
};