/**
 * @description 运营活动
 * @author chshen
 * @date 2020/05/25
 */
const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const BaseConfig = require('../baseConfig');

class ClientVersion extends BaseConfig {
    constructor() {
        super();

        this.version = null;
    }

    reload(app, name) {
        super.reload(app, name);

        this.version = [];
        for (const [k, v] of this.entries()) {
            logger.warn(`ClientVersion _version  reload `, k, v);
            this.version = v;
        }
    }


    /**
     * 取运营活动ID,列表
    */
    getVersion() {
        return this.version;
    }
}
module.exports = ClientVersion;