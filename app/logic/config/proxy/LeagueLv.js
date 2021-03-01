/**
 * @description 联盟等级表管理器
 * @author chenyq
 * @date 2020/05/19
 **/
const BaseConfig = require('../baseConfig');

const code = require('@code');

class LeagueLv extends BaseConfig {
    constructor() {
        super();
    }

    reload(app, name) {
        super.reload(app, name);
    }
    /**
     * 获取职位人数上限
     * @param {*} lv 公会等级
     * @param {*} job 职位
     */
    jobNum(lv, job) {
        let num = 0;
        const config = this.get(lv);
        if (config) {
            switch (job) {
            case code.guild.GUILD_JOB.CHAMPIONS:
                num = 1;
                break;
            case code.guild.GUILD_JOB.DEPUTY_CHAMPIONS:
                num = config.DeputyLeaderLimit;
                break;
            case code.guild.GUILD_JOB.ELITE:
                num = config.EliteLimit;
                break;
            case code.guild.GUILD_JOB.MEMBER:
                num = config.MemberUpperLimit - 1;
                break;
            }
        }
        return num;
    }
    /**
     * 获取徽章所需联盟等级
     * @param {String} icon 
     */
    iconNeedLv(icon){
        let lv = 1;
        if(icon && icon.length > 0){
            for (const config of this.values()) {
                if(config.UnlockIcon.includes(icon)){
                    lv = config.Id;
                    break;
                }
            }
        }
        return lv;
    }
}
module.exports = LeagueLv;