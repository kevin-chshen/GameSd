/**
 * @description 异步redis模块
 * @author chenyq
 * @data 2020/03/10
 */

const logger = require('pomelo-logger').getLogger('pomelo', __filename);

const AsyncRedis = function () {
    this.$id = 'logic_AsyncRedis';
    this.$scope = 'prototype';
    this._redis = null;
};

module.exports = AsyncRedis;

/**
 * 初始化设置redis client
 */
AsyncRedis.prototype.init = function (redisClient) {
    this._redis = redisClient;
};

/**
 * 关闭连接
 */
AsyncRedis.prototype.shutdown = function () {
    // 强制刷新内容到redis
    this._redis.end(true);
};

/**
 * 设置存储在给定键中的值
 * @param {*} key 
 * @param {*} value 
 * @param {*} 'EX'设置过期时间(秒) 'PX'设置过期时间(毫秒) 'NX'只有键key不存在的时候才会设置key的值 'XX'只有键key存在的时候才会设置key的值
 * @return OK/null
 */
AsyncRedis.prototype.set = async function (key, value, ...param) {
    return await new Promise((resolve) => {
        this._redis.set(key, value, ...param, function (err, res) {
            if (err) {
                logger.error("REDIS err:%s set %j %j %j", JSON.stringify(err), key, value, ...param);
            }
            return resolve({ err, res });
        });
    });
};

/**
 * 获取存储在给定键中的值
 * @param {*} key 
 * @return success:value fail:null
 */
AsyncRedis.prototype.get = async function (key) {
    return await new Promise((resolve) => {
        this._redis.get(key, function (err, res) {
            if (err) {
                logger.error("REDIS get %j err:%s", key, JSON.stringify(err));
            }
            return resolve({ err, res });
        });
    });
};

/**
 * 删除一个(或多个)keys
 * @param  {...any} keys 
 * @return 成功删除条目
 */
AsyncRedis.prototype.del = async function (...keys) {
    return await new Promise((resolve) => {
        this._redis.del(...keys, function (err, res) {
            if (err) {
                logger.error("REDIS err:%s del %j", JSON.stringify(err), ...keys);
            }
            return resolve({ err, res });
        });
    });
};

/**
 * 将键存储的值加上整数increment
 * @param {*} key 
 * @param {*} incr 
 * @return 增加后的值
 */
AsyncRedis.prototype.incrby = async function (key, incr = 1) {
    return await new Promise((resolve) => {
        this._redis.incrby(key, incr, function (err, res) {
            if (err) {
                logger.error("REDIS incr %j %j err:%s", key, incr, JSON.stringify(err));
            }
            return resolve({ err, res });
        });
    });
};

/**
 * 将键存储的值减去整数increment
 * @param {*} key 
 * @param {*} incr 
 * @return 减去后的值
 */
AsyncRedis.prototype.decrby = async function (key, incr = 1) {
    return await new Promise((resolve) => {
        this._redis.decrby(key, incr, function (err, res) {
            if (err) {
                logger.error("REDIS decrby %j %j err:%s", key, incr, JSON.stringify(err));
            }
            return resolve({ err, res });
        });
    });
};

/**
 * 将键存储的值加上浮点数increment
 * @param {*} key 
 * @param {*} incr 
 * @return 增加后的值
 */
AsyncRedis.prototype.incrbyfloat = async function (key, incr = 1) {
    return await new Promise((resolve) => {
        this._redis.incrbyfloat(key, incr, function (err, res) {
            if (err) {
                logger.error("REDIS incrbyfloat %j %j err:%s", key, incr, JSON.stringify(err));
            }
            return resolve({ err, res });
        });
    });
};

/**
 * 查询一个key是否存在
 * @param {*} key 
 * @return 1/0
 */
AsyncRedis.prototype.exists = async function (key) {
    return await new Promise((resolve) => {
        this._redis.exists(key, function (err, res) {
            if (err) {
                logger.error("REDIS exists %j err:%s", key, JSON.stringify(err));
            }
            return resolve({ err, res });
        });
    });
};

/**
 * 设置一个key的过期的秒数
 * @param {*} key 
 * @param {*} seconds 
 * @return 1/0
 */
AsyncRedis.prototype.expire = async function (key, seconds) {
    return await new Promise((resolve) => {
        this._redis.expire(key, seconds, function (err, res) {
            if (err) {
                logger.error("REDIS expire %j %j err:%s", key, seconds, JSON.stringify(err));
            }
            return resolve({ err, res });
        });
    });
};

/**
 * 设置一个key的过期的毫秒数
 * @param {*} key 
 * @param {*} milliseconds 
 * @return 1/0
 */
AsyncRedis.prototype.pexpire = async function (key, milliseconds) {
    return await new Promise((resolve) => {
        this._redis.pexpire(key, milliseconds, function (err, res) {
            if (err) {
                logger.error("REDIS pexpire %j %j err:%s", key, milliseconds, JSON.stringify(err));
            }
            return resolve({ err, res });
        });
    });
};

/**
 * 设置一个UNIX时间戳的过期时间
 * @param {*} key 
 * @param {*} timestamp 
 * @return 1/0
 */
AsyncRedis.prototype.expireat = async function (key, timestamp) {
    return await new Promise((resolve) => {
        this._redis.expireat(key, timestamp, function (err, res) {
            if (err) {
                logger.error("REDIS expireat %j %j err:%s", key, timestamp, JSON.stringify(err));
            }
            return resolve({ err, res });
        });
    });
};

/**
 * 设置一个UNIX时间戳的过期时间(毫秒)
 * @param {*} key 
 * @param {*} milliseconds 
 * @return 1/0
 */
AsyncRedis.prototype.pexpireat = async function (key, milliseconds) {
    return await new Promise((resolve) => {
        this._redis.pexpireat(key, milliseconds, function (err, res) {
            if (err) {
                logger.error("REDIS pexpireat %j %j err:%s", key, milliseconds, JSON.stringify(err));
            }
            return resolve({ err, res });
        });
    });
};

/**
 * 移除key的过期时间
 * @param {*} key 
 * @return 1/0
 */
AsyncRedis.prototype.persist = async function (key) {
    return await new Promise((resolve) => {
        this._redis.persist(key, function (err, res) {
            if (err) {
                logger.error("REDIS persist %j err:%s", key, JSON.stringify(err));
            }
            return resolve({ err, res });
        });
    });
};

/**
 * 事务
 * @param {*} list [[command1, key, ...param],[command2, key, ...param],...]
 * @return return [res1,res2,...]/undefined
 */
AsyncRedis.prototype.multi = async function (list) {
    return await new Promise((resolve) => {
        const m = this._redis.multi();
        for (const [command, key, ...param] of list) {
            m[command](key, ...param, function (err) {
                if (err) {
                    logger.error("err:", JSON.stringify(err));
                }
            });
        }
        m.exec(function (err, res) {
            return resolve({ err, res });
        });
    });
};

/**
 * 监视一个(或多个) key ，如果在事务执行之前这个(或这些) key 被其他命令所改动，那么事务将被打断。
 * @param  {...any} keys 
 * @return OK
 */
AsyncRedis.prototype.watch = async function (...keys) {
    return await new Promise((resolve) => {
        this._redis.watch(...keys, function (err, res) {
            if (err) {
                logger.error("REDIS err:%s watch %j", JSON.stringify(err), ...keys);
            }
            return resolve({ err, res });
        });
    });
};

/**
 * 刷新一个事务中已被监视的所有key
 * @return OK
 */
AsyncRedis.prototype.unwatch = async function () {
    return await new Promise((resolve) => {
        this._redis.unwatch(function (err, res) {
            if (err) {
                logger.error("REDIS unwatch err:%s", JSON.stringify(err));
            }
            return resolve({ err, res });
        });
    });
};

/**
 * 获取符合规则的所有key
 * @param {String} pattern keys的规则
 */
AsyncRedis.prototype.keys = async function (pattern) {
    return await new Promise((resolve) => {
        this._redis.keys(pattern, function (err, res) {
            if (err) {
                logger.error("REDIS keys err:%s", JSON.stringify(err));
            }
            return resolve({ err, res });
        });
    });
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
AsyncRedis.prototype.lpush = async function (key, ...values) {
    return await new Promise((resolve) => {
        this._redis.lpush(key, ...values, function (err, res) {
            if (err) {
                logger.error("REDIS err:%s lpush %j %j", JSON.stringify(err), key, ...values);
            }
            return resolve({ err, res });
        });
    });
};

/**
 * 将给定值推入列表的右端
 * @param {*} key 
 * @param  {...any} values 
 * @return 当前列表长度
 */
AsyncRedis.prototype.rpush = async function (key, ...values) {
    return await new Promise((resolve) => {
        this._redis.rpush(key, ...values, function (err, res) {
            if (err) {
                logger.error("REDIS err:%s rpush %j %j", JSON.stringify(err), key, ...values);
            }
            return resolve({ err, res });
        });
    });
};

/**
 * 从列表左端弹出一个值
 * @param {*} key 
 * @param {*} 
 * @return 并返回被弹出的值
 */
AsyncRedis.prototype.lpop = async function (key) {
    return await new Promise((resolve) => {
        this._redis.lpop(key, function (err, res) {
            if (err) {
                logger.error("REDIS lpop %j err:%s", key, JSON.stringify(err));
            }
            return resolve({ err, res });
        });
    });
};

/**
 * 从列表右端弹出一个值
 * @param {*} key 
 * @return 并返回被弹出的值
 */
AsyncRedis.prototype.rpop = async function (key) {
    return await new Promise((resolve) => {
        this._redis.rpop(key, function (err, res) {
            if (err) {
                logger.error("REDIS rpop %j err:%s", key, JSON.stringify(err));
            }
            return resolve({ err, res });
        });
    });
};

/**
 * 获取列表在给定位置上的单个元素
 * @param {*} key 
 * @param {*} index 给定位置 
 * @return 并返回给定位置的值
 */
AsyncRedis.prototype.lindex = async function (key, index) {
    return await new Promise((resolve) => {
        this._redis.lindex(key, index, function (err, res) {
            if (err) {
                logger.error("REDIS lindex %j %j err:%s", key, index, JSON.stringify(err));
            }
            return resolve({ err, res });
        });
    });
};

/**
 * 获取列表在给定范围上的所有值
 * @param {*} key 
 * @param {*} start 0为开头 
 * @param {*} end -1为末尾
 * @return 列表/[]
 */
AsyncRedis.prototype.lrange = async function (key, start, end) {
    return await new Promise((resolve) => {
        this._redis.lrange(key, start, end, function (err, res) {
            if (err) {
                logger.error("REDIS lrange %j %j %j err:%s", key, start, end, JSON.stringify(err));
            }
            return resolve({ err, res });
        });
    });
};

/**
 * 将列表按指定的index范围裁减
 * @param {*} key 
 * @param {*} start 0为开头 
 * @param {*} end -1为末尾
 * @return 列表
 */
AsyncRedis.prototype.ltrim = async function (key, start, end) {
    return await new Promise((resolve) => {
        this._redis.ltrim(key, start, end, function (err, res) {
            if (err) {
                logger.error("REDIS ltrim %j %j %j err:%s", key, start, end, JSON.stringify(err));
            }
            return resolve({ err, res });
        });
    });
};

/**
 * 获取列表长度
 * @param {*} key
 * @return 列表长度
 */
AsyncRedis.prototype.llen = async function (key) {
    return await new Promise((resolve) => {
        this._redis.llen(key, function (err, res) {
            if (err) {
                logger.error("REDIS llen %j err:%s", key, JSON.stringify(err));
            }
            return resolve({ err, res });
        });
    });
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
AsyncRedis.prototype.sadd = async function (key, ...values) {
    return await new Promise((resolve) => {
        this._redis.sadd(key, ...values, function (err, res) {
            if (err) {
                logger.error("REDIS err:%s sadd %j %j", JSON.stringify(err), key, ...values);
            }
            return resolve({ err, res });
        });
    });
};

/**
 * 如果给定的元素在集合中，则移除此元素
 * @param {*} key 
 * @param  {...any} values 
 * @return 1/0
 */
AsyncRedis.prototype.srem = async function (key, ...values) {
    return await new Promise((resolve) => {
        this._redis.srem(key, ...values, function (err, res) {
            if (err) {
                logger.error("REDIS err:%s srem %j %j", JSON.stringify(err), key, ...values);
            }
            return resolve({ err, res });
        });
    });
};

/**
 * 检查给定的元素是否存在于集合中
 * @param {*} key 
 * @param {*} item 
 * @return 1/0
 */
AsyncRedis.prototype.sismember = async function (key, item) {
    return await new Promise((resolve) => {
        this._redis.sismember(key, item, function (err, res) {
            if (err) {
                logger.error("REDIS sismember %j %j err:%s", key, item, JSON.stringify(err));
            }
            return resolve({ err, res });
        });
    });
};

/**
 * 返回集合包含的元素的数量
 * @param {*} key 
 * @return 返回集合包含的元素的数量
 */
AsyncRedis.prototype.scard = async function (key) {
    return await new Promise((resolve) => {
        this._redis.scard(key, function (err, res) {
            if (err) {
                logger.error("REDIS scard %j err:%s", key, JSON.stringify(err));
            }
            return resolve({ err, res });
        });
    });
};

/**
 * 返回集合中包含的所有元素
 * @param {*} key 
 * @return array(无序)/[]
 */
AsyncRedis.prototype.smembers = async function (key) {
    return await new Promise((resolve) => {
        this._redis.smembers(key, function (err, res) {
            if (err) {
                logger.error("REDIS smembers %j err:%s", key, JSON.stringify(err));
            }
            return resolve({ err, res });
        });
    });
};

/**
 * 随机地移除集合中的一个元素
 * @param {*} key
 * @return 返回被移除的元素
 */
AsyncRedis.prototype.spop = async function (key) {
    return await new Promise((resolve) => {
        this._redis.spop(key, function (err, res) {
            if (err) {
                logger.error("REDIS spop %j err:%s", key, JSON.stringify(err));
            }
            return resolve({ err, res });
        });
    });
};

/**
 * 返回集合中的多个随机元素
 * @param {*} key 
 * @param {*} num 大于集合长度返回整个集合；负数 返回绝对值的个数，绝对值大于集合长度，则会出现重复值
 * @return 列表/[]
 */
AsyncRedis.prototype.srandmember = async function (key, num) {
    return await new Promise((resolve) => {
        this._redis.srandmember(key, num, function (err, res) {
            if (err) {
                logger.error("REDIS srandmember %j %j err:%s", key, num, JSON.stringify(err));
            }
            return resolve({ err, res });
        });
    });
};

/**
 * 将元素item从source_key迁移到dest_key
 * @param {*} source_key 
 * @param {*} dest_key 
 * @param {*} item 
 * @return 1/0
 */
AsyncRedis.prototype.smove = async function (source_key, dest_key, item) {
    return await new Promise((resolve) => {
        this._redis.smove(source_key, dest_key, item, function (err, res) {
            if (err) {
                logger.error("REDIS smove %j %j %j err:%s", source_key, dest_key, item, JSON.stringify(err));
            }
            return resolve({ err, res });
        });
    });
};

/**
 * 返回那些存在于第一个集合，但不存在于其他集合的元素(差集)
 * @param {*} key 
 * @param  {...any} keys 
 * @return 包含差集成员的列表
 */
AsyncRedis.prototype.sdiff = async function (key, ...keys) {
    return await new Promise((resolve) => {
        this._redis.sdiff(key, ...keys, function (err, res) {
            if (err) {
                logger.error("REDIS err:%s sdiff %j %j", key, JSON.stringify(err), ...keys);
            }
            return resolve({ err, res });
        });
    });
};

/**
 * 将sdiff操作的结果存储到指定的键中
 * @param {*} dest_key 
 * @param {*} key 
 * @param  {...any} keys 
 * @return 结果集中的元素数量
 */
AsyncRedis.prototype.sdiffstore = async function (dest_key, key, ...keys) {
    return await new Promise((resolve) => {
        this._redis.sdiffstore(dest_key, key, ...keys, function (err, res) {
            if (err) {
                logger.error("REDIS err:%s sdiffstore %j %j %j", JSON.stringify(err), dest_key, key, ...keys);
            }
            return resolve({ err, res });
        });
    });
};

/**
 * 返回那些同时存在于所有集合中的元素(交集)
 * @param {*} key 
 * @param  {...any} keys 
 * @return 包含交集成员的列表
 */
AsyncRedis.prototype.sinter = async function (key, ...keys) {
    return await new Promise((resolve) => {
        this._redis.sinter(key, ...keys, function (err, res) {
            if (err) {
                logger.error("REDIS err:%s sinter %j %j", JSON.stringify(err), key, ...keys);
            }
            return resolve({ err, res });
        });
    });
};

/**
 * 将sinter操作的结果存储到指定的键中
 * @param {*} dest_key 
 * @param {*} key 
 * @param  {...any} keys 
 * @return 结果集中的元素数量
 */
AsyncRedis.prototype.sinterstore = async function (dest_key, key, ...keys) {
    return await new Promise((resolve) => {
        this._redis.sinterstore(dest_key, key, ...keys, function (err, res) {
            if (err) {
                logger.error("REDIS err:%s sinterstore %j %j %j", JSON.stringify(err), dest_key, key, ...keys);
            }
            return resolve({ err, res });
        });
    });
};

/**
 * 返回那些至少存在于一个集合中的元素(并集)
 * @param {*} key 
 * @param  {...any} keys 
 * @return 包含并集成员的列表
 */
AsyncRedis.prototype.sunion = async function (key, ...keys) {
    return await new Promise((resolve) => {
        this._redis.sunion(key, ...keys, function (err, res) {
            if (err) {
                logger.error("REDIS err:%s sunion %j %j", JSON.stringify(err), key, ...keys);
            }
            return resolve({ err, res });
        });
    });
};

/**
 * 将sunion操作的结果存储到指定的键中
 * @param {*} dest_key 
 * @param {*} key 
 * @param  {...any} keys 
 * @return 结果集中的元素数量
 */
AsyncRedis.prototype.sunionstore = async function (dest_key, key, ...keys) {
    return await new Promise((resolve) => {
        this._redis.sunionstore(dest_key, key, ...keys, function (err, res) {
            if (err) {
                logger.error("REDIS err:%s sunionstore %j %j %j", JSON.stringify(err), dest_key, key, ...keys);
            }
            return resolve({ err, res });
        });
    });
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
AsyncRedis.prototype.zadd = async function (key, ...scoreMember) {
    return await new Promise((resolve) => {
        this._redis.zadd(key, ...scoreMember, function (err, res) {
            if (err) {
                logger.error("REDIS err:%s zadd %j %j", JSON.stringify(err), key, ...scoreMember);
            }
            return resolve({ err, res });
        });
    });
};

/**
 * 如果给定成员存在于有序集合，则移除
 * @param {*} key 
 * @param  {...any} member 
 * @return 
 */
AsyncRedis.prototype.zrem = async function (key, ...member) {
    return await new Promise((resolve) => {
        this._redis.zrem(key, ...member, function (err, res) {
            if (err) {
                logger.error("REDIS err:%s zrem %j %j", JSON.stringify(err), key, ...member);
            }
            return resolve({ err, res });
        });
    });
};

/**
 * 获取一个有序集合中的成员数量
 * @param {*} key 
 * @return 有序集的元素个数
 */
AsyncRedis.prototype.zcard = async function (key) {
    return await new Promise((resolve) => {
        this._redis.zcard(key, function (err, res) {
            if (err) {
                logger.error("REDIS zcard %j err:%s", key, JSON.stringify(err));
            }
            return resolve({ err, res });
        });
    });
};

/**
 * 有序集合中对指定成员的分数加上增量 increment
 * @param {*} key 
 * @param {*} incr 
 * @param {*} member 
 * @return 变化后的值
 */
AsyncRedis.prototype.zincrby = async function (key, incr, member) {
    return await new Promise((resolve) => {
        this._redis.zincrby(key, incr, member, function (err, res) {
            if (err) {
                logger.error("REDIS zincrby %j %j %j err:%s", key, incr, member, JSON.stringify(err));
            }
            return resolve({ err, res });
        });
    });
};

/**
 * 获取成员分数
 * @param {*} key 
 * @param {*} member 
 * @return 分数
 */
AsyncRedis.prototype.zscore = async function (key, member) {
    return await new Promise((resolve) => {
        this._redis.zscore(key, member, function (err, res) {
            if (err) {
                logger.error("REDIS zscore %j %j err:%s", key, member, JSON.stringify(err));
            }
            return resolve({ err, res });
        });
    });
};

/**
 * 获取分数区间在min~max的成员个数
 * @param {*} key 
 * @param {*} min 
 * @param {*} max 
 * @return 成员数量
 */
AsyncRedis.prototype.zcount = async function (key, min, max) {
    return await new Promise((resolve) => {
        this._redis.zcount(key, min, max, function (err, res) {
            if (err) {
                logger.error("REDIS zcount %j %j %j err:%s", key, min, max, JSON.stringify(err));
            }
            return resolve({ err, res });
        });
    });
};

/**
 * 返回有序集中指定成员的排名 从小到大
 * @param {*} key 
 * @param {*} member 
 * @return 排名
 */
AsyncRedis.prototype.zrank = async function (key, member) {
    return await new Promise((resolve) => {
        this._redis.zrank(key, member, function (err, res) {
            if (err) {
                logger.error("REDIS zrank %j %j err:%s", key, member, JSON.stringify(err));
            }
            return resolve({ err, res });
        });
    });
};

/**
 * 返回有序集中指定成员的排名 从大到小
 * @param {*} key 
 * @param {*} member 
 * @return 排名
 */
AsyncRedis.prototype.zrevrank = async function (key, member) {
    return await new Promise((resolve) => {
        this._redis.zrevrank(key, member, function (err, res) {
            if (err) {
                logger.error("REDIS zrevrank %j %j err:%s", key, member, JSON.stringify(err));
            }
            return resolve({ err, res });
        });
    });
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
AsyncRedis.prototype.zrange = async function (key, from, to, withscores) {
    return await new Promise((resolve) => {
        if (withscores) {
            this._redis.zrange(key, from, to, "withscores", function (err, res) {
                if (err) {
                    logger.error("REDIS zrange %j %j %j %j err:%s", key, from, to, withscores, JSON.stringify(err));
                }
                return resolve({ err, res });
            });
        }
        else {
            this._redis.zrange(key, from, to, function (err, res) {
                if (err) {
                    logger.error("REDIS zrange %j %j %j %j err:%s", key, from, to, withscores, JSON.stringify(err));
                }
                return resolve({ err, res });
            });
        }
    });
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
AsyncRedis.prototype.zrevrange = async function (key, from, to, withscores) {
    return await new Promise((resolve) => {
        if (withscores) {
            this._redis.zrevrange(key, from, to, "withscores", function (err, res) {
                if (err) {
                    logger.error("REDIS zrevrange %j %j %j %j err:%s", key, from, to, withscores, JSON.stringify(err));
                }
                return resolve({ err, res });
            });
        }
        else {
            this._redis.zrevrange(key, from, to, function (err, res) {
                if (err) {
                    logger.error("REDIS zrevrange %j %j %j %j err:%s", key, from, to, withscores, JSON.stringify(err));
                }
                return resolve({ err, res });
            });
        }

    });
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
AsyncRedis.prototype.zrangebyscore = async function (key, min, max, offset, count, withscores) {
    return await new Promise((resolve) => {
        if (withscores) {
            this._redis.zrangebyscore(key, min, max, 'limit', offset, count, "withscores", function (err, res) {
                if (err) {
                    logger.error("REDIS zrangebyscore %j %j %j %j %j %j err:%s", key, min, max, offset, count, withscores, JSON.stringify(err));
                }
                return resolve({ err, res });
            });
        }
        else {
            this._redis.zrangebyscore(key, min, max, 'limit', offset, count, function (err, res) {
                if (err) {
                    logger.error("REDIS zrangebyscore %j %j %j %j %j %j err:%s", key, min, max, offset, count, withscores, JSON.stringify(err));
                }
                return resolve({ err, res });
            });
        }

    });
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
AsyncRedis.prototype.zrevrangebyscore = async function (key, max, min, offset, count, withscores) {
    return await new Promise((resolve) => {
        if (withscores) {
            this._redis.zrevrangebyscore(key, max, min, 'limit', offset, count, "withscores", function (err, res) {
                if (err) {
                    logger.error("REDIS zrevrangebyscore %j %j %j %j %j %j err:%s", key, max, min, offset, count, withscores, JSON.stringify(err));
                }
                return resolve({ err, res });
            });
        }
        else {
            this._redis.zrevrangebyscore(key, max, min, 'limit', offset, count, function (err, res) {
                if (err) {
                    logger.error("REDIS zrevrangebyscore %j %j %j %j %j %j err:%s", key, max, min, offset, count, withscores, JSON.stringify(err));
                }
                return resolve({ err, res });
            });
        }
    });
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
AsyncRedis.prototype.hset = async function (key, field, value) {
    return await new Promise((resolve) => {
        this._redis.hset(key, field, value, function (err, res) {
            if (err) {
                logger.error("REDIS hset %j %j %j err:%s", key, field, value, JSON.stringify(err));
            }
            return resolve({ err, res });
        });
    });
};

/**
 * 获取指定哈希表键的值
 * @param {*} key 
 * @param {*} field 
 * @return value/null
 */
AsyncRedis.prototype.hget = async function (key, field) {
    return await new Promise((resolve) => {
        this._redis.hget(key, field, function (err, res) {
            if (err) {
                logger.error("REDIS hget %j %j err:%s", key, field, JSON.stringify(err));
            }
            return resolve({ err, res });
        });
    });
};

/**
 * 同时将多个 field-value (字段-值)对设置到哈希表中
 * @param {*} key 
 * @param  {...any} fieldValue field,value至少需要一对
 * @return OK
 */
AsyncRedis.prototype.hmset = async function (key, ...fieldValue) {
    return await new Promise((resolve) => {
        this._redis.hmset(key, ...fieldValue, function (err, res) {
            if (err) {
                logger.error("REDIS err:%s hmset %j %j", JSON.stringify(err), key, ...fieldValue);
            }
            return resolve({ err, res });
        });
    });
};

/**
 * 从哈希表里面获取一个或多个键的值
 * @param {*} key 
 * @param  {...any} field 
 * @return [value,value,...]/[null,null,...]
 */
AsyncRedis.prototype.hmget = async function (key, ...field) {
    return await new Promise((resolve) => {
        this._redis.hmget(key, ...field, function (err, res) {
            if (err) {
                logger.error("REDIS err:%s hmget %j %j", JSON.stringify(err), key, ...field);
            }
            return resolve({ err, res });
        });
    });
};

/**
 * 删除一个或多个哈希表字段
 * @param {*} key 
 * @param  {...any} field 
 * @return N/0
 */
AsyncRedis.prototype.hdel = async function (key, ...field) {
    return await new Promise((resolve) => {
        this._redis.hdel(key, ...field, function (err, res) {
            if (err) {
                logger.error("REDIS err:%s hdel %j %j", JSON.stringify(err), key, ...field);
            }
            return resolve({ err, res });
        });
    });
};

/**
 * 获取哈希表中字段的数量
 * @param {*} key 
 * @return N/0
 */
AsyncRedis.prototype.hlen = async function (key) {
    return await new Promise((resolve) => {
        this._redis.hlen(key, function (err, res) {
            if (err) {
                logger.error("REDIS hlen %j %j err:%s", key, JSON.stringify(err));
            }
            return resolve({ err, res });
        });
    });
};

/**
 * 查看哈希表 key 中，指定的字段是否存在
 * @param {*} key 
 * @param {*} field 
 * @return 1/0
 */
AsyncRedis.prototype.hexists = async function (key, field) {
    return await new Promise((resolve) => {
        this._redis.hexists(key, field, function (err, res) {
            if (err) {
                logger.error("REDIS hexists %j %j %j err:%s", key, field, JSON.stringify(err));
            }
            return resolve({ err, res });
        });
    });
};

/**
 * 获取所有哈希表中的字段
 * @param {*} key 
 * @return 列表/[]
 */
AsyncRedis.prototype.hkeys = async function (key) {
    return await new Promise((resolve) => {
        this._redis.hkeys(key, function (err, res) {
            if (err) {
                logger.error("REDIS hkeys %j %j err:%s", key, JSON.stringify(err));
            }
            return resolve({ err, res });
        });
    });
};

/**
 * 获取哈希表中所有值
 * @param {*} key 
 * @return 列表/[]
 */
AsyncRedis.prototype.hvals = async function (key) {
    return await new Promise((resolve) => {
        this._redis.hvals(key, function (err, res) {
            if (err) {
                logger.error("REDIS hvals %j %j err:%s", key, JSON.stringify(err));
            }
            return resolve({ err, res });
        });
    });
};

/**
 * 获取在哈希表中指定 key 的所有字段和值
 * @param {*} key 
 * @return {key:value,key:value,...}/null
 */
AsyncRedis.prototype.hgetall = async function (key) {
    return await new Promise((resolve) => {
        this._redis.hgetall(key, function (err, res) {
            if (err) {
                logger.error("REDIS hgetall %j %j err:%s", key, JSON.stringify(err));
            }
            return resolve({ err, res });
        });
    });
};

/**
 * 为哈希表 key 中的指定字段的整数值加上增量 increment 
 * @param {*} key 
 * @param {*} field 
 * @param {*} incr 
 * @return 变更后的值
 */
AsyncRedis.prototype.hincrby = async function (key, field, incr) {
    return await new Promise((resolve) => {
        this._redis.hincrby(key, field, incr, function (err, res) {
            if (err) {
                logger.error("REDIS hincrby %j %j %j %j err:%s", key, field, incr, JSON.stringify(err));
            }
            return resolve({ err, res });
        });
    });
};

/**
 * 为哈希表 key 中的指定字段的浮点数值加上增量 increment
 * @param {*} key 
 * @param {*} field 
 * @param {*} incr 
 * @return 变更后的值
 */
AsyncRedis.prototype.hincrbyfloat = async function (key, field, incr) {
    return await new Promise((resolve) => {
        this._redis.hincrbyfloat(key, field, incr, function (err, res) {
            if (err) {
                logger.error("REDIS hincrbyfloat %j %j %j %j err:%s", key, field, incr, JSON.stringify(err));
            }
            return resolve({ err, res });
        });
    });
};
