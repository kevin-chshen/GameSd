/**
 * @description 公告服务
 * @author chshen
 * @date 2020/06/18
 */
const bearcat = require('bearcat');
const MongoAnnouncement = require('@mongo/mongoAnnouncement');

const AnnouncementService = function () {
    this.$id = 'auth_AnnouncementService';
    this.app = null;
};
module.exports = AnnouncementService;
bearcat.extend('auth_AnnouncementService', 'logic_BaseService');

// 处理公告
AnnouncementService.prototype.do = async function(params) {

    const expirationTime = Number(params.type) == 2 ? 0: Number(params.endTime);
    const id = Number(params.id);
    const res = await MongoAnnouncement.query({ id: Number(params.id) });
    if (expirationTime > 0) {
        const mongo = res.length > 0 ? res[0] : new MongoAnnouncement();
        // 存入mongo
        await mongo.updateImmediately({
            id: id,
            expirationTime: expirationTime,
            data: params
        });
        this.app.rpcs.global.announcementRemote.update({}, id);
    } else {
        // 移除
        if (res.length > 0) {
            await res[0].delete({});
            this.app.rpcs.global.announcementRemote.delete({}, id);
        }
    }
    return {ret: 0, msg:"success"};
};

/**
 * 超文本转文本
 * 后台用纯文本脚本，这里不用再处理
*/
AnnouncementService.prototype.html2Text = function (html) {
    const txt = html.replace(/<(style|script|iframe)[^>]*?>[\s\S]+?<\/\1\s*>/gi, '').replace(/<[^>]+?>/g, '').replace(/ /g, ' ').replace(/>/g, ' ');//.replace(/\\n/g, '\n').replace(/\s+/g, '');
    // 自定义文本格式
    return txt.replace(/%%/g, `<`).replace(/@@/g, `>`);
};