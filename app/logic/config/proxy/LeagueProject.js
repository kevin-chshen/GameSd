/**
 * @description 联盟全球项目管理器
 * @author chenyq
 * @date 2020/05/27
 **/
const BaseConfig = require('../baseConfig');

const code = require('@code');

class LeagueProject extends BaseConfig {
    constructor() {
        super();
    }

    reload(app, name) {
        super.reload(app, name);
    }
    /**
     * 获取捐献相关配置
     * @param {*} id 项目id
     * @param {*} type 捐献类型
     * @returns {Object} info{cost:{},add:0,limit:0,reward:{},luckReward:{}}
     */
    getDonationConfig(id, type) {
        const config = this.get(id);
        if (config) {
            const info = {};
            if (type == code.guildProject.PROJECT_DONATION_TYPE.CASH) {
                info.add = config.DonateValue[0];
                info.limit = config.LimitTimes[0];
                info.reward = config.DonateEveryReward[0];
            }
            else if (type == code.guildProject.PROJECT_DONATION_TYPE.DIAMOND) {
                info.cost = config.Cost;
                info.add = config.DonateValue[1];
                info.limit = config.LimitTimes[1];
                info.reward = config.DonateEveryReward[1];
            }
            info.luckyReward = config.DonateLuckyReward;
            return info;
        }
        return undefined;
    }
    getBossInfo(id, curHp) {
        const config = this.get(id);
        if (!config) {
            return { enemyInfo: { uid: 0, name: "", head: 0, power: 0 }, enemyArray: [] };
        }
        const enemyArray = [];
        const totalPower = 0;
        const modelID = config.ModelId;
        const modelConfig = this.app.Config.Model.get(modelID);
        enemyArray.push({
            id: modelID,
            hp: curHp,
            atk: config.BossAttack,
            skill: modelConfig.Skill,
        });
        const baseEnemyArray = [];
        baseEnemyArray.push({
            id: modelID,
            hp: config.BossHp,
            atk: config.BossAttack,
            skill: modelConfig.Skill,
        });
        let name = '';
        let head = 10001;
        if (modelConfig) {
            name = modelConfig.Name;
            head = modelConfig.HeadRes;
        }
        return { enemyInfo: { uid: modelID, name: name, head: head, lv: 100, power: totalPower, vip: 0 }, enemyArray: enemyArray, baseEnemyArray: baseEnemyArray };
    }
    getRankRewardIndex(id, rank) {
        const config = this.get(id);
        if (config) {
            for (const [index, rankRange] of Object.entries(config.RankInterval)) {
                if (rankRange.length >= 2 && rank >= rankRange[0] && rank <= rankRange[1]) {
                    return index;
                }
            }
        }
        return 0;
    }
}
module.exports = LeagueProject;