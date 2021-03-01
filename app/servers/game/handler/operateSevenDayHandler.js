/**
 * @description 七日奖励
 * @author jzy
 * @date 2020/06/08
 */

// const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const code = require('@code');

module.exports = function (app) {
    return new Handler(app);
};

const Handler = function (app) {
    this.app = app;
};

/**
 * 查询
*/
Handler.prototype.query = function (msg, session, next) {
    const player = session.player;
    const actId = msg.actId;

    const op = player.Operate.get(actId);
    if (!op) {
        next(null, { code: code.err.ERR_OPERATE_NOT_OPEN });
        return;
    }
    const data = op.getData();

    next(null, { 
        code: code.err.SUCCEEDED, 
        actId: actId, 
        hasReceive: data.hasReceive,
    });
};

Handler.prototype.signIn = function (msg, session, next) {
    const player = session.player;
    const actId = msg.actId;
    // 活动开启
    if (!this.app.Operate.actIdOnline(actId)) {
        next(null, { code: code.err.ERR_OPERATE_NOT_OPEN });
        return;
    }

    const op = player.Operate.get(actId);
    const resultReturn = op.signIn(msg.day, (result)=>{
        result.actId = actId;
        next(null, result);
    });
    if(resultReturn){
        next(null, resultReturn);
    }
};