/**
 * @description 选择事件
 * @author jzy
 * @date 2020/03/23
 */

const BaseConfig = require('../baseConfig');
const randomUtil = require('@util/randomUtil');
const protoUtil = require('@util/protoUtils');
const code = require('@code');

class EventChoose extends BaseConfig{
    constructor() {
        super();
        this.typeCache = {};
        this.pool = {};
    }


    reload(app, name) {
        super.reload(app, name);

        this.typeCache = {};
        for (const choose of this.values()) {
            const typeClassify = this.typeCache[choose.EventType] || {};
            const idClassify = typeClassify[choose.EventId] || [];
            idClassify.push(choose);
            typeClassify[choose.EventId] = idClassify;
            this.typeCache[choose.EventType] = typeClassify;
        }

        this.pool = {};
        for (const choose of this.values()) {
            if (choose.EventType == code.eventChoose.EVENT_TYPE.STREET_CHOOSE) {
                for (const platId of choose.PlatformTypeArr) {
                    this.pool[platId] = this.pool[platId] || [];
                    this.pool[platId].push(choose.EventId);
                }
            }
        }
    }

    /**
     * 根据事件类型随机一个事件id
     * @param {Enum} eventType 
     */
    getRandomEventID(eventType) {
        const eventIDs = Object.keys(this.typeCache[eventType]);
        const index = randomUtil.random(0, eventIDs.length-1);
        return parseInt(eventIDs[index]);
    }

    getRandomAward(eventUID){
        const cfg = this.get(eventUID);
        const typeArr = cfg.TypeArr;
        const award = [];
        const cost = [];
        const dropList = [];
        const indexList = [];
        for(const index in typeArr){
            let rate = 0;
            switch(typeArr[index]){
            case code.eventChoose.RATE_TYPE.FULL:
                rate = 1;
                break;
            case code.eventChoose.RATE_TYPE.THREE_QUARTERS:
                rate = 0.75;
                break;
            case code.eventChoose.RATE_TYPE.HALF:
                rate = 0.45;
                break;
            case code.eventChoose.RATE_TYPE.QUARTER:
                rate = 0.25;
                break;
            }
            if(randomUtil.randomBool(rate)){
                indexList.push(index);
                if(cfg.Award && cfg.Award.length>index && Object.keys(cfg.Award[index])[0]!=0){
                    award.push(cfg.Award[index]);
                }
                if(cfg.Cost && cfg.Cost.length>index && Object.keys(cfg.Cost[index])[0]!=0){
                    cost.push(cfg.Cost[index]);
                }
                if(cfg.Drop && cfg.Drop.length>index){
                    dropList.push(cfg.Drop[index]);
                }
            }
        }
        
        return {award:protoUtil.encodeConfigAward(award),cost:protoUtil.encodeConfigAward(cost),dropList:dropList,indexList:indexList};
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
     * 生成随机事件配置表id
     * @param {Integer} eventId
     * @param {Integer} choose 
     * @return {Integer} 配置表ID
    */
    genCfgId(eventId, choose) {
        return eventId*10 + choose;
    }
}

module.exports = EventChoose;