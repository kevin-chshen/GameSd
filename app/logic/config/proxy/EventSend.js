/**
 * @description 选择事件
 * @author jzy
 * @date 2020/03/23
 */
const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const BaseConfig = require('../baseConfig');
const randomUtil = require('@util/randomUtil');
const protoUtil = require('@util/protoUtils');
const code = require('@code');

class EventSend extends BaseConfig{
    constructor() {
        super();
        this.typeCache = {};
        this.pool = {};
    }

    reload(app, name) {
        super.reload(app, name);

        this.typeCache = {};
        for (const send of this.values()) {
            const typeClassify = this.typeCache[send.EventType] || [];
            typeClassify.push(send);
            this.typeCache[send.EventType] = typeClassify;
        }

        this.pool = {};
        for (const event of this.values()) {
            if (code.eventSend.EVENT_TYPE.VISIT == event.EventType) {
                for (const platId of event.PlatformTypeArr) {
                    this.pool[platId] = this.pool[platId] || [];
                    this.pool[platId].push(event.Id);
                }
            }
        }
    }

    /**
     * 根据事件类型获取一个事件ID
     * @param {Enum} eventType 
     */
    getRandomEventID(eventType){
        const eventIDs = this.typeCache[eventType];
        const index = randomUtil.random(0, eventIDs.length-1);
        return eventIDs[index].Id;
    }

    /**
     * 根据参数随机出结果
     * @param {Number} eventID
     * @param {Number} cardID  卡片ID
     * @param {Number} param  参照配置表说明  使用公式1则传入 卡牌当前身价/关卡推荐身价
     *                                      使用公式2则传入 卡牌属性、当前头衔
     * @returns {Object} {success:true,award:{itemID:xxx,itemNum:xxx}}
     */
    getRandomAward(eventID, cardID, param){
        const cfg = this.get(eventID);
        let rate = 0;
        switch(cfg.Condition){
        case code.eventSend.CONDITION_TYPE.K:{
            rate = this.__calFormula1(cfg, cardID, param);
            break;
        }
        case code.eventSend.CONDITION_TYPE.HOT_MAX:
        case code.eventSend.CONDITION_TYPE.CHARM_MAX:
        case code.eventSend.CONDITION_TYPE.POPULAR:
        case code.eventSend.CONDITION_TYPE.POWER:
            // 专人拜访模块待定
            rate = this.__calFormula2(cfg.Condition, cardID, param);
            break;
        }
        rate = Math.max(code.eventSend.MIN_RATE, Math.min(rate,code.eventSend.MAX_RATE));
        let award; 
        let dropList;
        const success = randomUtil.randomBool(rate);
        if(success){
            award = cfg.SuccessAward;
            dropList = cfg.DropSuccess;
        }else {
            award = cfg.FailAward;
            dropList = cfg.DropFail;
        }
        return {success:success,award:protoUtil.encodeConfigAward(award || {}),dropList:dropList};
    }

    /**
     * 获取平台对应的事件池
     * @param {Integer} platformId
     * @return {Object} 事件池
    */
    getPool(platformId) {
        return this.pool[platformId] || [];
    }
    /**
     * 获取平台对应的事件池
     * @param {Integer} platformId
     * @return {Object} 事件池
    */
    randomEvent(platformId) {
        const pool = this.getPool(platformId);
        const size = pool.length;
        if (size > 0) {
            if (size == 1)
                return pool[0];
            else
                return pool[Math.floor(Math.random() * size)];
        }
        return 0;
    }

    /**
     * 计算公式1
     * @return {Number} 概率
    */
    __calFormula1(cfg, cardID, param){
        // 计算额外加成值
        const cardCfg = this.app.Config.Card.get(cardID);
        const matchList = [];
        let additionRate = 0;
        //性别
        if (cardCfg.Sex == code.player.SexType.MALE) {
            matchList.push(code.card.REQUIRE_TYPE.MALE);
        } else if (cardCfg.Sex == code.player.SexType.FEMALE) {
            matchList.push(code.card.REQUIRE_TYPE.FEMALE);
        }
        //默认主播类型和card表主播类型序号一致
        matchList.push(cardCfg.Career);
        for (const index in cfg.TypeArr) {
            if (matchList.indexOf(cfg.TypeArr[index]) >= 0) {
                additionRate += cfg.ProbabilityArr[index];
            }
        }

        return this.app.Config.Global.get(code.eventSend.GLOBAL_CONFIG_K_ID).GlobalFloat * param + additionRate;
    }
    /**
     * 计算公式2
     * @param {Integer} type
     * @param {Integer} cardId 
     * @param {Object} player
     * @return {Number} 概率
    */
    __calFormula2(type, cardID, player) {
        const cardCfg = this.app.Config.Card.get(cardID);
        if (!cardCfg) {
            logger.warn(`EventSend __calFormula2 get card:${cardID} config failed`);
            return 0;
        }
        // 检测卡牌
        const card = player.Card.getCardObj(cardID);
        if (card == null) {
            logger.info(`EventSend __calFormula2 player:${player.uid} card:${cardID} not exist`);
            return 0;
        }
        const cardAttr = card.getAttr();
        const R = this.app.Config.Global.get(code.eventSend.GLOBAL_CONFIG_R).GlobalFloat;
        const D = this.app.Config.Global.get(code.eventSend.GLOBAL_CONFIG_D).GlobalFloat;
        const C = this.app.Config.Global.get(code.eventSend.GLOBAL_CONFIG_C).GlobalFloat;
        const E = this.app.Config.Global.get(code.eventSend.GLOBAL_CONFIG_E).GlobalFloat;
        const attribute = this.app.Config.Prestige.get(player.lv).AttributeReference;
        let A, B;
        switch (type) {
        case code.eventSend.CONDITION_TYPE.HOT_MAX:
            A = cardAttr[code.attribute.ATTR_TYPE.HP_MAX];
            B = attribute[code.attribute.ATTR_TYPE.HP_MAX];
            break;
        case code.eventSend.CONDITION_TYPE.CHARM_MAX:
            A = cardAttr[code.attribute.ATTR_TYPE.ATTACK_MAX];
            B = attribute[code.attribute.ATTR_TYPE.ATTACK_MAX];
            break;
        case code.eventSend.CONDITION_TYPE.POPULAR:
            A = cardAttr[code.attribute.ATTR_TYPE.POPULARITY];
            B = attribute[code.attribute.ATTR_TYPE.POPULARITY];
            break;
        case code.eventSend.CONDITION_TYPE.POWER:
            A = card.getPower();
            B = this.app.Config.Prestige.get(player.lv).PowerReference;
            break;
        }
        if (!B || B == 0 || !A) {
            logger.info(`EventSend __calFormula2 player:${player.uid} global base is 0, or attr null`);
            return 0;
        }
        return R / (Math.exp(D* (E-(A/B))) + 1) + C;
    }
}

module.exports = EventSend;