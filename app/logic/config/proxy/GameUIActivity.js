/**
 * @description 系统开放配置表
 * @author chshen
 * @date 2020/03/31
 */
const BaseConfig = require('../baseConfig');

class GameUIActivity extends BaseConfig {

    constructor(){
        super();
        // 解锁类型激活列表
        this.openList = {};
    }

    reload(app, name) {
        super.reload(app, name);

        this.openList = {};
        for (const cfg of this.values()) {        
            if (!this.openList[cfg.UnlockType]) {
                this.openList[cfg.UnlockType] = [];
            }
            this.openList[cfg.UnlockType].push(cfg);
        }
    }

    /**
     * 获取类型对应的开启列表
    */
    getOpenListByType(type) {
        return this.openList[type] || [];
    }
}

module.exports = GameUIActivity;