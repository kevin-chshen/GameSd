/**
 * @description buff表
 * @author jzy
 * @date 2020/04/29
 */

// const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const code = require("@code");

const BaseConfig = require('../baseConfig');

class BuyingTimes extends BaseConfig {
    constructor() {
        super();
    }

    /**
     * 作用属性列表给卡牌
     * @param {Array} cardList [{cardId:xxx,attr:{属性}}] attr属性为原始包含上下限的属性
     * @param {Array} buffIDList buff的ID列表
     */
    affectBattleCardAttr(cardList, buffIDList){
        const totalBuff = {};
        for(const buffID of buffIDList){
            const cfg = this.get(buffID);
            if(cfg.Type != code.buff.BUFF_TYPE.FRIENDSHIP_BATTLE && cfg.Type != code.buff.BUFF_TYPE.BATTLE){
                continue;
            }
            
            for(const info of cardList){
                if(!this._isMatchBuffTarget(buffID,info.cardId)){
                    continue;
                }
                totalBuff[info.cardId] = totalBuff[info.cardId] || {};
                for(const attrBuffID of Object.keys(cfg.Effect)){
                    const key = code.attribute.ATTR_PRO_TO_ID[attrBuffID];
                    totalBuff[info.cardId][key] = (totalBuff[info.cardId][key] || 0) + cfg.Effect[attrBuffID];
                }
            }
        }
        for(const info of cardList){
            const benefitBuffList = totalBuff[info.cardId] || {};
            for(const key of Object.keys(benefitBuffList)){
                info.attr[key] = Math.floor(info.attr[key]*(10000+benefitBuffList[key])/10000);
            }
        }
    }

    _isMatchBuffTarget(buffID,cardId){
        const cfg = this.get(buffID);
        const cardCfg = this.app.Config.Card.get(cardId);
        if(cfg.Target == 0){
            return true;
        }
        //性别
        if(cardCfg.Sex == cfg.Target){
            return true;
        }
        //职业
        if(10+cardCfg.Career == cfg.Target){
            return true;
        }
        //品质
        if(20+cardCfg.Quality == cfg.Target){
            return true;
        }
        //ID
        if(cardId == buffID){
            return true;
        }
    }


    /**
     * 计算团建增加buff
     * @param {Array} buffIDList buff的ID列表
     * @return {Object} [物品id]-->增益万分比
     */
    calcFriendshipBenefitBuff(buffIDList){
        const totalBuff = {};
        for(const buffID of buffIDList){
            const cfg = this.get(buffID);
            if(cfg.Type != code.buff.BUFF_TYPE.FRIENDSHIP_BENEFIT){
                continue;
            }
            for(const buffItemID of Object.keys(cfg.Effect)){
                totalBuff[buffItemID] = (totalBuff[buffItemID] || 0) + cfg.Effect[buffItemID];
            }
        }
        return totalBuff;
    }
}
module.exports = BuyingTimes;