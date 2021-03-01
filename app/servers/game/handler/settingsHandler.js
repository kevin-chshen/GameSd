/**
 * @description 设置
 * @author jzy
 * @date 2020/05/26
 */
const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const code = require('@code');
const utils = require('@util');

module.exports = function (app) {
    return new Handler(app);
};

const Handler = function (app) {
    this.app = app;
};

Handler.prototype.feedBack = async function (msg, session, next) {
    if (Object.values(code.settings.FEED_BACK_TYPE).indexOf(msg.type) < 0) {
        next(null, { code: code.err.ERR_SETTINGS_FEEDBACK_TYPE_WRONG });
        return;
    }
    const returnCode = await this.app.Settings.addFeedBackLog(session.uid, msg.type, msg.msg);
    next(null, { code: returnCode });
};

// Handler.prototype.getPostInfo = async function(msg, session, next){
//     const infoList = [];
//     // TODO
//     infoList.push({
//         title:"test1",
//         content:"这是一篇测试公告AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
//         isHot:0,
//     });
//     infoList.push({
//         title:"test2",
//         content:"这是一篇测试公告BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
//         isHot:1,
//     });
//     infoList.push({
//         title:"test3",
//         content:"这是一篇测试公告CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC",
//         isHot:1,
//     });
//     infoList.push({
//         title:"test4",
//         content:"这是一篇测试公告DDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
//         isHot:1,
//     });
//     infoList.push({
//         title:"test5",
//         content:"这是一篇测试公告EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE",
//         isHot:1,
//     });
//     infoList.push({
//         title:"test6",
//         content:"这是一篇测试公告FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
//         isHot:1,
//     });
//     next(null,{postInfoList:infoList});
// };

Handler.prototype.giftCode = async function(msg, session, next){
    const player = session.player;
    const giftCode = utils.encode.encodeRfc3986(msg.code.trim());

    // 检测
    const game = code.system.GAME_NAME;
    const version = code.system.VERSION;
    const time = utils.time.ms2s(Date.now());
    const acd = player.accountData;
    const ci = acd.clientInfo;
    const argCheck = {
        game: game,
        mainPlatform: code.system.AGENT_TYPE[acd.agentId],
        platform: acd.platform,
        device: ci.device,
        server: acd.serverId,
        role_id: player.uid,
        dim_level: player.lv,
        code: giftCode,
        time: time,
        version: version,
    };
    const retCheck = await this.app.rpcs.auth.cdkeyRemote.checkCode({}, argCheck);
    if (retCheck.err || !retCheck.res) {
        next(null, {code: code.err.FAILED });
        return;
    }
    const resCheck = retCheck.res;
    if (resCheck.code != code.err.SUCCEEDED) {
        next(null, { code: resCheck.code });
        return;
    }
    const cardId = resCheck.data.cardId;

    // 上传
    const argUpdate =  Object.assign(argCheck, {
        role_name: player.name,
        account_name: acd.account,
        cardId: cardId,
        log_time: utils.time.ms2s(Date.now()),
    });
    const retUpdate = await this.app.rpcs.auth.cdkeyRemote.updateCode({}, argUpdate);
    if (retUpdate.err || !retUpdate.res) {
        next(null, { code: code.err.FAILED });
        return;
    }
    const resUpdate = retUpdate.res;
    if (resUpdate.code != code.err.SUCCEEDED) {
        next(null, { code: resUpdate.code });
        return;
    }
    const res = resCheck.data;
    const reward = {};
    const moneyData = JSON.parse(res.moneyData);
    moneyData.map(obj =>{
        if (reward[obj.id]){
            reward[obj.id] += obj.nums;
        } else {
            reward[obj.id] = obj.nums;
        }
    });
    const propsData = JSON.parse(res.propsData);
    propsData.map(obj => {
        if (reward[obj.id]) {
            reward[obj.id] += obj.nums;
        } else {
            reward[obj.id] = obj.nums;
        }
    });
    const award = utils.proto.encodeConfigAward(reward);
    player.Item.addItem(award, code.reason.OP_CODE_CDK);
    logger.info(`setting handler cdk code player:${player.uid}, award:%j`, award);
    next(null, { code: code.err.SUCCEEDED, award: utils.proto.encodeAward(award)});
};