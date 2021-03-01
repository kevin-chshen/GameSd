/**
 * @description 联盟科技表管理器
 * @author chenyq
 * @date 2020/05/22
 **/
const BaseConfig = require('../baseConfig');

// const code = require('@code');

class LeagueSkill extends BaseConfig {
    constructor() {
        super();
    }

    reload(app, name) {
        super.reload(app, name);
        this.skillIdList = [];
        for (const info of this.values()) {
            if (!this.skillIdList.includes(info.SkillId)) {
                this.skillIdList.push(info.SkillId);
            }
        }
    }
    /**
     * 判断科技是否存在
     * @param {*} skillId 科技id
     */
    judgeSkillId(skillId) {
        if (this.skillIdList.includes(skillId)) {
            return true;
        }
        else {
            return false;
        }
    }
    /**
     * 获取科技配置id
     * @param {*} skillId 科技id
     * @param {*} lv 等级
     */
    getId(skillId, lv){
        return skillId * 100 + lv;
    }
    getConfig(skillId, lv){
        const id = this.getId(skillId, lv);
        return this.get(id);
    }
    /**
     * 获取科技效果
     * @param {*} skillId 科技id
     * @param {*} lv 等级
     */
    getSkillEffect(skillId, lv){
        const config = this.getConfig(skillId, lv);
        if(config){
            return config.Effect;
        }
        return {};
    }
}
module.exports = LeagueSkill;