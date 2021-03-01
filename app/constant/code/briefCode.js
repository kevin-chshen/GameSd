/**
 * @description 角色缩略信息
 * @author linjs
 * @date 2020/03/25
 */

const assert = require('assert');
const playerKeys = require('./playerCode').Keys;

/**
 * brief key 属性缓存
 */
const briefKeyProp = {};

/**
 * brief key 配置
 * 1.jsonKey 符合键值类型,在设置和获取时会使用JSON库进行转换
 * 2.playerKey和computeFun必须拥有一个,用于角色登录时同步信息到角色缩略信息中,优先使用playerKey
 * @param {String} name 名字
 * @param {Boolean} jsonKey 值类型是json属性 获取值和设置值会将value自动进行转换
 * @param {String} playerKey 对应的玩家属性名 playerCode中定义的属性
 * @param {Function} computeFun 计算函数,形如  compute(MongoPlayer) 通过玩家数据计算出来的值
 */

/**
 * 数据的当前版本,如果有增加字段或者修改字段,需要增加这个数目
 * 一旦redis里面的数据版本跟这个不一致,就会重新加载玩家的缩略信息
 */
const CURRENT_VERSION = '0.0.5';
module.exports = {
    CURRENT_VERSION,
    isJsonProp,
    getAllBriefKeyProp,
    initBriefFromPlayerData,
    TEST: makeBriefKeyType({
        name: 'test',   // 测试属性
        jsonKey: true,
        computeFun: _getTest,
    }),
    UID: makeBriefKeyType({
        name: 'uid',    // 玩家uid
        playerKey: playerKeys.UID,
    }),
    VERSION: makeBriefKeyType({
        name: 'version',    // 数据版本
        computeFun: _getVersion,
    }),
    LV: makeBriefKeyType({
        name: 'lv',     // 玩家等级
        playerKey: playerKeys.LV,
    }),
    VIP: makeBriefKeyType({
        name: 'vip',     // vip等级
        playerKey: playerKeys.VIP,
    }),
    NAME: makeBriefKeyType({
        name: 'name',   // 名字
        playerKey: playerKeys.NAME,
    }),
    MANIFESTO: makeBriefKeyType({
        name: 'manifesto',   // 个人宣言
        playerKey: playerKeys.MANIFESTO,
    }),
    LAST_LOGOUT_TIME: makeBriefKeyType({
        name: 'lastLogoutTime', // 最后一次退出时间(毫秒)
        playerKey: playerKeys.LAST_LOGOUT_TIME,
    }),
    POWER: makeBriefKeyType({
        name: 'power',  // 战力
        playerKey: playerKeys.POWER,
    }),
    LAST_LOGIN_TIME: makeBriefKeyType({
        name: 'lastLoginTime', // 最后一次登陆时间(毫秒)
        playerKey: playerKeys.LAST_LOGIN_TIME,
    }),
    HEAD_IMAGE_ID: makeBriefKeyType({
        name: 'headImageId',    // 头像id
        playerKey: playerKeys.HEAD_IMAGE_ID,
    }),
    SEX: makeBriefKeyType({
        name: 'sex',    // 性别
        playerKey: playerKeys.SEX,
    }),
    BATTLE_MEMBER: makeBriefKeyType({
        name: 'battleMember',    // 战斗成员
        jsonKey: true,
        playerKey: playerKeys.BATTLE_MEMBER,
    }),
    CAR_TOP_THREE: makeBriefKeyType({
        name: 'carTopThree',    // 豪车前三
        jsonKey: true,
        playerKey: playerKeys.CAR_TOP_THREE,
    }),
    AUTO_SHOW: makeBriefKeyType({
        name: 'autoShow',       // 车展数据
        jsonKey: true,
        playerKey: playerKeys.AUTO_SHOW,
    }),
    CASH_PER_SECOND: makeBriefKeyType({
        name: 'cashPerSecond',    // 赚钱速度
        playerKey: playerKeys.COIN_PER_SECOND,
    }),
    BAN_CHAT_END_TS: makeBriefKeyType({
        name: 'banChatEndTs',    // 禁言结束时间戳
        computeFun: _banChatEndTs,
    }),
    
};

/**
 * 检验并生成brief key配置
 * @param {Object} config 设置值
 */
function makeBriefKeyType(config) {
    assert(briefKeyProp[config.name] == null, `brief key [${config.name}] duplicate`);
    assert(config.playerKey || config.computeFun, `brief key [${config.name}] must have compute prop`);
    const prop = {
        name: config.name,
        jsonKey: config.jsonKey || false,
        playerKey: config.playerKey || undefined,
        computeFun: config.computeFun || undefined,
    };
    briefKeyProp[config.name] = prop;
    return prop;
}

/**
 * 是否json属性
 * @param {String} prop 属性名称
 */
function isJsonProp(briefName) {
    return briefKeyProp[briefName].jsonKey;
}

/**
 * 获取所有brief key的属性
 */
function getAllBriefKeyProp() {
    return Object.values(briefKeyProp);
}

/**
 * 从玩家数据初始化缩略信息
 * @param {Object} playerData 玩家数据
 */
function initBriefFromPlayerData(playerData) {
    const brief = {};
    for (const {name, jsonKey, playerKey, computeFun} of getAllBriefKeyProp()) {
        let value = null;
        if (playerKey) {
            value = playerData.get(playerKey);
        } else if (computeFun) {
            value = computeFun(playerData);
        }
        if (jsonKey) {
            value = JSON.stringify(value);
        }
        brief[name] = value;
    }
    return brief;
}

// 取值函数
function _getTest(_playerData) {
    return {msg:'123', msg2:[1,2,3]};
}

function _getVersion(_playerData) {
    return CURRENT_VERSION;
}

function _banChatEndTs(playerData) {
    if (playerData.ban){
        playerData.ban.banChatTs || 0;
    } else {
        return 0;
    }
}
