/**
 * created by chshen 2020/03/19
*/
const MongoDataBase = require("../../logic/mongo/mongoDataBase");

class MongoAccount extends MongoDataBase {
    constructor(data) {
        super(data);
    }
}

module.exports = MongoAccount;

MongoAccount.prototype._collectionName = "account";
MongoAccount.prototype._columns = { 
    account: { type:"string", default: "" },
    platform: { type:"string", default: "" },
    serverId:{ type:"number", default: 0 },
    agentId:{ type:"number", default: 0 },
    deviceId:{ type:"string", default: "" },    // 设备端
    clientVersion:{ type:"string", default: "" },
    clientInfo:{ type:"object", default: {} },
    loginType : { type:"number", default: 0 },
    uid:{ type:"number", default: 0 },
    regTime: { type:"number", default: 0 },
    regIp: { type:"string", default: "0.0.0.0" },
    userIp : { type : "string", default: "0.0.0.0"},
    sdkResult: { type: "string", default: "{}" },
    forbidTs: { type: "number", default: 0 },       // 封禁时间戳
    forbidReason: { type: "string", default: "" },  // 封禁原因
};
MongoAccount.prototype._index = 'uid';