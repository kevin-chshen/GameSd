/**
 * @description id服务,服务器生命周期内提供唯一id服务
 * @author linjs
 * @date 2020/04/22
 */

const bearcat = require('bearcat');
const util = require('@util');
const code = require('@code');
const assert = require('assert');

const IdService = function () {
    this.$id = 'logic_IdService';
    this.app = null;
    this.processId = 0;  // 数字化的进程id 服务器类型编码+id后数字
    this.lastInfo = {}; // 上次生成的信息: 包括上次的时间,自增值{lastTime:***, lastValue:***}
};

module.exports = IdService;
bearcat.extend('logic_IdService', 'logic_BaseService');

/**
 * 服务初始化
 */
IdService.prototype.init = async function () {
    const serverType = this.app.getServerType();
    const serverCode = code.system.SERVER_TYPE_CODE[serverType];
    assert(serverCode, `server type [${serverType}] do not has server code`);
    const serverId = parseInt(this.app.getServerId().split('-')[2]);
    assert(serverId > 0, `server id [${this.app.getServerId()}] is invalid.`);
    this.processId = serverCode + serverId;
};

/**
 * 根据key生成下一个id
 * @return {String}
 */
IdService.prototype.genNext = function (key) {
    const now = util.time.nowSecond();
    let last = this.lastInfo[key];
    if (last) {
        if (last.lastTime != now) {
            last.lastTime = now;
            last.lastValue = 1;
        } else {
            last.lastValue += 1;
            last.lastValue = last.lastValue > 0xffff ? 1 : last.lastValue;
        }
    } else {
        last = { lastTime: now, lastValue: 1};
        this.lastInfo[key] = last;
    }
    return (BigInt(now) * BigInt(0x100000000) + BigInt((this.processId << 16) + last.lastValue)).toString();
};

