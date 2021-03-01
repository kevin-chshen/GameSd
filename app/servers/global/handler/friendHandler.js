/**
 * @description 好友消息
 * @author jzy
 * @date 2020/04/16
 */

// const logger = require('pomelo-logger').getLogger('pomelo', __filename);
// const code = require('@code');
// const util = require('@util');

module.exports = function (app) {
    return new Handler(app);
};

const Handler = function (app) {
    this.app = app;
};

Handler.prototype.getFriendList = async function (msg, session, next){
    next(null, {
        friendList:await this.app.Friend.getFriendList(session.uid),
        applyList:await this.app.Friend.getApplyList(session.uid),
        blackList:await this.app.Friend.getBlackList(session.uid),
    });
};

Handler.prototype.applyFriend = async function (msg, session, next){
    next(null, await this.app.Friend.apply(session.uid, msg.uid));
};

Handler.prototype.acceptApplyFriend = async function (msg, session, next){
    next(null, await this.app.Friend.acceptApply(session.uid, msg.uid));
};

Handler.prototype.denyApplyFriend = async function (msg, session, next){
    next(null, await this.app.Friend.denyApply(session.uid, msg.uid));
};

Handler.prototype.deleteFriend = async function (msg, session, next){
    next(null, await this.app.Friend.deleteFriend(session.uid, msg.uid));
};

Handler.prototype.block = async function (msg, session, next){
    const result = await this.app.Friend.blockFriend(session.uid, [msg.uid]);
    if(Array.isArray(result.newBlockInfo)){
        result.newBlockInfo = result.newBlockInfo[0];
    }
    next(null, result);
};

Handler.prototype.unBlock = async function (msg, session, next){
    const result = await this.app.Friend.unBlockFriend(session.uid, [msg.uid]);
    if(Array.isArray(result.uid)){
        result.uid = result.uid[0];
    }
    next(null, result);
};

Handler.prototype.searchFriend = async function (msg, session, next){
    next(null, await this.app.Friend.searchFriend(session.uid, msg.word));
};

Handler.prototype.recommendFriend = async function (msg, session, next){
    next(null, await this.app.Friend.recommendFriend(session.uid));
};