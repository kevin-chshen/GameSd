/**
 * @description 投资消息
 * @author jzy
 * @date 2020/04/24
 */

const code = require("@code");

module.exports = function (app) {
    return new Handler(app);
};

const Handler = function (app) {
    this.app = app;
};

Handler.prototype.inviteInvest = async function (msg, session, next){
    const result = await this.app.Invest.invite(session.uid, msg.id, msg.tag, msg.targetUID);
    if(result.code==code.err.SUCCEEDED){
        const data = await this.app.Invest.query(msg.id);
        const value = data.dbValue();
        const tags = [];
        if(value.globalFlag){
            tags.push(code.invest.INVEST_TYPE.GLOBAL);
        }
        if(value.guildId && value.guildId!=0){
            tags.push(code.invest.INVEST_TYPE.GUILD);
        }
        result.tag = tags;
        result.id = msg.id;
    }
    next(null,result);
};

Handler.prototype.getCooperateProjectInfo = async function (msg, session, next){
    next(null, await this.app.Invest.getCooperateProjectInfo(session.uid, msg.id));
};