const BaseConfig = require('../baseConfig');
const code = require('@code');
const utils = require('@util');
class Item extends BaseConfig {
    constructor() {
        super();
        this.typeCache = {};
    }

    reload(app, name) {
        super.reload(app, name);

        this.typeCache = {};
        for (const item of this.values()) {
            const oldValue = this.typeCache[item.Type];
            this.typeCache[item.Type] = oldValue ? oldValue.concat(item.Id) : [item.Id];
        }
    }

    getByType(type) {
        return this.typeCache[type];
    }


    /**
     * 是否为有效的货币id
     * @param {Number} currencyID 货币id
     */
    isValidCurrency(currencyID){
        const itemConfig = this.get(currencyID);
        return itemConfig && itemConfig.Type == code.item.ITEM_TYPE.CURRENCY;
    }

    /**
     * 是否是合法的仓库物品id
     * @param {Integer} itemId 物品id
     * @return {Bool}
     */
    isValidBackPackItem(itemId){
        const itemConfig = this.get(itemId);
        return itemConfig && itemConfig.Type == code.item.ITEM_TYPE.INVENTORY;
    }

    /**
     * 是否为获得后直接使用的物品
     * @param {Number} itemId 
     */
    isDirectUseItem(itemId){
        const itemConfig = this.get(itemId);
        return itemConfig && itemConfig.UseType == code.item.ITEM_USE_TYPE.DIRECT_USE;
    }

    /**
     * 是否是获得物品后开始倒计时的类型
     * @param {Integer} itemId 物品id
     * @return {Bool}
     */
    isLimitTimeByGet(itemId){
        const itemConfig = this.get(itemId);
        return itemConfig.LimitTimeType == code.item.ITEM_LIMIT_TIME_TYPE.GET;
    }

    /**
     * 是否能出售
     * @param {Integer} itemId 物品id
     * @return {Bool}
     */
    isCanSell(itemID){
        const itemConfig = this.get(itemID);
        return itemConfig && itemConfig.SellType > 0;
    }

    /**
     * 是否能合成
     * @param {Integer} itemId 物品id
     * @return {Bool}
     */
    isCanCompose(itemID){
        const itemConfig = this.get(itemID);
        return itemConfig && itemConfig.ComposeItem > 0;
    }

    /**
     * 使用效果信息
     * @param {Integer} itemId 物品id
     * @return {Bool}
     */
    getEffectFile(itemId){
        const itemConfig = this.get(itemId);
        if(itemConfig){
            return itemConfig.UseEffect;
        }else{
            return {};
        }
    }

    /**
     * 获得使用消耗的数量
     * @param {Number} itemId 
     */
    getUseCost(itemId){
        const itemConfig = this.get(itemId);
        let useCost;
        if(itemConfig){
            useCost=itemConfig.UseCost;
        }else{
            useCost = {};
        }
        return utils.proto.encodeConfigAward(useCost);
    }


    getColorName(itemID){
        const itemConfig = this.get(itemID);
        const color = code.card.QUALITY_COLOR[itemConfig.Color];
        if (color) {
            return '<Color=' + color + '>' + itemConfig.Name + '</Color>';
        }
        else {
            return itemConfig.Name;
        }
    }
}

module.exports = Item;