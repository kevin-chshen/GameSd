/**
 * @description 物品操作代理
 * @author jzy
 * @date 2020/03/21
 */

const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const assert = require('assert');
const code = require('@code');
const bearcat = require('bearcat');

const ItemComponent = function (app, player) {
    this.$id = 'game_ItemComponent';
    this.$scope = 'prototype';
    this.app = app;
    this.player = player;
};

module.exports = ItemComponent;
bearcat.extend('game_ItemComponent', 'game_Component');

/**
 * 每种枚举都可以根据需求定义接口，执行时未定义的话会警告，但会继续执行
 * addItem       增加物品           参数为一个物品列表[{itemID:xxx,itemNum:xxx} ...]  若有返回值，则作为参数addItem传入notifyChanges
 * deleteItem    删除物品           参数为一个物品列表[{itemID:xxx,itemNum:xxx} ...]  若有返回值，则作为参数deleteItem传入notifyChanges
 * getItemNum    获取物品数量        参数为一个ID，返回值为数量
 * isEnough      判断物品是否足够    参数为一个物品列表[{itemID:xxx,itemNum:xxx} ...]  返回值为bool类型
 * isCanAdd      判断物品是否能够增加 参数为一个物品列表[{itemID:xxx,itemNum:xxx} ...]  成功返回 code.err.SUCCEEDED 其他的返回具体的错误编号,例如 code.err.ERR_ITEM_CAR_BAG_FULL
 * notifyChanges 通知物品更新消息    参数为变化的物品列表[0,1,2,3] 或者为 addItem和deleteItem的返回值 {addItem: xxx, deleteItem: xxx}
 * 
 * 注：如果 addItem 和 deleteItem 其中一个有返回值，那就当做两个都有返回值的情况，
 * 所以尽量保证要么两个函数都有返回值，要么两个函数都没有返回值
 */
ItemComponent.prototype.itemDefine = function () {
    const self = this;
    return {
        //背包仓库
        [code.item.ITEM_TYPE.INVENTORY]: {
            addItem: function (List, actionId) {
                self.player.Backpack.addItem(List, false, actionId);
            },
            deleteItem: function (List, actionId) {
                self.player.Backpack.deleteItem(List, false, actionId);
            },
            getItemNum: function (id) {
                return self.player.Backpack.getItemNum(id);
            },
            isEnough: function (List) {
                return self.player.Backpack.isItemEnough(List);
            },
            notifyChanges: function (idList) {
                self.player.Backpack.notifyChanges(idList);
            },
        },
        //货币
        [code.item.ITEM_TYPE.CURRENCY]: {
            addItem: function (List, actionId) {
                for (const item of List) {
                    self.player.Currency.add(item.itemID, item.itemNum, actionId, false);
                }
            },
            deleteItem: function (List, actionId) {
                for (const item of List) {
                    self.player.Currency.delete(item.itemID, item.itemNum, actionId, code.currency.DELETE_TYPE.Normal, false);
                }
            },
            getItemNum: function (id) {
                return self.player.Currency.get(id);
            },
            isCanAdd: function (List) {
                for (const item of List) {
                    const result = self.player.Currency.isCanAdd(item.itemID, item.itemNum);
                    if (result != code.err.SUCCEEDED) {
                        return result;
                    }
                }
                return code.err.SUCCEEDED;
            },
            isEnough: function (List) {
                for (const item of List) {
                    if (!self.player.Currency.isEnough(item.itemID, item.itemNum)) {
                        return false;
                    }
                }
                return true;
            },
            notifyChanges: function (idList) {
                self.player.Currency.notifyChanges(idList);
            },
        },
        //卡片
        [code.item.ITEM_TYPE.CARD]: {
            addItem: function (List, actionId) {
                const idList = [];
                for (const item of List) {
                    assert(item.itemNum == 1, `增加卡片ID[${item.itemID}]的数量只能填1`);
                    const config = self.app.Config.Item.get(item.itemID);
                    if (config) {
                        idList.push(config.RelevanceId);
                    }
                }
                if(actionId && actionId >= 0){
                    self.app.Log.itemsLog(self.player, 1, actionId, List);
                }
                return self.player.Card.addNewCards(idList);
            },
            notifyChanges: function (info) {
                self.player.Card.cardInfoNotify(info.addItem);
            },
        },
        // 豪车
        [code.item.ITEM_TYPE.CAR]: {
            addItem: function (List, actionId) {
                const obj = {};
                for (const item of List) {
                    const config = self.app.Config.Item.get(item.itemID);
                    if (config) {
                        obj[config.RelevanceId] = (obj[config.RelevanceId] || 0) + item.itemNum;
                    }
                }
                if(actionId && actionId >= 0){
                    self.app.Log.itemsLog(self.player, 1, actionId, List);
                }
                return self.player.Car.addNewCars(obj, true);
            },
            deleteItem: function (List, actionId) {
                const obj = {};
                for (const item of List) {
                    const config = self.app.Config.Item.get(item.itemID);
                    if (config) {
                        obj[config.RelevanceId] = (obj[config.RelevanceId] || 0) + item.itemNum;
                    }
                }
                if(actionId && actionId >= 0){
                    self.app.Log.itemsLog(self.player, -1, actionId, List);
                }
                return self.player.Car.deleteCars(obj);
            },
            isEnough: function (List) {
                const obj = {};
                for (const item of List) {
                    const config = self.app.Config.Item.get(item.itemID);
                    if (config) {
                        obj[config.RelevanceId] = (obj[config.RelevanceId] || 0) + item.itemNum;
                    }
                }
                for (const [RelevanceId,itemNum] of Object.entries(obj)) {
                    if (!self.player.Car.judgeEnough(RelevanceId, itemNum)) {
                        return false;
                    }
                }
                return true;
            },
            isCanAdd: function (List) {
                return self.player.Car.judgeCarProt(List);
            },
            notifyChanges: function (info) {
                self.player.Car.carInfoNotify(info.addItem, info.deleteItem);
            },
        },
        // 联盟经验
        [code.item.ITEM_TYPE.GUILD_EXP]: {
            addItem: function (List) {
                for (const item of List) {
                    new Promise(resolve => {
                        self.app.rpcs.global.guildRemote.addGuildExp({}, self.player.uid, item.itemNum);
                        resolve();
                    });
                }
            },
            notifyChanges: function () {
            },
        },
        // 联盟贡献
        [code.item.ITEM_TYPE.GUILD_CONTRIBUTE]: {
            addItem: function (List, actionId) {
                let count = 0;
                for (const item of List) {
                    count += item.itemNum;
                }
                new Promise(resolve => {
                    self.app.rpcs.global.guildRemote.addGuildContribute({}, self.player.uid, count, actionId);
                    resolve();
                });
            },
            deleteItem: function (List, actionId) {
                for (const item of List) {
                    new Promise(resolve => {
                        self.app.rpcs.global.guildRemote.delGuildContribute({}, self.player.uid, item.itemNum, actionId);
                        resolve();
                    });
                }
            },
            isEnough: function (List) {
                let count = 0;
                for (const item of List) {
                    count += item.itemNum;
                }
                if (self.player.contribute >= count) {
                    return true;
                }
                return false;
            },
            notifyChanges: function () {
            },
        },
    };
};

/**
 * 获取物品数量
 * @param {Number} id 物品id
 */
ItemComponent.prototype.getItemNum = function (id) {
    const itemCfg = this.app.Config.Item.get(id);
    assert(itemCfg, `物品ID[${id}]配置不存在`);
    const itemType = itemCfg.Type;
    const func = this.itemDefine()[itemType].getItemNum;
    if (func) {
        return func(id);
    } else {
        assert.fail(`物品类型[${itemType}]未定义getItemNum函数`);
    }
};

/**
 * 物品是否充足
 * @param {Mixed} itemInfoList Array或Object [{itemID:xxx,itemNum:xxx} ...]
 */
ItemComponent.prototype.isEnough = function (itemInfoList) {
    const classifyResult = this.classify(itemInfoList);
    for (const type of Object.keys(classifyResult)) {
        const func = this.itemDefine()[type].isEnough;
        if (func) {
            if (!func(classifyResult[type])) {
                return false;
            }
        } else {
            logger.warn(`物品类型[${type}]未定义isEnough函数`);
        }
    }
    return true;
};

/**
 * 物品是否能增加
 * @param {Mixed} itemInfoList Array或Object [{itemID:xxx,itemNum:xxx} ...]
 * @returns {Integer} 返回错误表编码
 */
ItemComponent.prototype.isCanAddWithErrNo = function (itemInfoList) {
    const classifyResult = this.classify(itemInfoList);
    for (const type of Object.keys(classifyResult)) {
        const func = this.itemDefine()[type].isCanAdd;
        if (func) {
            const result = func(classifyResult[type]);
            if (code.err.SUCCEEDED != result) {
                return result;
            }
        }
        // 需要判断增加的较少，不做警告
        // else{
        //     logger.warn(`物品类型[${type}]未定义isCanAdd函数`);
        // }
    }
    return code.err.SUCCEEDED;
};

/**
 * 物品是否能增加
 * @param {Mixed} itemInfoList Array或Object [{itemID:xxx,itemNum:xxx} ...]
 * @returns {Boolean}
 */
ItemComponent.prototype.isCanAdd = function (itemInfoList) {
    return code.err.SUCCEEDED == this.isCanAddWithErrNo(itemInfoList);
};

/**
 * 物品增删一起操作，
 * 主要是为了统一notifyChanges消息的发送，
 * 如果同时需要增加和删除物品时最好用这个接口，否则自己处理notifyChanges的时机
 * @param {Mixed} addItemInfoList 增加的物品 Array或Object [{itemID:xxx,itemNum:xxx} ...]
 * @param {Mixed} deleteItemInfoList 删除的物品 Array或Object [{itemID:xxx,itemNum:xxx} ...]
 * @param {boolean} reverse 是否反转增删顺序， false先增后删，true先删后增
 */
ItemComponent.prototype.modifyItem = function (addItemInfoList, deleteItemInfoList, actionId = 0, beforeNotify = null, reverse = false, notify = true) {
    const addClassifyResult = this.classify(addItemInfoList);
    const delClassifyResult = this.classify(deleteItemInfoList);
    const changesIdsDict = {};
    if (reverse) {
        this.delClassifyItem(delClassifyResult, changesIdsDict, actionId);
        this.addClassifyItem(addClassifyResult, changesIdsDict, actionId);
    } else {
        this.addClassifyItem(addClassifyResult, changesIdsDict, actionId);
        this.delClassifyItem(delClassifyResult, changesIdsDict, actionId);
    }

    if(beforeNotify){
        beforeNotify();
    }

    if (notify) {
        for (const type of Object.keys(changesIdsDict)) {
            let idList;
            if (changesIdsDict[type].addItem || changesIdsDict[type].deleteItem) {
                if (changesIdsDict[type].list) {
                    logger.warn(`物品类型[${type}]存在addItem或deleteItem只有一方有返回值`);
                }
                idList = changesIdsDict[type];
            } else {
                idList = this.getChangesIdFromItemList(changesIdsDict[type].list);
            }
            this.notifyChanges(type, idList);
        }
    }
};

/**
 * 增加物品
 * @param {Mixed} itemInfoList Array或Object [{itemID:xxx,itemNum:xxx} ...]
 */
ItemComponent.prototype.addItem = function (itemInfoList, actionId = 0, beforeNotify = null, notify = true) {
    const classifyResult = this.classify(itemInfoList);

    const notifyList = [];
    for (const type of Object.keys(classifyResult)) {
        const func = this.itemDefine()[type].addItem;
        if (func) {
            const result = func(classifyResult[type], actionId);
            if (notify) {
                let idList;
                if (result) {
                    idList = { addItem: result };
                } else {
                    idList = this.getChangesIdFromItemList(classifyResult[type]);
                }
                notifyList.push({type:type,idList:idList});
            }
        } else {
            logger.warn(`物品类型[${type}]未定义addItem函数`);
        }
    }

    if(beforeNotify){
        beforeNotify();
    }

    if(notify){
        for(const {type,idList} of notifyList){
            this.notifyChanges(type, idList);
        }
    }
};

/**
 * 减少物品
 * @param {Mixed} itemInfoList Array或Object [{itemID:xxx,itemNum:xxx} ...]
 */
ItemComponent.prototype.deleteItem = function (itemInfoList, actionId = 0, beforeNotify = null, notify = true) {
    const classifyResult = this.classify(itemInfoList);

    const notifyList = [];
    for (const type of Object.keys(classifyResult)) {
        const func = this.itemDefine()[type].deleteItem;
        if (func) {
            const result = func(classifyResult[type], actionId);
            if (notify) {
                let idList;
                if (result) {
                    idList = { deleteItem: result };
                } else {
                    idList = this.getChangesIdFromItemList(classifyResult[type]);
                }
                notifyList.push({type:type,idList:idList});
            }
        } else {
            logger.warn(`物品类型[${type}]未定义deleteItem函数`);
        }
    }
    if(beforeNotify){
        beforeNotify();
    }

    if(notify){
        for(const {type,idList} of notifyList){
            this.notifyChanges(type, idList);
        }
    }
};

/**
 * 增加物品
 * @param {Array} itemIDList
 */
ItemComponent.prototype.notifyChanges = function (itemType, itemIDList) {
    const func = this.itemDefine()[itemType].notifyChanges;
    if (func) {
        func(itemIDList);
    } else {
        logger.warn(`物品类型[${itemType}]未定义notifyChanges函数`);
    }
};


/***************************** internal function ********************************/

ItemComponent.prototype.addClassifyItem = function (addClassifyResult, changesIdsDict, actionId) {
    for (const type of Object.keys(addClassifyResult)) {
        const func = this.itemDefine()[type].addItem;
        if (func) {
            const result = func(addClassifyResult[type], actionId);
            changesIdsDict[type] = changesIdsDict[type] || {};
            if (result) {
                changesIdsDict[type].addItem = result;
            } else {
                changesIdsDict[type].list = changesIdsDict[type].list || [];
                changesIdsDict[type].list = changesIdsDict[type].list.concat(addClassifyResult[type]);
            }
        } else {
            logger.warn(`物品类型[${type}]未定义addItem函数`);
        }
    }
};

ItemComponent.prototype.delClassifyItem = function (delClassifyResult, changesIdsDict, actionId) {
    for (const type of Object.keys(delClassifyResult)) {
        const func = this.itemDefine()[type].deleteItem;
        if (func) {
            const result = func(delClassifyResult[type], actionId);
            changesIdsDict[type] = changesIdsDict[type] || {};
            if (result) {
                changesIdsDict[type].deleteItem = result;
            } else {
                changesIdsDict[type].list = changesIdsDict[type].list || [];
                changesIdsDict[type].list = changesIdsDict[type].list.concat(delClassifyResult[type]);
            }
        } else {
            logger.warn(`物品类型[${type}]未定义deleteItem函数`);
        }
    }
};

/**
 * 分类
 * @param {Mixed} itemInfoList Array或Object [{itemID:xxx,itemNum:xxx} ...]
 */
ItemComponent.prototype.classify = function (itemInfoList) {
    //为null返回空
    if (!itemInfoList) {
        return {};
    }
    const itemList = {};
    if (Array.isArray(itemInfoList)) {
        for (const item of itemInfoList) {
            const itemCfg = this.app.Config.Item.get(item.itemID);
            assert(itemCfg, `物品ID[${item.itemID}]配置不存在`);
            const itemType = itemCfg.Type;
            let isClassify = false;
            for (const type of Object.keys(this.itemDefine())) {
                if (itemType == type) {
                    itemList[itemType] = itemList[itemType] || [];
                    item.itemNum > 0 ? itemList[itemType].push(item) : null;  // 排除数量为0的
                    isClassify = true;
                    break;
                }
            }
            if (!isClassify) {
                logger.error(`item模块，存在无法分类物品，ID[${item.itemID}]`);
            }
        }
    } else if (itemInfoList.itemID) {
        const itemCfg = this.app.Config.Item.get(itemInfoList.itemID);
        assert(itemCfg, `物品ID[${itemInfoList.itemID}]配置不存在`);
        const itemType = itemCfg.Type;
        let isClassify = false;
        for (const type of Object.keys(this.itemDefine())) {
            if (itemType == type) {
                itemList[itemType] = itemList[itemType] || [];
                itemInfoList.itemNum > 0 ? itemList[itemType].push(itemInfoList) : null; // 排除数量为0的
                isClassify = true;
                break;
            }
        }
        if (!isClassify) {
            logger.error(`item模块，存在无法分类物品，ID[${itemInfoList.itemID}]`);
        }
    }

    return itemList;
};

/**
 * 从itemList中剥离变化的id列表
 * @param {Array} itemInfoList [{itemID:xxx,itemNum:xxx} ...]
 */
ItemComponent.prototype.getChangesIdFromItemList = function (itemInfoList) {
    const idList = [];
    for (const item of itemInfoList) {
        const itemID = item.itemID;
        if (itemID && idList.indexOf(itemID) < 0) {
            idList.push(itemID);
        }
    }
    return idList;
};