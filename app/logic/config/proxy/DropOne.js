/**
 * @description 掉落表
 * @author linjs
 * @date 2020/04/26
 */

const BaseConfig = require('../baseConfig');
const code = require('@code');
const util = require('@util');

class DropOne extends BaseConfig {
    constructor () {
        super();
        this.needRecordTimes = {};      // 是否需要记录次数 { id => boolean }
        this.relatedSignedAll = {};
        this.relatedSignedByType = {};    // 掉落下标 类型=>{id => [下标集合]}
    }

    reload(app, name) {
        super.reload(app, name);

        this.needRecordTimes = {};
        this.relatedSignedAll = {};
        this.relatedSignedByType = {};
        // 所有标记缓存
        const dropTwo = app.Config.DropTwo;
        const dropSign = app.Config.DropSign;
        for (const type of Object.values(code.drop.SIGN_TYPE)) {
            this.relatedSignedByType[type] = {};
        }
        for (const {Id, IdTwo, GivenDropId} of this.values()) {
            // 所有有次数的dropId数组
            this.needRecordTimes[Id] = !util.object.isNull(GivenDropId);
            // 分析关联哪些标记
            const idList = [...IdTwo];
            const allContain = this.relatedSignedAll[Id] || [];
            Object.values(GivenDropId).map( specId => idList.push(specId));
            idList.map( (dropTwoId) => {
                const signIdList = dropTwo.get(dropTwoId).SignId;
                signIdList.map( signId => {
                    const signConfig = dropSign.get(signId);
                    // 根据类型放到关联的库中
                    const typeContain = this.relatedSignedByType[signConfig.SignType][Id] || [];
                    if (!allContain.includes(signId)) {
                        allContain.push(signId);
                    }
                    if (!typeContain.includes(signId)) {
                        typeContain.push(signId);
                        this.relatedSignedByType[signConfig.SignType][Id] = typeContain;
                    }
                });
            });
            if (allContain.length > 0) {
                this.relatedSignedAll[Id] = allContain;
            }
        }
    }

    /**
     * 需要记录次数的所有id
     */
    getNeedRecordTimes() {
        return Object.entries(this.needRecordTimes).reduce( (total, [id, isNeed]) => {
            if (isNeed) {
                return total.concat(id);
            } else {
                return total;
            }
        }, []);
    }

    /**
     * 某个掉落id是否需要记录次数
     * @param {Integer} id id
     */
    isNeedRecordTimes(id) {
        return this.needRecordTimes[id];
    }

    /**
     * 掉落id关联的所有掉落下标编号,没有返回空
     * @param {Integer} id 掉落id
     */
    getRelatedSign(id) {
        return this.relatedSignedAll[id];
    }

    /**
     * 掉落id关联的个人掉落下标编号,没有返回空
     * @param {Integer} id 掉落id
     */
    getRelatedPersonSign(id) {
        return this.relatedSignedByType[code.drop.SIGN_TYPE.PERSON][id];
    }

    /**
     * 掉落id关联的服务器掉落下标编号,没有返回空
     * @param {Integer} id 掉落id
     */
    getRelatedServerSign(id) {
        return this.relatedSignedByType[code.drop.SIGN_TYPE.SERVER][id];
    }
}

module.exports = DropOne;
