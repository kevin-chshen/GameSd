/**
 * @description 邮件服务
 * @author linjs
 * @date 2020/04/10
 */

const bearcat = require('bearcat');

const MailService = function () {
    this.$id = 'global_MailService';
    this.app = null;
};

module.exports = MailService;
bearcat.extend('global_MailService', 'logic_BaseService');

/**
 * 发送订制邮件
 * @param {Integer} uid 目标玩家
 * @param {Object} mail 邮件内容
 */
MailService.prototype.sendCustomMail = async function (uid, mail) {
    uid = Number(uid);
    // 检查玩家在哪个gameId
    const gameId = await this.app.Online.whichGame(uid);
    if (gameId) {
        // 玩家在线,让对应的game处理
        const {err,res} = await this.app.rpcs.game.mailRemote.sendCustomMail.toServer(gameId, uid, mail);
        if (err || !res) {
            // 处理失败,加入到离线邮件中
            await this.app.OfflineData.addMail(uid, [mail]);
        }
    } else {
        // 玩家不在线,加到离线邮件中
        await this.app.OfflineData.addMail(uid, [mail]);
    }
    return true;
};
