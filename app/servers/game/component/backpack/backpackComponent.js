/**
 * @description 背包物品管理器
 * @author jzy
 * @date 2020/03/13
 */
const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const code = require('@code');
const assert = require('assert');
const protoUtils = require('@util/protoUtils.js');
const bearcat = require('bearcat');

const BackpackComponent = function(app, player){
    this.$id = 'game_BackpackComponent';
    this.$scope = 'prototype';
    this.app = app;
    this.player = player;
};

module.exports = BackpackComponent;
bearcat.extend('game_BackpackComponent', 'game_Component');

/** 数据结构
 * {
 *      110:{                          //物品id
 *              itemNum: 999,          //物品数量
 *              getTime: 654323456,    //物品获得时间
 *          },
 *      1000:{
 *              itemNum: 1,
 *          }
 * }
 */


/**
 * @param {Number} itemId 物品id
 * @return {Number} 数量
 */
BackpackComponent.prototype.getItemNum = function(itemId){
    const item = this.getItem(itemId);
    return item.itemNum || 0;
};

/**
 * 检查数量够不够
 * @param {Mixed} itemInfoList Array或Object [{itemID:xxx,itemNum:xxx} ...] 或者 {itemID:xxx,itemNum:xxx}
 */
BackpackComponent.prototype.isItemEnough = function(itemInfoList){
    if(Array.isArray(itemInfoList)&&itemInfoList.length<=0) { return true; }
    //合并
    itemInfoList = this.mergeItemInfoList(itemInfoList);
    const itemList = this.getItem();

    for (const i in itemInfoList) {
        const itemID = itemInfoList[i].itemID;
        const itemNum = itemInfoList[i].itemNum;
        const item = itemList[itemID] || {};
        //检查物品数量够不够
        if((item.itemNum || 0) < itemNum){
            return false;
        }
    }

    return true;
};

/**
 * 增加物品
 * @param {Mixed} itemInfoList Array或Object [{itemID:xxx,itemNum:xxx} ...]
 */
BackpackComponent.prototype.addItem = function(itemInfoList, notifyChanges = true, actionId = 0){
    if(Array.isArray(itemInfoList)&&itemInfoList.length<=0) { return; }
    //合并
    itemInfoList = this.mergeItemInfoList(itemInfoList);
    const itemList = this.getItem();

    //检查报错
    for (const i in itemInfoList) {
        const itemID = itemInfoList[i].itemID;
        //检查物品配置
        assert(this.app.Config.Item.isValidBackPackItem(itemID),`增加物品，物品id "${itemID}" 无效`);
    }

    //加物品
    const changesID = [];
    for (const i in itemInfoList) {
        const itemID = itemInfoList[i].itemID;
        changesID.push(itemID);
        const itemNum = itemInfoList[i].itemNum;
        const item = itemList[itemID] || {};
        const resultNum = Number(item.itemNum || 0) + Number(itemNum);
        assert(resultNum <= code.item.MAX_ITEM_NUM, `物品id[${itemID}]超过物品上限，无法增加,当前数量:${(item.itemNum || 0)}`);
        item.itemNum = resultNum;
        // TODO: 预留的获得时间
        if(this.app.Config.Item.isLimitTimeByGet(itemID)){
            item.getTime = Date.now();
        }
        itemList[itemID] = item;
    }
    //更新数据库
    this.update(itemList);
    // 增加后台日志
    if(actionId >= 0){
        this.app.Log.itemsLog(this.player, 1, actionId, itemInfoList);
    }else{
        logger.warn(`增加物品未配置actionID , 物品列表${JSON.stringify(itemInfoList)}`);
    }

    this.player.Event.emit(code.event.RECOVERY_ADD.name, itemInfoList);

    if(notifyChanges){
        this.notifyChanges(changesID);
    }
};

/**
 * 删除物品
 * @param {Mixed} itemInfoList Array或Object [{itemID:xxx,itemNum:xxx} ...]
 */
BackpackComponent.prototype.deleteItem = function(itemInfoList, notifyChanges = true, actionId = 0){
    if(Array.isArray(itemInfoList)&&itemInfoList.length<=0) { return; }
    //合并
    itemInfoList = this.mergeItemInfoList(itemInfoList);
    const itemList = this.getItem();

    //检查报错
    for (const i in itemInfoList) {
        const itemID = itemInfoList[i].itemID;
        const itemNum = itemInfoList[i].itemNum;
        const item = itemList[itemID] || {};
        //检查物品配置
        assert(this.app.Config.Item.isValidBackPackItem(itemID),`增加物品，物品id "${itemID}" 无效`);
        //检查物品数量够不够
        assert((item.itemNum || 0) >= itemNum,`删除物品id "${itemID}" 数量"${itemNum}", 数量不足, 拥有"${item.itemNum}"`);
    }

    const changesID = [];
    //删除操作
    for (const i in itemInfoList) {
        const itemID = itemInfoList[i].itemID;
        changesID.push(itemID);
        const itemNum = itemInfoList[i].itemNum;
        const item = itemList[itemID] || {};
        item.itemNum = Number(item.itemNum || 0) - Number(itemNum);
        if(item.itemNum<=0){
            delete itemList[itemID];
        }else{
            itemList[itemID] = item;
        }
    }
    //更新数据库
    this.update(itemList);

    // 增加后台日志
    if(actionId){
        this.app.Log.itemsLog(this.player, -1, actionId, itemInfoList);
    }else{
        logger.warn(`扣除物品未配置actionID , 物品列表${itemInfoList}`);
    }

    this.player.Event.emit(code.event.RECOVERY_DEDUCT.name, itemInfoList);

    if(notifyChanges){
        this.notifyChanges(changesID);
    }
};

/**
 * 根据物品id删除仓库物品
 * @param {Mixed} idList Array或Number [id]
 */
BackpackComponent.prototype.deleteItemByID = function(idList, notifyChanges = true){
    if(Array.isArray(idList)&&idList.length<=0) { return; }
    let ids = [];
    if(Array.isArray(idList)){
        ids = idList;
    }else{
        ids.push(idList);
    }
    const itemList = this.getItem();
    //检查报错
    for(const i in ids){
        const id = ids[i];
        //检查物品配置
        assert(itemList[id],`删除物品，未拥有物品id "${id}" `);
    }

    const changesID = [];
    //删除操作
    for(const i in ids){
        const id = ids[i];
        changesID.push(id);
        
        delete itemList[id];
    }
    //更新数据库
    this.update(itemList);

    if(notifyChanges){
        this.notifyChanges(changesID);
    }
};

/**
 * 使用物品
 * @param {Mixed} itemInfoList Array或Object [{itemID:xxx,itemNum:xxx} ...]
 */
BackpackComponent.prototype.useItem = async function(itemInfo){
    //合并
    const costList = [];
    const itemID = itemInfo.itemID;
    assert(this.app.Config.Item.isValidBackPackItem(itemID),`使用物品，物品id "${itemID}" 无效`);
    const itemNum = itemInfo.itemNum;
    if(itemNum==0){
        return code.err.SUCCEEDED;
    }
    const ownNum = this.getItemNum(itemID);
    assert(ownNum>=itemNum, `使用物品ID "${itemID}" 数量"${itemNum}", 数量不足，拥有"${ownNum}"`);
    for(const costItem of this.app.Config.Item.getUseCost(itemID)){
        costItem.itemNum = costItem.itemNum*itemNum;
        costList.push(costItem);
    }
    const effectMap = this.app.Config.Item.getEffectFile(itemID);
    const effectKeys = Object.keys(effectMap);
    // 使用效果只有一个
    assert(effectKeys.length==1, `物品id "${itemID}" 使用效果配置数量不唯一`);
    const effectName = effectKeys[0];
    const useFile = this.app.Item.getUseFile(effectName);
    assert(useFile, `物品id "${itemID}" 使用方法文件"${effectName}"不存在或未加载`);

    //使用
    const res = await useFile(this.app, this.player, effectMap[effectName], itemNum);
    if(res&&res.code!=code.err.SUCCEEDED){
        return {code:res.code};
    }
    this.player.Item.deleteItem([{itemID:itemID,itemNum:itemNum}].concat(costList), code.reason.OP_ITEM_USE);
    const protoAward = protoUtils.encodeAward(res.award || []);
    this.__bannerGetReward(protoAward, itemID);
    return {code:code.err.SUCCEEDED, award:protoAward};
};

/**
 * 使用自选礼包
 */
BackpackComponent.prototype.useOptionalGift = function(itemID, choose, returnFunc){
    assert(this.app.Config.Item.isValidBackPackItem(itemID),`自选礼包物品，物品id "${itemID}" 无效`);
    const config = this.app.Config.Item.get(itemID);
    assert(Object.keys(config.UseEffect)[choose],`自选礼包物品选择错误，物品id "${itemID}", 选择 [${choose}]`);
    const useCost = this.app.Config.Item.getUseCost(itemID);

    const addItemItemID = Number(Object.keys(config.UseEffect)[choose]);
    const addItem = {itemID:addItemItemID,itemNum:config.UseEffect[addItemItemID]};
    this.player.Item.modifyItem(addItem,useCost.concat({itemID:itemID,itemNum:1}), code.reason.OP_ITEM_USE, ()=>{ 
        const protoAward = protoUtils.encodeAward(addItem);
        this.__bannerGetReward(protoAward, itemID);
        returnFunc(protoAward); 
    });
};

/**
 * 
 * @param {Array} protoAward 已合并的奖励信息
 */
BackpackComponent.prototype.__bannerGetReward = function(protoAward,itemID){
    const itemMap = {};
    for(const each of protoAward){
        itemMap[each.itemID] = each.itemNum;
    }
    const allItemIDs = Object.keys(itemMap);
    const NotifyJson = this.app.Config.Item.get(itemID).NoticeItem;
    if(Object.keys(NotifyJson).length<1){
        return;
    }
    const bannerId = Object.keys(NotifyJson)[0];
    for(const id of NotifyJson[bannerId]){
        if(allItemIDs.indexOf(String(id))>=0){
            this.app.Chat.bannerSysTpltChat(Number(bannerId), [
                this.player.name, 
                this.app.Config.Item.getColorName(itemID),
                this.app.Config.Item.getColorName(id),
            ]);
        }
    }
};

/**
 * 出售物品
 * @param {Mixed} itemInfoList Array或Object [{itemID:xxx,itemNum:xxx} ...]
 * @returns {Array} 增加的物品数组
 */
BackpackComponent.prototype.sellItem = function(itemInfoList){
    //合并
    itemInfoList = this.mergeItemInfoList(itemInfoList);
    let addItemList = [];
    for (const i in itemInfoList) {
        const itemID = itemInfoList[i].itemID;
        assert(this.app.Config.Item.isCanSell(itemID), `出售物品ID "${itemID}" 无效，不能出售`);
        const itemNum = itemInfoList[i].itemNum;
        const ownNum = this.getItemNum(itemID);
        assert(ownNum>=itemNum, `出售物品ID "${itemID}" 数量"${itemNum}", 数量不足，拥有"${ownNum}"`);
        const itemConfig = this.app.Config.Item.get(itemID);

        addItemList.push({itemID: itemConfig.SellType, itemNum: itemConfig.SellPrice * itemNum});
    }
    addItemList = this.mergeItemInfoList(addItemList);
    
    //修改物品
    this.player.Item.modifyItem(addItemList, itemInfoList, code.reason.OP_ITEM_SELL);

    return protoUtils.encodeAward(addItemList);
};

/**
 * 合成物品
 * @param {Mixed} itemInfoList Array或Object [{itemID:xxx,itemNum:xxx} ...]
 * @returns {Array} 增加的物品数组
 */
BackpackComponent.prototype.composeItem = function(itemInfoList){
    itemInfoList = this.mergeItemInfoList(itemInfoList);

    let addItemList = [];
    for (const i in itemInfoList) {
        const itemID = itemInfoList[i].itemID;
        assert(this.app.Config.Item.isCanCompose(itemID), `合成物品ID "${itemID}" 无效，不能合成`);
        const itemConfig = this.app.Config.Item.get(itemID);
        const itemNum = itemInfoList[i].itemNum * itemConfig.ComposeNum;
        const ownNum = this.getItemNum(itemID);
        assert(ownNum>=itemNum, `合成材料物品ID "${itemID}" 需要材料数量"${itemNum}", 数量不足，拥有"${ownNum}"`);
        
        const composeNum = itemInfoList[i].itemNum;
        addItemList.push({itemID: itemConfig.ComposeItem, itemNum: composeNum});
        itemInfoList[i].itemNum = composeNum * itemConfig.ComposeNum;
    }
    addItemList = this.mergeItemInfoList(addItemList);

    //修改物品
    this.player.Item.modifyItem(addItemList, itemInfoList, code.reason.OP_ITEM_COMPOSE);

    return protoUtils.encodeAward(addItemList);
};

/**
 * 推送物品变化消息
 */
BackpackComponent.prototype.notifyChanges = function(itemIds){
    const data = {itemInfo:[]};
    const itemObj = this.getItem();
    itemIds = itemIds==undefined?Object.keys(itemObj):itemIds;
    for (const key in itemIds) {
        const itemID = itemIds[key];
        data.itemInfo.push({itemID:itemID,itemNum: this.getItemNum(itemID)});
    }

    if(data.itemInfo.length>0) {
        this.app.get('channelService').pushMessageByUids("onBackpackItemDataNotify", data,
            [{uid:this.player.uid, sid: this.player.connectorId}]);
    }
};

/**
 * 获取玩家仓库物品 
 * （注：对返回的object对象操作会直接修改数据库对象的数据）
 * @param {Object} player 玩家对象
 * @param {Number} itemId 物品id
 * @return {JSON} {xxx:{itemNum:xxx}, ...} 或 {itemNum:xxx, ...}
 */
BackpackComponent.prototype.getItem = function(itemId)
{
    const playerItem = this.player.get(code.player.Keys.ITEM) || {};
    if (!itemId)
    {
        return playerItem;
    }
    return (playerItem[itemId] || {});
};

/*================ internal interface ====================*/

/**
 * 更新仓库物品列表数据库
 * @param {Object} player 玩家对象
 * @param {Object} playerItem 玩家物品数据对象
 */
BackpackComponent.prototype.update = function(playerItem){
    this.player.set(code.player.Keys.ITEM,playerItem);
};

/**
 * 压缩仓库物品信息
 */
BackpackComponent.prototype.mergeItemInfoList = function(itemInfoList){
    const result = [];
    if(Array.isArray(itemInfoList)){
        const tempDict = {};
        for(const i in itemInfoList){
            const id = itemInfoList[i].itemID;
            const num = itemInfoList[i].itemNum;
            assert(num >= 0, `物品ID "${id}" 的数量 "${num}" 错误`);
            tempDict[id] = (tempDict[id] || 0) + (num>=0? num:0);
        }
        for(const id in tempDict){
            result.push({itemID:id, itemNum:tempDict[id]});
        }
    }else{
        assert(itemInfoList.itemNum >= 0, `物品ID "${itemInfoList.itemID}" 的数量 "${itemInfoList.itemNum}" 错误`);
        result.push(itemInfoList);
    }
    return result;
};