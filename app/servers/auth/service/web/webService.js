/**
 * @description web后台服务
 * @author chshen
 * @date 2020/05/12
 */
const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const bearcat = require('bearcat');
const http = require('http');
const url = require('url');
const md5 = require('md5');
const code = require('@code');
const util = require('@util');
const assert = require('assert');
const querystring = require("querystring");//解析post传过去的数据，以防乱码


const WebService = function () {
    this.$id = 'auth_WebService';
    this.app = null;
    this.server = null;
    
    this.handlers = {
        ['/pay.php']: (...args) => {
            this.pay(...args);
        },
        ['/api/pay.php']: (...args) => {
            this.pay(...args);
        },
        ['/ban']: (...args) => {
            this.ban(...args);
        },
        ['/api/ban']: (...args) => {
            this.ban(...args);
        },
        ['/news_broadcast']: (...args) => {
            this.broadcast(...args);
        },
        ['/api/news_broadcast']: (...args) => {
            this.broadcast(...args);
        },
        ['/send_mail']: (...args) => {
            this.sendMail(...args);
        },
        ['/api/send_mail']: (...args) => {
            this.sendMail(...args);
        },
        ['/send_gift']: (...args) => {
            this.sendItem(...args);
        },
        ['/api/send_gift']: (...args) => {
            this.sendItem(...args);
        },
        ['/user_info_list']: (...args) => {
            this.getUserInfoList(...args);
        },
        ['/api/user_info_list']: (...args) => {
            this.getUserInfoList(...args);
        },
        ['/announcement']: (...args) => {
            this.announcement(...args);
        },
        ['/api/announcement']: (...args) => {
            this.announcement(...args);
        },
        ['/kick_user']: (...args) => {
            this.kickUser(...args);
        },
        ['/api/kick_user']:(...args) =>{
            this.kickUser(...args);
        },
        ['/api/user_detail']:(...args) =>{
            this.userDetail(...args);
        }
    };
};
module.exports = WebService;
bearcat.extend('auth_WebService', 'logic_BaseService');

WebService.prototype.init = async function () {
    this.server = http.createServer((req, resp) =>{
        this.createServer(req, resp);
    });

    this.server.addListener('connection', function (socket) {
        socket.setTimeout(30000);
    });

    const port = this.app.SystemConfig.getWebPort();
    this.server.listen(port);
    logger.warn(`WebService auth_WebService ${process.pid}`);
};

WebService.prototype.getWhiteListIps = function() {
    return [
        '127.0.0.1',
        '42.62.31.88',
        '121.201.56.3',
        '121.201.56.4',
        '121.201.56.5',
        '121.201.56.6',
        '150.109.109.6',
        '124.243.195.40',
        '42.62.106.216',
        '42.62.106.220',
        '124.243.209.28',
        '42.62.106.230',
        '134.175.153.131',
        '134.175.153.164',
        '106.55.12.42',
        '124.243.209.74',
        '124.243.195.68',
        '193.112.23.59',
        '42.62.31.81',
        '115.159.121.230',
        '124.243.195.55',
        '129.204.107.16',
        '106.52.245.159',
        '42.62.31.92'
    ];
};

/**
 * 创建蜂鸟服务
*/
WebService.prototype.createServer = function (req, resp) {
    resp.writeHead(200, { "Content-Type": 'text/html; charset=utf-8' });
    logger.info(`WebService createServer record req %j, process pid: `, req.url, process.pid);
    const ip = this._getClientIP(req).split(':')[3];
    const whiteIps = this.getWhiteListIps();
    if (whiteIps.indexOf(ip) == -1) {
        resp.end(JSON.stringify({'ret':202, "msg": '验证失败'}));
    }
    const parsedUrl = url.parse(req.url, true);
    let params;
    if (req.method === 'POST') {
        const body = [];
        const self = this;
        req.on('error', function (err) {
            logger.error(`webService err:%j`, err);
            resp.end(JSON.stringify({ ret: 202, msg: 'post error' }));
        }).on('data', function (chunk) {  //数据较大，分多次接收
            body.push(chunk);
        }).on("end", function () {  //接收完成后的操作
            const data = body.join('');
            params = querystring.parse(data);
            self.doHandler(parsedUrl, params, resp);
        });
    } else if (req.method === 'GET') {
        params = url.parse(req.url, true).query;
        this.doHandler(parsedUrl, params, resp);
    }
    else {
        resp.end('');
    }
};

WebService.prototype.doHandler = function (parsedUrl, params, resp){
    if (params && this.handlers[parsedUrl.pathname]) {
        const self = this;
        this.handlers[parsedUrl.pathname](params, function (result) {
            resp.end(JSON.stringify(result));
            self._sendLog(parsedUrl.pathname, JSON.stringify(params), JSON.stringify(result));
        });
    } else {
        // 找不到处理接口 则默认超时
        resp.end(JSON.stringify(code.web.FN_SDK.PAY.RET_TIMEOUT));
    }
};

/**
 * @getClientIP
 * @desc 获取用户 ip 地址
 * @param {Object} req - 请求
 */
WebService.prototype._getClientIP = function(req) {
    return req.headers['x-forwarded-for'] || // 判断是否有反向代理 IP
        req.connection.remoteAddress || // 判断 connection 的远程 IP
        req.socket.remoteAddress || // 判断后端的 socket 的 IP
        req.connection.socket.remoteAddress;
};

/**
 * 校验url有效性
 * @param {Object} params
*/
WebService.prototype.checkUrl = function (params) {
    // 检测数据有效性
    const arr = [];
    Object.keys(params).sort().map(key => {
        if (key != 'flag') {
            arr.push(key);
            arr.push(params[key]);
        }
    });
    const key = code.system.WEB_BACKEND_KEY;
    const res = util.encode.encodeRfc3986(arr.join('')) + key;
    const resCode = md5(res).toUpperCase();
    return resCode == params.flag;
};

/**
 * 关闭服务器
*/
WebService.prototype.shutdown = function () {
    this.server.close(()=>{
        const port = this.app.SystemConfig.getWebPort();
        logger.info(`WebService shutdown port:${port}`);
    });
};

WebService.prototype.pay = async function (params, cb) {
    assert(params, `ApiService api/pay `);
    const orderId = params.order_id;
    const gameId = params.game_id;
    const serverId = params.server_id;
    const fnPid = params.fnpid;
    const uid = params.uid;
    const payWay = params.pay_way;
    const amount = params.amount;
    const callbackInfo = params.callback_info;
    const orderStatus = params.order_status;
    const failedDesc = params.failed_desc;
    const sign = params.sign;
    // 检测参数
    if (!orderId || !gameId || !serverId ||
        !fnPid || !uid || !payWay || !amount ||
        !callbackInfo || !orderStatus || failedDesc == null ||
        !sign) {
        logger.error('ApiService /api/pay.php params:%j error', params);
        cb(code.web.FN_SDK.PAY.RET_PARAM_ERROR);
        return;
    }
    // 校验url
    const key = code.system.WEB_FNSDK_KEY;
    const str = [orderId, gameId, serverId, fnPid, uid, payWay, amount
        , callbackInfo, orderStatus, failedDesc, key].join('');
    const checkCode = md5(str);
    if (sign != checkCode) {
        cb(code.web.FN_SDK.PAY.RET_MD5_FAIL);
        return;
    }
    // 状态
    if (params.order_status != "S") {
        cb(code.web.FN_SDK.PAY.RET_FAILED);
        return;
    }
    logger.info(`WebService pay: `, JSON.stringify(params));
    // 充值业务
    const ret = await this.app.Pay.backendPay(params);

    cb(ret);
};

/**
 * 封禁
*/
WebService.prototype.ban = async function (params, cb) {
    if (!this.checkUrl(params)) {
        cb(JSON.stringify({ret: 200, msg:"check flag error"}));
        return;
    }
    logger.info(`WebService ban data :%j`, params);
    const ret = await this.app.Ban.ban(params);
    cb(ret);
};


/**
 * 广播
*/
WebService.prototype.broadcast = async function(params, cb) {
    if (!this.checkUrl(params)) {
        cb(JSON.stringify({ ret: 200, msg: "check flag error" }));
        return;
    }
    logger.info(`WebService broadcast data :%j`, params);
    if (!params.type) {
        logger.error(`WebService broadcast type null`);
        cb({ ret: 101, msg: "type lose"});
        return;
    }
    if (!params.content) {
        logger.error(`WebService broadcast content null`);
        cb({ ret: 101, msg: "content lose" });
        return;
    }
    switch(Number(params.type)) {
    // 世界聊天窗
    // 跑马灯 1、2都走跑马灯
    case 1:
    case 2:
        this.app.rpcs.global.chatRemote.bannerSysChat({}, params.content);
        break;
    // case 3:
    //     break;
    default:
        logger.warn(`web service broadcast type:${params.type} not define`);
        break;
    }
    cb({ret: 0, msg: "success"});
};


WebService.prototype.sendMail = async function(params, cb) {
    logger.info(`WebService sendMail data :%j`, params);
    if (!this.checkUrl(params)) {
        cb(JSON.stringify({ ret: 200, msg: "check flag error" }));
        return;
    }
    this.app.Mail.sendMail(params);
    cb({ ret: 0, msg: "success" });
};

/**
 * 道具、货币发放
*/
WebService.prototype.sendItem = async function (params, cb) {
    if (!this.checkUrl(params)) {
        cb(JSON.stringify({ret: 200, msg:"check flag error"}));
        return;
    }
    logger.info(`WebService item data :%j`, params);
    const ret = await this.app.Item.sendItem(params);
    cb(ret);
};

WebService.prototype.getUserInfoList = async function(params,  cb){
    if (!this.checkUrl(params)) {
        cb(JSON.stringify({ret: 200, msg:"check flag error"}));
        return;
    }
    logger.info(`WebService player data :%j`, params);
    const ret = await this.app.Player.getUserList(params);
    cb(ret);
};

WebService.prototype._sendLog = function (path, query, result) {
    const logInfo = { path: path, query: query, result: result, happend_time: util.time.nowSecond() };
    this.app.rpcs.log.logRemote.addLog({}, code.log.LOG_TYPE_OPERATE_INTERFACE, logInfo);
};

// 公告
WebService.prototype.announcement = async function(params, cb) {
    if (!this.checkUrl(params)) {
        cb(JSON.stringify({ ret: 200, msg: "check flag error" }));
        return;
    }
    const ret = await this.app.Announcement.do(params);
    cb(ret);
};

// 踢人
WebService.prototype.kickUser = function (params, cb) {
    if (!this.checkUrl(params)) {
        cb(JSON.stringify({ ret: 200, msg: "check flag error" }));
        return;
    }
    this.app.Ban.kickUser(params);
    cb({ret: 0, msg: "success"});
};

WebService.prototype.userDetail = async function(params, cb){
    if (!this.checkUrl(params)) {
        cb(JSON.stringify({ ret: 200, msg: "check flag error" }));
        return;
    }
    logger.info(`WebService player data :%j`, params);
    const ret = await this.app.Player.getUserDetail(params);
    cb(ret);
};