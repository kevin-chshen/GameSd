/**
 * @description 兑换码服务
 * @author chshen
 * @date 2020/06/01
 */

const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const md5 = require('md5');
const code = require('@code');
const axios = require('axios');
const util = require('@util');
const { encode } = require('@util');

module.exports = function (app) {
    return new Remote(app);
};

const Remote = function (app) {
    this.app = app;

    // 限制频繁提交兑换码
    this.cdKey_cd = 0;
};

/**
 * 检测兑换码
*/
Remote.prototype.checkCode = async function(arg, cb) {
    const nowMs = Date.now();
    // 限制1秒请求一次
    if (nowMs - this.cdKey_cd < 1000) {
        cb(null, { code: code.err.ERR_CDKEY_PARTY_CDKEY_CD });
        return;
    }
    this.cdKey_cd = nowMs;
    const arr = ['code', arg.code, 'device', arg.device, 'dim_level', arg.dim_level, 
        'game', arg.game, 'mainPlatform', arg.mainPlatform, 'platform', arg.platform,
        'role_id', arg.role_id, 'server', arg.server, 'time', arg.time, 'version', arg.version];
    const key = code.system.CDKEY_KEY;
    const keyCode = util.encode.encodeRfc3986(arr.join('')) + key;
    const flag = md5(keyCode).toUpperCase();
    const reqUrl = `${code.system.CDKEY_CHECK_CODE_URL}&game=${arg.game}&platform=${arg.platform}&mainPlatform=${arg.mainPlatform}&device=${arg.device}&server=${arg.server}&role_id=${arg.role_id}&dim_level=${arg.dim_level}&code=${arg.code}&time=${arg.time}&version=${arg.version}&flag=${flag}`;
    await axios.request({
        url: reqUrl,
        method: 'get',
        headers: {
            'Content-type': 'application/json;charset=UTF-8'
        }
    }).then(rep => {
        const JsonData = rep.data;
        logger.info(`cdkKeyRemote checkCode data:%j`, JsonData);
        switch (JsonData.ret) {
        case 0:
            cb(null, { code: code.err.SUCCEEDED, data: JsonData.data });
            break;
        case -1:
            cb(null, { code: code.err.ERR_CDKEY_PARAMETERS_INCOMPLETE });
            break;
        case -2:
            cb(null, { code: code.err.ERR_CDKEY_SIGNATURE_ERROR });
            break;
        case -3:
            cb(null, { code: code.err.ERR_CDKEY_CODE_NOT_EXIST });
            break;
        case -4:
            cb(null, { code: code.err.ERR_CDKEY_CODE_HAS_BEEN_ACTIVATED });
            break;
        case -5:
            cb(null, { code: code.err.ERR_CDKEY_THE_SAME_PACKAGE_HAS_EXCEEDED_LIMIT });
            break;
        case -6:
            cb(null, { code: code.err.ERR_CDKEY_UNKNOWN_ERROR });
            break;
        case -7:
            cb(null, { code: code.err.ERR_CDKEY_PACKAGE_EMPTY });
            break;
        case -8:
            cb(null, { code: code.err.ERR_CDKEY_CODE_HAS_EXPIRED });
            break;
        case -9:
            cb(null, { code: code.err.ERR_CDKEY_SERVER_NOT_IN_CODE_SERVER_LIST });
            break;
        case -10:
            cb(null, { code: code.err.ERR_CDKEY_PLAYER_NOT_IN_CODE_PLATFORM_LIST });
            break;
        case -11:
            cb(null, { code: code.err.ERR_CDKEY_LEVEL_NOT_MEET_GIFT_LEVEL_REQUIREMENTS });
            break;
        case -12:
            cb(null, { code: code.err.ERR_CDKEY_CODE_NOT_BELONG_CURRENT_LOCALE });
            break;
        default:
            cb(null, { code: code.err.ERR_CDKEY_UNKNOWN_ERROR });
        }
    }).catch(error => {
        logger.error(`cdk remote check code error:%j`, error);
        cb(null, {code: code.err.FAILED });
    });
};

/**
 * 提交兑换码
*/
Remote.prototype.updateCode = async function (arg, cb) {
    const arr = ['account_name', arg.account_name, 'cardId', arg.cardId, 'code', arg.code, 'device', arg.device, 'dim_level', arg.dim_level,
        'game', arg.game, 'log_time', arg.log_time, 'platform', arg.platform, 'role_id', arg.role_id, 'role_name', arg.role_name, 
        'server', arg.server, 'time', arg.time, 'version', arg. version];
    const key = code.system.CDKEY_KEY;
    const keyCode = util.encode.encodeRfc3986(arr.join('')) + key;
    const flag = md5(keyCode).toUpperCase();
    const reqUrl = `${code.system.CDKEY_UPDATE_CODE_URL}&game=${arg.game}&platform=${arg.platform}&device=${arg.device}&server=${arg.server}&role_id=${arg.role_id}&role_name=${arg.role_name}&account_name=${arg.account_name}&dim_level=${arg.dim_level}&cardId=${arg.cardId}&code=${arg.code}&log_time=${arg.time}&time=${arg.time}&version=${arg.version}&flag=${flag}`;
    //http://api.4399data.com/?r=code/updateCode&game=demo&platform=1&device=android&server=1001&role_id=123&role_name=%E6%B5%8B%E8%AF%95&account_name=test&dim_level=1&cardId=2017032404&code=c77xlsuacpix&log_time=1490327283&time=1490327283&version=1.1&flag=F53C804E957C9F67AA2F7028A865BACA
    await axios.request({
        url: encodeURI(reqUrl),
        method: 'get',
        headers: {
            'Content-type': 'application/json;charset=UTF-8'
        }
    }).then(rep => {
        const JsonData = rep.data;
        logger.info(`cdkKeyRemote updateCode data:%j`,JsonData);
        switch (JsonData.ret) {
        case 0:
            cb(null, { code: code.err.SUCCEEDED, data:JsonData.data });
            break;
        case -1:
            cb(null, { code: code.err.ERR_CDKEY_PARAMETERS_INCOMPLETE });
            break;
        case -2:
            cb(null, { code: code.err.ERR_CDKEY_VERIFY_FAILED });
            break;
        case -3:
            cb(null, { code: code.err.ERR_CDKEY_UPLOAD_FAILED });
            break;
        default:
            cb(null, { code: code.err.ERR_CDKEY_UNKNOWN_ERROR });
        }
    }).catch(error => {
        logger.error(`cdk remote updateCode error:%j`, error);
        cb(null, { code: code.err.FAILED });
    });
};