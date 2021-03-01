const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const mongoAccount = require('@mongo/mongoAccount');
const mongoAnnouncement = require('@mongo/mongoAnnouncement');
const mongoAutoShow = require('@mongo/mongoAutoShow');
const mongoFlowRate = require('@mongo/mongoFlowRate');
const mongoFriend = require('@mongo/mongoFriend');
const mongoGlobalMail = require('@mongo/mongoGlobalMail');
const mongoGuild = require('@mongo/mongoGuild');
const mongoGuildMember = require('@mongo/mongoGuildMember');
const mongoGuildProject = require('@mongo/mongoGuildProject');
const mongoInvest = require('@mongo/mongoInvest');
const mongoOfflineData = require('@mongo/mongoOfflineData');
const mongoOfflineMail = require('@mongo/mongoOfflineMail');
const mongoOperate = require('@mongo/mongoOperate');
const mongoPay = require('@mongo/mongoPay');
const mongoPlayer = require('@mongo/mongoPlayer');
const mongoServerData = require('@mongo/mongoServerData');
const mongoSettings = require('@mongo/mongoSettings');

class RepairMongoID {
    constructor() {
    }
    async update(_app) {
        // 加载所有配置表 并更新ID(删除旧数据 添加新数据)
        await this.removeAndReplace(mongoAccount);
        await this.removeAndReplace(mongoAnnouncement);
        await this.removeAndReplace(mongoAutoShow);
        await this.removeAndReplace(mongoFlowRate);
        await this.removeAndReplace(mongoFriend);
        await this.removeAndReplace(mongoGlobalMail);
        await this.removeAndReplace(mongoGuild);
        await this.removeAndReplace(mongoGuildMember);
        await this.removeAndReplace(mongoGuildProject);
        await this.removeAndReplace(mongoInvest);
        await this.removeAndReplace(mongoOfflineData);
        await this.removeAndReplace(mongoOfflineMail);
        await this.removeAndReplace(mongoOperate);
        await this.removeAndReplace(mongoPay);
        await this.removeAndReplace(mongoPlayer);
        await this.removeAndReplace(mongoServerData);
        await this.removeAndReplace(mongoSettings);
    }

    async removeAndReplace(db) {
        const res = await db.query();
        logger.warn(`version 0.0.0.2 update mongo _id to index collections :${db.prototype._collectionName}, index:${db.prototype._index}`);
        res.map(async (mongo) => {
            const id = mongo.get(db.prototype._index);
            const data = JSON.parse(JSON.stringify((mongo.dbValue())));
            data._id = id;
            const p = new db(data);
            await p.flush();
            mongo.delete(true);
        });
    }
}

module.exports = RepairMongoID;
