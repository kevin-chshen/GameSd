/**
 * @description 充值
 * @author chshen
 * @date 2020/05/09
 */

const BaseConfig = require('../baseConfig');

class Pay extends BaseConfig {
    constructor() {
        super();
    }

    reload(app, name) {
        super.reload(app, name);
    }
}
module.exports = Pay;