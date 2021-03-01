/**
 * @description 公告
 * @author chshen
 * @date 2020/06/18
 */
const bearcat = require('bearcat');
const util = require('@util');

const AnnouncementService = function () {
    this.$id = 'global_AnnouncementService';
    this.app = null;
    this.timer = null;
};

module.exports = AnnouncementService;
bearcat.extend('global_AnnouncementService', 'logic_MongoBaseService');
AnnouncementService.prototype.mongoDataClassFunc = require('@mongo/mongoAnnouncement');
AnnouncementService.prototype.uidKey = 'id';
AnnouncementService.prototype.needClean = false;

// 初始化
AnnouncementService.prototype.init = async function () {
    await this.loadAll();
    
    // 每分钟检测移除过期公告
    const self = this;
    this.timer = setInterval(() => {
        self._filter(self.getAllData());
    }, 60000);
};

// 过滤公告
AnnouncementService.prototype._filter = function (allData) {
    const now = util.time.nowSecond();
    let changed = false;
    allData.filter(data => {
        if (data.get('expirationTime') <= now) {
            this.delete(data.get('id'));
            changed = true;
        }
    });
    if (changed) {
        this.app.Notify.broadcast('onSyncUpdateAnnouncement', {});
    }
};

AnnouncementService.prototype.shutdown = async function() {
    clearInterval(this.timer);
};

// 更新公告
AnnouncementService.prototype.update = async function(id) {
    await this.loadOne(id);
};
