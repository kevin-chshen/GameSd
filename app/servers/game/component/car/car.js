/**
 * @description 卡牌对象
 * @author chenyq
 * @data 2020/03/26
 */

const code = require('@code');
// let util = require('@util');

const CarObject = function (app, player, carId, dataInfo) {
    this.$id = 'game_Car';
    this.$scope = "prototype";
    this.app = app;
    this.player = player;
    this.carId = carId;
    this.dbData = dataInfo;
    this.carEquipCardId = 0;
    this.carPower = 0;
    this.calcAttr();

    this.defineProperty();
};
module.exports = CarObject;

/**
 * 豪车属性=豪车升级属性*（1+豪车改装百分比+改装大师百分比）
 */
CarObject.prototype.calcAttr = function () {
    // 等级属性
    this.attr = this.getLevelAttr();
    // 改装属性加成
    this.getRefitAttr();
    if (this.carEquipCardId > 0) {
        this.player.attributeMgr.updateAttr(this.carEquipCardId, code.attribute.ATTR_MODULE.CAR, this.attr);
    }
};
/**
 * 获取升级属性
 */
CarObject.prototype.getLevelAttr = function () {
    const upgradeAttr = {};
    const config = this.getCarConfig();
    if (config && config.Attribute) {
        for (const [type, val] of Object.entries(config.Attribute)) {
            const lv = this.dbData.level;
            if (type == code.attribute.ATTR_TYPE.POPULARITY) {
                // 豪车人气属性=豪车初始人气*（1+豪车等级）
                upgradeAttr[type] = Math.floor(val * (1 + lv));
            }
            else {
                // 豪车升级属性=豪车初始属性*(1+0.1*豪车等级)
                upgradeAttr[type] = Math.floor(val * (1 + 0.15 * lv));
            }
        }
    }
    this.upgradeAttr = upgradeAttr;
    return upgradeAttr;
};
/**
 * 获取改装属性
 */
CarObject.prototype.getRefitAttr = function () {
    this.refitAdd = 0;
    if (this.dbData.refit) {
        let isPerfect = 0;
        let isIndependent = 0;
        for (const info of Object.values(this.dbData.refit)) {
            const id = info.id;
            const index = info.index;
            const refitConfig = this.getCarRefitConfig(id);
            this.refitAdd = this.refitAdd + refitConfig.Percentage[index] || 0;
            if (parseInt(id) == code.car.CAR_REFIT_TYPE.PERFECT) {
                isPerfect = isPerfect + 1;
            }
            else if (parseInt(id) == code.car.CAR_REFIT_TYPE.INDEPENDENT) {
                isPerfect = isPerfect + 1;
                isIndependent = isIndependent + 1;
            }
        }
        // 大师加成
        if (isPerfect >= 4) {
            // 增加改装大师属性-完美
            const perfectConfig = this.getCarRefitConfig(code.car.CAR_REFIT_TYPE.PERFECT);
            if (perfectConfig) {
                this.refitAdd = this.refitAdd + perfectConfig.Compose;
            }
        }
        if (isIndependent >= 4) {
            // 增加改装大师属性-绝世
            const perfectConfig = this.getCarRefitConfig(code.car.CAR_REFIT_TYPE.INDEPENDENT);
            if (perfectConfig) {
                this.refitAdd = this.refitAdd + perfectConfig.Compose;
            }
        }
    }
    for (const type of Object.keys(this.attr)) {
        this.attr[type] = Math.floor(this.attr[type] * (1 + this.refitAdd / 10000));
    }
    // 豪车身价=（热度min+热度max）*（魅力min+魅力max）/5000
    const hpMin = this.attr[code.attribute.ATTR_TYPE.HP_MIN] || 0;
    const hpMax = this.attr[code.attribute.ATTR_TYPE.HP_MAX] || 0;
    const attackMin = this.attr[code.attribute.ATTR_TYPE.ATTACK_MIN] || 0;
    const attackMax = this.attr[code.attribute.ATTR_TYPE.ATTACK_MAX] || 0;
    this.power = Math.floor((hpMin + hpMax) * (attackMin + attackMax) / 5000);
};

// CarObject.prototype.getRefit = function () {
//     return this.dbData.refit || {};
// };
// /**
//  * 保存改装属性
//  */
// CarObject.prototype.setRefit = function (part, id, index) {
//     this.dbData.refit[part] = { id: id, index: index };
//     this.calcAttr();
// };
/**
 * 豪车重置
 */
CarObject.prototype.resetCar = function () {
    this.dbData.level = 0;
    this.dbData.refit = {};
    this.calcAttr();
};
/**
* 获取豪车基础数据
*/
CarObject.prototype.getDBData = function () {
    return this.dbData;
};
/**
 * 豪车配置编号
 */
CarObject.prototype.getConfigId = function () {
    return this.dbData.cId;
};
CarObject.prototype.getLevel = function () {
    return this.dbData.level;
};
CarObject.prototype.setLevel = function (level) {
    this.dbData.level = level;
    this.calcAttr();
};
/**
 * 属性定义
 */
CarObject.prototype.defineProperty = function () {
    // /**
    // * 获取豪车基础数据
    // */
    // Object.defineProperty(this, 'data', {
    //     get: function () { return this.dbData || {}; }
    // });
    // /**
    //  * 豪车配置编号
    //  */
    // Object.defineProperty(this, 'cId', {
    //     get: function () { return this.dbData.cId; }
    // });
    // /**
    //  * 豪车等级
    //  */
    // Object.defineProperty(this, 'lv', {
    //     get: function () { return this.dbData.level || 0; },
    //     set: function (level) {
    //         this.dbData.level = level;
    //         this.calcAttr();
    //     }
    // });
    /**
     * 豪车等级
     */
    Object.defineProperty(this, 'refitInfo', {
        get: function () { return this.dbData.refit || {}; },
        set: function ([part, id, index]) {
            this.dbData.refit[part] = { id: id, index: index };
            this.calcAttr();
        }
    });
    /**
     * 豪车装备在的卡牌编号
     */
    Object.defineProperty(this, 'equipCardId', {
        get: function () {
            return this.carEquipCardId;
        },
        set: function (cardId) {
            const oldCardId = this.carEquipCardId;
            this.carEquipCardId = cardId;
            // 通知卡牌属性处理
            if (cardId > 0) {
                //增加属性
                this.player.attributeMgr.addAttr(cardId, code.attribute.ATTR_MODULE.CAR, this.attr);
            }
            else {
                //扣除属性
                this.player.attributeMgr.deductAttr(oldCardId, code.attribute.ATTR_MODULE.CAR, this.attr);
            }
        }
    });
    /**
     * 卡牌战力
     */
    Object.defineProperty(this, 'carPower', {
        get: function () { return this.power; }
    });
};

/**
 * 获取豪车配置
 */
CarObject.prototype.getCarConfig = function () {
    return this.app.Config.Car.get(this.dbData.cId);
};
/**
 * 获取豪车升级配置
 */
CarObject.prototype.getCarUpgradeConfig = function (lv = this.dbData.level) {
    return this.app.Config.CarLevel.get(lv);
};
/**
 * 获取豪车改装配置
 */
CarObject.prototype.getCarRefitConfig = function (id) {
    return this.app.Config.CarRefit.get(id);
};

/**
 * 获取当前改装大师等级 完美/绝世
 */
CarObject.prototype.getRefitComposeLv = function () {
    if (this.dbData.refit) {
        let isPerfect = 0;
        let isIndependent = 0;
        for (const info of Object.values(this.dbData.refit)) {
            const id = info.id;
            if (parseInt(id) == code.car.CAR_REFIT_TYPE.PERFECT) {
                isPerfect = isPerfect + 1;
            }
            else if (parseInt(id) == code.car.CAR_REFIT_TYPE.INDEPENDENT) {
                isPerfect = isPerfect + 1;
                isIndependent = isIndependent + 1;
            }
        }
        if (isIndependent >= 4) {
            return code.car.CAR_REFIT_TYPE.INDEPENDENT;
        }
        else if (isPerfect >= 4) {
            return code.car.CAR_REFIT_TYPE.PERFECT;
        }
    }
    return 0;
};