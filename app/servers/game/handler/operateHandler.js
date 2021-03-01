/**
 * @description 运营基础活动模块
 * @author chshen
 * @date 2020/05/25
 */
const util = require('@util');
const code = require('@code');

module.exports = function (app) {
    return new Handler(app);
};

const Handler = function (app) {
    this.app = app;
};

// 查询在线的活动ID列表
Handler.prototype.query = async function (msg, session, next) {
    const activityList = [];
    const list = this.app.Operate.onlineActivityList();
    const {res,err} = await this.app.rpcs.global.operateRemote.onlineActivityList({});
    const objList = [list];
    if(!err){
        objList.push(res);
    }
    const finalObj = {};
    Object.assign(finalObj, ...objList);
    for (const [id, timer] of Object.entries(finalObj)) {
        activityList.push({
            id: Number(id),
            startMs: util.time.ms2s(timer.startMs),
            stopMs: util.time.ms2s(timer.stopMs),
        });
    }
    next(null, { infos: activityList });
};


/**
 * 查询首充信息
*/
Handler.prototype.queryFirst = function(msg, session, next) {
    const player = session.player;
    next(null, { isFirstPay: player.firstPay, hadFetch: player.hadFetchFirst });
};

/**
 * 领取首充奖励
*/
Handler.prototype.fetchFirstPay = function (msg, session, next) {
    const player = session.player;
    // 未首充
    if (player.firstPay == 0) {
        next(null, { code: code.err.ERR_FIRST_NOT_PAY });
        return;
    }
    if (player.hadFetchFirst == 1) {
        next(null, {code: code.err.ERR_FIRST_AWARD_HAD_FETCH });
        return;
    }
    const awardJson = this.app.Config.Global.get(11).GlobalJson;
    const reward = util.proto.encodeConfigAward(awardJson);
    player.hadFetchFirst = 1;
    player.Item.addItem(reward, code.reason.OP_OPERATE_FIRST_PAY_GET, ()=>{
        next(null, { code: code.err.SUCCEEDED, hadFetch: 1, award: util.proto.encodeAward(reward)});
    });
};
