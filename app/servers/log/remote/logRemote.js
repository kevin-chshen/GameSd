/**
 * @description 日志存储服务
 * @author linjs
 * @date 2020/03/13
 */

const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const code = require('@code');

module.exports = function (app) {
    return new LogRemote(app);
};

const LogRemote = function (app) {
    this.app = app;
};

/**
 * 新增日志
 * @param {String} type 日志类型
 * @param {Json} value 日志的值
 * @param {Function} cb 回调函数
 */
LogRemote.prototype.addLog = function (type, value, cb) {
    if (this.app.Mysql && this.app.Mysql[type]) {
        this.app.Mysql[type].create(value).then().catch((err) => {
            logger.error(`LogRemote addLog [${type}:${JSON.stringify(value)}] with error:${err}`);
        });
        if (type == code.log.LOG_TYPE_CHAT) {
            this.app.ChatDump.dumpChat(value);
        }
    }
    cb(null, true);
};
/**
 * 新增批量日志
 * @param {String} type 日志类型
 * @param {Array} records 日志[{...},{...},...]
 * @param {Function} cb 回调函数
 */
LogRemote.prototype.addBulkLog = function (type, records, cb) {
    if (this.app.Mysql && this.app.Mysql[type]) {
        const Model = this.app.Mysql[type];
        Model.bulkCreate(records).then().catch((err) => {
            logger.error(`LogRemote addLog [${type}:${JSON.stringify(records)}] with error:${err}`);
        });
    }
    cb(null, true);
};

/**
 * 更新某个log,不存在则创建,存在则更新
 * @param {String} type 日志类型
 * @param {Json} value 要更新的值
 * @param {Object} where 查找条件{id:***}
 * @param {Function} cb 回调函数
 */
LogRemote.prototype.updateLog = function (type, value, where, cb) {
    if (this.app.Mysql && this.app.Mysql[type]) {
        const Model = this.app.Mysql[type];
        Model.findOrCreate({
            where: where,
            defaults: value,
        }).then(([oldValue, created]) => {
            if (created === false) {
                oldValue.update(value);
            }
        }).catch(err => {
            logger.error(`LogRemote updateLog [${type}:${JSON.stringify(where)}:${JSON.stringify(value)}] with error:${err}`);
        });
    }
    cb(null, true);
};

/**
 * 更新某个log,存在则更新
 * @param {String} type 日志类型
 * @param {Json} value 要更新的值
 * @param {Object} where 查找条件{id:***}
 * @param {Function} cb 回调函数
 */
LogRemote.prototype.updateOneLog = function (type, value, where, cb) {
    if (this.app.Mysql && this.app.Mysql[type]) {
        const Model = this.app.Mysql[type];
        Model.findOne({
            where: where,
            defaults: value,
        }).then((oldValue) => {
            if (oldValue) {
                oldValue.update(value);
            }
        }).catch(err => {
            logger.error(`LogRemote updateOneLog [${type}:${JSON.stringify(where)}:${JSON.stringify(value)}] with error:${err}`);
        });
    }
    cb(null, true);
};
