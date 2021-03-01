/**
 * Created by chshen on 2016/2/24.
 * @node: 验证服务器远程调用模块
 */
const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const md5 = require('md5');
const code = require('@code');
const axios = require('axios');

module.exports = function(app) {
    return new Remote(app);
};

const Remote = function(app) {
    this.app = app;
};

/**
 * 校验账号是否合法(测试账号)
 * @param  {String}   account 账号
 * @param  {String}   verifyCode 验证码
 * @param  {Function}   cb  callback
 * @return {bool}
*/
Remote.prototype.verifyTest = function(account, verifyCode, cb) {
    // 计算验证码
    const env = this.app.get('env');
    if (env == 'production') {
        const checkCode = md5(account + code.system.ACCOUNT_VERIFY_CODE).toUpperCase();
        if (checkCode != verifyCode) {
            logger.warn("authRemote verifyAccountTest : account(%s) verify failed, code = %s", account, checkCode);
            cb("error");
            return;
        }
    }

    logger.info("authRemote verifyAccountTest : account(%s) verify success", account);
    cb(null);
};

/**
 * 蜂鸟sdk校验
 * @param {String} name 名称
 * @param {String} uid 
 * @param {string} ext
 * @param {Function} cb  callback
*/
Remote.prototype.verifyFNSDK = async function(name, uid, ext, cb) {
    // 'http://fnapi.4399sy.com/sdk/api/login.php?name=~s&uid=~s&ext=~s'
    const reqUrl = `${code.system.FN_SDK_URL}name=${name}&uid=${uid}&ext=${ext}`;
    logger.info(`auth remote verify fn sdk req url %j`, reqUrl);
    await axios.request({
        url: reqUrl,
        method: 'get',
        headers: {
            'Content-type': 'application/json;charset=UTF-8'
        }
    }).then((rep) => {
        const JsonData = rep.data;
        if (JsonData.code == 1) {
            cb(null, { account_name: JsonData.content.uid, sdk_result: JSON.stringify(JsonData) });
        } else {
            logger.error(`auth remote verify error fn sdk JsonData %j`, JsonData);
            cb("error");
        }
    }).catch(error =>{
        logger.error(`verifyFNSDK error:%j`, error);
        cb(error);
    });
};