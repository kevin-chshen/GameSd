/**
 * @description 物品管理器
 * @author jzy
 * @date 2020/03/13
 */
const bearcat = require('bearcat');
const code = require('@code');
const assert = require('assert');

const ItemService = function(){
    this.$id = 'game_ItemService';
};

module.exports = ItemService;
bearcat.extend('game_ItemService', 'logic_BaseService');

ItemService.prototype.getUseFile = function(fileName){
    const self = this;
    /**
     * 使用物品模板，函数名和参数固定不变，有返回值时返回值为使用物品失败信息
     * key为物品配置表中UseEffect字段配置的字符串
     * @param {Object} app pomelo app
     * @param {Object} player 玩家对象
     * @param {Object} param 配置表效果后面跟着的参数
     * @param {Number} useTimes 一共使用多少次
     * @returns {Object} 返回错误代码表示使用失败，返回code.err.SUCCEEDED表示成功
     *                   award 表示为弹出奖励信息
     */
    const useFuncMap = {
        // 增加投资次数
        InvestTimes:async function(app, player, param, useTimes){
            const totalTimes = param*useTimes;
            player.Recovery.addRecovery(code.recovery.RECOVERY_TYPE.INVEST, totalTimes);
            return {code:code.err.SUCCEEDED};
        },
    };

    const exchangeFunc = this.getExchangeEffectFunc(fileName);
    if(exchangeFunc){
        return async(app, player, param, useTimes)=>{
            return await self._useExchangeEffectItem(exchangeFunc, app, player, param, useTimes);
        };
    }

    return useFuncMap[fileName];
};

ItemService.prototype.getExchangeEffectFunc = function(effectName){
    return bearcat.getBean('game_ItemExchangeEffect')[effectName];
};

/**
 * 将物品列表里面的掉落物品类型兑换成物品
 * @param {Object} player 
 * @param {Array} awardList 
 * @returns {Object} {code,award}
 */
ItemService.prototype.exchangeDropItem = async function(player, awardList){
    if(!Array.isArray(awardList)){
        awardList = [awardList];
    }
    let result = [];
    for(const item of awardList){
        const config = this.app.Config.Item.get(item.itemID);
        if(config.Type==code.item.ITEM_TYPE.DROP_ITEM){
            assert(Object.keys(config.UseEffect).length == 1, `物品id [${item.itemID}] 的使用效果错误，使用效果数量应为一个`);
            const effectName = Object.keys(config.UseEffect)[0];
            const param = config.UseEffect[effectName];
            const exchangeFunc = this.getExchangeEffectFunc(effectName);
            assert(exchangeFunc!=undefined, `物品id [${item.itemID}] 效果 [${effectName}] 未配置`);
            const res = await exchangeFunc(this.app, player, param, item.itemNum);
            if(res.code!=code.err.SUCCEEDED){
                return {code:res.code};
            }
            result = result.concat(res.award);
        }else{
            result.push(item);
        }
    }
    return {code:code.err.SUCCEEDED, award:result};
};



ItemService.prototype._useExchangeEffectItem = async function(effectFunc, app, player, param, useTimes){
    const res = await effectFunc(app, player, param, useTimes);
    if(res.code!=code.err.SUCCEEDED){
        return {code:code};
    }
    player.Item.addItem(res.award, 0);
    return {code:code.err.SUCCEEDED, award:res.award};
};




