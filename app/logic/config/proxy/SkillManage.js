/**
 * @description 创建角色表管理器
 * @author chshen
 * @date 2020/03/23
 **/
const BaseConfig = require('../baseConfig');

class SkillManage extends BaseConfig {
    constructor() {
        super();
    }

    getEffects(skillId, star, platformId) {
        // 星级默认从0开始所以这里默认+1
        const id = skillId * 100 + star + 1;
        const skill = this.get(id);
        if (skill){
            if (skill.ConditionArr && skill.EffectArr) {
                let effect = 0;
                for (let index = 0, len = skill.ConditionArr.length; index < len; ++index) {
                    const type = skill.ConditionArr[index];
                    // 0表示所有平台
                    if (type == 0 || platformId == type) {
                        effect += skill.EffectArr[index] || 0;
                    }
                }
                return effect;
            }
        }
        return 0;
    }
}
module.exports = SkillManage;