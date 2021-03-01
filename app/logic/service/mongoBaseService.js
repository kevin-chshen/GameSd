/**
 * @description 带mongo缓存的service，暴露通用接口query
 * @author jzy
 * @date 2020/04/15
 */

const code = require('@code');
const bearcat = require('bearcat');
const assert = require('assert');

const MongoBaseService = function () {
    this.$id = 'logic_MongoBaseService';
    this.app = null;
};

module.exports = MongoBaseService;
bearcat.extend('logic_MongoBaseService', 'logic_BaseService');

// 可以定制的变量
// const default_mongoDataClassFunc = null;
const default_uidKey = "uid";
const default_needClean = true;  // 是否需要清理缓存
const default_cleanCacheTime = code.mongoBaseService.DEFAULT_CLEAN_CACHE_TIME_MS; // 清理间隔
const default_dataLeaveTime = code.mongoBaseService.DEFAULT_DATA_LEAVE_TIME_MS;   // 数据的存活时长

// 使用下面的形式自定义
// MongoBaseService.prototype.mongoDataClassFunc = null;
// MongoBaseService.prototype.uidKey = "uid";
// MongoBaseService.prototype.needClean = true;    // 是否需要清理缓存
// MongoBaseService.prototype.cleanCacheTime = code.mongoBaseService.DEFAULT_CLEAN_CACHE_TIME_MS;  // 清理间隔
// MongoBaseService.prototype.dataLeaveTime = code.mongoBaseService.DEFAULT_DATA_LEAVE_TIME_MS;    // 数据的存活时长

/**
 * 加载所有数据
 */
MongoBaseService.prototype.loadAll = async function () {
    const now = Date.now();
    const res = await this.mongoDataClassFunc.query({});
    const allData = res.map((data) => {
        const id = data.get(this.uidKey==undefined?default_uidKey:this.uidKey);
        this.mongoDataCache[id] = { data: data, time: now };
        return data;
    });
    return allData;
};

/**
 * 返回缓存中的所有数据
 */
MongoBaseService.prototype.getAllData = function () {
    return Object.values(this.mongoDataCache).map(({data}) => data );
};

/**
 * 直接从缓存获取,不会从数据库查询
 */
MongoBaseService.prototype.getCache = function (uid) {
    const data = this.mongoDataCache[uid];
    if (data) {
        data.time = Date.now(); // 被读取,也延迟一下
        return data.data;
    }
    return null;
};

/**
 * 统一查询的接口
 */
MongoBaseService.prototype.query = async function(uid){
    if(this.mongoDataCache[uid]){
        this.mongoDataCache[uid].time = Date.now();
        return this.mongoDataCache[uid].data;
    }else{
        assert(typeof this.mongoDataClassFunc == "function", `未设置Mongo数据库对象到this.mongoDataClassFunc身上`);
        const condition = {};
        condition[this.uidKey==undefined?default_uidKey:this.uidKey] = uid;
        const result = await this.mongoDataClassFunc.query(condition);
        if(result.length<=0){
            return null;
        }
        const data = result[0];
        this.mongoDataCache[uid] = {data: data, time: Date.now()};
        return data;
    }
};

/**
 * 重新加载数据
 */
MongoBaseService.prototype.loadOne = async function (uid) {
    const condition = {};
    condition[this.uidKey == undefined ? default_uidKey : this.uidKey] = uid;
    const result = await this.mongoDataClassFunc.query(condition);
    if (result.length <= 0) {
        return null;
    }
    const data = result[0];
    this.mongoDataCache[uid] = { data: data, time: Date.now() };
    return data;
};

/**
 * 若缓存和数据库都不存在则创建（不会更新到数据库）
 */
MongoBaseService.prototype.queryOrCreate = async function(uid){
    let data = await this.query(uid);
    if(data){
        return data;
    }else{
        const newData = {};
        newData[this.uidKey==undefined?default_uidKey:this.uidKey] = uid;
        data = new this.mongoDataClassFunc(newData);
        this.mongoDataCache[uid] = {data: data, time: Date.now()};
        await this.onCreate(data);
        return data;
    }
};

/**
 * 调用queryOrCreate接口 创建完数据后调用       注:不要将参数data作为indexOf的参数或者key，否则可能会产生难以排查的问题
 * @param {Object} data 数据条目对象data
 */
MongoBaseService.prototype.onCreate = async function(_data){

};

/**
 * 删除数据
 */
MongoBaseService.prototype.delete = async function (uid) {
    const data = await this.query(uid);
    if (data) {
        await this.onDelete(data);
        data.delete();
        delete this.mongoDataCache[uid];
    }
};


/**
 * 调用delete接口 创建完数据后调用     注:不要将参数data作为indexOf的参数或者key，否则可能会产生难以排查的问题
 * @param {Object} data 数据条目对象data
 */
MongoBaseService.prototype.onDelete = async function(_data){

};

/****************************internal function*****************************************/

MongoBaseService.prototype.initBase = function() {
    this.mongoDataCache = {};
    if (this.needClean==undefined?default_needClean:this.needClean) {
        // 定时清理数据缓存
        this.onlineTimer = setInterval(()=>{ this._cleanCache(); }, this.cleanCacheTime==undefined?default_cleanCacheTime:this.cleanCacheTime);
    }
};

MongoBaseService.prototype._cleanCache = function(){
    if (!this.mongoDataCache || Object.keys(this.mongoDataCache).length <= 0){ return; }

    for(const uid of Object.keys(this.mongoDataCache)){
        const dateTime = this.mongoDataCache[uid].time;
        if(dateTime+(this.dataLeaveTime==undefined?default_dataLeaveTime:this.dataLeaveTime)<=Date.now()){
            delete this.mongoDataCache[uid];
        }
    }
};

MongoBaseService.prototype.shutdownBase = function () {
    // 清除定时器
    clearInterval(this.onlineTimer);
};
