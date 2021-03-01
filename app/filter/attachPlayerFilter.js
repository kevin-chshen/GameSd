/**
 * @description 为游戏服的session附加玩家结构的过滤器
 * @author linjs
 * @date 2020/03/21
 */

module.exports = function(app) {
    return new AttachPlayerFilter(app);
};

const AttachPlayerFilter = function (app) {
    this.app = app;
};

//const fs = require('fs');
AttachPlayerFilter.prototype.before = function (msg, session, next) {
    // const res = {
    //     route: msg.__route__,
    //     body:{}
    // };
    // for (const [pro, val] of Object.entries(msg)) {
    //     if (pro != '__route__') {
    //         res.body[pro] = val;
    //     }
    // }
    // const str = JSON.stringify(res);
    // fs.appendFile('E:/zmxy/server/bearcat/action.json', `${str}\n`, _err => {
    //     //console.log(`______appendFile_____________`, err);
    // });
    if (session.uid) {
        const player = this.app.Player.getPlayerByUid(session.uid);
        if (player) {
            session.player = player;
            next();
        } else {
            // todo:发生致命错误时如何处理
            next(new Error(`player error session.uid:${session.uid}, msg route: ${msg.__route__}`));
        }
    } else {
        next();
    }
};