/**
 * @description 战斗技能表
 * @author jzy
 * @date 2020/03/31
 */

const logger = require('pomelo-logger').getLogger('pomelo', __filename);

const BaseConfig = require('../baseConfig');
const code = require('@code');
const utils = require('@util');

class Skill extends BaseConfig{
    constructor() {
        super();
        this.SkillCache = {};
    }

    reload(app, name) {
        super.reload(app, name);

        this.SkillCache = {};
        for (const skill of this.values()) {
            const typeClassify = this.SkillCache[skill.SkillId] || {};
            typeClassify[skill.Level] = skill;
            this.SkillCache[skill.SkillId] = typeClassify;
        }
    }

    getByLevel(skillId, level){
        if(Object.keys(this.SkillCache).indexOf(skillId.toString())<0){
            return null;
        }
        return this.SkillCache[skillId][level];
    }

    /**
     * 应用技能效果，（注：传入的selfList和otherList内的对象会被修改属性）
     * @param {Number} id ID
     * @param {Array} selfList [{id:xxx,hp:xxx,atk:xxx}...]  id：卡片id或模型id
     * @param {Array} otherList [{id:xxx,hp:xxx,atk:xxx}...]  id：卡片id或模型id
     * @returns {Object} self: 己方受到影响的列表，other: 对象受到影响的列表
     */
    applyEffect(id, selfList, otherList, selfID){
        const config = this.get(id);
        let isDeBuff = false;
        //不成功直接返回
        if(!config || !utils.random.randomBool(config.Probability/10000)){return;}
        //阵营匹配
        let effectList = [];
        switch(config.Camp){
        case code.skill.CAMP_TYPE.SELF:
            effectList = selfList;
            break;
        case code.skill.CAMP_TYPE.OTHER:
            isDeBuff = true;
            effectList = otherList;
            break;
        case code.skill.CAMP_TYPE.SELF_ONE:
            for(const item of selfList){
                if(item.id == selfID){
                    effectList = [item];
                    break;
                }
            }
            break;
        }
        //条件匹配
        let matchList = [];
        if(config.ConditionArr.indexOf(code.card.REQUIRE_TYPE.DEFAULT)>=0){
            //0表示匹配全部
            matchList = effectList;
        }else{
            //BOSS不会进入这一分支，除非配错
            for(const info of effectList){
                const condition = [];
                const cardCfg = this.app.Config.Card.get(info.id);
                if(cardCfg){
                    //性别
                    if(cardCfg.Sex == code.player.SexType.MALE){
                        condition.push(code.card.REQUIRE_TYPE.MALE);
                    }else if(cardCfg.Sex == code.player.SexType.FEMALE){
                        condition.push(code.card.REQUIRE_TYPE.FEMALE);
                    }
                    //默认主播类型和card表主播类型序号一致
                    condition.push(cardCfg.Career);
                }else{
                    logger.warn(`应用战斗技能效果，主播类型过滤，卡片ID[${info.id}]不存在`);
                }
                //根据指定条件判断要不要加入影响列表，并且关系
                let isCanAdd = true;
                for(const need of config.ConditionArr){
                    if(condition.indexOf(need)<0){
                        isCanAdd = false;
                        break;
                    }
                }
                if(isCanAdd){
                    matchList.push(info);
                }
            }
        }
        //随机抽取几个(如果为0则原封不动取全部)
        if(config.TargetNum!=0){
            matchList = utils.random.randomArrayElements(matchList,config.TargetNum);
        }
        

        //技能效果实现
        for(const effect of Object.keys(config.Effect)){
            this.applySkillEffectToArray(parseInt(effect),config.Effect[effect],matchList, isDeBuff);
        }

        //实际产生影响的列表id
        const changesSelf = [];
        const changesOther = [];
        for(const info of matchList){
            if(selfList.indexOf(info)>=0){
                changesSelf.push(info);
            }else if(otherList.indexOf(info)>=0){
                changesOther.push(info);
            }
        }

        return {self:changesSelf, other:changesOther};
    }


    /**
     * 具体效果应用
     * @param {Number} effectId 
     * @param {Number} rate 比率
     * @param {Array} matchList [{id:xxx,hp:xxx,atk:xxx}...]  id：卡片id或模型id
     */
    applySkillEffectToArray(effectId, rate, matchList, isDeBuff){
        switch(effectId){
        //提升魅力
        case code.skill.EFFECT_TYPE.CHARM:{
            for(const info of matchList){
                if(isDeBuff){
                    info.atk = Math.floor((10000-rate) * info.atk / 10000);
                }else{
                    info.atk = Math.floor((10000+rate) * info.atk / 10000);
                }
            }
            break;
        }
        }
    }

}

module.exports = Skill;