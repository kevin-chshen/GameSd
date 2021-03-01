/**
 * @description 豪车消息模块
 * @author chenyq
 * @date 2020/03/30
 */
// const logger = require('pomelo-logger').getLogger('pomelo', __filename);

// let pomelo = require('pomelo');
const code = require('@code');
const util = require('@util');

module.exports = function (app) {
    return new Handler(app);
};

const Handler = function (app) {
    this.app = app;
};
/**
 * 获取豪车信息
 */
Handler.prototype.carGetInfo = function (msg, session, next) {
    const player = session.player;
    if (!player) { next(null); return; }

    const carList = player.Car.carGetInfo();
    next(null, { code: code.err.SUCCEEDED, carList: carList });
};
/**
 * 装备豪车
 */
Handler.prototype.carEquip = function (msg, session, next) {
    const player = session.player;
    if (!player) { next(null); return; }
    const carId = msg.carId;
    const cardId = msg.cardId;
    const carList = player.Car.carEquip(carId, cardId);
    player.Event.emit(code.event.CARD_EQUIP_CAR.name);
    next(null, { code: code.err.SUCCEEDED, carList: carList });
};
/**
 * 升级豪车
 */
Handler.prototype.carUpgrade = function (msg, session, next) {
    const player = session.player;
    if (!player) { next(null); return; }
    const carId = msg.carId;
    const carObj = player.Car.getCarObj(carId);
    if (!carObj) {
        next(null, { code: code.err.ERR_CAR_NO_EXIST });
        return; // 豪车不存在
    }
    const level = carObj.getLevel();
    const carConfig = carObj.getCarConfig();
    if (level >= carConfig.MaxLevel) {
        next(null, { code: code.err.ERR_CAR_UPGRADE_LIMIT });
        return; // 豪车等级已达最大可强化等级
    }
    const newLevel = level + 1;
    const upgradeConfig = carObj.getCarUpgradeConfig(newLevel);
    if (!upgradeConfig) {
        next(null, { code: code.err.ERR_CAR_UPGRADE_MAX });
        return; // 豪车等级已满
    }
    const costInfo = upgradeConfig.NeedCost[carConfig.Index - 1];
    const costList = util.proto.encodeConfigAward(costInfo);
    const itemMgr = player.Item;
    if (!itemMgr.isEnough(costList)) {
        next(null, { code: code.err.ERR_CAR_UPGRADE_COST });
        return; // 豪车升级消耗不足
    }
    itemMgr.deleteItem(costList, code.reason.OP_CAR_UPGRADE_COST);
    const carInfo = player.Car.carUpgrade(carId, newLevel);
    next(null, { code: code.err.SUCCEEDED, carInfo: carInfo });
};
/**
 * 改装豪车
 */
Handler.prototype.carRefit = function (msg, session, next) {
    const player = session.player;
    if (!player) { next(null); return; }
    const carId = msg.carId;
    const part = msg.part;
    const carObj = player.Car.getCarObj(carId);
    if (!carObj) {
        next(null, { code: code.err.ERR_CAR_NO_EXIST });
        return; // 豪车不存在
    }
    if (part < parseInt(code.car.CAR_PART.ENGINE) || part > parseInt(code.car.CAR_PART.CHASSIS)) {
        next(null, { code: code.err.ERR_CAR_REFIT_PART_ERROR });
        return; // 改装部位错误
    }
    const carConfig = carObj.getCarConfig();
    if (util.object.isNull(carConfig.RefitCost)) {
        next(null, { code: code.err.ERR_CAR_REFIT_NO });
        return; // 该豪车无法改装
    }
    const costList = util.proto.encodeConfigAward(carConfig.RefitCost);
    const itemMgr = player.Item;
    if (!itemMgr.isEnough(costList)) {
        next(null, { code: code.err.ERR_CAR_REFIT_COST });
        return; // 豪车改装消耗不足
    }
    itemMgr.deleteItem(costList, code.reason.OP_CAR_REFIT_COST);
    const carInfo = player.Car.carRefit(carId, part);
    next(null, { code: code.err.SUCCEEDED, carInfo: carInfo });
};
/**
 * 重置豪车
 */
Handler.prototype.carReset = function (msg, session, next) {
    const carId = msg.carId;
    const player = session.player;
    if (!player) { next(null); return; }
    const carObj = player.Car.getCarObj(carId);
    if (!carObj) {
        next(null, { code: code.err.ERR_CAR_NO_EXIST });
        return; // 该豪车不存在
    }
    // let cardId = carObj.equipCardId;
    // if (player.Card.isFormation(cardId)) {
    //     next(null, { code: code.err.ERR_CAR_RESET_FORMATION });
    //     return; // 装备卡牌上阵中无法重置
    // }
    const lv = carObj.getLevel();
    const refit = carObj.refitInfo;
    if (lv == 0 && util.object.isNull(refit)) {
        next(null, { code: code.err.ERR_CAR_RESET_NO_NEED });
        return; // 未培养无法重置
    }
    const carConfig = carObj.getCarConfig();
    // 统计返还消耗的物品 座驾强化消耗的资源会100%返还，改装消耗材料不会返还
    let costList = {};
    for (let i = 1; i <= lv; i++) {
        const config = carObj.getCarUpgradeConfig(i);
        costList = util.object.mergeObject(costList, config.NeedCost[carConfig.Index - 1]);
    }
    const carInfo = player.Car.carReset(carId);
    // 返还物品
    player.Item.addItem(util.proto.encodeConfigAward(costList), code.reason.OP_CAR_RESET_GET);
    next(null, { code: code.err.SUCCEEDED, carInfo: carInfo });
};
/**
 * 出售豪车
 */
Handler.prototype.carSell = function (msg, session, next) {
    const carIdList = msg.carIdList;
    const player = session.player;
    if (!player) { next(null); return; }
    const sellInfo = player.Car.sellCar(carIdList);
    player.Item.addItem(util.proto.encodeConfigAward(sellInfo.itemList), code.reason.OP_CAR_SELL_GET);
    next(null, { code: code.err.SUCCEEDED, sellList: sellInfo.sellList });
};
/**
 * 合成豪车
 */
Handler.prototype.carCompound = function (msg, session, next) {
    const cId = msg.cId;
    const num = msg.num;
    const player = session.player;
    if (!player) { next(null); return; }

    // 获取所需豪车数量
    const config = this.app.Config.Car.get(cId);
    if (!config) {
        next(null, { code: code.err.ERR_CAR_COMPOUND_ERROR });
        return; // 合成豪车错误
    }
    if (util.object.isNull(config.ComposeCost)) {
        next(null, { code: code.err.ERR_CAR_COMPOUND_NOT });
        return; // 该豪车无法合成
    }
    const compostCost = util.proto.encodeConfigAward(config.ComposeCost);
    const costList = util.item.multi(compostCost, num);
    const itemMgr = player.Item;
    if (!itemMgr.isEnough(costList)) {
        next(null, { code: code.err.ERR_CAR_COMPOUND_COST });
        return; // 豪车合成消耗不足
    }
    const itemId = player.Car.getItemIdToCId(cId);
    const carInfo = {};
    carInfo[itemId] = num;
    const composeList = util.proto.encodeConfigAward(carInfo);
    // 先扣除 再添加新的
    itemMgr.modifyItem(composeList, costList, code.reason.OP_CAR_COMPOUND);
    player.Event.emit(code.event.CAR_EXCHANGE.name, util.proto.encodeConfigAward(carInfo));
    next(null, { code: code.err.SUCCEEDED, composeInfo: { itemID: itemId, itemNum: String(num) } });
};
/**
 * 快速合成豪车
 */
Handler.prototype.carQuickCompound = function (msg, session, next) {
    const cIdList = msg.cIdList;
    const player = session.player;
    if (!player) { next(null); return; }
    // 获取最终所需的消耗
    const costInfo = player.Car.getQuickCompoundCost(cIdList);
    // 扣除消耗
    const totalCost = costInfo.totalCost;
    const itemMgr = player.Item;
    if (!itemMgr.isEnough(totalCost)) {
        next(null, { code: code.err.ERR_CAR_QUICK_COMPOUND_COST });
        return; // 豪车合成消耗不足
    }
    // 合成的豪车
    const composeInfo = util.proto.encodeConfigAward(costInfo.itemDict);
    // 先扣除 再添加新的
    itemMgr.modifyItem(composeInfo, totalCost, code.reason.OP_CAR_QUICK_COMPOUND);
    player.Event.emit(code.event.CAR_EXCHANGE.name, (costInfo.composeList || []));
    next(null, { code: code.err.SUCCEEDED, composeList: costInfo.composeList });
};
/**
 * 获取新豪车
 */
Handler.prototype.carNew = function (msg, session, next) {
    const player = session.player;
    if (!player) { next(null); return; }

    const cId = msg.cId;
    const carInfo = player.Car.addNewCar(cId, true, false);
    next(null, { code: code.err.SUCCEEDED, carInfo: carInfo });
};