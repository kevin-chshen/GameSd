/**
 * @description 运营日志相关的字典导出工具
 * 1.将dict文件夹底下的配置插入到数据库中
 * 2.dump这些表格,生成dict.sql,放入svn版本中,随版本一起更新
 * 3.部分表格需要从策划配置中读取
 * 4.相关表格作用,参考http://open2.4399houtai.com/doc/d09cce54549f6013fae9cdc339831aa6/list/e6809071e7cab39622f8e93c36f44bca/#36_3.%20%E6%95%B0%E6%8D%AE%E5%AD%97%E5%85%B8
 * @author linjs
 * @date 2020/05/12
 */

const path = require('path');
const mysql = require('mysql2/promise');
const exec = require('child_process').exec;

/**
 * 开始导出字典
 */
async function exportDict() {
    const baseDir = path.dirname(process.argv[1]);
    // 连接数据库
    const configPath = path.join(baseDir, '../../config', process.argv[2], 'system.json');
    const mysqlConfig = require(configPath).mysql;
    console.info(`目标数据库配置:${JSON.stringify(mysqlConfig)}`);
    const connect = await connectMysql(mysqlConfig);
    connect.connect();
    // 导出json
    console.info(`开始导出json文件`);
    const dictDir = path.join(baseDir, 'dict');
    await exportJson(connect, dictDir);
    // 从配置表导出:dict_action,dict_item
    console.info(`开始导出dict_action`);
    const dataDir = path.join(baseDir, '../../config/data');
    await exportAction(connect, dataDir, dictDir);
    console.info(`开始导出dict_item`);
    await exportItem(connect, dataDir, dictDir);
    console.info(`开始导出dict_link_step`);
    await exportLinkStep(connect, dataDir, dictDir);
    // 关闭连接
    connect.end();

    // 导出文件到dict.sql
    console.info(`开始dump到dict.sql`);
    const sqlPath = path.join(baseDir, '../../sql', 'dict.sql');
    await dumpSql(process.argv[3], mysqlConfig, sqlPath);
}

exportDict().then(() => {
    console.log('导出成功');
    process.exit(0);
}).catch(err => {
    console.log(`导出失败: ${err} ${err.stack}`);
    process.exit(1);
});

/**
 * 连接数据库
 * @param {Object} config mysql数据库配置
 */
async function connectMysql(config) {
    return await mysql.createConnection({
        host: config.host,
        port: config.port,
        user: config.username,
        password: config.password,
        database: config.database,
        charset: 'utf8mb4'
    });
}

// 将dict文件夹底下的文件内容导出到mysql
// 需要导出的文件
const dictNameVec = [
    'dict_action_type',
    'dict_chat_channel',
    'dict_color',
    'dict_reason',
    'dict_shop_type',
    'dict_value_type',
];
/**
 * 导出json实例到数据库
 * @param {Object} connect mysql数据库连接
 * @param {String} dictDir json目录
 */
async function exportJson(connect, dictDir) {
    return await Promise.all(dictNameVec.map(async name => {
        // 先删除原来的内容
        await connect.execute(`TRUNCATE ${name};`);
        const jsonPath = path.join(dictDir, name + '.json');
        const json = require(jsonPath);
        const sql = makeSql(name, json);
        return await Promise.all(Object.values(json).map(async info => {
            return await connect.execute(sql, Object.values(info));
        }));
    }));
}

/**
 * 生成insert语句
 * @param {String} name 表名
 * @param {Object} json 对应的json数据
 */
function makeSql(name, json) {
    // 取出配置中的第一个
    const first = Object.values(json)[0];
    const keyNames = Object.keys(first);
    const params = keyNames.map(() => '?');
    return `INSERT INTO ${name} (${keyNames.join(',')}) VALUES (${params.join(',')});`;
}

/**
 * 生成insert语句 批量插入sql
 * @param {String} name 表名
 * @param {Object} json 对应的json数据
 */
function makeSqlBatch(name, json) {
    // 取出配置中的第一个
    const first = Object.values(json)[0];
    const keyNames = Object.keys(first);
    return `INSERT INTO ${name} (${keyNames.join(',')}) VALUES ?;`;
}
/**
 * 导出行为字典配置
 * @param {Object} connect mysql连接
 * @param {String} dataDir 策划数据配置目录
 * @param {String} dictDir json数据目录
 */
async function exportAction(connect, dataDir, dictDir) {
    // 先删除原来的数据
    await connect.execute(`TRUNCATE dict_action;`);

    const reasonDict = require(path.join(dictDir, 'dict_action.json'));
    // INSERT INTO dict_action(`action_id`,`action_name`,`action_type_id`, `level_req`) VALUES ?
    const sql = makeSqlBatch('dict_action', reasonDict);

    // 读取reason配置
    const reasonVec = require(path.join(dataDir, 'BonusReason.json'));
    const reasonList = [];
    for (const reason of Object.values(reasonVec)) {
        reasonList.push([reason.Id, reason.Name, 3, 0]);
        reasonList.push([reason.Id, reason.Name, 4, 0]);
    }
    await connect.query(sql, [reasonList]);
    console.log('insert BonusReason to dict_action ', reasonList.length);

    const operateVec = require(path.join(dataDir, 'OperateBaseActivity.json'));
    const operateList = [];
    for (const data of Object.values(operateVec)) {
        operateList.push([data.Id, data.Name, 9, 0]);
    }
    await connect.query(sql, [operateList]);
    console.log('insert OperateBaseActivity to dict_action ', operateList.length);

    const activityVec = require(path.join(dataDir, 'ActivityTime.json'));
    const activityList = [];
    for (const data of Object.values(activityVec)) {
        activityList.push([data.Id, data.Name, 5100, 0]);
    }
    await connect.query(sql, [activityList]);
    console.log('insert ActivityTime to dict_action ', activityList.length);

    const taskVec = require(path.join(dataDir, 'Task.json'));
    const taskList = [];
    for (const data of Object.values(taskVec)) {
        let action_type = 1500;
        if (data.Type == 1) {
            action_type = 1501;
        }
        else if (data.Type == 2) {
            action_type = 1502;
        }
        else if (data.Type == 3) {
            action_type = 1503;
        }
        taskList.push([data.Id, data.Describe, action_type, 0]);
    }
    await connect.query(sql, [taskList]);
    console.log('insert Task to dict_action ', taskList.length);

    const checkPointVec = require(path.join(dataDir, 'Checkpoint.json'));
    const checkPointList = [];
    for (const data of Object.values(checkPointVec)) {
        checkPointList.push([data.Id, data.Name, 5, 0]);
    }
    await connect.query(sql, [checkPointList]);
    console.log('insert Checkpoint to dict_action ', checkPointList.length);

}
/**
 * 导出物品配置
 * @param {Object} connect mysql连接
 * @param {String} dataDir 策划数据配置目录
 * @param {String} dictDir json数据目录
 */
async function exportItem(connect, dataDir, dictDir) {
    // 先删除原来的数据
    await connect.execute(`TRUNCATE dict_item;`);
    // 读取物品配置
    const itemDict = require(path.join(dictDir, 'dict_item.json'));
    const sql = makeSqlBatch('dict_item', itemDict);

    const itemVec = require(path.join(dataDir, 'Item.json'));
    const itemList = [];
    for (const data of Object.values(itemVec)) {
        itemList.push([data.Id, data.Name, 0, '普通道具', data.Color, 0]);
    }
    await connect.query(sql, [itemList]);
    console.log('insert Item to dict_item ', itemList.length);

    const shopVec = require(path.join(dataDir, 'Shop.json'));
    const shopList = [];
    for (const data of Object.values(shopVec)) {
        shopList.push([data.Id, data.NameBoy, 1, '商店道具', 1, 0]);
    }
    await connect.query(sql, [shopList]);
    console.log('insert Shop to dict_item ', shopList.length);

    const mysteryShopVec = require(path.join(dataDir, 'MysteryShopJackpot.json'));
    const mysteryShopList = [];
    for (const data of Object.values(mysteryShopVec)) {
        mysteryShopList.push([data.Id, data.Name, 2, '神秘商店道具', 1, 0]);
    }
    await connect.query(sql, [mysteryShopList]);
    console.log('insert MysteryShopJackpot to dict_item ', mysteryShopList.length);
}
/**
 * 导出事件流程配置
 * @param {Object} connect mysql连接
 * @param {String} dataDir 策划数据配置目录
 * @param {String} dictDir json数据目录
 */
async function exportLinkStep(connect, dataDir, dictDir) {
    await connect.execute(`TRUNCATE dict_link_step;`);
    const linkStepDict = require(path.join(dictDir, 'dict_link_step.json'));
    const sql = makeSqlBatch('dict_link_step', linkStepDict);

    const taskVec = require(path.join(dataDir, 'Task.json'));
    const taskList = [];
    for (const data of Object.values(taskVec)) {
        if (data.Type == 1) {
            taskList.push([data.Id, data.PostpositionId, data.Describe, 0, '', 1]);
        }
    }
    await connect.query(sql, [taskList]);
    console.log('insert Task to dict_link_step ', taskList.length);
}

// 需要导出的文件
const dumpTableName = [
    ...dictNameVec,
    'dict_action',
    'dict_item',
    'dict_link_step',
];

/**
 * 生成dict.sql文件
 * @param {String} dumpCmd dump命令
 * @param {Object} config mysql配置
 * @param {String} sqlPath dict.sql的路径
 */
async function dumpSql(dumpCmd, config, sqlPath) {
    const cmd = `${dumpCmd} --skip-add-locks -h${config.host} -P${config.port} -u${config.username} -p${config.password} ${config.database} ${dumpTableName.join(' ')} > ${sqlPath}`;
    return new Promise((resolve) => {
        exec(cmd, function (err, stdout, stderr) {
            if (err) {
                console.err(`dump error:${err} ${stderr}`);
                resolve(err);
            } else {
                console.log(stdout);
                resolve();
            }
        });
    });
}
