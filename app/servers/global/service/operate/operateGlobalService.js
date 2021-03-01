/**
 * @description 全局运营活动
 * @author jzy
 * @date 2020/06/09
 */

// const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const bearcat = require('bearcat');
const code = require('@code');
const util = require('@util');
const mongoOperate = require('@mongo/mongoOperate');

const OperateGlobalService = function () {
    this.$id = 'global_OperateGlobalService';
    this.app = null;

    this.mongoDataCache = {};
    this.operateMgr = {};
};

module.exports = OperateGlobalService;
bearcat.extend('global_OperateGlobalService', 'logic_BaseService');


const Components = {
    [code.activity.OPERATE_GLOBAL_TYPE.RANK_RUSH]:"global_OperateRankRush",  // 冲榜活动
};


/**
 * 初始化
*/
OperateGlobalService.prototype.init = function() {
    // global服注册运营活动
    const operateTypes = code.activity.OPERATE_GLOBAL_TYPE;
    for (const type of Object.values(operateTypes)) {
        const ids = this.app.Config.OperateBaseActivity.getIdsByType(type);
        if (ids && Array.isArray(ids)) {
            ids.map((id) => {
                this.app.Operate.initTimer(id);
            });
        }
    }

    this.app.Event.on(code.eventServer.OPERATE_INIT_FINISH.name, 0, async(...args) => {
        await this.operateInitFinish(...args);
    });
};

/**
 * 服务器启动之后
 */
OperateGlobalService.prototype.operateInitFinish = async function(){
    // 历史数据(存在内存不清除)
    const queryRes = await mongoOperate.query();
    const allData = queryRes.map((data) => {
        const id = data.get("operateId");
        this.mongoDataCache[id] = data;
        return data;
    });
    for (const dbData of allData) {
        const id = dbData.get('operateId');
        const data = dbData.get('data');
        this.operateMgr[id] = await this.create(id, data);
        await this.operateMgr[id].init();
    }

    const operates = this.app.Operate.onlineActivityList();
    // 已关闭活动结算
    const removeIds = [];
    const onlineOperates = Object.keys(operates);
    for (const [id, op] of Object.entries(this.operateMgr)) {
        if (onlineOperates.indexOf(id) == -1) {
            await op.stop();
            removeIds.push(id);
        }
    }
    for(const id of removeIds){
        await this.delete(id);
        delete this.operateMgr[id];
    }

    // 重置或创建新活动
    const newOperateIds = [];
    for (const timer of Object.values(operates)) {
        const id = timer.id;
        const startMs = timer.startMs;
        const stopMs = timer.stopMs;
        const obj = this.operateMgr[id];
        if (obj) {
            if (obj.getStartMs() != startMs) {
                await obj.reset(startMs, stopMs);
                newOperateIds.push(id);
            }
        } else {
            // 创建新数据
            this.operateMgr[id] = await this.create(id, null, startMs, stopMs);
            await this.operateMgr[id].init();
            newOperateIds.push(id);
        }
    }

    // 新活动开始
    for (const id of newOperateIds) {
        await this.operateMgr[id].start();
    }

    // 运营活动监听事件
    const operateIds = this.app.Config.OperateBaseActivity.getIds();
    operateIds.map((operateId) => {
        this.app.Event.on([code.eventServer.OPERATE_START_TIMER.name, operateId], 0, async(...args) => {
            await this.onStartEvent(...args);
        });
        this.app.Event.on([code.eventServer.OPERATE_STOP_TIMER.name, operateId], 0, async(...args) => {
            await this.onStopEvent(...args);
        });
    });
};

OperateGlobalService.prototype.onStartEvent = async function(timer){
    const {id, startMs, stopMs} = timer;
    let act = this.operateMgr[id];
    if (act) {
        if (act.getStartMs() != startMs) {
            // 重置数据
            await act.reset(startMs, stopMs);
        }
    } else {
        this.operateMgr[id] = await this.create(id, null, startMs, stopMs);
        act = this.operateMgr[id];
        await act.init();
    }
    await act.start();

    const info = {
        id: id,
        startMs: util.time.ms2s(timer.startMs),
        stopMs: util.time.ms2s(timer.stopMs),
    };
    // 通知活动开启
    this.app.Notify.broadcast('onSyncOperateStartNotify', {
        info: info
    });
};

OperateGlobalService.prototype.onStopEvent = async function(timer){
    const {id} = timer;
    // 运营活动关闭处理
    const act = this.operateMgr[id];
    if (act) {
        await act.stop();
        await this.delete(id);
        delete this.operateMgr[id];
    }

    const info = {
        id: id,
        startMs: util.time.ms2s(timer.startMs),
        stopMs: util.time.ms2s(timer.stopMs),
    };
    // 通知活动关闭
    this.app.Notify.broadcast('onSyncOperateStopNotify', {
        info: info
    });
};


/**
 * 获取运营活动对象
*/
OperateGlobalService.prototype.get = function(actId) {
    return this.operateMgr[actId];
};

/**
 * 检测并返回运营活动对象
*/
OperateGlobalService.prototype.checkAndGet = function(actId, type) {
    const operateCfg = this.app.Config.OperateBaseActivity.get(actId);
    if (!operateCfg || operateCfg.Type != type) {
        return null;
    }
    return this.get(actId);
};

OperateGlobalService.prototype.create = async function (id, data, startMs, stopMs) {
    const type = this.app.Config.OperateBaseActivity.getType(id);
    data = data || { startMs: startMs, stopMs: stopMs };
    let obj = null;
    if(Object.keys(Components).includes(type.toString())){
        obj = bearcat.getBean(Components[type], this.app, id, type, data);
    }else{
        obj = bearcat.getBean('global_OperateBase', this.app, id, type, data);
    }

    this.getOrCreateData(id, obj.getData());

    return obj;
};


/*****************************internal function******************************/

OperateGlobalService.prototype.getDbData = function(id){
    return this.mongoDataCache[id];
};

OperateGlobalService.prototype.delete = async function(id){
    const data = this.getDbData(id);
    if(data){
        data.delete();
        delete this.mongoDataCache[id];
    }
};

OperateGlobalService.prototype.getOrCreateData = function(id, data){
    let dbData;
    if(this.mongoDataCache[id]){
        dbData = this.mongoDataCache[id];
        dbData.update({data:data});
    }else{
        dbData = new mongoOperate();
        dbData.update({operateId:id, data:data});
        this.mongoDataCache[id] = dbData;
    }
    return dbData;
};