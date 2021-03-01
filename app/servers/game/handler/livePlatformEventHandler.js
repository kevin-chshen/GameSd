/**
 * @description 直播平台事件
 * @author chshen
 * @data 2020/03/23
 */
const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const code = require("@code");
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
Handler.prototype.query = function (msg, session, next) {
    const player = session.player;
    const platforms = player.LivePfEvent.platforms();
    const infos = [];
    const thanksType = code.live.EVENT_TYPE.THANKS;
    for (const [plat, obj] of Object.entries(platforms)) {
        const platId = parseInt(plat);
        for (const [eventUid, eventId] of Object.entries(obj.thanks)) {
            infos.push({
                eventUid: eventUid,
                platformId: platId,
                type: thanksType,
                id: eventId
            });
        }
        if (Object.keys(obj.otherEvent).length != 0) {
            infos.push({
                eventUid: obj.otherEvent.uid,
                platformId: platId,
                type: obj.otherEvent.type,
                id: obj.otherEvent.id
            });
        }
        if (Object.keys(obj.discount).length != 0 && obj.discount.type) {
            infos.push({
                eventUid: obj.discount.uid,
                platformId: platId,
                type: obj.discount.type,
                id: obj.discount.id,
                endTime: util.time.ms2s(obj.discount.startMS + obj.discount.remainMS)
            });
        }
    }
    const reply = {
        info: infos,
        level: player.mgrLv
    };
    next(null, reply);
};

/**
 * 感谢事件
*/
Handler.prototype.thanks = async function (msg, session, next) {
    const player = session.player;
    const platformId = msg.platformId;
    const eventUid = msg.eventUid;
    // 检测数据
    if (!platformId || !eventUid) {
        logger.debug(`Live Platform Event thanks Handler param error,player:${player.uid}`);
        next(null, {code: code.err.ERR_CLIENT_PARAMS_WRONG });
        return;
    }
    // 检测事件有效
    const platform = player.LivePfEvent.getPlatform(platformId);
    if (!platform) {
        logger.debug(`Live Platform Event thanks Handler platformId :${platformId} not found,player:${player.uid}`);
        next(null, { code: code.err.ERR_CLIENT_PARAMS_WRONG });
        return;
    }
    const eventId = platform.getThankEventId(eventUid);
    if (eventId == 0) {
        logger.debug(`Live Platform Event thanks Handler event uid:${eventUid} not exist, player:${player.uid}`);
        next(null, { code: code.err.ERR_LIVE_PLATFORM_EVENT_NOT_EXIST });
        return;
    }
    // 获取奖励数据
    const cfg = this.app.Config.EventThank.get(eventId);    
    if (!cfg || !cfg.Drop) {
        logger.debug(`Live Platform Event thanks Handler event id:${eventId} not config, player:${player.uid}`);
        next(null, { code: code.err.ERR_SERVER_INTERNAL_WRONG });
        return;
    }

    // 事件刷新
    platform.removeThanksEvent(eventUid);

    // 领取奖励
    const rewards = await player.Drop.dropBatch(cfg.Drop);
    player.Item.addItem(rewards, code.reason.OP_LIVE_PLATFORM_THANKS_GET);

    next(null, { code: code.err.SUCCEEDED,
        platformId: platformId,
        eventUid: eventUid,
        award: util.proto.encodeAward(rewards)
    });
};

/**
 * 派遣事件
*/
Handler.prototype.eventSend = async function (msg, session, next) {
    const player = session.player;
    const platformId = msg.platformId;
    const cardId = msg.cardId;
    const eventUid = msg.eventUid;
    // 检测数据有效性
    if (!platformId || !cardId || !eventUid) {
        logger.debug(`Live Platform Event send Handler param error,player:${player.uid}`);
        next(null, { code: code.err.ERR_CLIENT_PARAMS_WRONG });
        return;
    }
    // 检测卡牌
    const card = player.Card.getCardObj(cardId);
    if (card == null) {
        logger.debug(`Live Platform Event send Handler card:${cardId} not exist, player:${player.uid}`);
        next(null, { code: code.err.ERR_LIVE_PLATFORM_EVENT_CARD_NOT_EXIST });
        return;
    }
    // 检测事件有效
    const platform = player.LivePfEvent.getPlatform(platformId);
    if (!platform) {
        logger.debug(`Live Platform Event send Handler platformId :${platformId} not found,player:${player.uid}`);
        next(null, { code: code.err.ERR_CLIENT_PARAMS_WRONG });
        return;
    }
    const event= platform.otherEvent();
    if (!event || event.id == 0) {
        logger.debug(`Live Platform Event send Handler event id:${event.id} not exist, player:${player.uid}`);
        next(null, { code: code.err.ERR_LIVE_PLATFORM_EVENT_NOT_EXIST });
        return;
    }
    if (eventUid != event.uid || event.type != code.live.EVENT_TYPE.DISPATCH) {
        logger.debug(`Live Platform Event send Handler event id:${event.id}, not dispatch type, player:${player.uid}`);
        next(null, { code: code.err.ERR_LIVE_PLATFORM_EVENT_TYPE_WRONG });
        return;
    }
    // 判断是否成功并获得奖励
    const ret = this.app.Config.EventSend.getRandomAward(event.id, cardId, player);
    if (!ret || !ret.dropList) {
        logger.debug(`Live Platform Event send Handler event id:${event.id}, award get failed, player:${player.uid}`);
        next(null, { code: code.err.FAILED });
        return;
    }

    // 移除并刷新事件
    platform.removeOtherEvent(event.uid);
    // 领取奖励 + 通知管理信息
    const award = await player.Drop.dropBatch(ret.dropList);
    player.Item.addItem(award, code.reason.OP_LIVE_PLATFORM_SEND_GET);
    const mgrExp = player.Currency.get(code.currency.CURRENCY_ID.MGR_EXP);
    const reply = {
        code: code.err.SUCCEEDED,
        success: ret.success ? 0 : 1,
        platformId: platformId,
        mgrExp: mgrExp,
        eventUid: eventUid,
        award: util.proto.encodeAward(award)
    };
    next(null, reply);
};

/**
 * 推销事件
*/
Handler.prototype.discount = function (msg, session, next) {
    // 检测数据
    const player = session.player;
    const platformId = msg.platformId;
    const eventUid = msg.eventUid;
    if (!platformId || !eventUid) {
        logger.debug(`Live Platform Event discount Handler param error,player:${player.uid}`);
        next(null, {code: code.err.ERR_CLIENT_PARAMS_WRONG});
        return;
    }
    // 检测事件有效
    const platform = player.LivePfEvent.getPlatform(platformId);
    if (!platform) {
        logger.debug(`Live Platform Event discount Handler platformId :${platformId} not found,player:${player.uid}`);
        next(null, { code: code.err.ERR_CLIENT_PARAMS_WRONG });
        return;
    }
    const event = platform.discountEvent();
    if (!event || event.id == 0) {
        logger.debug(`Live Platform Event discount Handler event id:${event.id} not exist, player:${player.uid}`);
        next(null, { code: code.err.ERR_LIVE_PLATFORM_EVENT_NOT_EXIST });
        return;
    }
    if (eventUid != event.uid || event.type != code.live.EVENT_TYPE.DISCOUNT) {
        logger.debug(`Live Platform Event discount Handler event id:${event.id}, not dispatch type, player:${player.uid}`);
        next(null, { code: code.err.ERR_LIVE_PLATFORM_EVENT_TYPE_WRONG });
        return;
    }
    // 货币检测
    const cfg = this.app.Config.EventDiscount.get(event.id);
    if (!cfg || !cfg.CurrentPrice || !cfg.DiscountItem) {
        logger.info(`Live Platform Event discount Handler event id:${event.id} not config, player:${player.uid}`);
        next(null, {code: code.err.ERR_SERVER_INTERNAL_WRONG });
        return;
    }
    const price = util.proto.encodeAwardByArray(cfg.CurrentPrice);
    if (!player.Item.isEnough(price)) {
        logger.debug(`Live Platform Event choose Handler cost:${price} not enough, player:${player.uid}`);
        next(null, { code: code.err.ERR_LIVE_PLATFORM_EVENT_COST_NOT_ENOUGH });
        return;
    }

    // 移除并刷新事件
    platform.removeDiscountEvent(event.uid);
    // 领取奖励 + 通知管理信息
    const award = util.proto.encodeConfigAward(cfg.DiscountItem);
    player.Item.modifyItem(award, price, code.reason.OP_LIVE_PLATFORM_DISCOUNT);
    next(null, { code: code.err.SUCCEEDED,
        platformId: platformId,
        eventUid: eventUid,
        award: util.proto.encodeAward(award)
    });
};


/**
 * 选择事件
*/
Handler.prototype.choose = async function (msg, session, next) {
    // 检测数据
    const player = session.player;
    const platformId = msg.platformId;
    const choose = msg.choose;
    const eventUid = msg.eventUid;
    if (!platformId || !choose || !eventUid) {
        logger.debug(`Live Platform Event choose Handler param error,player:${player.uid}`);
        next(null, { code: code.err.ERR_CLIENT_PARAMS_WRONG });
        return;
    }
    // 检测事件有效
    const platform = player.LivePfEvent.getPlatform(platformId);
    if (!platform) {
        logger.debug(`Live Platform Event choose Handler platformId :${platformId} not found,player:${player.uid}`);
        next(null, { code: code.err.ERR_CLIENT_PARAMS_WRONG });
        return;
    }
    const event = platform.otherEvent();
    if (!event || event.id == 0) {
        logger.debug(`Live Platform Event choose Handler event id:${event.id} not exist, player:${player.uid}`);
        next(null, { code: code.err.ERR_LIVE_PLATFORM_EVENT_NOT_EXIST });
        return;
    }
    if (eventUid != event.uid || event.type != code.live.EVENT_TYPE.CHOOSE) {
        logger.debug(`Live Platform Event choose Handler event id:${event.id}, not dispatch type, player:${player.uid}`);
        next(null, { code: code.err.ERR_LIVE_PLATFORM_EVENT_TYPE_WRONG });
        return;
    }
    // 选项消耗检测
    const cfgId = this.app.Config.EventChoose.genCfgId(event.id, choose);
    const ret = this.app.Config.EventChoose.getRandomAward(cfgId);
    if (!ret || ret.dropList.length == 0) {
        logger.info(`Live Platform Event choose Handler cfgId:${cfgId} get ret error, player:${player.uid}`);
        next(null, { code: code.err.ERR_SERVER_INTERNAL_WRONG });
        return;
    }
    if (!player.Item.isEnough(ret.cost)) {
        logger.debug(`Live Platform Event choose Handler cost:${ret.cost} not enough, player:${player.uid}`);
        next(null, { code: code.err.ERR_LIVE_PLATFORM_EVENT_COST_NOT_ENOUGH });
        return;
    }

    // 移除并刷新事件
    platform.removeOtherEvent(event.uid);
    // 选项扣钱
    player.Item.deleteItem(ret.cost);
    // 领取奖励 + 通知管理信息
    const award = await player.Drop.dropBatch(ret.dropList);
    player.Item.addItem(award, code.reason.OP_LIVE_PLATFORM_CHOOSE_GET);
    const mgrExp = player.Currency.get(code.currency.CURRENCY_ID.MGR_EXP);
    next(null, { code: code.err.SUCCEEDED,
        platformId: platformId,
        choose: choose,
        indexList: ret.indexList,
        eventUid: eventUid,
        mgrExp: mgrExp,
        award: util.proto.encodeAward(award)
    });
};