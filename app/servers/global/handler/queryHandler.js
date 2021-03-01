/**
 * @description 查询消息
 * @author jzy
 * @date 2020/04/23
 */

const code = require("@code");
const utils = require("@util");
const logger = require('pomelo-logger').getLogger('pomelo', __filename);

module.exports = function (app) {
    return new Handler(app);
};

const Handler = function (app) {
    this.app = app;
};

/**
 * 查询玩家信息
 */
Handler.prototype.queryPlayerInfo = async function(msg,session,next){
    const targetUID = parseInt(msg.uid);
    const brief = await this.app.Brief.getBrief(targetUID);
    if(!brief){
        next(null,{code:code.err.ERR_FRIEND_PLAYER_NOT_EXIST});
        return;
    }
    const result = await this.app.Redis.hget(code.redis.ROLE_ON_CONNECTOR.name, targetUID);
    if(result.err){
        logger.error(result.err);
        next(null,{code:code.err.FAILED});
        return;
    }
    const isOnline = result.res?true:false;
    next(null,{code:code.err.SUCCEEDED, info:{
        uid:targetUID.toString(),
        lv:parseInt(brief.lv),
        sex:parseInt(brief.sex),
        vip:parseInt(brief.vip),
        name:brief.name,
        manifesto:brief.manifesto,
        power:parseInt(brief.power),
        guild:await this.app.Guild.getGuildName(targetUID),
        lastOnlineTime:isOnline?0:utils.time.ms2s(Number(brief.lastLogoutTime)),
        skin:parseInt(brief.headImageId),
    }});
};