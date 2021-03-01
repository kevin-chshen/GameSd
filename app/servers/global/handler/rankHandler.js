/**
 * @description 排行榜
 * @author jzy
 * @date 2020/05/15
 */

const code = require('@code');

module.exports = function (app) {
    return new Handler(app);
};

const Handler = function (app) {
    this.app = app;
};

Handler.prototype.getRankInfo = async function(msg,session,next){
    let key;
    switch(msg.type){
    case code.rank.RANK_SECOND_TYPE.EARN:{
        key = code.rank.RANK_KEYS.EARN;
        break;
    }
    case code.rank.RANK_SECOND_TYPE.POWER:{
        key = code.rank.RANK_KEYS.POWER;
        break;
    }
    case code.rank.RANK_SECOND_TYPE.FLOWRATE:{
        // 流量为王
        const beginIndex = msg.page * code.rank.PAGE_OFFSET + 1;
        const endIndex = (msg.page + 1) * code.rank.PAGE_OFFSET;
        const info = await this.app.FlowRate.getFlowRateRankInfo(session.uid, beginIndex,endIndex);
        info.code = code.err.SUCCEEDED;
        info.type = msg.type;
        next(null, info);
        return;
    }
    case code.rank.RANK_SECOND_TYPE.CAR:{
        key = code.rank.RANK_KEYS.CAR;
        break;
    }
    default:{
        next(null, {code:code.err.ERR_CLIENT_PARAMS_WRONG});
        return;
    }
    }
    const info = await this.app.Rank.getRankList(session.uid, key, false, msg.page);
    if(info.code==code.err.SUCCEEDED){
        info.type = msg.type;
    }
    next(null, info);
};

Handler.prototype.getGuildRankInfo = async function(msg,session,next){
    let key;
    switch(msg.type){
    case code.rank.RANK_SECOND_TYPE_LEAGUE.EARN:{
        key = code.rank.RANK_KEYS.EARN;
        break;
    }
    case code.rank.RANK_SECOND_TYPE_LEAGUE.POWER:{
        key = code.rank.RANK_KEYS.POWER;
        break;
    }
    default:{
        next(null, {code:code.err.ERR_CLIENT_PARAMS_WRONG});
        return;
    }
    }
    const info = await this.app.Rank.getRankList(session.uid, key, true, msg.page);
    if(info.code==code.err.SUCCEEDED){
        info.type = msg.type;
    }
    next(null, info);
};

Handler.prototype.getTopCarInfo = async function(msg,session,next){
    const brief = await this.app.Brief.getBrief(Number(msg.uid));
    const list = [];
    for(const rank in brief.carTopThree){
        list.push({
            rank:Number(rank) + 1,
            id:Number(brief.carTopThree[rank][0]),
            power:brief.carTopThree[rank][1].toString(),
        });
    }
    next(null,{info:list});
};