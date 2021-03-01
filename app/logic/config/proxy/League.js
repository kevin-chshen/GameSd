/* eslint-disable indent */
/**
 * @description 联盟表管理器
 * @author chenyq
 * @date 2020/05/19
 **/
const BaseConfig = require('../baseConfig');

const code = require('@code');

class League extends BaseConfig {
    constructor() {
        super();
    }

    reload(app, name) {
        super.reload(app, name);
    }
    jobName(job){
        const config = this.get(job);
        if(config){
            return config.Name;
        }
        return '';
    }
    /**
     * 职位操作权限
     * @param {*} type 操作
     * @param {*} job 职位
     */
    jobOperate(type, job) {
        let isTrue = false;
        const config = this.get(job);
        if (config) {
            switch (type) {
                case code.guild.GUILD_JOB_OPERATE.ICON:
                    isTrue = config.OperateIcon;
                    break;
                case code.guild.GUILD_JOB_OPERATE.DISSOLVE:
                    isTrue = config.OperateDissolve;
                    break;
                case code.guild.GUILD_JOB_OPERATE.KICK_OUT:
                    isTrue = config.OperateKickOut;
                    break;
                case code.guild.GUILD_JOB_OPERATE.APPLY:
                    isTrue = config.ApplyList;
                    break;
                case code.guild.GUILD_JOB_OPERATE.MODIFY:
                    isTrue = config.ModifyInfo;
                    break;
                case code.guild.GUILD_JOB_OPERATE.JOB_CHANGE:
                    isTrue = config.PositionChange;
                    break;
                case code.guild.GUILD_JOB_OPERATE.NOTICE:
                    isTrue = config.OperateNotice;
                    break;
                case code.guild.GUILD_JOB_OPERATE.MANIFESTO:
                    isTrue = config.OperateDeclare;
                    break;
                case code.guild.GUILD_JOB_OPERATE.RENAME:
                    isTrue = config.OperateRename;
                    break;
                case code.guild.GUILD_JOB_OPERATE.PROJECT_OPEN:
                    isTrue = config.OperateProjectOpen;
                    break;
                case code.guild.GUILD_JOB_OPERATE.PROJECT_KICK_OUT:
                    isTrue = config.OperateProjectKickOut;
                    break;
            }
        }
        return isTrue || false;
    }
}
module.exports = League;