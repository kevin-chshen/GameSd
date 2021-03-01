/**
 * @description redis相关定义
 * @author linjs
 * @date 2020/03/23
 */

const assert = require('assert');

/**
 * redis key 缓存
 */
const redisKeyProp = {};

/**
 * redis key 配置
 * @param {String} name 名字
 * @param {String} type redis值类型
 * @param {String} comment 注释
 * @param {Boolean} cleanOnStarting 服务器组启动时是否需要清理这个字段
 * @param {Integer} cacheSyncSec 缓存同步间隔(秒)
 * @param {Integer} timeoutSec 超时间隔(秒),过期之后会被自动清理
 * @param {Boolean} joinedKey 是否是组合出来的Key
 */
module.exports = {
    isValidRedisKey,
    getRedisKeyPropByName,
    getAllRedisKeyProp,

    TEST: makeRedisKeyType({
        name: 'test',
        type: 'hash',
        comment: '测试用',
        cleanOnStarting: true,
        cacheSyncSec: 60,
        timeoutSec: 60,
        joinedKey: true,
    }),
    MY_LOGIN_SERVERS: makeRedisKeyType({
        name: 'ml',
        type: 'hash',
        comment: '我的登录服',
        cleanOnStarting: false, // 不能清除，此处属于跨服数据
    }),
    CONNECTOR_ONLINE_NUM: makeRedisKeyType({
        name: 'connectorOnlineNum',
        type: 'sorted set',
        comment: '连接服务器对应的在线人数,绑定的排序数值为人数',
        cleanOnStarting: true,
        cacheSyncSec: 3
    }),
    ACCOUNT_DISPATCHED_CONNECTOR: makeRedisKeyType({
        name: 'accountDispatchedConnector',
        type: 'hash',
        comment: '账号分配的Connector,{connector:xxx,count:n}',
        cleanOnStarting: true,
        timeoutSec: 300,
        joinedKey: true,
    }),
    AUTHORITY_CODE_OF_ACCOUNT: makeRedisKeyType({
        name: 'authorityCodeOfAccount',
        type: 'integer',
        comment: '账号的验证Code{code:account}',
        cleanOnStarting: true,
        timeoutSec: 300,
        joinedKey: false,
    }),
    ROLE_ON_CONNECTOR: makeRedisKeyType({
        name: 'roleOnConnector',
        type: 'hash',
        comment: '角色所在的Connector服务器{角色uid:所在的Connector服}',
        cleanOnStarting: true,
    }),
    MAX_PLAYER_UID: makeRedisKeyType({
        name: 'maxPlayerUid',
        type: 'hash',
        comment: '当前玩家uid最大值',
        cleanOnStarting: true,
    }),
    ROLE_ON_GAME: makeRedisKeyType({
        name: 'roleOnGame',
        type: 'hash',
        comment: '角色所在的Game服务器{角色uid:所在的游戏服}',
        cleanOnStarting: true,
    }),
    GAME_ONLINE_NUM: makeRedisKeyType({
        name: 'gameOnlineNum',
        type: 'zset',
        comment: '游戏服务器对应的在线人数,绑定的排序数值为人数',
        cleanOnStarting: true,
        cacheSyncSec: 3
    }),
    ALL_ROLE_ID: makeRedisKeyType({
        name: 'allRoleId',
        type: 'set',
        comment: '所有玩家uid的集合',
        cleanOnStarting: true
    }),
    ROLE_BRIEF: makeRedisKeyType({
        name: 'roleBrief',
        type: 'hash',
        comment: '角色的缩略信息{角色lv:lv, ...}',
        cleanOnStarting: false,
        joinedKey: true
    }),
    ONLINE_LOG_INFO: makeRedisKeyType({
        name: 'onlineLogInfo',
        type: 'hash',
        comment: '在线日志信息{平台}',
        cleanOnStarting: true,
    }),
    LOG_ONLINE_PEOPLE: makeRedisKeyType({
        name: 'logOnlinePeople',
        type: 'hash',
        comment: '在线日志信息平台设备对应的人数{平台:{设备端:people}}',
        cleanOnStarting: true,
        joinedKey: true
    }),
    LOG_ONLINE_IP: makeRedisKeyType({
        name: 'logOnlineIP',
        type: 'hash',
        comment: '在线日志信息平台设备对应的ip数{平台:{设备端:ips}}',
        cleanOnStarting: true,
        joinedKey: true
    }),
    LOG_ONLINE_DID: makeRedisKeyType({
        name: 'logOnlineDid',
        type: 'hash',
        comment: '在线日志信息平台设备对应的设备id数{平台:{设备端:did}}',
        cleanOnStarting: true,
        joinedKey: true
    }),
    MAX_GLOBAL_MAIL_ID: makeRedisKeyType({
        name: 'maxGlobalMailId',
        type: 'integer',
        comment: '当前最大的全局邮件id',
        cleanOnStarting: true,
    }),
    CHAT_WORLD_HISTORY: makeRedisKeyType({
        name: 'chatWorldHistory',
        type: 'zset',
        comment: '世界频道历史聊天记录{ value:roleMsg score:time }',
        cleanOnStarting: true,
    }),
    CHAT_GUILD_HISTORY: makeRedisKeyType({
        name: 'chatGuildHistory',
        type: 'zset',
        comment: '商会频道历史聊天记录{ value:roleMsg score:time }',
        cleanOnStarting: true,
        joinedKey: true,
    }),
    MAX_GUILD_ID: makeRedisKeyType({
        name: 'maxGuildId',
        type: 'integer',
        comment: '当前最大联盟id',
        cleanOnStarting: true
    }),
    RANK_VERSION:makeRedisKeyType({
        name: 'rankVersion',
        type: 'hash',
        comment: '排行榜数据版本号',
    }),
    RANK:makeRedisKeyType({
        name: 'rank',
        type: 'zset',
        comment: '排行榜',
        cleanOnStarting: false,
        joinedKey: true
    }),
    DIAMOND_POOL:makeRedisKeyType({
        name: 'diamondPool',
        type: 'set',
        comment: '奖池钻石',
        cleanOnStarting: false,
    }),
    DIAMOND_POOL_RECORD:makeRedisKeyType({
        name: 'diamondPoolRecord',
        type: 'list',
        comment: '奖池钻石获奖记录',
        cleanOnStarting: false,
        joinedKey: true,
    }),
};

/**
 * 生成redis key 配置
 * @param {Object} config 配置项
 */
function makeRedisKeyType(config) {
    assert(redisKeyProp[config.name] == null, `redis key [${config.name}] duplicate`);
    const prop = {
        name: config.name,
        type: config.type,
        comment: config.comment,
        cacheSyncSec: config.cacheSyncSec || 0,
        timeoutSec: config.timeoutSec || 0,
        cleanOnStarting: config.cleanOnStarting || false,
        joinedKey: config.joinedKey || false
    };
    redisKeyProp[config.name] = prop;
    return prop;
}

/**
 * 是否有效的redis key
 * @param {String} key redis key
 */
function isValidRedisKey(key) {
    return redisKeyProp[key] != null;
}

/**
 * 获取redis key 对应的属性
 * @param {String} key redis key名称
 */
function getRedisKeyPropByName(key) {
    return redisKeyProp[key];
}

/**
 * 获取所有redis key的属性
 */
function getAllRedisKeyProp() {
    return Object.values(redisKeyProp);
}
