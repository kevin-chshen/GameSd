/**
 * @description 卡牌管理模块
 * @author chenyq
 * @data 2020/03/30
 */

const logger = require('pomelo-logger').getLogger('pomelo', __filename);

// let pomelo = require('pomelo');
const bearcat = require('bearcat');
const code = require('@code');
const util = require('@util');

// db数据
// carInfo {carMaxId:0, 
//          carEquip:{carId:cardId,...},
//          carList:{carId:{ cId: 0, level: 0, refit: {part1:{id:0, index:0},...}},{部位:{评分段:0, 评分索引:0},...}},...}}
//          carRefitInfo:{type1:num, type2:num, type3:num, type4:num, type5:num}}

const CarComponent = function (app, player) {
    this.$id = 'game_CarComponent';
    this.$scope = 'prototype';
    this.app = app;
    this.player = player;
    this.carDict = {};         //{carId:{},carId:{}}
};

bearcat.extend('game_CarComponent', 'game_Component');
module.exports = CarComponent;

CarComponent.prototype.onAfterLoad = function () {
    if (this.player.carInfo == undefined) {
        this.player.carInfo = {};
    }
    const carInfo = this.player.carInfo;
    const carEquip = carInfo.carEquip || {};
    const carList = carInfo.carList || {};
    for (const [carId, info] of Object.entries(carList)) {
        const carObj = bearcat.getBean('game_Car', this.app, this.player, parseInt(carId), info);
        const cardId = carEquip[carId] || 0;
        if (cardId > 0) {
            carObj.equipCardId = cardId;
            const cardObj = this.player.Card.getCardObj(cardId);
            if (carObj) {
                cardObj.setEquipCar(carId);
            }
        }
        this.carDict[carId] = carObj;
    }
    logger.info("CarComponent onLogin");
};

/******************************************************************
 * public function
 *****************************************************************/
/**
 * 获取豪车对象
 */
CarComponent.prototype.getCarObj = function (carId) {
    if (this.carDict == undefined) {
        return undefined;
    }
    return this.carDict[carId];
};
/**
 * 获取豪车信息
 */
CarComponent.prototype.carGetInfo = function () {
    const carList = [];
    if (this.carDict) {
        for (const carObj of Object.values(this.carDict)) {
            const info = this.getInfo(carObj);
            carList.push(info);
        }
    }
    return carList;
};
/**
 * 装备豪车 cardId = 0为卸下
 */
CarComponent.prototype.carEquip = function (carId, cardId) {
    const carEquip = this.player.carInfo.carEquip || {};
    const carObj = this.carDict[carId];
    const changeCard = [];
    const carSet = new Set();
    const oldCardId = carEquip[carId] || 0;
    if (carObj && oldCardId != cardId) {
        // 不管豪车是装备还是卸下 如果有处于装备中 就卸下
        if (oldCardId > 0) {
            delete carEquip[carId];
            carObj.equipCardId = 0; // oldCardId扣除旧豪车属性
            const oldCardObj = this.player.Card.getCardObj(oldCardId);
            if (oldCardObj) {
                oldCardObj.setEquipCar(0);
            }
            changeCard.push(oldCardId);
            carSet.add(carId);
        }
        // 判断是否要装备于哪个卡牌
        if (cardId > 0) {
            // 如果该卡牌已经装备豪车 卸下其豪车
            const cardObj = this.player.Card.getCardObj(cardId);
            if (cardObj) {
                const oldCarId = cardObj.getEquipCar();
                if (oldCarId > 0) {
                    delete carEquip[oldCarId];
                    const oldCarObj = this.carDict[oldCarId];
                    if (oldCarObj) {
                        oldCarObj.equipCardId = 0; // cardId扣除旧豪车属性
                        carSet.add(oldCarId);
                    }
                }
                // 为该卡牌装备上豪车
                carEquip[carId] = cardId;
                carObj.equipCardId = cardId; // cardId增加新豪车属性
                cardObj.setEquipCar(carId);
                changeCard.push(cardId);
                carSet.add(carId);
            }
        }
        this.player.carInfo.carEquip = carEquip;
        this.updateCar(false);
        this.player.Card.updatePower();
        if (changeCard.length > 0) {
            this.player.Card.notifyChanges(changeCard);
        }
    }
    const carList = [];
    for (const id of carSet) {
        if (this.carDict[id]) {
            const info = this.getInfo(this.carDict[id]);
            carList.push(info);
        }
    }
    return carList;
};
/**
 * 豪车升级
 */
CarComponent.prototype.carUpgrade = function (carId, level) {
    if (this.carDict[carId] == undefined) {
        return;
    }
    this.carDict[carId].setLevel(level);
    this.updateCar();
    this.updateEquipCard(carId);
    this.player.Event.emit(code.event.CAR_UP.name);
    return this.getInfo(this.carDict[carId]);
};
/**
 * 豪车改装
 */
CarComponent.prototype.carRefit = function (carId, part) {
    const carObj = this.getCarObj(carId);
    const oldRefitLv = carObj.getRefitComposeLv();
    const carRefitInfo = this.player.carInfo.carRefitInfo || {};
    let id = 0;
    // 获取评分段
    for (let i = 5; i >= 1; i--) {
        const config = carObj.getCarRefitConfig(i);
        let pro = 0;
        if (i >= code.car.CAR_REFIT_TYPE.SUPERIOR) {
            // 绝世、完美、精良-公式计算概率抽取
            const refitNum = carRefitInfo[i] || 1;
            pro = config.SuccessValue * (refitNum - config.MinTime);
        }
        else {
            // 瑕疵、粗糙-概率直接抽取
            pro = config.SuccessValue;
        }
        // 粗糙-低保
        if (i == code.car.CAR_REFIT_TYPE.ROUGH || util.random.probability(pro)) {
            id = i;
            carRefitInfo[i] = 1;// 重置改装次数
            break;
        }
        else {
            // 失败增加改装次数
            carRefitInfo[i] = (carRefitInfo[i] || 1) + 1;
        }
    }
    // 获取评分
    const refitConfig = carObj.getCarRefitConfig(id);
    const index = util.random.randomWeight(refitConfig.ProbabilityValue);
    carObj.refitInfo = [part, id, index];
    this.updateCar();
    this.updateEquipCard(carId);
    this.player.carInfo.carRefitInfo = carRefitInfo;
    this.player.Event.emit(code.event.CAR_REFIT.name);
    if (id >= code.car.CAR_REFIT_TYPE.INDEPENDENT) {
        // 公告
        this.app.Chat.bannerSysTpltChat(code.car.CAR_REFIT_SYSTEM_ID, [this.player.name]);
    }
    const newRefitLv = carObj.getRefitComposeLv();
    if (newRefitLv > oldRefitLv) {
        const config = carObj.getCarRefitConfig(newRefitLv)
        if (config) {
            const refitName = util.color.getNameColor(config.Name, newRefitLv);
            // 公告
            this.app.Chat.bannerSysTpltChat(code.car.CAR_REFIT_COMPOSE_SYSTEM_ID, [this.player.name, refitName]);
        }
    }
    return this.getInfo(this.carDict[carId]);
};
/**
 * 豪车重置
 */
CarComponent.prototype.carReset = function (carId) {
    if (this.carDict[carId] == undefined) {
        return;
    }
    this.carDict[carId].resetCar();
    this.updateCar();
    this.updateEquipCard(carId);
    this.player.Event.emit(code.event.CAR_RESET.name);
    return this.getInfo(this.carDict[carId]);
};
/**
 * 豪车出售 已强化，已改装，已装备，无回收材料的豪车不可出售
 */
CarComponent.prototype.sellCar = function (carIdList) {
    // 统计出售结果
    const sellList = [];
    let itemList = {};
    for (const carId of carIdList) {
        // 已强化，已改装，已装备
        if (this.carDict[carId] && this.judgeCarIsInit(this.carDict[carId])) {
            // 是否可出售
            const config = this.carDict[carId].getCarConfig();
            if (!util.object.isNull(config.Sell)) {
                sellList.push(carId);
                delete this.carDict[carId];
                itemList = util.object.mergeObject(itemList, config.Sell);
            }
        }
    }
    this.updateCar();
    return { sellList: sellList, itemList: itemList };
};
/**
 * 获取快速合成消耗及结果
 */
CarComponent.prototype.getQuickCompoundCost = function (cIdList) {
    // 可消耗豪车数量
    const cIdNumDict = this.getCostCar();
    // 预计合成豪车
    const expectDict = {};
    // 预计消耗的豪车数量
    const expectCostList = {};
    // 所有合成的豪车，不包含拿去扣除的 显示用
    const showList = {};
    let totalCost = [];
    for (const cId of cIdList) {
        const config = this.app.Config.Car.get(cId);
        if (config && config.Quality < code.car.CAR_QUALITY.yellow && !util.object.isNull(config.ComposeCost)) {
            // 根据消耗豪车
            const costInfo = this.getCostInfo(config.ComposeCost);
            // 判断可合成最大数量
            const maxNum = this.getCompoundCarNum(costInfo.carCost, cIdNumDict, expectDict);
            // 统计消耗豪车及其他消耗
            if (maxNum > 0) {
                showList[cId] = (showList[cId] || 0) + maxNum;
                // 添加预合成数量
                expectDict[cId] = (expectDict[cId] || 0) + maxNum;
                // 扣除豪车
                this.costCompoundCarNum(costInfo, maxNum, cIdNumDict, expectDict, expectCostList);
                // 统计其他消耗材料
                // totalCost = util.object.mergeObject(totalCost, util.object.itemDouble(costInfo.otherCost, maxNum));
                const costList = util.proto.encodeConfigAward(costInfo.otherCost);
                const costMultiList = util.item.multi(costList, maxNum);
                totalCost = totalCost.concat(costMultiList);
            }
        }
    }
    const cIdToItemId = this.getCIdItemIdObj();
    // totalCost = util.object.mergeObject(totalCost, this.carToItem(cIdToItemId, expectCostList));
    const expectList = this.carToItem(cIdToItemId, expectCostList);
    totalCost = totalCost.concat(util.proto.encodeConfigAward(expectList));
    // 转换为对应豪车物品再返回
    return { totalCost: totalCost, composeList: this.getComposeInfo(cIdToItemId, expectDict), itemDict: this.carToItem(cIdToItemId, expectDict) };
};

/**
 * 判断豪车消耗是否足够
 */
CarComponent.prototype.judgeEnough = function (cId, num) {
    const cIdNumDict = this.getCostCar();
    if (cIdNumDict[cId] && cIdNumDict[cId].num >= num) {
        return true;
    }
    return false;
};
/**
 * 判断车位是否足够
 * @param {Array} list [{itemID:xxx,itemNum:xxx} ...]
 * @returns {Integer}
 */
CarComponent.prototype.judgeCarProt = function (list) {
    let needProt = 0;
    for (const item of list) {
        const config = this.app.Config.Item.get(item.itemID);
        if (config) {
            needProt += parseInt(item.itemNum);
        }
    }
    const portMax = this.carPortMax();
    const carNum = this.getCarProtNum();
    if (carNum + needProt <= portMax) {
        return code.err.SUCCEEDED;
    } else {
        return code.err.ERR_ITEM_CAR_BAG_FULL;
    }
};
/**
* 通知客户端豪车信息
*/
CarComponent.prototype.carInfoNotify = function (carList, delList) {
    if ((carList && carList.length > 0) || (delList && delList.length > 0)) {
        this.channelNotify("onCarInfoNotify", { carList: carList, delList: delList });
    }
};

/**
 * 扣除豪车
 * @param object {cId:num,cId:num,...}
 */
CarComponent.prototype.deleteCars = function (obj) {
    let returnList = [];
    for (const [cId, num] of Object.entries(obj)) {
        const delList = this.deleteCar(cId, num, false, false);
        returnList = [...returnList, ...delList];
    }
    this.updateCar();
    this.player.Event.emit(code.event.CAR_CHANGE.name);
    return returnList;
};
/**
 * 扣除豪车
 */
CarComponent.prototype.deleteCar = function (cId, num, isUpdate, isNotify = true) {
    const delList = [];
    let count = 0;
    const cIdNumDict = this.getCostCar();
    if (cIdNumDict[cId]) {
        for (const carId of cIdNumDict[cId].carIdList) {
            if (this.carDict[carId]) {
                delList.push(carId);
                if (++count >= num) {
                    break;
                }
            }
        }
    }
    if (delList.length > 0) {
        for (const carId of delList) {
            if (this.carDict[carId]) {
                delete this.carDict[carId];
            }
        }
        if (isUpdate) {
            this.updateCar();
            this.player.Event.emit(code.event.CAR_CHANGE.name);
        }
        //广播删除的豪车
        if (isNotify) {
            this.carInfoNotify(undefined, delList);
        }
    }
    return delList;
};
/**
 * 添加豪车
 * @param object {cId:num,cId:num,...}
 * @param isSendMail 超过车位上限是否发送邮件
 */
CarComponent.prototype.addNewCars = function (obj, isSendMail) {
    // 判断车位
    let addNum = 0;
    for (const num of Object.values(obj)) {
        addNum += num;
    }
    const carProtMax = this.carPortMax();
    let carNum = this.getCarProtNum();
    if (!isSendMail && carNum + addNum > carProtMax) {
        // TODO 豪车车位不足，无法获得
        return [];
    }
    const mailCarList = {};
    const carList = [];
    for (const [cId, num] of Object.entries(obj)) {
        for (let i = 0; i < num; i++) {
            if (carNum < carProtMax) {
                const carInfo = this.addNewCar(cId, false, false);
                if (!util.object.isNull(carInfo)) {
                    carList.push(carInfo);
                }
            }
            else {
                mailCarList[cId] = (mailCarList[cId] || 0) + 1;
            }
            carNum += 1;
        }
    }
    this.updateCar();
    this.player.Event.emit(code.event.CAR_CHANGE.name, obj);
    // 多余豪车发送邮件
    if (!util.object.isNull(mailCarList)) {
        const mailConfig = this.app.Config.Mail.get(code.mail.MAIL_CONFIG_ID.CAR_MAIL);
        if (mailConfig) {
            const itemList = [];
            for (const [cId, num] of Object.entries(mailCarList)) {
                itemList.push({ itemID: this.getItemIdToCId(cId), itemNum: num });
            }
            this.app.Mail.sendMail(this.player.uid, mailConfig.Name, mailConfig.Text, itemList);
        }
    }

    return carList;
};
/**
 * 添加新豪车
 */
CarComponent.prototype.addNewCar = function (cId = 0, isUpdate = true, isNotice = true) {
    let carInfo = {};
    const config = this.app.Config.Car.get(cId);
    if (config) {
        // 判断车位 超过车位上限发送邮件
        const carProtMax = this.carPortMax();
        const carNum = this.getCarProtNum();
        if (carNum >= carProtMax) {
            // 发送豪车邮件
            const itemInfo = { itemID: this.getItemIdToCId(cId), itemNum: 1 };
            const mailConfig = this.app.Config.Mail.get(code.mail.MAIL_CONFIG_ID.CAR_MAIL);
            if (mailConfig) {
                this.app.Mail.sendMail(this.player.uid, mailConfig.Name, mailConfig.Text, [itemInfo]);
                logger.info(`player:${this.player.uid} add new car:${cId} , carProtMax sendMail itemInfo:${JSON.stringify(itemInfo)}`);
            }
        }
        else {
            this.player.carInfo.carMaxId = (this.player.carInfo.carMaxId || 0) + 1;
            const carId = this.player.carInfo.carMaxId;
            const info = {};
            info.cId = cId;
            info.level = 0;
            info.refit = {};
            const carObj = bearcat.getBean('game_Car', this.app, this.player, parseInt(carId), info);
            this.carDict[carId] = carObj;
            if (isUpdate) {
                this.updateCar();
                this.player.Event.emit(code.event.CAR_CHANGE.name, { [cId]: 1 });
            }
            carInfo = this.getInfo(carObj);
            if (isNotice) {
                this.channelNotify("onCarInfoNotify", { carList: [carInfo] });
            }
        }
    }
    else {
        logger.error("addNewCar error, carId not exists", cId);
    }

    return carInfo;
};
/**
 * 获取豪车数量
 */
CarComponent.prototype.getCarProtNum = function () {
    const carIdList = Object.keys(this.carDict || {});
    return carIdList.length;
};
/**
 * 获取豪车前三
 */
CarComponent.prototype.updateCarTopThree = function () {
    const old = this.player.carTopThree;
    const carList = Object.values(this.carDict);
    let topThree = [];
    if (old.length <= 0 && carList.length <= 0) {
        return;
    }
    if (carList.length > 0) {
        if (carList.length <= 3) {
            topThree = carList.map((o) => [o.getConfigId(), o.carPower]);
        }
        else {
            const sortList = carList.sort((a, b) => b.carPower - a.carPower);
            const mapList = sortList.map((o) => [o.getConfigId(), o.carPower]);
            const [one, two, three] = mapList;
            topThree = [one, two, three];
        }
    }
    this.player.carTopThree = topThree;
    this.player.Event.emit(code.event.CAR_TOP_THREE_UPDATE.name);
};

/******************************************************************
 * private function
 *****************************************************************/
/**
 * 获取合成所需豪车
 */
CarComponent.prototype.getCostInfo = function (composeCost) {
    const carCost = {};       //豪车消耗{cId:num,...}
    const otherCost = {};     //其他消耗{itemId:num,...}
    for (const [itemId, num] of Object.entries(composeCost)) {
        const itemConfig = this.app.Config.Item.get(itemId);
        if (itemConfig.Type == code.item.ITEM_TYPE.CAR) {
            carCost[itemConfig.RelevanceId] = num;
        }
        else {
            otherCost[itemId] = (otherCost[itemId] || 0) + num;
        }
    }
    return { carCost: carCost, otherCost: otherCost };
};
/**
 * 获取可合成豪车数量 包含预合成
 */
CarComponent.prototype.getCompoundCarNum = function (carCost, cIdNumDict, expectDict) {
    // 统计可消耗总数量
    const totalCostDict = {};
    for (const [cId, info] of Object.entries(cIdNumDict)) {
        totalCostDict[cId] = (totalCostDict[cId] || 0) + info.num;
    }
    for (const [cId, num] of Object.entries(expectDict)) {
        totalCostDict[cId] = (totalCostDict[cId] || 0) + num;
    }
    // 获取可合成最大数量
    let maxNum = -1;
    for (const [cId, needNum] of Object.entries(carCost)) {
        if (totalCostDict[cId]) {
            const num = Math.floor(totalCostDict[cId] / needNum);
            if (maxNum === -1 || num < maxNum) {
                maxNum = num;
            }
        }
    }
    return maxNum;
};
/**
 * 删除材料 先从预合成中扣除 再扣除已有的
 */
CarComponent.prototype.costCompoundCarNum = function (costInfo, maxNum, cIdNumDict, expectDict, expectCostList) {
    for (const [cId, num] of Object.entries(costInfo.carCost)) {
        let costNum = num * maxNum;
        // 优先扣除预合成
        if (expectDict[cId]) {
            if (expectDict[cId] >= costNum) {
                expectDict[cId] = expectDict[cId] - costNum;
                costNum = 0;
            }
            else {
                costNum = costNum - expectDict[cId];
                expectDict[cId] = 0;
            }
        }
        //再扣除自身拥有的
        if (cIdNumDict[cId] && costNum > 0) {
            cIdNumDict[cId].num = cIdNumDict[cId].num - costNum;
            // 统计扣除豪车数量
            expectCostList[cId] = (expectCostList[cId] || 0) + costNum;
        }
    }
};

/**
 * 判断豪车是否为初始值
 */
CarComponent.prototype.judgeCarIsInit = function (carObj) {
    // 未强化，未改装，未装备
    if (carObj.getLevel() <= 0 &&
        util.object.isNull(carObj.refitInfo) &&
        carObj.equipCardId <= 0) {
        return true;
    }
    else {
        return false;
    }
};
/**
 * 获取可消耗的豪车
 * @returns object {cId,{num:1,carIdList:[carId1,carId2]}},...} 
 */
CarComponent.prototype.getCostCar = function () {
    const cIdNumDict = {};
    for (const [carId, carObj] of Object.entries(this.carDict)) {
        if (this.judgeCarIsInit(carObj)) {
            const cId = carObj.getConfigId();
            if (!cIdNumDict[cId]) {
                cIdNumDict[cId] = { num: 0, carIdList: [] };
            }
            cIdNumDict[cId].num = (cIdNumDict[cId].num || 0) + 1;
            cIdNumDict[cId].carIdList.push(carId);
        }
    }
    return cIdNumDict;
};

// };
/**
 * 返回信息豪车信息
 */
CarComponent.prototype.getInfo = function (carObj) {
    const carData = carObj.getDBData();
    const info = {};
    info.carId = carObj.carId;
    info.cId = carData.cId;
    info.level = carData.level;
    info.refitList = [];
    for (const [part, refit] of Object.entries(carData.refit)) {
        const refitInfo = {};
        refitInfo.part = part;
        refitInfo.id = refit.id;
        refitInfo.index = refit.index;
        info.refitList.push(refitInfo);
    }
    info.cardId = carObj.equipCardId;
    info.power = carObj.carPower;
    return info;
};
/**
 * 返回豪车合成信息
 */
CarComponent.prototype.getComposeInfo = function (cIdToItemId, expectDict) {
    const composeList = [];
    for (const [cId, num] of Object.entries(expectDict)) {
        if (cIdToItemId[cId] && num > 0) {
            composeList.push({ itemID: cIdToItemId[cId], itemNum: String(num) });
        }
    }
    return composeList;
};
/**
 * 更新豪车数据
 */
CarComponent.prototype.updateCar = function (topThree = true) {
    if (this.carDict) {
        const carList = {};
        for (const carId of Object.keys(this.carDict)) {
            carList[carId] = this.carDict[carId].getDBData();
        }
        this.player.carInfo.carList = carList;

        if (topThree) {
            this.updateCarTopThree();
        }
    }
};
/**
 * 更新装备卡牌信息
 */
CarComponent.prototype.updateEquipCard = function (carId) {
    this.player.Event.emit(code.event.ATTRIBUTE_CHANGE.name);
    const carEquip = this.player.carInfo.carEquip || {};
    const cardId = carEquip[carId] || 0;
    if (cardId > 0) {
        this.player.Card.updatePower(cardId);
        this.player.Card.notifyChanges([cardId]);
    }
};
// /**
// * 通知客户端豪车信息
// */
// CarComponent.prototype.carInfoNotifyFromCarId = function (idList) {
//     let data = [];
//     for (const carId of Object.values(idList)) {
//         let carObj = this.carDict[carId];
//         if (carObj) {
//             let info = this.getInfo(carObj);
//             data.push(info);
//         }
//     }
//     this.carInfoNotify(data, []);
// };


/**
 * 通知客户端信息
 */
CarComponent.prototype.channelNotify = function (name, data) {
    this.app.get('channelService').pushMessageByUids(name, data,
        [{ uid: this.player.uid, sid: this.player.connectorId }]);
};
/**
 * 获取豪车配置编号对应物品id
 */
CarComponent.prototype.getCIdItemIdObj = function () {
    const cIdToItemId = {};
    for (const [itemId, config] of this.app.Config.Item.entries()) {
        if (config.Type == code.item.ITEM_TYPE.CAR) {
            cIdToItemId[config.RelevanceId] = itemId;
        }
    }
    return cIdToItemId;
};
/**
 * 获取豪车对应物品编号
 */
CarComponent.prototype.getItemIdToCId = function (cId) {
    const cIdToItemId = this.getCIdItemIdObj();
    return cIdToItemId[cId] || 0;
};
/**
 * 豪车配置格式转换为物品格式
 */
CarComponent.prototype.carToItem = function (cIdToItemId, carInfo) {
    const returnList = {};
    for (const [cId, num] of Object.entries(carInfo)) {
        if (cIdToItemId[cId] && num > 0) {
            returnList[cIdToItemId[cId]] = num;
        }
    }
    return returnList;
};
/**
 * 获取车位上限
 */
CarComponent.prototype.carPortMax = function () {
    const vip = this.player.vip || 0;
    const vipConfig = this.app.Config.Vip.get(vip);
    return vipConfig ? vipConfig.Carport || 0 : 0;
};