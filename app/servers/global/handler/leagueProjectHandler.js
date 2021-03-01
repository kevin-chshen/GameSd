/**
 * @description 联盟项目消息
 * @author chenyq
 * @date 2020/05/27
 */

// const logger = require('pomelo-logger').getLogger('pomelo', __filename);
// const code = require('@code');
// const util = require('@util');

module.exports = function (app) {
    return new Handler(app);
};

const Handler = function (app) {
    this.app = app;
};
/**
 * 获取联盟项目信息
 */
Handler.prototype.projectGetInfo = async function (msg, session, next) {
    const uid = session.uid;
    const data = await this.app.GuildProject.guildProjectGetInfo(uid);
    next(null, data);
};
/**
 * 项目开启
 */
Handler.prototype.projectOpen = async function (msg, session, next) {
    const uid = session.uid;
    const id = msg.id;
    const type = msg.type;
    const data = await this.app.GuildProject.guildProjectOpen(uid, id, type);
    next(null, data);
};
/**
 * 项目捐献
 */
Handler.prototype.projectDonation = async function (msg, session, next) {
    const uid = session.uid;
    const type = msg.type;
    const data = await this.app.GuildProject.guildProjectDonation(uid, type);
    next(null, data);
};
/**
 * 项目捐献榜
 */
Handler.prototype.projectDonationRanking = async function (msg, session, next) {
    const uid = session.uid;
    const data = await this.app.GuildProject.guildProjectDonationRanking(uid);
    next(null, data);
};
/**
 * 项目谈判
 */
Handler.prototype.projectNegotiate = async function (msg, session, next) {
    const data = await this.app.GuildProject.guildProjectNegotiate(session);
    next(null, data);
};
/**
 * 项目谈判伤害榜
 */
Handler.prototype.projectDamageRanking = async function (msg, session, next) {
    const uid = session.uid;
    const data = await this.app.GuildProject.guildProjectDamageRanking(uid);
    next(null, data);
};
/**
 * 项目购买谈判次数
 */
Handler.prototype.projectBuyNum = async function (msg, session, next) {
    const uid = session.uid;
    const data = await this.app.GuildProject.guildProjectBuyNum(uid);
    next(null, data);
};
/**
 * 项目派驻
 */
Handler.prototype.projectAccredit = async function (msg, session, next) {
    const uid = session.uid;
    const pos = msg.pos;
    const cardId = msg.cardId;
    const data = await this.app.GuildProject.guildProjectAccredit(uid, pos, cardId);
    next(null, data);
};
/**
 * 项目派驻卸下
 */
Handler.prototype.projectUnload = async function (msg, session, next) {
    const uid = session.uid;
    const unloadUid = Number(msg.uid);
    const data = await this.app.GuildProject.guildProjectUnload(uid, unloadUid);
    next(null, data);
};