/**
 * @description 投资计划活动模块
 * @author chshen
 * @date 2020/05/25
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
 * 查询月卡信息
*/
Handler.prototype.query = function (msg, session, next) {
    const player = session.player;

    const cardList = [];
    const cards = player.MonthCard.getCards();
    for (const c of cards) {
        const canFetch = c.canFetch();
        const subCount = canFetch?0:1;
        cardList.push({
            cardId: c.getCardId(),
            remainDay: c.remainDays() - subCount,
            isTodayFetch: canFetch?0:1
        });
    }
    next(null, { code: code.err.SUCCEEDED, cards: cardList });
};

/**
 * 购买月卡
*/
Handler.prototype.buy = function (msg, session, next) {
    const player = session.player;
    const cardId = msg.cardId;

    const cfg = this.app.Config.OperateMonthlyCard.get(cardId);
    if (!cfg) {
        logger.debug(`actMonthCardHandler buyMonthCard cardId:${cardId} config not found, player:${player.uid}`);
        next(null, { code: code.err.ERR_CLIENT_PARAMS_WRONG });
        return;
    }

    const card = player.MonthCard.getCard(cardId);
    if (card && !card.canRenew()) {
        logger.debug(`actMonthCardHandler buyMonthCard not exist cardId:${cardId}, player:${player.uid}`);
        next(null, { code: code.err.ERR_MONTH_CARD_CAN_NOT_BUY });
        return;
    }
    
    // 允许购买
    next(null, { code: code.err.SUCCEEDED, cardId: cardId });
};


/**
 * 领取每日奖励
*/
Handler.prototype.fetch = function (msg, session, next) {
    const player = session.player;
    const cardId = msg.cardId;

    const cfg = this.app.Config.OperateMonthlyCard.get(cardId);
    if (!cfg) {
        logger.debug(`actMonthCardHandler   buyMonthCard cardId:${cardId} config not found, player:${player.uid}`);
        next(null, { code: code.err.ERR_CLIENT_PARAMS_WRONG });
        return;
    }
    const card = player.MonthCard.getCard(cardId);
    if (!card) {
        logger.debug(`actMonthCardHandler buyMonthCard not exist cardId:${cardId}, player:${player.uid}`);
        next(null, { code: code.err.ERR_MONTH_CARD_NOT_ENOUGH });
        return;
    }
    if (!card.canFetch()) {
        logger.debug(`actMonthCardHandler buyMonthCard today has fetch, cardId:${cardId}, player:${player.uid}`);
        next(null, { code: code.err.ERR_MONTH_CARD_CAN_NOT_FETCH });
        return;
    }
    const reward = util.proto.encodeConfigAward(cfg.EveryDayReward);
    player.Item.addItem(reward, code.reason.OP_ACT_MONTH_CARD_DAILY_GET);
    card.setLastFetch();

    player.Event.emit(code.event.MONTH_CARD_RECEIVE.name, cardId);

    next(null, { code: code.err.SUCCEEDED, cardId: cardId, award: util.proto.encodeAward(reward), remain: card.remainDays()-1 });
};