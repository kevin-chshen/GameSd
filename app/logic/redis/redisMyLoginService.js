/**
 * @description redis模块
 * @author chenyq
 * @data 2020/03/10
 */

const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const bearcat = require('bearcat');
const redis = require('redis');
const code = require('@code');
const assert = require('assert');

const RedisMyLoginService = function () {
    this.$id = 'logic_RedisMyLoginService';
    this.app = null;
    this._asyncRedis = null;
};

module.exports = RedisMyLoginService;
bearcat.extend('logic_RedisMyLoginService', 'logic_BaseService');

/**
 * 初始化redis client
 */
RedisMyLoginService.prototype.init = async function () {
    const redisConfig = this.app.SystemConfig.redisMyLogin;
    const redisClient = redis.createClient(redisConfig.port, redisConfig.host, { password: redisConfig.password});
    this._asyncRedis = bearcat.getBean('logic_AsyncRedis');
    this._asyncRedis.init(redisClient);
    logger.info("server id %s connect to redis %j %j success", this.app.getServerId(), redisConfig.host, redisConfig.port);

    redisClient.on("error", function (error) {
        logger.error("REDIS error %j", error);
    });
};

/**
 * 设置存储在给定键中的值
 * @param {*} key 
 * @param {*} value 
 * @param {*} 'EX'设置过期时间(秒) 'PX'设置过期时间(毫秒) 'NX'只有键key不存在的时候才会设置key的值 'XX'只有键key存在的时候才会设置key的值
 * @return OK/null
 */
RedisMyLoginService.prototype.set = async function (key, value, ...param) {
    return this._asyncRedis.set(makeKey(key), value, ...param);
};

/**
 * 获取存储在给定键中的值
 * @param {*} key 
 * @return success:value fail:null
 */
RedisMyLoginService.prototype.get = async function (key) {
    return this._asyncRedis.get(makeKey(key));
};

/**
 * 删除一个(或多个)keys
 * @param  {...any} keys 
 * @return 成功删除条目
 */
RedisMyLoginService.prototype.del = async function (...keys) {
    return this._asyncRedis.del(...keys.map(key => makeKey(key)));
};

/**
 * 直接删除多个key,不检查key的有效性
 * @param  {...any} keys 
 * @return 成功删除条目
 */
RedisMyLoginService.prototype.delDirect = async function (...keys) {
    return this._asyncRedis.del(...keys);
};

/**
 * 返回通配符匹配的所有key
 * @param {String} pattern 通配符,支持*号
 */
RedisMyLoginService.prototype.keys = async function (pattern)  {
    return this._asyncRedis.keys(pattern);
};

/**
 * 将键存储的值加上整数increment
 * @param {*} key 
 * @param {*} incr 
 * @return 增加后的值
 */
RedisMyLoginService.prototype.incrby = async function (key, incr = 1) {
    return this._asyncRedis.incrby(makeKey(key), incr);
};

/**
 * 将键存储的值减去整数increment
 * @param {*} key 
 * @param {*} incr 
 * @return 减去后的值
 */
RedisMyLoginService.prototype.decrby = async function (key, incr = 1) {
    return this._asyncRedis.decrby(makeKey(key), incr);
};

/**
 * 将键存储的值加上浮点数increment
 * @param {*} key 
 * @param {*} incr 
 * @return 增加后的值
 */
RedisMyLoginService.prototype.incrbyfloat = async function (key, incr = 1) {
    return this._asyncRedis.incrbyfloat(makeKey(key), incr);
};

/**
 * 查询一个key是否存在
 * @param {*} key 
 * @return 1/0
 */
RedisMyLoginService.prototype.exists = async function (key) {
    return this._asyncRedis.exists(makeKey(key));
};

/**
 * 设置一个key的过期的秒数
 * @param {*} key 
 * @param {*} seconds 
 * @return 1/0
 */
RedisMyLoginService.prototype.expire = async function (key, seconds) {
    return this._asyncRedis.expire(makeKey(key), seconds);
};

/**
 * 设置一个key的过期的毫秒数
 * @param {*} key 
 * @param {*} milliseconds 
 * @return 1/0
 */
RedisMyLoginService.prototype.pexpire = async function (key, milliseconds) {
    return this._asyncRedis.pexpire(makeKey(key), milliseconds);
};

/**
 * 设置一个UNIX时间戳的过期时间
 * @param {*} key 
 * @param {*} timestamp 
 * @return 1/0
 */
RedisMyLoginService.prototype.expireat = async function (key, timestamp) {
    return this._asyncRedis.expireat(makeKey(key), timestamp);
};

/**
 * 设置一个UNIX时间戳的过期时间(毫秒)
 * @param {*} key 
 * @param {*} milliseconds 
 * @return 1/0
 */
RedisMyLoginService.prototype.pexpireat = async function (key, milliseconds) {
    return this._asyncRedis.pexpireat(makeKey(key), milliseconds);
};

/**
 * 移除key的过期时间
 * @param {*} key 
 * @return 1/0
 */
RedisMyLoginService.prototype.persist = async function (key) {
    return this._asyncRedis.persist(makeKey(key));
};

/**
 * 事务
 * @param {*} list [[command1, key, ...param],[command2, key, ...param],...]
 * @return return [res1,res2,...]/undefined
 */
RedisMyLoginService.prototype.multi = async function (list) {
    const realList = list.map(([command, key, ...param]) => [command, makeKey(key), ...param]);
    return this._asyncRedis.multi(realList);
};

/**
 * 监视一个(或多个) key ，如果在事务执行之前这个(或这些) key 被其他命令所改动，那么事务将被打断。
 * @param  {...any} keys 
 * @return OK
 */
RedisMyLoginService.prototype.watch = async function (...keys) {
    return this._asyncRedis.watch(...keys.map(key => makeKey(key)));
};

/**
 * 刷新一个事务中已被监视的所有key
 * @return OK
 */
RedisMyLoginService.prototype.unwatch = async function () {
    return this._asyncRedis.unwatch();
};

//-----------------------
// list
//-----------------------
/**
 * 将给定值推入列表的左端
 * @param {*} key 
 * @param  {...any} values 
 * @return 当前列表长度
 */
RedisMyLoginService.prototype.lpush = async function (key, ...values) {
    return this._asyncRedis.lpush(makeKey(key), ...values);
};

/**
 * 将给定值推入列表的右端
 * @param {*} key 
 * @param  {...any} values 
 * @return 当前列表长度
 */
RedisMyLoginService.prototype.rpush = async function (key, ...values) {
    return this._asyncRedis.rpush(makeKey(key), ...values);
};

/**
 * 从列表左端弹出一个值
 * @param {*} key 
 * @param {*} 
 * @return 并返回被弹出的值
 */
RedisMyLoginService.prototype.lpop = async function (key) {
    return this._asyncRedis.lpop(makeKey(key));
};

/**
 * 从列表右端弹出一个值
 * @param {*} key 
 * @return 并返回被弹出的值
 */
RedisMyLoginService.prototype.rpop = async function (key) {
    return this._asyncRedis.rpop(makeKey(key));
};

/**
 * 获取列表在给定位置上的单个元素
 * @param {*} key 
 * @param {*} index 给定位置 
 * @return 并返回给定位置的值
 */
RedisMyLoginService.prototype.lindex = async function (key, index) {
    return this._asyncRedis.lindex(makeKey(key), index);
};

/**
 * 获取列表在给定范围上的所有值
 * @param {*} key 
 * @param {*} start 0为开头 
 * @param {*} end -1为末尾
 * @return 列表/[]
 */
RedisMyLoginService.prototype.lrange = async function (key, start, end) {
    return this._asyncRedis.lrange(makeKey(key), start, end);
};

/**
 * 将列表按指定的index范围裁减
 * @param {*} key 
 * @param {*} start 0为开头 
 * @param {*} end -1为末尾
 * @return 列表
 */
RedisMyLoginService.prototype.ltrim = async function (key, start, end) {
    return this._asyncRedis.ltrim(makeKey(key), start, end);
};

/**
 * 获取列表长度
 * @param {*} key
 * @return 列表长度
 */
RedisMyLoginService.prototype.llen = async function (key) {
    return this._asyncRedis.llen(makeKey(key));
};

//-----------------------
// set
//-----------------------
/**
 * 将给定元素添加到集合
 * @param {*} key 
 * @param  {...any} values 
 * @return 插入元素数量
 */
RedisMyLoginService.prototype.sadd = async function (key, ...values) {
    return this._asyncRedis.sadd(makeKey(key), ...values);
};

/**
 * 如果给定的元素在集合中，则移除此元素
 * @param {*} key 
 * @param  {...any} values 
 * @return 1/0
 */
RedisMyLoginService.prototype.srem = async function (key, ...values) {
    return this._asyncRedis.srem(makeKey(key), ...values);
};

/**
 * 检查给定的元素是否存在于集合中
 * @param {*} key 
 * @param {*} item 
 * @return 1/0
 */
RedisMyLoginService.prototype.sismember = async function (key, item) {
    return this._asyncRedis.sismember(makeKey(key), item);
};

/**
 * 返回集合包含的元素的数量
 * @param {*} key 
 * @return 返回集合包含的元素的数量
 */
RedisMyLoginService.prototype.scard = async function (key) {
    return this._asyncRedis.scard(makeKey(key));
};

/**
 * 返回集合中包含的所有元素
 * @param {*} key 
 * @return array(无序)/[]
 */
RedisMyLoginService.prototype.smembers = async function (key) {
    return this._asyncRedis.smembers(makeKey(key));
};

/**
 * 随机地移除集合中的一个元素
 * @param {*} key
 * @return 返回被移除的元素
 */
RedisMyLoginService.prototype.spop = async function (key) {
    return this._asyncRedis.spop(makeKey(key));
};

/**
 * 返回集合中的多个随机元素
 * @param {*} key 
 * @param {*} num 大于集合长度返回整个集合；负数 返回绝对值的个数，绝对值大于集合长度，则会出现重复值
 * @return 列表/[]
 */
RedisMyLoginService.prototype.srandmember = async function (key, num) {
    return this._asyncRedis.srandmember(makeKey(key), num);
};

/**
 * 将元素item从sourceKey迁移到destKey
 * @param {*} sourceKey
 * @param {*} destKey
 * @param {*} item
 * @return 1/0
 */
RedisMyLoginService.prototype.smove = async function (sourceKey, destKey, item) {
    return this._asyncRedis.smove(makeKey(sourceKey), makeKey(destKey), item);
};

/**
 * 返回那些存在于第一个集合，但不存在于其他集合的元素(差集)
 * @param {*} key 
 * @param  {...any} keys 
 * @return 包含差集成员的列表
 */
RedisMyLoginService.prototype.sdiff = async function (key, ...keys) {
    return this._asyncRedis.sdiff(makeKey(key), ...keys.map((x) => makeKey(x)));
};

/**
 * 将sdiff操作的结果存储到指定的键中
 * @param {*} destKey 
 * @param {*} key 
 * @param  {...any} keys 
 * @return 结果集中的元素数量
 */
RedisMyLoginService.prototype.sdiffstore = async function (destKey, key, ...keys) {
    return this._asyncRedis.sdiffstore(makeKey(destKey), makeKey(key), ...keys.map((x) => makeKey(x)));
};

/**
 * 返回那些同时存在于所有集合中的元素(交集)
 * @param {*} key 
 * @param  {...any} keys 
 * @return 包含交集成员的列表
 */
RedisMyLoginService.prototype.sinter = async function (key, ...keys) {
    return this._asyncRedis.sinter(makeKey(key), ...keys.map((x) => makeKey(x)));
};

/**
 * 将sinter操作的结果存储到指定的键中
 * @param {*} destKey 
 * @param {*} key 
 * @param  {...any} keys 
 * @return 结果集中的元素数量
 */
RedisMyLoginService.prototype.sinterstore = async function (destKey, key, ...keys) {
    return this._asyncRedis.sinterstore(makeKey(destKey), makeKey(key), ...keys.map((x) => makeKey(x)));
};

/**
 * 返回那些至少存在于一个集合中的元素(并集)
 * @param {*} key 
 * @param  {...any} keys 
 * @return 包含并集成员的列表
 */
RedisMyLoginService.prototype.sunion = async function (key, ...keys) {
    return this._asyncRedis.sunion(makeKey(key), ...keys.map((x) => makeKey(x)));
};

/**
 * 将sunion操作的结果存储到指定的键中
 * @param {*} destKey 
 * @param {*} key 
 * @param  {...any} keys 
 * @return 结果集中的元素数量
 */
RedisMyLoginService.prototype.sunionstore = async function (destKey, key, ...keys) {
    return this._asyncRedis.sunionstore(makeKey(destKey), makeKey(key), ...keys.map((x) => makeKey(x)));
};

//-----------------------
// zset
//-----------------------
/**
 * 将一个带有给定分支的成员添加到有序集合中
 * @param {*} key 
 * @param  {...any} scoreMember score,member至少需要一对 score为int
 * @return 
 */
RedisMyLoginService.prototype.zadd = async function (key, ...scoreMember) {
    return this._asyncRedis.zadd(makeKey(key), ...scoreMember);
};

/**
 * 如果给定成员存在于有序集合，则移除
 * @param {*} key 
 * @param  {...any} member 
 * @return 
 */
RedisMyLoginService.prototype.zrem = async function (key, ...member) {
    return this._asyncRedis.zrem(makeKey(key), ...member);
};

/**
 * 获取一个有序集合中的成员数量
 * @param {*} key 
 * @return 有序集的元素个数
 */
RedisMyLoginService.prototype.zcard = async function (key) {
    return this._asyncRedis.zcard(makeKey(key));
};

/**
 * 有序集合中对指定成员的分数加上增量 increment
 * @param {*} key 
 * @param {*} incr 
 * @param {*} member 
 * @return 变化后的值
 */
RedisMyLoginService.prototype.zincrby = async function (key, incr, member) {
    return this._asyncRedis.zincrby(makeKey(key), incr, member);
};

/**
 * 获取成员分数
 * @param {*} key 
 * @param {*} member 
 * @return 分数
 */
RedisMyLoginService.prototype.zscore = async function (key, member) {
    return this._asyncRedis.zscore(makeKey(key), member);
};

/**
 * 获取分数区间在min~max的成员个数
 * @param {*} key 
 * @param {*} min 
 * @param {*} max 
 * @return 成员数量
 */
RedisMyLoginService.prototype.zcount = async function (key, min, max) {
    return this._asyncRedis.zcount(makeKey(key), min, max);
};

/**
 * 返回有序集中指定成员的排名 从小到大
 * @param {*} key 
 * @param {*} member 
 * @return 排名
 */
RedisMyLoginService.prototype.zrank = async function (key, member) {
    return this._asyncRedis.zrank(makeKey(key), member);
};

/**
 * 返回有序集中指定成员的排名 从大到小
 * @param {*} key 
 * @param {*} member 
 * @return 排名
 */
RedisMyLoginService.prototype.zrevrank = async function (key, member) {
    return this._asyncRedis.zrevrank(makeKey(key), member);
};

/**
 * 返回有序集中，指定区间内的成员 从小到大
 * @param {*} key 
 * @param {*} from start 和 stop 都以 0 为底，以 0 表示有序集第一个成员，以 1 表示有序集第二个成员，以此类推
 * @param {*} to 也可以使用负数下标，以 -1 表示最后一个成员， -2 表示倒数第二个成员，以此类推
 * @param {*} withscores 是否一并返回分数true/false
 * @example app.Redis.zrange(key, 0, -1, true)
 * @return [score,member,score1,member1,score2,member2,...]
 * @example app.Redis.zrange(key, 0, -1)
 * @return [member,member1,member2,...]
 */
RedisMyLoginService.prototype.zrange = async function (key, from, to, withscores) {
    return this._asyncRedis.zrange(makeKey(key), from, to, withscores);
};

/**
 * 返回有序集中，指定区间内的成员 从大到小
 * @param {*} key 
 * @param {*} from start 和 stop 都以 0 为底，以 0 表示有序集第一个成员，以 1 表示有序集第二个成员，以此类推
 * @param {*} to 也可以使用负数下标，以 -1 表示最后一个成员， -2 表示倒数第二个成员，以此类推
 * @param {*} withscores 是否一并返回分数true/false
 * @example app.Redis.zrevrange(key, 0, -1, true)
 * @return [score,member,score1,member1,score2,member2,...]
 * @example app.Redis.zrevrange(key, 0, -1)
 * @return [member,member1,member2,...]
 */
RedisMyLoginService.prototype.zrevrange = async function (key, from, to, withscores) {
    return this._asyncRedis.zrevrange(makeKey(key), from, to, withscores);
};

/**
 * 返回有序集中，指定区间内的成员 从小到大
 * @param {*} key 
 * @param {*} from start 和 stop 都以 0 为底，以 0 表示有序集第一个成员，以 1 表示有序集第二个成员，以此类推
 * @param {*} to 也可以使用负数下标，以 -1 表示最后一个成员， -2 表示倒数第二个成员，以此类推
 * @param {*} offset
 * @param {*} count
 * @param {*} withscores 是否一并返回分数true/false
 * @example app.Redis.zrangebyscore(key, min, max, 0, -1, true)
 * @return [score,member,score1,member1,score2,member2,...]
 * @example app.Redis.zrangebyscore(key, min, max, 0, -1)
 * @return [member,member1,member2,...]
 */
RedisMyLoginService.prototype.zrangebyscore = async function (key, min, max, offset, count, withscores) {
    return this._asyncRedis.zrangebyscore(makeKey(key), min, max, offset, count, withscores);
};

/**
 * 返回有序集中，指定区间内的成员 从大到小
 * @param {*} key 
 * @param {*} from start 和 stop 都以 0 为底，以 0 表示有序集第一个成员，以 1 表示有序集第二个成员，以此类推
 * @param {*} to 也可以使用负数下标，以 -1 表示最后一个成员， -2 表示倒数第二个成员，以此类推
 * @param {*} offset 
 * @param {*} count
 * @param {*} withscores 是否一并返回分数true/false
 * @example app.Redis.zrevrangebyscore(key, max, min, 0, -1, true)
 * @return [score,member,score1,member1,score2,member2,...]
 * @example app.Redis.zrevrangebyscore(key, max, min, 0, -1)
 * @return [member,member1,member2,...]
 */
RedisMyLoginService.prototype.zrevrangebyscore = async function (key, max, min, offset, count, withscores) {
    return this._asyncRedis.zrevrangebyscore(makeKey(key), min, max, offset, count, withscores);
};

//-----------------------
// hash
//-----------------------
/**
 * 在哈希表里面关联起给定的键值对
 * @param {*} key 
 * @param {*} field 
 * @param {*} value 
 * @return 1(新增)/0(更新)
 */
RedisMyLoginService.prototype.hset = async function (key, field, value) {
    return this._asyncRedis.hset(makeKey(key), field, value);
};

/**
 * 获取指定哈希表键的值
 * @param {*} key 
 * @param {*} field 
 * @return value/null
 */
RedisMyLoginService.prototype.hget = async function (key, field) {
    return this._asyncRedis.hget(makeKey(key), field);
};

/**
 * 同时将多个 field-value (字段-值)对设置到哈希表中
 * @param {*} key 
 * @param  {...any} fieldValue field,value至少需要一对
 * @return OK
 */
RedisMyLoginService.prototype.hmset = async function (key, ...fieldValue) {
    return this._asyncRedis.hmset(makeKey(key), ...fieldValue);
};

/**
 * 从哈希表里面获取一个或多个键的值
 * @param {*} key 
 * @param  {...any} field 
 * @return [value,value,...]/[null,null,...]
 */
RedisMyLoginService.prototype.hmget = async function (key, ...field) {
    return this._asyncRedis.hmget(makeKey(key), ...field);
};

/**
 * 删除一个或多个哈希表字段
 * @param {*} key 
 * @param  {...any} field 
 * @return N/0
 */
RedisMyLoginService.prototype.hdel = async function (key, ...field) {
    return this._asyncRedis.hdel(makeKey(key), ...field);
};

/**
 * 获取哈希表中字段的数量
 * @param {*} key 
 * @return N/0
 */
RedisMyLoginService.prototype.hlen = async function (key) {
    return this._asyncRedis.hlen(makeKey(key));
};

/**
 * 查看哈希表 key 中，指定的字段是否存在
 * @param {*} key 
 * @param {*} field 
 * @return 1/0
 */
RedisMyLoginService.prototype.hexists = async function (key, field) {
    return this._asyncRedis.hexists(makeKey(key), field);
};

/**
 * 获取所有哈希表中的字段
 * @param {*} key 
 * @return 列表/[]
 */
RedisMyLoginService.prototype.hkeys = async function (key) {
    return this._asyncRedis.hkeys(makeKey(key));
};

/**
 * 获取哈希表中所有值
 * @param {*} key 
 * @return 列表/[]
 */
RedisMyLoginService.prototype.hvals = async function (key) {
    return this._asyncRedis.hvals(makeKey(key));
};

/**
 * 获取在哈希表中指定 key 的所有字段和值
 * @param {*} key 
 * @return {key:value,key:value,...}/null
 */
RedisMyLoginService.prototype.hgetall = async function (key) {
    return this._asyncRedis.hgetall(makeKey(key));
};

/**
 * 为哈希表 key 中的指定字段的整数值加上增量 increment 
 * @param {*} key 
 * @param {*} field 
 * @param {*} incr 
 * @return 变更后的值
 */
RedisMyLoginService.prototype.hincrby = async function (key, field, incr) {
    return this._asyncRedis.hincrby(makeKey(key), field, incr);
};

/**
 * 为哈希表 key 中的指定字段的浮点数值加上增量 increment
 * @param {*} key 
 * @param {*} field 
 * @param {*} incr 
 * @return 变更后的值
 */
RedisMyLoginService.prototype.hincrbyfloat = async function (key, field, incr) {
    return this._asyncRedis.hincrbyfloat(makeKey(key), field, incr);
};

/**
 * 关闭redis服务
 */
RedisMyLoginService.prototype.shutdown = function () {
    this._asyncRedis.shutdown();
    this.app.Redis = null;
};

/**
 * 生成实际要访问的redis key
 * 1.单独的key,直接使用名字
 * 2.组合的key,用key的名字+_剩下变量的join('_')
 * @param {Mixed} key redis Key 定义
 */
function makeKey(key) {
    let keyName = null;
    let realKey = null;
    if (Array.isArray(key)) {
        keyName = key[0];
        realKey = key.join('_');
    } else {
        keyName = key;
        realKey = key;
    }
    assert(code.redis.isValidRedisKey(keyName), `redis key [${key}] is invalid`);
    return realKey;
}
