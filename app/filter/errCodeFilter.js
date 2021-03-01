/**
 * @description 解析返回协议的错误代码
 * @author jzy
 * @date 2020/04/03
 */

const logger = require('pomelo-logger').getLogger('pomelo', __filename);

module.exports = function(app) {
    return new Filter(app);
};

const Filter = function (app) {
    this.app = app;
};

Filter.prototype.after = function (err, msg, session, resp, next){
    if(resp && resp.code && resp.code != 200){
        if(!this.app.Config || !this.app.Config.ErrorCode){
            logger.warn(`未拥有ErrorCode配置表，无法检测协议ErrorCode [${resp.code}]`);
            next(err);
            return;
        }
        const codeCfg = this.app.Config.ErrorCode.get(resp.code);
        if(!codeCfg){
            logger.warn(`无法识别协议ErrorCode [${resp.code}]`);
            next(err);
            return;
        }
        const player = session.player;
        if (player){
            logger.warn(`\n\t产生协议ErrorCode [${codeCfg.Code}], 枚举：${codeCfg.Enum}, 信息：${codeCfg.Message}, 路由：${msg.__route__}, player:${player.uid}`);
        } else {
            logger.warn(`\n\t产生协议ErrorCode [${codeCfg.Code}], 枚举：${codeCfg.Enum}, 信息：${codeCfg.Message}, 路由：${msg.__route__}`);
        }
    }
    next(err);
};