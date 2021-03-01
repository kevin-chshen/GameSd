const ObjectID = require('mongodb').ObjectID;
const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const dbConst = require("@code").db;

class MongoDataBase{
    constructor(data){
        this._data = {};

        // _id 单独处理
        if (data && data._id) {
            this._data._id = data._id;
        } else if (data && this._index) {
            this._data._id = data[this._index];
        } else {
            if (!this._index){
                this._data._id = new ObjectID();
            }
        }

        // 数据
        if(data){
            for(const [key, value] of Object.entries(data)){
                if(key == "_id"){
                    // 过滤_id
                    continue;
                }
                this.set(key, value);
            }
        }
    }

    ID(){
        return this._data._id;
    }

    /**
     * 获取内存数据块  {columnName0:value0, columnName1:value1...}
     */
    dbValue(){
        return this._data;
    }

    /**
     * 获取列数据
     * @param {String} columnName 
     */
    get(columnName){
        if (!(columnName in this._columns))
        {
            logger.error("MongoData : try to get unknown column %s at %s", columnName, this._collectionName);
            return undefined;
        }
        return this._data[columnName]==undefined? deepClone(this._columns[columnName].default): this._data[columnName];
    }

    /**
     * 修改内存内的数据（不修改数据库）
     * @param {String} columnName 
     * @param {*} val 
     */
    set(columnName, val){
        if (!this._data){
            logger.info("MongoData : data is null, set collection(%j) column(%s) failed", this._collectionName, columnName);
            return true;
        }
    
        if (!(columnName in this._columns))
        {
            logger.error("MongoData : try to set unknown column %s at %s, %s", columnName, this._collectionName, (new Error()).stack);
            return false;
        }
    
        const column = this._columns[columnName];
        const columnType = column.type;
        if (typeof val !=  columnType)
        {
            logger.error("MongoData : value type mismatch column %s at %s, need %s, actually %s"
                , columnName, this._collectionName, columnType, typeof val);
            return false;
        }
        this._data[columnName] = val==undefined? deepClone(column.default): val;
        if (columnName == this._index && !this._data._id) {
            this._data._id = this._data[this._index];
        }
        // logger.debug("MongoData : set column %s at %s to %j", columnName, this._collectionName, val);
        return true;
    }

    /**
     * 更新数据（更新数据库）
     * @param {JSON} values {key0:value0, key1:value1...}
     * @param {Function} cb (err,result) 默认不需要，底层报错 result = {key0:value0, key1:value1...}
     * @param {JSON} conditionObj 匹配参数， 默认为空匹配自身id，详见http://mongodb.github.io/node-mongodb-native/3.1/api/Collection.html#update
     * @param {Boolean} immediately 是否立即同步，默认定时同步
     */
    update(values, immediately = false, conditionObj = null, cb = null) {
        const sync = MongoDataBase.app.get("sync");
        let syncFunc = sync.exec;
        if (immediately)
        {
            syncFunc = sync.flush;
        }
        const self = this;
        const dbcb = function (err, result) {
            if (err) {
                logger.error("MongoData : fail to update %s %j, err = %j", self._collectionName, self._data, err.toString());
            }
            // else
            // {
            //     logger.debug("MongoData : update %s %j successfully.", self._collectionName, self._data);
            // }
    
            if (cb)
            {
                cb(err, result);
            }
        };
    
        if (self._data){
            //values设置为null时，同步内存块到数据库
            if (values){
                const backup = self.dbValue();
                for (const key of Object.keys(values)) {
                    if(!self.set(key, values[key])){
                        //出错时，错误的数据不写入内存和数据库
                        self._data = backup;
                        return;
                    }
                }
            }else{
                values = self.dbValue();
            }
        }
        const isInsert = true;
        syncFunc.call(sync, "mongoDataOp.modify", [self.ID(), self._collectionName], self.dbValue(),
            {op : dbConst.OP_UPDATE, condition : conditionObj || {_id : self.ID()}, collectionName : self._collectionName, cb: dbcb, isInsert : isInsert});
    }
    /**
     * 立即更新数据（更新数据库）
     * @param {JSON} values {key0:value0, key1:value1...}
     * @param {Function} cb (err,result) 默认不需要，底层报错 result = {key0:value0, key1:value1...}
     */
    async updateImmediately(values, cb = null) {
        const sync = MongoDataBase.app.get("sync");
        const self = this;        
        if (self._data) {
            //values设置为null时，同步内存块到数据库
            if (values) {
                const backup = self.dbValue();
                for (const key of Object.keys(values)) {
                    if (!self.set(key, values[key])) {
                        //出错时，错误的数据不写入内存和数据库
                        self._data = backup;
                        return;
                    }
                }
            } else {
                values = self.dbValue();
            }
        }
        return await new Promise((resolve, reject) => {
            const dbcb = function (err, result) {
                if (err) {
                    logger.error("MongoData : fail to update %s %j, err = %j", self._collectionName, self._data, err.toString());
                    reject(err, result);
                } else {
                    logger.debug("MongoData : update %s %j successfully.", self._collectionName, self._data);
                    if (cb) {
                        cb(err, result);
                    }
                    resolve(err, result);
                }
            };
            sync.flush("mongoDataOp.modify", [self.ID(), self._collectionName], self.dbValue(),
                { op: dbConst.OP_UPDATE, condition: { _id: self.ID() }, collectionName: self._collectionName, cb: dbcb, isInsert: true });
        });
    }
    /**
     * 查询数据库文档
     * @param {JSON} conditionObj 匹配参数 [] $or形式 或 {} 原生形式，详见http://mongodb.github.io/node-mongodb-native/3.1/api/Collection.html#find
     * @param {JSON} keys 查询参数返回哪些字段，例如 {name:1, uid:1, _id:0} 1表示有这个字段，0表示没有
     * @param {JSON} sortType sort()参数
     * @param {Number} count limit()参数
     * @param {Boolean} onlyData 
     * @returns {Array} dataArray为搜索结果DBData[]数组（若设置onlyData=true则为数据集合数组）,出错时返回undefined
     */
    static async query(conditionObj = null, keys = {}, sortType = {}, count = 0, onlyData = false, skip = 0) {
        const self = this;
        keys = keys || {};
        sortType = sortType || {};
        count = count || 0;
        onlyData = onlyData || false;
        skip = skip || 0;

        //直接调用
        const collection = MongoDataBase.app.db.collection(self.prototype._collectionName);
        const condition = conditionObj || {};
        let documents,err;
        if (Array.isArray(condition)){
            await collection.find({$or : condition}, {projection: keys}).sort(sortType).skip(skip).limit(count).toArray().then(value => {
                documents = value;
            }).catch(reason => {
                err = reason;
            });
        }else{
            const index = self.prototype._index;
            if (index && Object.keys(condition).length == 1 && condition[index]) {
                condition._id = condition[index];
                delete condition[index];
            }
            await collection.find(condition, {projection: keys}).sort(sortType).skip(skip).limit(count).toArray().then(value => {
                documents = value;
            }).catch(reason => {
                err = reason;
            });
        }

        if (err) {
            logger.error("MongoData : fail to query %s %j %j", self.prototype._collectionName, conditionObj, err.toString());
        }
        else {
            const dataArray = [];
            documents.forEach(function (doc, _index, _array) {
                let data = new self.prototype.constructor(doc);
                if (onlyData) {
                    data = data.dbValue();
                }

                dataArray.push(data);
            });

            // 检测表字段是否齐全，不齐全则Y用默认值补全
            const isKeyEmpty = Object.keys(keys).length == 0;
            const columns = self.prototype._columns;
            for (const cls of dataArray) {
                let data;
                if (onlyData) {
                    data = cls;
                }else{
                    data = cls.dbValue();
                }
                
                for (const [columnType, columnData] of Object.entries(columns)) {
                    if(!isKeyEmpty && keys[columnType] != 1){
                        continue;
                    }
                    data[columnType] = data[columnType]==undefined? deepClone(columnData.default):data[columnType];
                }
            }
            return dataArray;
        }
    }

    /**
     * 删除数据库文档，同时清空本地数据
     * @param {Function} cb (err, result)
     * @param {*} immediately 是否立即同步，默认立即同步，为了防止执行删除后，在缓存时间内做数据库查询导致数据回溯问题
     */
    delete(immediately = true, cb = null) {
        const sync = MongoDataBase.app.get("sync");
        let syncFunc = sync.exec;
        if (immediately)
        {
            syncFunc = sync.flush;
        }
    
        const dbcb = function (err, result) {
            if (err) {
                logger.error("MongoData : fail to delete %s %j, err = %j", self._collectionName, self._data, err.toString());
            }
            else
            {
                logger.debug("MongoData : delete %s %j successfully.", self._collectionName, self._data);
            }
    
            //清空内存数据
            self._data = null;
            
            if (cb)
            {
                cb(err, result);
            }
        };

        const self = this;
        syncFunc.call(sync, "mongoDataOp.modify", [self.ID(), self._collectionName], self.dbValue(),
            { op: dbConst.OP_DELETE, condition : {_id : self.ID()}, collectionName: self._collectionName, cb: dbcb });
    }

    // flush(cb = null) {
    //     const sync = MongoDataBase.app.get("sync");
    //     const self = this;
    //     const dbcb = function (err, result) {
    //         if (err) {
    //             logger.error("MongoData : fail to flush %s %j, err = %j", self._collectionName, self._data, err.toString());
    //         }
    //         else
    //         {
    //             logger.debug("MongoData : flush %s %j successfully.", self._collectionName, self._data);
    //         }
    
    //         if (cb)
    //         {
    //             cb(err, result);
    //         }
    //     };
    //     const isInsert = true;
    //     sync.flush("mongoDataOp.modify", [self.ID(), self._collectionName], self.dbValue(), 
    //         {op: dbConst.OP_UPDATE, condition : {_id : self.ID()}, collectionName : self._collectionName, cb : dbcb, isInsert : isInsert});
    // }

    /**
     * 强制刷新本地数据到数据库
     */
    async flush() {
        const sync = MongoDataBase.app.get("sync");
        const self = this;
        const isInsert = true;
        return await new Promise( (resolve, reject) => {
            const dbcb = function (err, result) {
                if (err) {
                    logger.error("MongoData : fail to flush %s %j, err = %j", self._collectionName, self._data, err.toString());
                    reject(err, result);
                } else {
                    logger.debug("MongoData : flush %s %j successfully.", self._collectionName, self._data);
                    resolve(err, result);
                }
            };
            sync.flush("mongoDataOp.modify", [self.ID(), self._collectionName], self.dbValue(), 
                {op: dbConst.OP_UPDATE, condition : {_id : self.ID()}, collectionName : self._collectionName, cb : dbcb, isInsert : isInsert});
        });
    }

    /**
     * 立即统计数量  http://mongodb.github.io/node-mongodb-native/3.1/api/Collection.html#aggregate
     * @param {Json} sql mongodb 自身的语法
     * @return {Object} 查询结果
    */
    static async aggregate(sql) {
        const self = this;
        const collectionName = self.prototype._collectionName;
        return new Promise((resolve) =>{            
            const res = MongoDataBase.app.db.collection(collectionName).aggregate(sql);
            res.toArray(function (err, documents) {
                if (err) {
                    logger.warn("fail to aggregate %s %j %j", collectionName, sql, err.toString());
                    resolve({ err, documents });
                } else {
                    logger.debug("aggregate %s %j successfully", collectionName, sql);
                    resolve({ err, documents });
                }
            });
        });
        
    }
}

/**
 * 深度拷贝
 * @api private
*/
const deepClone = function (origin) {
    if (typeof (origin) == 'object') {
        if (Array.isArray(origin)) {
            return origin.concat();
        } else {
            return Object.assign({}, origin);
        }
    }
    else {
        return origin;
    }
};

MongoDataBase.app = null;
MongoDataBase.prototype._collectionName = null;
MongoDataBase.prototype._columns = null;

module.exports = MongoDataBase;