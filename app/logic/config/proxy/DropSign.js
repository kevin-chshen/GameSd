/**
 * @description 掉落下标
 * @author linjs
 * @date 2020/05/07
 */

const BaseConfig = require('../baseConfig');
const code = require('@code');

class DropSign extends BaseConfig {
    constructor () {
        super();

        this.timerIdVec = {};
        this.timerIdToSignId = {};
    }

    reload(app, name) {
        super.reload(app, name);

        this.timerIdVec = {};
        this.timerIdToSignId = {};
        for (const type of Object.values(code.drop.SIGN_TYPE)) {
            this.timerIdVec[type] = [];
            this.timerIdToSignId[type] = {};
        }

        // 分析所有的计时器
        for (const {Id, TimerId, SignType} of this.values()) {
            TimerId.map( (timerId) => {
                if (!this.timerIdVec[SignType].includes(timerId)) {
                    this.timerIdVec[SignType].push(timerId);
                }

                const signIdVec = this.timerIdToSignId[SignType][TimerId] || [];
                signIdVec.push(Id);
                this.timerIdToSignId[SignType][TimerId] = signIdVec;
            });
        }
    }

    /**
     * 获取下标类型关联的所有timerId
     * @param {Integer} signType 下标类型
     */
    getTimerId(signType) {
        return this.timerIdVec[signType];
    }

    /**
     * 获取计时器对应的下标id
     * @param {Integer} signType 下标类型
     * @param {Integer} timerId 计时器id
     */
    getTimerIdToSignId(signType, timerId) {
        return this.timerIdToSignId[signType][timerId];
    }
}

module.exports = DropSign;
