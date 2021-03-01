/**
 * @description handler服务account
 * @author chshen
 * @date 2020/05/12
 */
const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const bearcat = require('bearcat');
const MongoPay = require('@mongo/mongoPay');
const MongoAccount = require('@mongo/mongoAccount');
const code = require('@code');
const util = require('@util');

const PayService = function() {
    this.$id = 'auth_PayService';
    this.app = null;
};
module.exports = PayService;
bearcat.extend('auth_PayService', 'logic_BaseService');


/**
 * 记录充值
 * @param {String} orderId 订单ID
 * @param {String} account 账号ID
 * @param {Integer} platform 平台ID
 * @param {Integer} serverId 服务器ID
 * @param {Object} info 
*/
PayService.prototype.backendPay = async function (params) {
    if (!params) {
        logger.error(`PayService backendPay params error, params:%j`, params);
        return code.web.FN_SDK.PAY.RET_PARAM_ERROR;
    }
    const infos = params.callback_info.split("_");
    const payId = infos[0];
    const uid = infos[1];
    const serialId = infos[2]; // 客户端用于标识缓存的唯一ID
    if (!payId || !uid || !serialId) {
        logger.error(`PayService backendPay params error, info:%j`, infos);
        return code.web.FN_SDK.PAY.RET_PARAM_ERROR;
    }
    const orderId = params.order_id;
    logger.info(`PayService backendPay orderId `, orderId);
    const res = await MongoPay.query({orderId: String(orderId)});
    if (res.length > 0) {
        logger.error(`PayService backendPay orderId:${orderId} had exist`);
        return code.web.FN_SDK.PAY.RET_DUPLICATE;
    }
    const account = params.uid;
    const platform = String(params.fnpid);
    const serverId = params.server_id;
    logger.info(`PayService backendPay query mongo account ${account}, platform:${platform}, serverId:${serverId}`);
    const accountRes = await MongoAccount.query({ account: String(account), platform: String(platform), serverId: Number(serverId)});
    if (accountRes.length == 0) {
        logger.error(`PayService backendPay account:${account} not exist`);
        return code.web.FN_SDK.PAY.RET_USER_NOT_EXISTS;
    }

    const playerUid = accountRes[0].dbValue().uid;
    if (playerUid != uid) {
        logger.error(`PayService backendPay uid:${uid} != playerUid:${playerUid}`);
    }
    // 添加订单数据
    await (new MongoPay()).updateImmediately({
        orderId: String(params.order_id), 
        gameId: String(params.game_id),
        serverId: Number(params.server_id),
        platform: String(params.fnpid),
        account: String(account),
        uid: Number(playerUid),
        payWay: Number(params.pay_way),
        amount: Number(params.amount),
        callbackInfo: String(params.callback_info),
        orderStatus: String(params.order_status),
        isHandled: 0,
        logTime: util.time.nowSecond()
    });
    // 处理订单
    const ret = await this.app.Redis.hget(code.redis.ROLE_ON_GAME.name, Number(playerUid));
    let ok = false;
    if (!ret.err && ret.res) {
        const gameId = ret.res;
        ok = await this.app.rpcs.game.payRemote.pay.toServer(gameId, playerUid, orderId, params.amount, payId, Number(params.pay_way), serialId);
    }
    logger.info(`PayService Pay result account:${account}, platform:${platform}, serverId:${serverId} pay ret:%j`, ok);
    if (ok.res) {
        return { ret: 0, msg: "success" };
    } else {
        return { ret: code.web.FN_SDK.PAY.RET_FAILED, msg: "pay failed" };
    }
};
