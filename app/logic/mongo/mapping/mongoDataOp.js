// let logger = require('pomelo-logger').getLogger('pomelo', __filename);
const dbConst = require("@code").db;

module.exports = {
    modify : function(db, dbValue, opts)
    {
        const op = opts.op;
        const collectionName = opts.collectionName;
        const collection = db.collection(collectionName);

        switch(op)
        {
        case dbConst.OP_INSERT:
        {
            // logger.debug('insert %s %j', collectionName, dbValue);
            collection.insertOne(dbValue, null, opts.cb);
            break;
        }
        case dbConst.OP_UPDATE:
        {
            // logger.debug('update %s %j %j, upsert(%s)', collectionName, opts.condition, dbValue, opts.isInsert);
            collection.updateOne(opts.condition, {$set : dbValue}, {upsert : opts.isInsert}, opts.cb);
            break;
        }
        case dbConst.OP_UPDATE_WITH_ACTION:
        {
            // logger.debug('update %s %j %j, upsert(%s)', collectionName, opts.condition, dbValue, opts.isInsert);
            collection.updateOne(opts.condition, dbValue, {upsert : opts.isInsert}, opts.cb);
            break;
        }
        case dbConst.OP_DELETE:
        {
            // logger.debug('delete %s %j', collectionName, dbValue);
            collection.deleteOne(opts.condition, null, opts.cb);
            break;
        }
        default:
        {
            // logger.warn("unknown db op %d", op);
            opts.cb(new Error("invalid db op" + op));
            break;
        }
        }
    },

    query : function (db, collectionName, opts) {
        const conditionObj = opts.condition;
        const collection = db.collection(collectionName);
        const keys = opts.keys;
        const sortType = opts.sortType;
        const limitCount = opts.limitCount;
        if (Array.isArray(conditionObj)){
            collection.find({$or : conditionObj}, keys).sort(sortType).limit(limitCount).toArray(opts.cb);
        }else{
            collection.find(conditionObj, keys).sort(sortType).limit(limitCount).toArray(opts.cb);
        }
    },

    aggregate : function (db, collectionName, cb) {
        const res = db.collection(collectionName).aggregate(cb.pipeline, cb.options);
        res.toArray(function (err,  res) {
            cb.cb(err, res);
        });
    }
};