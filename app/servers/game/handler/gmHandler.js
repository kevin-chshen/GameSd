/**
 * @description gm消息消息模块
 * @author jzy
 * @date 2020/03/26
 */
const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const code = require('@code');
const util = require('@util');
const bearcat = require('bearcat');

module.exports = function (app) {
    return new Handler(app);
};

const Handler = function (app) {
    this.app = app;
};

Handler.prototype.executeCommand = async function (msg, session, next) {
    const player = session.player;
    if (!player) { next(null); return; }

    if (this.app.get('env') == 'production') {
        logger.warn(`gm Handler executeCommand ${player.uid}`);
        next(null, { code: code.err.FAILED });
        return;
    }
    //字符串命令名
    const cmd = this.app.Gm[msg.cmd];
    //字符串组命令参数
    const param = msg.param;
    if (!cmd) {
        next(null, { code: code.err.ERR_COMMAND_NOT_EXIST });
        return;
    }
    const result = await this.app.Gm[msg.cmd](player, param);
    if (result) {
        if (util.str.isString(result)) {
            next(null, { code: code.err.SUCCEEDED, tip: result});
        } else if (result.code) {
            next(null, { code: result.code });
        } else {
            next(null, { code: code.err.SUCCEEDED });
        }
        return;
    }

    next(null, { code: code.err.SUCCEEDED });
};

Handler.prototype.getCommand = function (msg, session, next) {
    const allCmd = Object.keys(this.app.Gm.__proto__);
    const baseService = bearcat.getBean('logic_BaseService');
    const baseCmd = Object.keys(baseService.__proto__);
    next(null, { cmdList: Array.from(util.set.difference(allCmd, baseCmd)) });
};