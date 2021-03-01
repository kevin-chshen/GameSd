/**
 * @description game服临时商店
 * @author chshen
 * @date 2020/05/11
 */
const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const code = require('@code');
const util = require('@util');

module.exports = function (app) {
    return new Handler(app);
};

const Handler = function (app) {
    this.app = app;
};

/**
 * 查询临时商店
*/
Handler.prototype.query = function (msg, session, next) {
    // 数据检查
    const player = session.player;
    const shopUid = msg.shopUid;
    const shop = player.ShopTemporary.getShop(shopUid);
    if (!shop) {
        logger.debug(`shopTemporaryHandler query shop:%j failed, player:${player.uid}`, shop);
        next(null, {code : code.err.ERR_CLIENT_PARAMS_WRONG});
        return;
    }
    const data = shop.getData();
    const goods = [];
    for (const [uid, id] of Object.entries(data.goods)) {
        goods.push({
            k: String(uid),
            v: Number(id)
        });
    }
    const buyUids = [];
    data.buys.map((uid)=>{
        buyUids.push(String(uid));
    });
    const detail = {
        shopUid: shopUid,
        shopId: data.shopId,
        goods: goods,
        buyUids: buyUids
    };
    // 通知客户端交易成功
    const reply = { code:code.err.SUCCEEDED, detail: detail };
    next(null, reply);
};

/**
 * 临时商店购买
*/
Handler.prototype.buy = function (msg, session, next) {
    // 数据检查
    const player = session.player;
    const shopUid = msg.shopUid;
    const goodsUid = msg.goodsUid;

    // 数据检查
    if (!shopUid || !goodsUid) {
        logger.debug(`shopTemporaryHandler buy params failed, player:${player.uid}`);
        next(null, { code: code.err.ERR_CLIENT_PARAMS_WRONG });
        return;
    }

    const shop = player.ShopTemporary.getShop(shopUid);
    if (!shop) {
        logger.debug(`shopTemporaryHandler buy shop:${shopUid} not exist, player:${player.uid}`);
        next(null, { code: code.err.ERR_SHOP_TEMPORARY_SHOP_NOT_EXIST });
        return;
    }

    // 已购买
    if (shop.hasBuy(goodsUid)) {
        logger.debug(`shopTemporaryHandler buy goodsUId:${goodsUid} has buy, player:${player.uid}`);
        next(null, { code: code.err.ERR_SHOP_TEMPORARY_GOODS_HAD_BUY });
        return;
    }

    const goodsId = shop.getGoodId(goodsUid);
    if (goodsId == 0) {
        logger.debug(`shopTemporaryHandler buy goodsId 0, player:${player.uid}`);
        next(null, { code: code.err.ERR_SHOP_TEMPORARY_NOT_EXIST_GOODS });
        return;
    }

    // 消耗足够
    const cfg = this.app.Config.MysteryShopJackpot.get(goodsId);
    if (!cfg || !cfg.BuyItem) {
        logger.debug(`shopTemporaryHandler buy goodsId:${goodsId} not exist, player:${player.uid}`);
        next(null, { code: code.err.ERR_CLIENT_PARAMS_WRONG });
        return;
    }
    const costs = util.proto.encodeConfigAward(cfg.BuyItem);
    if (!player.Item.isEnough(costs)) {
        logger.debug(`shopTemporaryHandler buy costs:%j not enough, player:${player.uid}`, costs);
        next(null, { code: code.err.ERR_SHOP_TEMPORARY_COST_NOT_ENOUGH });
        return;
    }
    // 添加已购买ID
    shop.addBuys(goodsUid);

    // 扣消耗
    player.Item.deleteItem(costs, code.reason.OP_SHOP_BUY_TEMPORARY_COST);

    // 获取物品
    const sellItem = util.proto.encodeConfigAward(cfg.SellItem);
    player.Item.addItem(sellItem, code.reason.OP_SHOP_BUY_TEMPORARY_GET);

    player.Event.emit(code.event.SHOP_BUY.name, shop.shopId);

    this.app.Log.shopBuyLog(player, costs, shop.shopId, goodsId, 1);

    // 通知客户端交易成功
    const reply = { code: code.err.SUCCEEDED, shopUid: shopUid, goodsUid: String(goodsUid) };
    next(null, reply);
};