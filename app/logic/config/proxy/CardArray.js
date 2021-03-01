/**
 * @description 卡牌组
 * @author jzy
 * @date 2020/04/30
 */

// const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const code = require("@code");
const utils = require("@util");
const BaseConfig = require('../baseConfig');

class CardArray extends BaseConfig {
    constructor() {
        super();
        this.classifyByType = {};
    }

    reload(app, name) {
        super.reload(app, name);
        this.classifyByType = {};
        for (const data of this.values()) {
            this.classifyByType[data.UseType] = this.classifyByType[data.UseType] || [];
            this.classifyByType[data.UseType].push(data);
        }
    }

    /**
     * 获取随机的一个boss组
     * @param {Number} type 
     * @param {Number} level 
     */
    getRandomOne(type, level) {
        const randomList = [];
        for (const data of this.classifyByType[type]) {
            if (level >= data.PrestigeLv[0] && level <= data.PrestigeLv[1]) {
                randomList.push(data);
            }
        }

        if (randomList.length <= 0) {
            return;
        }
        return randomList[utils.random.random(0, randomList.length - 1)];
    }
    /**
     * 获取随机的n个boss组
     * @param {Number} type 
     * @param {Number} level 
     */
    getRandom(type, level, num) {
        const randomList = [];
        for (const data of this.classifyByType[type]) {
            if (level >= data.PrestigeLv[0] && level <= data.PrestigeLv[1]) {
                randomList.push(data);
            }
        }

        if (randomList.length <= 0) {
            return [];
        }
        return utils.random.randomArrayElements(randomList, num);
    }

    /**
     * 获取随机一个boss战斗组
     * @param {Number} type 
     * @param {Number} level 
     * @param {Number} power 基础总身价
     * @param {Number} difficulty 难度系数
     * @param {Number} attrParam 属性系数
     */
    getRandomBossArray(type, level, power, difficulty, attrParam) {
        const data = this.getRandomOne(type, level);
        if (!data) {
            return { bossInfo: { uid: 0, name: "" }, bossArray: [] };
        }
        const bossArray = [];
        const recommend = Math.floor(power * difficulty / 10000);  // 推荐身价
        for (let i = 0; i < data.ModelId.length; i++) {
            const modelID = data.ModelId[i];
            const rate = i<data.PowerRatio.length? data.PowerRatio[i]:0;
            const bossPower = Math.floor(recommend*rate/10000);
            const hp = Math.floor(attrParam* Math.sqrt(bossPower*1200/attrParam));
            const atk = Math.floor(Math.sqrt(bossPower*1200/attrParam));
            bossArray.push({
                id: modelID,
                hp: hp,
                atk: atk,
                skill: this.app.Config.Model.get(modelID).Skill,
            });
        }
        return { bossInfo: { uid: 0, name: this.app.Config.Model.get(data.ModelId[0]).Name }, bossArray: bossArray };
    }
    /**
     * 流量为王机器人
     * @param {Number} level 头衔等级
     * @param {Number} recommendPower 排名推荐身价
     * @param {Number} attrParam 属性系数
     */
    getRandomGeneral(useType, level, recommendPower, attrParam) {
        const data = this.getRandomOne(useType, level);
        if (!data) {
            return { enemyInfo: { uid: 0, name: "", head: 0, power: 0 }, enemyArray: [] };
        }
        const enemyArray = [];
        let totalPower = 0;
        for (let i = 0; i < data.ModelId.length; i++) {
            const modelID = data.ModelId[i];
            const rate = i < data.PowerRatio.length ? data.PowerRatio[i] : 0;
            // 排名机器人卡牌身价=排名推荐身价*卡牌组身价比例/10000
            const power = Math.floor(recommendPower * rate / 10000);
            totalPower += power;
            // 机器人卡牌热度=属性系数*（排名机器人卡牌身价*1200/属性系数）^0.5
            const hp = Math.floor(attrParam * Math.pow(power * 1200 / attrParam, 0.5));
            // 机器人卡牌魅力=（排名机器人卡牌身价*1200/属性系数）^0.5
            const atk = Math.floor(Math.pow(power * 1200 / attrParam, 0.5));
            enemyArray.push({
                id: modelID,
                hp: hp,
                atk: atk,
                skill: this.app.Config.Model.get(modelID).Skill,
            });
        }
        let name = '';
        let head = 10001;
        const modelConfig = this.app.Config.Model.get(data.ModelId[0]);
        if (modelConfig) {
            name = '神秘玩家';//modelConfig.Name;
            head = modelConfig.HeadRes;
        }
        return { enemyInfo: { 
            uid: data.ModelId[0], 
            name: name, 
            head: head, 
            lv: level, 
            power: totalPower, 
            vip: 0, 
            sex:utils.random.randomBool(0.5)?code.player.SexType.MALE:code.player.SexType.FEMALE,
        }, enemyArray: enemyArray };
    }

    /**
     * 随机n个车展bot
     * @param {Number} level 
     * @param {Number} totalPowerList 
     */
    getRandomAutoShowBot(level, totalPowerList, num){
        const dataList = this.getRandom(code.cardArray.USE_TYPE.COMMON, level, num);
        const result = [];
        for(const index in dataList){
            const data = dataList[index];
            const totalPower = totalPowerList[index];
            const enemyArray = [];
            let sumPower = 0;
            const eachPower = [];
            for (let i = 0; i < data.ModelId.length; i++) {
                const modelID = data.ModelId[i];
                const rate = i < data.PowerRatio.length ? data.PowerRatio[i] : 0;
                // 机器人卡牌身价=排名推荐身价*卡牌组身价比例/10000
                const power = Math.floor(totalPower * rate / 10000);
                const atk = Math.floor(Math.pow(power * 120, 0.5));
                const hp = 10*atk;
                enemyArray.push({
                    id: modelID,
                    hp: hp,
                    atk: atk,
                    skill: this.app.Config.Model.get(modelID).Skill,
                });
                sumPower+=power;
                eachPower.push(power);
            }
            let name = '';
            const modelConfig = this.app.Config.Model.get(data.ModelId[0]);
            if (modelConfig) {
                name = modelConfig.Name;
            }
            result.push({
                enemyInfo: { 
                    uid: Number(data.ModelId[0].toString() + index), 
                    name: name , 
                    power:sumPower, 
                    eachPower:eachPower,
                    lv:level
                }, 
                enemyArray: enemyArray 
            });    
        }
        return result;
    }
}
module.exports = CardArray;