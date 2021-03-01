/**
 * @description 团建路线
 * @author jzy
 * @date 2020/04/28
 */

const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const BaseConfig = require('../baseConfig');
const utils = require('@util');
const code = require('@code');
// const assert = require('assert');

class FriendshipLine extends BaseConfig {
    constructor() {
        super();
        this.floorToIDInfoList = {};  // floor -> {id:xxx, difficulty:xxx}
        this.difficultyMap = {}; // floor -> {1:true}  (表示该floor有难度1)
    }

    reload(app, name) {
        super.reload(app, name);

        this.floorToIDInfoList = {};
        this.difficultyMap = {};
        for (const data of this.values()) {
            this.floorToIDInfoList[data.Floor] = this.floorToIDInfoList[data.Floor] || [];
            this.floorToIDInfoList[data.Floor].push({id:data.Id, difficulty:data.Difficulty});
            this.difficultyMap[data.Floor] = this.difficultyMap[data.Floor] || {};
            this.difficultyMap[data.Floor][data.Difficulty] = true;

            this.__checkData(data);
        }
    }

    __checkData(data){
        for(const key of Object.keys(data.Chequer)){
            const len = data.Chequer[key].length;
            if(data.ChequerDifficulty[key].length != len 
                || data.ChequerReward[key].length != len
                || data.ChequerCost[key].length != len
            ){
                logger.error(`Friendship配置表id[${data.Id}]的第[${key}]阶梯配置出错，${(new Error()).stack}`);
                return false;
            }
            if(data.Chequer[key+1]){
                const nextLen = data.Chequer[key+1].length;
                if(nextLen!=len+1&&nextLen!=len-1){
                    logger.error(`Friendship配置表id[${data.Id}]的第[${key}]阶梯和第[${key+1}]阶梯链接配置出错，${(new Error()).stack}`);
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * 根据层数和难度随机出一个id，难度可选填
     * @param {Number} floor 
     * @param {Number|undefined} difficulty 
     */
    getRandomID(floor,difficulty){
        if(!this.floorToIDInfoList[floor]){
            return;
        }
        if(difficulty!=undefined){
            const list = this.floorToIDInfoList[floor].filter(function(info){
                return info.difficulty == difficulty;
            });
            if(list.length==0){
                return;
            }
            return list[utils.random.random(0, list.length - 1)].id;
        }else{
            return this.floorToIDInfoList[floor][
                utils.random.random(0, this.floorToIDInfoList[floor].length - 1)
            ].id;
        }
    }

    /**
     * 获取初始任务线id
     */
    getInitID(){
        return this.getRandomID(1);
    }

    /**
     * 获取目标配置
     * @param {Number} id 
     * @param {Number} stair 
     * @param {Number} index 
     */
    getConfig(id, stair, index){
        const config = this.get(id);
        const obj = {
            friendshipID: config.Chequer[stair][index],
            difficulty: config.ChequerDifficulty[stair][index],
            reward: config.ChequerReward[stair][index],
            cost: config.ChequerCost[stair][index],
        };
        return obj;
    }

    /**
     * 获取路线所有的商店信息
     * @param {Number} id 
     */
    getShopList(id){
        const config = this.get(id);
        const result = [];
        for(const stair of Object.keys(config.Chequer)){
            for(const index in config.Chequer[stair]){
                const friendShipId = config.Chequer[stair][index];
                const friendShipCfg = this.app.Config.Friendship.get(friendShipId);
                const type = friendShipCfg.Type;
                if(type==code.friendship.GRID_TYPE.SHOP){
                    result.push({
                        stair:parseInt(stair),
                        index:parseInt(index),
                        shopId:friendShipCfg.ShopId,
                    });
                }
            }
        }
        return result;
    }

    /**
     * 获取每一步所需要的配置数据，格子id、格子类型、消耗
     * @param {Number} id 
     * @param {Number} stair 
     * @param {Number} index 
     */
    getStepCost(id, stair, index, lv){
        const totalCfg = this.getConfig(id, stair, index);
        const order = this.app.Config.Prestige.get(lv).Order;
        const baseCost = utils.proto.encodeConfigAward(this.app.Config.FriendshipReward.get(order).Cost);
        const totalCost = utils.item.multi(baseCost, totalCfg.cost, 10000);
        return {
            cost: totalCost,
            friendshipID: totalCfg.friendshipID,
            type: this.app.Config.Friendship.get(totalCfg.friendshipID).Type,
        };
    }

    /**
     * 获取每一步所需要的配置数据，格子id、格子类型、奖励
     * @param {Number} id 
     * @param {Number} stair 
     * @param {Number} index 
     */
    getStepAward(id, stair, index, lv){
        const totalCfg = this.getConfig(id, stair, index);
        const growReward = utils.item.multi(this.app.Config.Friendship.getBaseGrowReward(totalCfg.friendshipID, lv), totalCfg.reward, 10000);
        const fixedReward = this.app.Config.Friendship.getFixReward(totalCfg.friendshipID, lv);
        const totalReward = growReward.concat(fixedReward);
        return {
            award: totalReward,
            friendshipID: totalCfg.friendshipID,
            type: this.app.Config.Friendship.get(totalCfg.friendshipID).Type,
        };
    }

    /**
     * 检查下一阶段index是否正确
     * @param {Number} id 
     * @param {Number} stair 
     * @param {Number} index 
     * @param {Number} nextIndex 
     */
    checkNext(id, stair, index, nextIndex){
        const config = this.get(id).Chequer;
        if(stair!=0&&!config[stair]){return false;}
        if(!config[stair+1]){return false;}
        const currentLen = stair==0?1:config[stair].length;
        const nextLen = config[stair+1].length;
        if(nextIndex<0||nextIndex>=nextLen){return false;}
        const maxIndex = Math.ceil(((index+1)/currentLen)*nextLen-1);
        const minIndex = maxIndex-1;
        if(nextIndex!=minIndex&&nextIndex!=maxIndex){
            return false;
        }else{
            return true;
        }
    }

    /**
     * 检查是不是最后一阶层
     * @param {Number} id 
     * @param {Number} stair 
     */
    isFinalStair(id,stair){
        const config = this.get(id).Chequer;
        if(stair!=0&&!config[stair]){return false;}
        // 下一阶层不存在
        if(!config[stair+1]){
            return true;
        }else{
            return false;
        }
    }

    /**
     * 判断是不是最后一层
     * @param {Number} id 
     */
    isFinalStage(id){
        const floor = this.get(id).Floor;
        if(!this.floorToIDInfoList[floor+1] || this.floorToIDInfoList[floor+1].length<=0){
            return true;
        }else{
            return false;
        }
    }

    /**
     * 判断是不是多种难度
     * @param {Number} floor 
     */
    isStageMultiDifficulty(floor){
        return Object.keys(this.difficultyMap[floor]).length>1;
    }
}

module.exports = FriendshipLine;