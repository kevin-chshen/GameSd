/**
 * @description 计时器配置
 * @author chshen
 * @date 2020/03/23
 */

const BaseConfig = require('../baseConfig');
const code = require('@code');

class Timer extends BaseConfig {
    constructor() {
        super();

        this.personTimerIds = [];
    }
    reload(app, name) {
        super.reload(app, name);

        this.personTimerIds = [];
        for (const data of this.values()) {
            if (data.UseType == code.global.TIMER_TYPE.PERSONAGE) {
                this.personTimerIds.push(data.Id);
            }
        }
    }

    /**
     * 个人类型的定时器ID列表
    */
    getPersonTimerIds(){
        return this.personTimerIds;
    }
}
module.exports = Timer;