/**
 * @description global解析返回协议的错误代码
 * @author chenyq
 * @date 2020/07/09
 */

const logger = require('pomelo-logger').getLogger('pomelo', __filename);

module.exports = function (app) {
    return new GlobalAfterFilter(app);
};

const GlobalAfterFilter = function (app) {
    this.app = app;
};

const fs = require('fs');
GlobalAfterFilter.prototype.after = function (err, msg, session, resp, next) {
    // const res = {
    //     route: msg.__route__,
    //     body: {}
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
    // 路由解锁
    if (err != 'lock') {
        this.app.Lock.unLock(msg.__route__, session);
    }
    else {
        logger.warn(`请求太频繁！！！ route [${msg.__route__}], uid [${resp.uid}]`);
        next(null);
        return;
    }
    if (resp && resp.code && resp.code != 200) {
        if (!this.app.Config || !this.app.Config.ErrorCode) {
            logger.warn(`未拥有ErrorCode配置表，无法检测协议ErrorCode [${resp.code}]`);
            next(err);
            return;
        }
        const codeCfg = this.app.Config.ErrorCode.get(resp.code);
        if (!codeCfg) {
            logger.warn(`无法识别协议ErrorCode [${resp.code}]`);
            next(err);
            return;
        }
        logger.warn(`\n\t产生协议ErrorCode [${codeCfg.Code}], 枚举：${codeCfg.Enum}, 信息：${codeCfg.Message}, 路由：${msg.__route__}`);

    }
    next(err);
};