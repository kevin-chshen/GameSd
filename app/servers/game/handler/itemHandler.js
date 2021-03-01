/**
 * @description 物品消息模块
 * @author jzy
 * @date 2020/03/13
 */

const code = require('@code');


module.exports = function(app) {
    return new Handler(app);
};

const Handler = function(app) {
    this.app = app;
};

/**
 * 获取道具数据
 *
 * @param {Object} msg
 * @param {Object} session
 * @param {Function} next next step callback
 *
 */
Handler.prototype.getBackpackItemInfo = function(msg, session, next)
{
    const player = session.player;
    if (!player) { next(null); return; }

    const data = {itemInfo:[]};
    const itemObj = player.Backpack.getItem();
    const itemIds = Object.keys(itemObj);
    for (const key in itemIds) {
        const itemID = itemIds[key];
        const obj = itemObj[itemID];
        data.itemInfo.push({itemID:itemID,itemNum:(obj.itemNum || 0)});
    }
    next(null,data);
};

/**
 * 出售
 */
Handler.prototype.sellBackpackItem = function(msg, session, next)
{
    const player = session.player;
    if (!player) { next(null); return; }

    const itemID = msg.itemID;
    const itemNum = msg.itemNum;
    const ownNum = player.Backpack.getItemNum(itemID);
    //无法出售
    if(!this.app.Config.Item.isCanSell(itemID)){
        next(null,{code:code.err.ERR_ITEM_ILLEGAL_SELL_TYPE});
        return;
    }
    //数量不够
    if(ownNum<itemNum){
        next(null,{code:code.err.ERR_ITEM_ILLEGAL_NUM});
        return;
    }

    const addAward = player.Backpack.sellItem(msg);

    next(null,{code:code.err.SUCCEEDED,itemInfo:addAward});
};

/**
 * 批量出售
 */
Handler.prototype.sellBatchBackpackItem = function(msg, session, next)
{
    const player = session.player;
    if (!player) { next(null); return; }

    const idList = msg.idList;
    const sellList = [];
    for(const i in idList){
        const itemID = idList[i];
        const ownNum = player.Backpack.getItemNum(itemID);
        //无法出售
        if(!this.app.Config.Item.isCanSell(itemID)){
            next(null,{code:code.err.ERR_ITEM_ILLEGAL_SELL_TYPE});
            return;
        }
        //数量不够
        if(ownNum<=0){
            next(null,{code:code.err.ERR_ITEM_ILLEGAL_NUM});
            return;
        }
        sellList.push({itemID:itemID,itemNum:ownNum});
    }
    

    const addAward = player.Backpack.sellItem(sellList);

    next(null,{code:code.err.SUCCEEDED,award:addAward});
};

/**
 * 使用物品
 */
Handler.prototype.useBackpackItem = async function(msg, session, next)
{
    const player = session.player;
    if (!player) { next(null); return; }
    const itemID = msg.itemID;
    const itemNum = msg.itemNum;
    const ownNum = player.Backpack.getItemNum(itemID);
    //没有配置效果
    if(Object.keys(this.app.Config.Item.getEffectFile(itemID)).length <= 0){
        next(null,{code:code.err.ERR_ITEM_NOT_SET_USE_EFFECT});
        return;
    }
    //物品使用类型
    const config = this.app.Config.Item.get(itemID);
    if(config.UseType!=code.item.ITEM_USE_TYPE.USE){
        next(null,{code:code.err.ERR_ITEM_NOT_DIRECT_USE});
        return;
    }
    //数量不够
    if(ownNum<itemNum){
        next(null,{code:code.err.ERR_ITEM_ILLEGAL_NUM});
        return;
    }
    const itemInfo = {itemID:itemID,itemNum:itemNum};

    //使用消耗 数量不足
    const costList = [];
    for(const costItem of this.app.Config.Item.getUseCost(itemID)){
        costItem.itemNum = costItem.itemNum*itemNum;
        costList.push(costItem);
    }
    if(!player.Item.isEnough(costList.concat(itemInfo))){
        next(null,{code:code.err.ERR_ITEM_USE_COST_NOT_ENOUGH});
        return;
    }

    next(null,await player.Backpack.useItem(itemInfo));
};

Handler.prototype.useOptionalGift = function(msg, session, next){
    const player = session.player;
    const itemID = msg.itemID;
    const choose = msg.choose;
    // 物品使用类型
    const config = this.app.Config.Item.get(itemID);
    if(!config || config.UseType!=code.item.ITEM_USE_TYPE.OPTIONAL_GIFT){
        next(null,{code:code.err.ERR_ITEM_NOT_OPTIONAL_USE});
        return;
    }
    // 数量不够
    const useCost = this.app.Config.Item.getUseCost(itemID);
    if(!player.Item.isEnough(useCost.concat({itemID:itemID,itemNum:1}))){
        next(null,{code:code.err.ERR_ITEM_ILLEGAL_NUM});
        return;
    }
    // 选择错误
    const addItemID = Object.keys(config.UseEffect)[choose];
    if(addItemID==undefined){
        next(null,{code:code.err.ERR_ITEM_OPTIONAL_CHOOSE_WRONG});
        return;
    }
    // 是否能增加
    const addItem = {itemID:Number(addItemID),itemNum:config.UseEffect[addItemID]};
    const resultCode = player.Item.isCanAddWithErrNo(addItem);
    if(resultCode!=code.err.SUCCEEDED){
        next(null,{code:resultCode});
        return;
    }

    player.Backpack.useOptionalGift(itemID, choose, (addAward)=>{
        next(null,{code:code.err.SUCCEEDED,award:addAward});
    });

    

};

/**
 * 合成物品
 */
Handler.prototype.composeBackpackItem = function(msg, session, next)
{
    const player = session.player;
    if (!player) { next(null); return; }
    const itemID = msg.itemID;
    const itemNum = msg.itemNum;
    const ownNum = player.Backpack.getItemNum(itemID);
    const config = this.app.Config.Item.get(itemID);
    //无法合成
    if(!this.app.Config.Item.isCanCompose(itemID)){
        next(null,{code:code.err.ERR_ITEM_ILLEGAL_COMPOSE_TYPE});
        return;
    }
    //数量不够
    if(ownNum < itemNum * config.ComposeNum){
        next(null,{code:code.err.ERR_ITEM_ILLEGAL_NUM});
        return;
    }
    
    //合成数量过少
    if(itemNum<1){
        next(null,{code:code.err.ERR_ITEM_ILLEGAL_COMPOSE_NUM});
        return;
    }

    const addAward = player.Backpack.composeItem(msg);

    next(null,{code:code.err.SUCCEEDED,itemInfo:addAward});
};