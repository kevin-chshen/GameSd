/**
 * @description 全局表管理器
 * @author chenyq
 * @date 2020/04/28
 **/
const BaseConfig = require('../baseConfig');

class Global extends BaseConfig {
    constructor() {
        super();
    }

    getGlobalFloat(id, isFloor = false) {
        const config = this.get(id);
        if (config) {
            return isFloor ? Math.floor(config.GlobalFloat) : config.GlobalFloat;
        }
        return 0;
    }

    getGlobalArray(id) {
        const config = this.get(id);
        if (config) {
            return config.GlobalArray;
        }
        return [];
    }

    getGlobalJson(id) {
        const config = this.get(id);
        if (config) {
            return config.GlobalJson;
        }
        return {};
    }

}
module.exports = Global;