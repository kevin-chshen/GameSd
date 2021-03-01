/**
 * @description 策划配置读取服务
 * @author linjs
 * @date 2020/03/30
 */

const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const bearcat = require('bearcat');
const util = require('@util');
const path = require('path');
const fs = require('fs');
const BaseConfig = require('./baseConfig');

/**
 * 表格之间的依赖列表
 * 格式: 表名=>[表名s]
 * 例如:
 * "DropOne": ["DropTwo", "DropSign"],
 * 代表DropOne表依赖DropTwo,DropSign这2张表,
 * 1.读取DropOne需要先加载DropTwo和DropSign
 * 2.重载DropTwo和DropSign这2张表,也需要重载DropOne这张表
 */
const DepsConfig = {
    "DropOne": ["DropTwo", "DropSign"],
};

const ConfigService = function () {
    this.$id = "logic_ConfigService";
    this._cache = {};   // 所有数据的缓存信息 {proxy, isLoad}
    this.jsonPath = null;   // 配置文件位置
    this.helpPath = null;   // 访问器文件位置
    this.app = null;
    this.affect = {};   // 影响列表,deps数组的反向索引
};

module.exports = ConfigService;
bearcat.extend('logic_ConfigService', 'logic_BaseService');

/**
 * 初始化配置管理:创建读取代理,监视文件变化
 * @returns 
 */
ConfigService.prototype.init = async function() {
    this.jsonPath = path.join(this.app.getBase(), 'config/data');
    this.helpPath = path.join(this.app.getBase(), 'app/logic/config/proxy');
    const jsonFiles = await util.file.walk(this.jsonPath, util.file.extFilter('.json'), util.file.fileNameCutter('.json'));
    const helpFiles = await util.file.walk(this.helpPath, util.file.extFilter('.js'), util.file.fileNameCutter('.js'));
    for (const file of jsonFiles) {
        // 如果有代理文件,则使用代理读取
        let config = null;
        if (helpFiles.indexOf(file) >= 0) {
            const proxyPath = path.join(this.helpPath, file);
            const proxy = require(proxyPath);
            config = new proxy(this.app, file);
        } else {
            config = new BaseConfig(this.app, file);
        }
        this._cache[file] = { config: config, isLoaded: false };
        this.addGetterFun(this.app, file);
    }
    // 分析依赖关系
    this.parseAffect();
    // 开启监控,
    this.addWatcher();
};

/**
 * 重新加载某个文件
 * @param {String} filename 发生变化的文件名
 */
ConfigService.prototype.reload = function (filename) {
    const jsonFile = path.join(this.jsonPath, filename + '.json');
    if (fs.existsSync(jsonFile)) {
        delete require.cache[require.resolve(jsonFile)];
        let config = null;
        const helpFile = path.join(this.helpPath, filename + '.js');
        if (fs.existsSync(helpFile)) {
            delete require.cache[require.resolve(helpFile)];
            const proxy = require(helpFile);
            config = new proxy(this.app, filename);
        } else {
            config = new BaseConfig(this.app, filename);
        }
        this._cache[filename] = { config: config, isLoaded: false };
        // 自己加载完成后,分析一下影响列表,把受影响的表格也重载掉
        const affectList = this.affect[filename];
        if (affectList) {
            affectList.map( (name) => {
                logger.info(`ConfigService reload [${name}] after [${filename}].`);
                this.reload(name);
            });
        }
        logger.info("ConfigService reload " + filename + " ok.");
    } else {
        logger.error("ConfigService reload error: " + filename + " not exist.");
    }
};

/**
 * 往管理器上设置配置表的getter(首次访问时才初始化)
 * @param {Object} target config实例
 * @param {Object} app pomelo实例
 * @param {String} name 文件名
 */
ConfigService.prototype.addGetterFun = function (app, name) {
    Object.defineProperty(this, name, { get: function () {
        const {config: proxy, isLoaded: isLoaded} = this._cache[name];
        if (proxy) {
            if (isLoaded) {
                return proxy;
            } else {
                // 检查依赖,有的话,先加载依赖
                const deps = DepsConfig[name];
                if (deps) {
                    // 先访问一遍被依赖的表格,促使他被加载
                    deps.map((depsName) => { this[depsName]; });
                }
                proxy.reload(app, name);
                this._cache[name].isLoaded = true;
                return proxy;
            }
        } else {
            logger.info('config not exist' + name);
            return null;
        } 
    }});
};

/**
 * 根据依赖设置,生成影响设置
 */
ConfigService.prototype.parseAffect = function () {
    for (const [key, values] of Object.entries(DepsConfig)) {
        values.map( (name) => {
            const affectList = this.affect[name] || [];
            if (!affectList.includes(key)) {
                affectList.push(key);
                this.affect[name] = affectList;
            }
        });
    }
};

/**
 * 增加监控,支持热更新json和代理
 * @param {Object} 管理器自身
 */
ConfigService.prototype.addWatcher = function () {
    const self = this;
    function watcher(event, filename) {
        // 去掉后缀名
        self.reload(path.basename(filename, path.extname(filename)));
    }
    fs.watch(this.jsonPath).on('change', watcher);
    fs.watch(this.helpPath).on('change', watcher);
};
