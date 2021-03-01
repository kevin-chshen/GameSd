/**
 * @description 创建角色表管理器
 * @author chshen
 * @date 2020/03/23
 **/
const BaseConfig = require('../baseConfig');
const code = require('@code');

class ShopList extends BaseConfig {
    constructor() {
        super();

        this.mysteryList = [];
    }

    reload(app, name) {
        super.reload(app, name);

        this.mysteryList = [];
        for (const shop of this.values()) {
            if (shop.Type == code.shop.SHOP_TYPE.MYSTERY) {
                this.mysteryList.push(shop);
            }
        }
    }

    /**
     * 获取神秘商店列表
    */
    getMysteryList() {
        return this.mysteryList;
    }

    /**
     * 获取临时商店列表
    */
    getTemporaryList() {
        const shopList = [];
        for (const shop of this.values()) {
            if (shop.Type == code.shop.SHOP_TYPE.TEMPORARY) {
                shopList.push(shop);
            }
        }
        return shopList;
    }
}
module.exports = ShopList;