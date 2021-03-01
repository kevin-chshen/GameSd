/**
 * @description game服商店
 * @author chshen
 * @date 2020/04/23
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
 * 查询
*/
Handler.prototype.query = function(msg, session, next) {
    const player = session.player;

    const data = player.Shop.query();
    const directSale = [];
    const mystery = [];
    for (const [goodsId, num] of Object.entries(data.directSale)) {
        directSale.push({ k: Number(goodsId), v: num});
    }
    const vipCfg = this.app.Config.Vip.get(player.vip);
    // 刷新次数
    for (const [id, shop] of Object.entries(data.mystery)) {
        const shopId = Number(id);
        const goods = [];
        let freeCount = 0;
        let payCount = 0;
        if (vipCfg) {
            for (const [goodsUid, goodsId] of Object.entries(shop.goods)) {
                goods.push({
                    k: String(goodsUid),
                    v: goodsId
                });
            }
            freeCount = vipCfg.ShopRefreshFree[shopId] || 0;
            payCount = vipCfg.ShopRefreshPay[shopId] || 0;
        }
        const timeMs = player.Shop.calNextAutoRefreshTime(shopId) || 0;
        const buyUids = [];
        shop.buys.map((uid)=>{
            buyUids.push(String(uid));
        });
        mystery.push({
            shopId: shopId,
            remainFreeCount: Math.max(0, freeCount - shop.hadFreeRefreshCount),
            remainPayCount: Math.max(0, payCount - shop.hadPayRefreshCount),
            buyUids: buyUids,
            showGoods: goods,
            nextRefreshTime: util.time.ms2s(timeMs)
        });
    }
    next(null, { directSale: directSale, mystery: mystery});
};

/**
 * 免费刷新商店
*/
Handler.prototype.refreshFree = function(msg, session, next) {
    // 数据检查
    const player = session.player;
    const shopId = msg.shopId;

    // 商店是否存在
    const shopListCfg = this.app.Config.ShopList.get(shopId);
    if (!shopListCfg) {
        logger.debug(`shop handler refreshFree shopId:${shopId} failed, player:${player.uid}`);
        next(null, { code: code.err.ERR_SHOP_MYSTERY_SHOP_NOT_EXIST});
        return;
    }
    // 是否开启
    if (!player.SysOpen.check(shopListCfg.OpenId)) {
        logger.info(`shopHandler refreshFree shop:${shopId} not open ,player:${player.uid}`);
        next(null, { code: code.err.ERR_SHOP_NOT_OPEN });
        return;
    }
    const mystery = player.Shop.getMystery(shopId);
    if (!mystery) {
        logger.debug(`shop handler refresh mystery not found, player:${player.uid}`);
        next(null, { code: code.err.ERR_CLIENT_PARAMS_WRONG });
        return;
    }
    const vipCfg = this.app.Config.Vip.get(player.vip);
    if (!vipCfg) {
        logger.debug(`shop handler refresh vip:${player.vip} failed, player:${player.uid}`);
        next(null, { code: code.err.ERR_CLIENT_PARAMS_WRONG });
        return;
    }
    // 刷新次数
    const count = mystery.getHadFreeRefreshCount();
    const freeCount = vipCfg.ShopRefreshFree[shopId];
    if (count >= freeCount) {
        logger.debug(`shop handler refresh free refresh not enough, had:${count}, exceed free:${freeCount} failed, player:${player.uid}`);
        next(null, { code: code.err.ERR_SHOP_MYSTERY_REFRESH_COUNT_NOT_ENOUGH });
        return;
    }

    // 添加刷新次数
    const total = mystery.addOneHadFreeRefresh();
    
    // 刷新
    mystery.refresh(false);
    player.Event.emit(code.event.TALENT_MARKET_REFRESH.name);

    // 通知客户端交易成功
    next(null, { code: code.err.SUCCEEDED, shopId: shopId, remain: Math.max(freeCount - total, 0) });
};

/**
 * 付费刷新商店
*/
Handler.prototype.refreshPay = function (msg, session, next) {
    // 数据检查
    const player = session.player;
    const shopId = msg.shopId;

    // 商店是否存在
    const shopListCfg = this.app.Config.ShopList.get(shopId);
    if (!shopListCfg) {
        logger.debug(`shop handler refreshPay shopId:${shopId} failed, player:${player.uid}`);
        next(null, { code: code.err.ERR_SHOP_MYSTERY_SHOP_NOT_EXIST });
        return;
    }
    // 是否开启
    if (!player.SysOpen.check(shopListCfg.OpenId)) {
        logger.info(`shopHandler refreshPay shop:${shopId} not open ,player:${player.uid}`);
        next(null, { code: code.err.ERR_SHOP_NOT_OPEN });
        return;
    }

    const mystery = player.Shop.getMystery(shopId);
    if (!mystery) {
        logger.debug(`shop handler refresh mystery not found, player:${player.uid}`);
        next(null, { code: code.err.ERR_CLIENT_PARAMS_WRONG });
        return;
    }

    const vipCfg = this.app.Config.Vip.get(player.vip);
    if (!vipCfg) {
        logger.debug(`shop handler refresh vip:${player.vip} failed, player:${player.uid}`);
        next(null, { code: code.err.ERR_CLIENT_PARAMS_WRONG });
        return;
    }

    // 刷新次数
    const count = mystery.getHadPayRefreshCount();
    const payCount = vipCfg.ShopRefreshPay[shopId];
    if (count >= payCount) {
        logger.debug(`shop handler refresh free refresh not enough, had:${count}, exceed free:${payCount} failed, player:${player.uid}`);
        next(null, { code: code.err.ERR_SHOP_MYSTERY_REFRESH_COUNT_NOT_ENOUGH });
        return;
    }

    // 消耗
    const buyCfg = this.app.Config.BuyingTimes.getConfig(shopListCfg.RefreshCostId, count+1);
    if (!buyCfg) {
        logger.debug(`shop handler refresh buyCfg failed, type:${shopListCfg.RefreshCostId} count:${count}, player:${player.uid}`);
        next(null, { code: code.err.ERR_CLIENT_PARAMS_WRONG });
        return;
    }
    const firstCost = util.proto.encodeConfigAward(buyCfg.FirstCost);
    const secondCost = util.proto.encodeConfigAward(buyCfg.SecondCost);
    if (player.Item.isEnough(firstCost)) {
        player.Item.deleteItem(firstCost, code.reason.OP_SHOP_REFRESH_COST);
    } else if (player.Item.isEnough(secondCost)) {
        player.Item.deleteItem(secondCost, code.reason.OP_SHOP_REFRESH_COST);
    } else {
        logger.debug(`shop handler refresh cost not enough, count:${count}, shop:${shopId}, vip:${player.vip}, player:${player.uid}`);
        next(null, { code: code.err.ERR_SHOP_MYSTERY_REFRESH_COST_NOT_ENOUGH });
        return;
    }

    const total = mystery.addOneHadPayRefresh();

    // 刷新
    mystery.refresh(false);
    player.Event.emit(code.event.TALENT_MARKET_REFRESH.name);

    // 通知客户端交易成功
    next(null, { code: code.err.SUCCEEDED, shopId: shopId, remain: Math.max(payCount - total, 0) });
};

/**
 * 神秘商店购买
*/
Handler.prototype.buyMystery = function (msg, session, next) {
    // 数据检查
    const player = session.player;
    const shopId = msg.shopId;
    const goodsUid = msg.goodsUid;
    // 数据检查
    if (!goodsUid || !shopId) {
        logger.debug(`shop handler buyMystery params failed, player:${player.uid}`);
        next(null, { code: code.err.ERR_CLIENT_PARAMS_WRONG });
        return;
    }

    // 商店是否存在
    const shopListCfg = this.app.Config.ShopList.get(shopId);
    if (!shopListCfg) {
        logger.debug(`shop handler buyMystery shopId:${shopId} failed, player:${player.uid}`);
        next(null, { code: code.err.ERR_SHOP_MYSTERY_SHOP_NOT_EXIST });
        return;
    }
    // 是否开启
    if (!player.SysOpen.check(shopListCfg.OpenId)) {
        logger.info(`shopHandler buyMystery shop:${shopId} not open ,player:${player.uid}`);
        next(null, { code: code.err.ERR_SHOP_NOT_OPEN });
        return;
    }
    // 商店是否存在
    const mystery = player.Shop.getMystery(shopId);
    if (!mystery) {
        logger.debug(`shop handler buyMystery not found shop:${shopId}, player:${player.uid}`);
        next(null, { code: code.err.ERR_CLIENT_PARAMS_WRONG });
        return;
    }
    // 商店内是否有该物品
    const goodsId = mystery.getGoodsId(goodsUid);
    if (goodsId == 0) {
        logger.debug(`shop handler buyMystery not found shop:${shopId}, player:${player.uid}`);
        next(null, { code: code.err.ERR_SHOP_MYSTERY_NOT_EXIST_GOODS });
        return;
    }
    // 是否已经购买
    if (mystery.hadBuy(goodsUid)) {
        logger.debug(`shop handler buyMystery not found shop:${shopId}, player:${player.uid}`);
        next(null, { code: code.err.ERR_SHOP_MYSTERY_GOODS_HAD_BUY });
        return;
    }
    // 消耗足够
    const cfg = this.app.Config.MysteryShopJackpot.get(goodsId);
    if (!cfg || !cfg.BuyItem) {
        logger.debug(`shop handler buyMystery goodsId:${goodsId} not exist, player:${player.uid}`);
        next(null, { code: code.err.ERR_CLIENT_PARAMS_WRONG });
        return;
    }
    const costs = util.proto.encodeConfigAward(cfg.BuyItem);
    if (!player.Item.isEnough(costs)) {
        logger.debug(`shop handler buyMystery costs:%j not enough, player:${player.uid}`, costs);
        next(null, { code: code.err.ERR_SHOP_MYSTERY_COST_NOT_ENOUGH });
        return;
    }
    // 添加已购买ID
    mystery.addBuys(goodsUid);

    // 获取物品
    const sellItem = util.proto.encodeConfigAward(cfg.SellItem);
    player.Item.modifyItem(sellItem, costs, code.reason.OP_SHOP_BUY_MYSTERY_GET, ()=>{
        // 通知客户端交易成功
        const reply = { code: code.err.SUCCEEDED, shopId: shopId, goodsUid: String(goodsUid) };
        next(null, reply);
    });

    player.Event.emit(code.event.SHOP_BUY.name, shopId);

    this.app.Log.shopBuyLog(player, costs, shopId, goodsId, 1);
};


/**
 * 直营店购买
*/
Handler.prototype.buyDirectSale = async function (msg, session, next) {

    const player = session.player;
    const shopId = msg.shopId;
    const goodsId = msg.goodsId;
    const num = msg.num;

    // 数据检查
    if (!goodsId || !num) {
        logger.debug(`shop handler buyDirectSale params failed, player:${player.uid}`);
        next(null, {code: code.err.ERR_CLIENT_PARAMS_WRONG});
        return;
    }

    // 商店是否存在
    const shopListCfg = this.app.Config.ShopList.get(shopId);
    if (!shopListCfg) {
        logger.debug(`shop handler buyDirectSale shopId:${shopId} failed, player:${player.uid}`);
        next(null, { code: code.err.ERR_SHOP_MYSTERY_SHOP_NOT_EXIST });
        return;
    }
    // 是否开启
    if (!player.SysOpen.check(shopListCfg.OpenId)) {
        logger.info(`shopHandler buyDirectSale shop:${shopId} not open ,player:${player.uid}`);
        next(null, { code: code.err.ERR_SHOP_NOT_OPEN });
        return;
    }

    // 商店内是否有该物品
    const cfg = this.app.Config.Shop.get(goodsId);
    if (!cfg) {
        logger.debug(`shop handler buyDirectSale not found config, player:${player.uid}`);
        next(null, { code: code.err.FAILED });
        return;
    }
    // 限制条件
    const ok = await this.app.Config.Shop.conditionSuit(goodsId, player);
    if (!ok) {
        logger.debug(`shop handler buyDirectSale condition not enough, goodsId:${goodsId}, player:${player.uid}`);
        next(null, { code: code.err.ERR_SHOP_BUY_CONDITION_NOT_ENOUGH});
        return;
    }
    // 是否限购
    const shop = player.Shop.getShopDirecSale();
    if (cfg.UmLimit) {
        const count = shop.getHadBuyCount(goodsId);
        const max = this.app.Config.Shop.getMaxBuy(goodsId);
        if (max < count) {
            logger.debug(`shop handler buyDirectSale count:${count} exceed max:${max}, player:${player.uid}`);
            next(null, { code: code.err.ERR_SHOP_BUY_COST_NOT_ENOUGH });
            return;
        }
    }

    // 消耗足够
    let costs = util.proto.encodeConfigAward(cfg.Cost);
    costs = util.item.multi(costs, num);
    if (!player.Item.isEnough(costs)) {
        logger.debug(`shop handler buyDirectSale costs:%j not enough, player:${player.uid}`, costs);
        next(null, { code: code.err.ERR_SHOP_BUY_LIMIT });
        return;
    }

    // 添加购买次数
    let total = 0;
    if (!cfg.UmLimit)
        total = shop.addBuy(goodsId, num);

    // 获取指定物品
    let award;
    if (player.sex == code.player.SexType.FEMALE) {
        award = util.proto.encodeConfigAward(cfg.ItemGirl);
    } else {
        award = util.proto.encodeConfigAward(cfg.ItemBoy);
    }
    award = util.item.multi(award, num);
    player.Item.modifyItem(award, costs, code.reason.OP_SHOP_BUY_DIRECT_SALE_GET, ()=>{
        // 通知客户端交易成功
        next(null, { code: code.err.SUCCEEDED, goodsId: goodsId, num: num, total: total});
    });

    player.Event.emit(code.event.SHOP_BUY.name, shopId);

    this.app.Log.shopBuyLog(player, costs, shopId, goodsId, num);
};

