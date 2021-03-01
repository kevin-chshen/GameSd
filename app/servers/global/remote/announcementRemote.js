/**
 * @description 公告远程调用
 * @author chshen
 * @date 2020/05/25
 */
module.exports = function (app) {
    return new Remote(app);
};

const Remote = function (app) {
    this.app = app;
};

// 更新公告
Remote.prototype.update = function(id, cb) {
    this.app.Announcement.update(id);
    this.app.Notify.broadcast('onSyncUpdateAnnouncement', {});
    cb(null);
};

// 删除公告
Remote.prototype.delete = function(id, cb) {
    this.app.Announcement.delete(id);
    this.app.Notify.broadcast('onSyncUpdateAnnouncement', {});
    cb(null);
};
