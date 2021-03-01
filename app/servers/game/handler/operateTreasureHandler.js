const code = require('@code');
const logger = require('pomelo-logger').getLogger('pomelo', __filename);

module.exports = function (app) {
    return new Handler(app);
};

const Handler = function (app) {
    this.app = app;
};

/**
 * 查询
*/
Handler.prototype.query = async function (msg, session, next) {
    const player = session.player;
    const actId = msg.actId;

    const op = player.Operate.get(actId);
    if (!op) {
        next(null, { code: code.err.ERR_OPERATE_NOT_OPEN });
        return;
    }
    const data = op.getData();
    const {err, res} = await this.app.Redis.get(code.redis.DIAMOND_POOL.name);
    if(err){
        logger.error(`查询钻石奖池错误  ${JSON.stringify(err)}`);
        next(null, { code: code.err.FAILED });
        return;
    }

    next(null, { 
        code: code.err.SUCCEEDED, 
        actId: actId, 
        freeDrawTimes: data.freeDrawTimes || 0, 
        totalDrawTimes: data.totalDrawTimes || 0, 
        hasReceive: data.hasReceive, 
        diamondPool: res || 0,
        record: await op.getRewardRecord(),
    });
};

Handler.prototype.draw = async function (msg, session, next) {
    const player = session.player;
    const actId = msg.actId;
    // 活动开启
    if (!this.app.Operate.actIdOnline(actId)) {
        next(null, { code: code.err.ERR_OPERATE_NOT_OPEN });
        return;
    }

    const op = player.Operate.get(actId);
    const resultReturn = await op.draw(msg.drawType, (result)=>{
        result.actId = actId;
        next(null, result);
    });
    if(resultReturn){
        next(null, resultReturn);
    }
};

Handler.prototype.receive = async function (msg, session, next) {
    const player = session.player;
    const actId = msg.actId;
    // 活动开启
    if (!this.app.Operate.actIdOnline(actId)) {
        next(null, { code: code.err.ERR_OPERATE_NOT_OPEN });
        return;
    }

    const op = player.Operate.get(actId);
    const resultReturn = await op.receive(msg.index, (result)=>{
        result.actId = actId;
        next(null, result);
    });
    if(resultReturn){
        next(null, resultReturn);
    }
};

Handler.prototype.buyDrawItem = async function (msg, session, next) {
    const player = session.player;
    const actId = msg.actId;
    // 活动开启
    if (!this.app.Operate.actIdOnline(actId)) {
        next(null, { code: code.err.ERR_OPERATE_NOT_OPEN });
        return;
    }

    const op = player.Operate.get(actId);
    const result = await op.buyDrawItem(msg.num);
    result.actId = actId;
    next(null, result);
};


Handler.prototype.queryDiamondPool = async function (msg, session, next) {
    const {err, res} = await this.app.Redis.get(code.redis.DIAMOND_POOL.name);
    if(err){
        logger.error(`查询钻石奖池错误  ${JSON.stringify(err)}`);
        next(null, { code: code.err.FAILED });
        return;
    }

    next(null, { 
        code: code.err.SUCCEEDED, 
        diamondPool: res || 0,
    });
};