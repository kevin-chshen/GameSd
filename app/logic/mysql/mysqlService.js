/**
 * @description mysql服务
 * @author linjs
 * @date 2020/03/30
 */

const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const bearcat = require('bearcat');
const path = require('path');
const Sequelize = require('sequelize');
const code = require('@code');
const util = require('@util');
const fs = require('fs');
const mysql = require('mysql2');

const MysqlService = function () {
    this.$id = 'logic_MysqlService';
    this.app = null;
    this.sequelize = null;
    this.checkSequelize = null;
};

module.exports = MysqlService;
bearcat.extend('logic_MysqlService', 'logic_BaseService');

/**
 * 初始化服务
 */
MysqlService.prototype.init = async function () {
    const config = this.app.SystemConfig.mysql;

    const conn = mysql.createConnection({
        host: config.host,
        user: config.username,
        password: config.password,
        port: config.port,
        database: config.database,
        multipleStatements: true
    });
    conn.connect();
    // 初始化检测
    await this.initMysqlTables(conn);
    // 再处理sql增量
    await this.execSqlIncrement(conn);
    conn.close();

    await this.loadSequelize(config);

    await this.initDict();
};

/**
 * 加载sequelize
 */
MysqlService.prototype.loadSequelize = async function (config) {
    this.sequelize = new Sequelize(config.database, config.username, config.password, {
        host: config.host,
        dialect: 'mysql',
        pool: {
            max: 5,
            min: 0,
            idle: 30000
        },
        logging: false,     // 关闭mysql的日志输出
        // 也可以输出到pomelo的log4js
        // logging: function (sql) {
        //     logger.info(sql);
        // },
    });

    // 载入所有表格定义
    await loadModel(this, this.app, this.sequelize);

    logger.info(`mysql sequelize load ok ！！！`);
};

MysqlService.prototype.afterStartAll = async function () {
    // // 服务器启动后定时检测 this.sequelize
    // this.checkSequelize = setTimeout(() => {
    //     if (!this.sequelize) {
    //         this.loadSequelize(this.app.SystemConfig.mysql);
    //     }
    // }, 60 * 1000);
}

/**
 * 关闭服务
 */
MysqlService.prototype.shutdown = async function (_reason) {
    // clearTimeout(this.checkSequelize);
    // this.checkSequelize = null;
    await this.sequelize.close();
};

/**
 * 加载sql model
 * @param {Object} app pomelo app
 * @param {Object} sequelize 
 */
async function loadModel(target, app, sequelize) {
    const modelPath = path.join(app.getBase(), 'app/dao/mysql');
    const filter = util.file.extFilter('.js');
    const cutter = util.file.fileNameCutter('.js');
    const modelFiles = await util.file.walk(modelPath, filter, cutter);
    for (const file of modelFiles) {
        // 去掉mysql前缀并将第一个字母改成小写
        target[removePrefix(file)] = require(path.join(modelPath, file))(sequelize);
    }
}

/**
 * 移除文件名中的mysql前缀,并将首字母
 * @param {String} name 文件名称
 */
function removePrefix(name) {
    if (name.startsWith('mysql')) {
        name = name.substring(5);
    }
    return util.str.lowerFirst(name);
}
/**
 * 初始化 mysql日志库
 */
MysqlService.prototype.initMysqlTables = async function (conn) {
    logger.info(`mysql table 检测开始...`);
    // sql_version 不存在执行 sql_version.sql
    const exists = await this.sqlQuery(conn, 'select count(*) as count from information_schema.tables where table_name=\'sql_version\' and TABLE_SCHEMA=(select database())');
    if (!exists || exists.length <= 0 || exists[0].count <= 0) {
        logger.info(`sql_version 不存在，正在执行 sql_version.sql ...`);
        const sql = this.readFile('../../../sql/', 'sql_version');
        await this.sqlQuery(conn, sql);
        logger.info(`sql_version.sql 执行完毕！！！`);
    }
    // sql_version 无数据 执行 dict.sql, log.sql 初始化所有表及数据
    const dbList = await this.sqlQuery(conn, 'select * from sql_version');
    if (!dbList || dbList.length <= 0) {
        logger.info(`无sql版本数据，正在执行 dict.sql ...`);
        const sql1 = this.readFile('../../../sql/', 'dict');
        await this.sqlQuery(conn, sql1);
        logger.info(`dict.sql 执行完毕！！！`);
        logger.info(`无sql版本数据，正在执行 log.sql ...`);
        const sql2 = this.readFile('../../../sql/', 'log');
        await this.sqlQuery(conn, sql2);

        const insertSql = util.format.format('insert into sql_version(version,happend_time) values(\'%s\',%d)', code.system.MYSQL_VERSION, util.time.nowSecond());
        await this.sqlQuery(conn, insertSql);

        logger.info(`log.sql 执行完毕！！！`);
    }
    logger.info(`mysql table 检测或处理完毕！！！`);
};
/**
 * 执行版本sql增量
 * @param {Object} config 配置
 */
MysqlService.prototype.execSqlIncrement = async function (conn) {
    logger.info(`sql增量差异检测开始 ...`);
    // 获取最大版本
    const result = await this.sqlQuery(conn, 'select version from sql_version order by id desc limit 1');
    if (result.length <= 0) {
        logger.error(`sqlQuery sql_version result is []`);
        return;
    }
    const version = result[0].version;
    const oldNum = this.getVersionNum(version);
    // 获取当前版本
    const newNum = this.getVersionNum(code.system.MYSQL_VERSION);
    // 判断版本差异
    if (oldNum < 0 || newNum < 0 || oldNum >= newNum) {
        logger.info(`sql增量无版本差异: old:${version} ${oldNum}, new:${code.system.MYSQL_VERSION} ${newNum}`);
        return;
    }
    logger.info(`sql增量差异版本 oldVer:`, version, 'newVer:', code.system.MYSQL_VERSION);
    // 获取所有sql文件 X.X.X.sql
    const sqlDirPath = path.resolve(__dirname, '../../../sql/change/');
    const fileList = fs.readdirSync(sqlDirPath, 'utf-8');
    let versionList = fileList.map((fileName) => {
        return fileName.split('.sql').join('');
    });
    versionList = versionList.sort();

    // 获取满足条件的版本
    const changeList = versionList.filter((v) => {
        const num = this.getVersionNum(v);
        return (num >= 0 && num > oldNum && num <= newNum);
    });
    if (changeList.length <= 0) {
        logger.info(` not increment version ${changeList}`);
        return;
    }
    logger.info(`sql增量差异文件名`, changeList);
    // 读取版本sql文件,整合sql 按版本顺序
    let allText = '';
    for (let i = 0; i < changeList.length; i++) {
        const sql = this.readFile('../../../sql/change/', changeList[i]);
        allText += sql;

    }
    if (allText.length > 0) {
        logger.info(`sql增量差异正在执行 ...`);
        // 执行增量所有sql
        await this.sqlQuery(conn, allText);
        logger.info(`sql增量差异执行完毕！！！`);
    }
    const insertSql = util.format.format('insert into sql_version(version,happend_time) values(\'%s\',%d)', code.system.MYSQL_VERSION, util.time.nowSecond());
    await this.sqlQuery(conn, insertSql);

    logger.info(`sql增量检测或处理完毕！！！`);
};
/**
 * 读取sql文件信息
 */
MysqlService.prototype.readFile = function (relativePath, sqlName) {
    const sqlPath = path.resolve(__dirname, relativePath + sqlName + '.sql');
    return fs.readFileSync(sqlPath, 'utf-8');
};

/**
 * 处理同步操作sql
 * @param {Object} conn
 * @param {String} sql
 * @returns {Array | Object}
 */
MysqlService.prototype.sqlQuery = async function (conn, sql) {
    return new Promise((resolve, reject) => {
        conn.query(sql, (err, result) => {
            if (err) {
                logger.error(`sqlQuery err sql:${sql}, err:${err}`);
                return reject(err);
            }
            return resolve(result);
        });
    });
};
/**
 * 获取版本号对应数值
 * @param {String} version 1.0.1->100001 999.999.999->999999999
 * @returns {Number}
 */
MysqlService.prototype.getVersionNum = function (version) {
    const list = version.split('.');
    if (list.length != 3) {
        return -1;
    }
    let num = '';
    for (let i = 0; i < list.length; i++) {
        num = num + (Array(3).join("0") + list[i]).slice(-3);
    }
    return Number(num);
};


MysqlService.prototype.initDict = async function(){
    // 检测 行为字典表和道具字典表 是否有新数据 ，有则增加
    await this.initDictAction(this.app);
    await this.initDictItem(this.app);
    await this.initDictLinkStep(this.app);
}
/**
 * sql表数据增量
 */
/**
 * 检测行为字典新增数据
 */
MysqlService.prototype.initDictAction = async function (app) {
    const allList = await this.getDictLogAll(code.log.LOG_TYPE_DICT_ACTION);
    const logList = [];
    for (const config of app.Config.BonusReason.values()) {
        const new1 = { action_id: config.Id, action_name: config.Name, action_type_id: 3, level_req: 0 };
        const new2 = { action_id: config.Id, action_name: config.Name, action_type_id: 4, level_req: 0 };
        if (!this.isExists(allList, new1)) {
            logList.push(new1);
        }
        if (!this.isExists(allList, new2)) {
            logList.push(new2);
        }
    }
    // 运营活动actionId
    for (const config of app.Config.OperateBaseActivity.values()) {
        const newOP = { action_id: config.Id, action_name: config.Name, action_type_id: 9, level_req: 0 };
        if (!this.isExists(allList, newOP)) {
            logList.push(newOP);
        }
    }
    // 活动actionId
    for (const config of app.Config.ActivityTime.values()) {
        const newA = { action_id: config.Id, action_name: config.Name, action_type_id: 5100, level_req: 0 };
        if (!this.isExists(allList, newA)) {
            logList.push(newA);
        }
    }
    // 任务actionId
    for (const config of app.Config.Task.values()) {
        let action_type = 1500;
        if (config.Type == code.mission.MISSION_TYPE.MAIN) {
            action_type = 1501;
        }
        else if (config.Type == code.mission.MISSION_TYPE.DAILY) {
            action_type = 1502;
        }
        else if (config.Type == code.mission.MISSION_TYPE.ACHIEVEMENT) {
            action_type = 1503;
        }
        const newA = { action_id: config.Id, action_name: config.Describe, action_type_id: action_type, level_req: 0 };
        if (!this.isExists(allList, newA)) {
            logList.push(newA);
        }
    }
    // 副本actionId
    for (const config of app.Config.Checkpoint.values()) {
        const newA = { action_id: config.Id, action_name: config.Name, action_type_id: 5, level_req: 0 };
        if (!this.isExists(allList, newA)) {
            logList.push(newA);
        }
    }
    // 其他actionId
    // const actionList = [];
    // for (const task of actionList) {
    //     if (!this.isExists(allList, task)) {
    //         logList.push(task);
    //     }
    // }
    if (logList.length > 0) {
        await this.addBulkLog(code.log.LOG_TYPE_DICT_ACTION, logList);
        logger.info("new add dict action", logList.length);
    }
};
/**
 * 检测道具字典新增数据
 */
MysqlService.prototype.initDictItem = async function (app) {
    const allList = await this.getDictLogAll(code.log.LOG_TYPE_DICT_ITEM);
    const logList = [];
    // 普通物品 0
    for (const config of app.Config.Item.values()) {
        const new1 = { item_id: config.Id, item_name: config.Name, item_type: 0, item_type_name: '普通道具', quality: config.Color, level_req: 0 };
        if (!this.isExists(allList, new1)) {
            logList.push(new1);
        }
    }
    // 商店物品 1
    for (const config of app.Config.Shop.values()) {
        const new2 = { item_id: config.Id, item_name: config.NameBoy, item_type: 1, item_type_name: '商店道具', quality: 1, level_req: 0 };
        if (!this.isExists(allList, new2)) {
            logList.push(new2);
        }
    }
    // 神秘商店物品 2
    for (const config of app.Config.MysteryShopJackpot.values()) {
        const new3 = { item_id: config.Id, item_name: config.Name, item_type: 2, item_type_name: '神秘商店道具', quality: 1, level_req: 0 };
        if (!this.isExists(allList, new3)) {
            logList.push(new3);
        }
    }
    if (logList.length > 0) {
        await this.addBulkLog(code.log.LOG_TYPE_DICT_ITEM, logList);
        logger.info("new add dict item", logList.length);
    }

};
/**
 * 检测事件流程字典表
 * (10001,10002,'签约主播文文',0,'',1),
 */
MysqlService.prototype.initDictLinkStep = async function (app) {
    const allList = await this.getDictLogAll(code.log.LOG_TYPE_DICT_LINK_STEP);
    const logList = [];
    for (const config of app.Config.Task.values()) {
        if (config.Type == code.mission.MISSION_TYPE.MAIN) {
            const new1 = { step_id: config.Id, next_step_id: config.PostpositionId, step_name: config.Describe, order_id: 0, step_section: '', step_type: 1 };
            if (!this.isExists(allList, new1)) {
                logList.push(new1);
            }
        }
    }
    if (logList.length > 0) {
        await this.addBulkLog(code.log.LOG_TYPE_DICT_LINK_STEP, logList);
        logger.info("new add dict link step", logList.length);
    }
};
MysqlService.prototype.isExists = function (list, obj) {
    if (list.length <= 0) {
        return false;
    }
    return list.some(function (info) {
        if (!info || !obj) {
            return false;
        }
        let equal = true;
        for (const [k, v] of Object.entries(info.dataValues)) {
            if (v != obj[k]) {
                equal = false;
                break;
            }
        }
        return equal;
    });
};
/**
 * 获取表中所有数据
 */
MysqlService.prototype.getDictLogAll = async function (type) {
    const Model = this.app.Mysql[type];
    return await Model.findAll({ include: [{ all: true }] });
};

/**
 * 新增批量日志
 * @param {String} type 日志类型
 * @param {Array} records 日志[{...},{...},...]
 * @param {Function} cb 回调函数
 */
MysqlService.prototype.addBulkLog = function (type, records) {
    const Model = this.app.Mysql[type];
    Model.bulkCreate(records).then().catch((err) => {
        logger.error(`LogRemote addLog [${type}:${JSON.stringify(records)}] with error:${err}`);
    });
};