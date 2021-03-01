/**
 * @description 月卡活动模块
 * @author chshen
 * @data 2020/05/27
 */
const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const bearcat = require('bearcat');
const code = require('@code');
const util = require('@util');
const assert = require('assert');

const ActMonthCardComponent = function (app, player) {
    this.$id = 'game_ActMonthCardComponent';
    this.$scope = 'prototype';
    this.app = app;
    this.player = player;

    this.cardMgr = {};  // 月卡管理
};
bearcat.extend('game_ActMonthCardComponent', 'game_Component');
module.exports = ActMonthCardComponent;

/**
 * 数据结构
 * {
 *      [月卡ID]:{
 *      }
 * }
 * 内存数据
 * cardMgr:{
 *      [卡ID]:对象
 * }
*/

/**
 * 月卡过期
*/
ActMonthCardComponent.prototype.expired = function(cardId) {
    delete this.cardMgr[cardId];
    delete this.player.monthCard[cardId];
};

/**
 * 加载数据
*/
ActMonthCardComponent.prototype.onLoad = function () {
    // 移除剩余天数为0的月卡
    const remove = [];
    for (const [id, card] of Object.entries(this.player.monthCard)) {
        if (card.remainDays <= 0) {
            remove.push(Number(id));
        }
    }
    for (const id of remove) {
        delete this.player.monthCard[id];
    }
    this.player.Event.on(code.event.PAY_MONTH_CARD.name, (...args) => {
        this.onPayEvent(args[0]);
    });
    this.player.Event.on(code.event.MONTH_CARD_EXPIRED.name, (...args) => {
        this.expired(args[0]);
    });

    for (const [id, card] of Object.entries(this.player.monthCard)) {
        this.cardMgr[id] = bearcat.getBean('game_ActMonthCard', this.app, this.player, id, card);
    }
};

/**
 * 跨天
*/
ActMonthCardComponent.prototype.onDayChange = function (_isOnTime, count) {
    for (const card of Object.values(this.cardMgr)) {
        card.onDayChange(count);
    }
};

/**
 * 月卡购买成功事件
 * @param {Integer} payId
*/
ActMonthCardComponent.prototype.onPayEvent = function (payId) {
    const cfg = this.app.Config.Pay.get(payId);
    assert(cfg, `PayComponent handlePayDailyPay cfgId:${payId} not found,player:${this.player.uid}`);

    // 是否触发 首充和vip经验
    const cardId = this.app.Config.OperateMonthlyCard.getCardIdByPayId(payId);
    const card = this.cardMgr[cardId];
    if (card) {
        card.addRenew();
        this.onSyncActMonthCardNotify(card, true);
        logger.info(`ActMonthCardComponent onPayEvent cardId able, player:${this.player.uid}`);
        return;
    }

    // 添加月卡对象
    const monthCardCfg = this.app.Config.OperateMonthlyCard.get(cardId);
    const data = {
        renewMs: [],
        remainDays: monthCardCfg.Days,
        isTodayFetch: false,
    };
    const obj = bearcat.getBean('game_ActMonthCard', this.app, this.player, cardId, data);
    this.cardMgr[cardId] = obj;
    this.player.monthCard[cardId] = obj.getData();

    this.player.Event.emit(code.event.MONTH_CARD_REWARD.name, payId);

    this.onSyncActMonthCardNotify(obj, false);
};

/**
 * 通知购买月卡
 * @param {Object} obj
 * @param {Boolean} renew 是否续费
*/
ActMonthCardComponent.prototype.onSyncActMonthCardNotify = function(obj, renew) {
    // 通知前端刷新月卡信息
    const canFetch = obj.canFetch();
    const subCount = canFetch ? 0 : 1;
    const cardId = obj.getCardId();
    const info = {
        cardId: cardId,
        remainDay: obj.remainDays() - subCount,
        isTodayFetch: canFetch ? 0 : 1
    };
    let gainAward = [];
    if (!renew) {
        const reward = this.app.Config.OperateMonthlyCard.get(cardId).Reward;
        gainAward = util.proto.encodeConfigAward(reward);
    }
    this.player.Item.addItem(gainAward, 0, ()=>{
        this.player.Notify.notify('onSyncActMonthCardNotify', { 
            info: info,
            award: util.proto.encodeAward(gainAward),
        });
    });
};

/**
 * 月卡列表
*/
ActMonthCardComponent.prototype.getCards = function () {
    return Object.values(this.cardMgr);
};

/**
 * 指定月卡
*/
ActMonthCardComponent.prototype.getCard = function (cardId) {
    return this.cardMgr[cardId];
};