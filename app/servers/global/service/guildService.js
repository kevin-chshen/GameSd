/* eslint-disable indent */
/**
 * @description 联盟数据服务
 * @author chenyq
 * @date 2020/04/24
 */

const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const bearcat = require('bearcat');
const code = require('@code');
const util = require('@util');

// const DBGuildMember = require("@mongo/mongoGuildMember");

const GuildService = function () {
    this.$id = 'global_GuildService';
    this.app = null;
    this.updateMemberDataTimeout = null;
    this.guildChannel = {};
    this.guildMemberDict = {};      // 公会对应成员缓存 {guildId:{uid:job,uid:job},{guildId:{uid:job}}}
    this.applyDict = {};            // 申请缓存 {uid:{guildId,...},...}
};

module.exports = GuildService;
bearcat.extend('global_GuildService', 'logic_BaseService');


GuildService.prototype.init = async function () {
    // TODO 暂定1分钟变更一次成员数据
    this.updateMemberDataTimeout = setTimeout(() => {
        this.loadInfo();
    }, 5 * 1000);
    logger.info("global_GuildService init");
};

GuildService.prototype.shutdown = function () {
    clearTimeout(this.updateMemberDataTimeout);
    this.updateMemberDataTimeout = null;
};

GuildService.prototype.loadInfo = async function () {
    // 联盟数据加入缓存
    await this.app.GuildCache.loadAll();
    // 联盟成员数据加入缓存
    await this.app.GuildMemberCache.loadAll();
    // 加载申请缓存
    await this.loadApplyDict();
    // 加载公会成员缓存
    await this.loadGuildMemberDict();

    // 结算计时器
    this.app.Timer.register(code.guild.GUILD_ON_DAY_TIMER, 0, true, () => {
        this.onDayTimer();
    });

    this.openTimeout();
};

GuildService.prototype.onDayTimer = function () {
    // 清空每日资金和贡献记录
    this.guildZeroProcess();
    // TODO玩家建设信息
    this.guildMemberZeroProcess();
    console.log("联盟零点处理");
};

GuildService.prototype.openTimeout = async function () {
    // TODO 暂时处理所有联盟 后续修改 比如 一个月内活跃的 联盟才处理成员数据变更
    const guildListData = this.app.GuildCache.getAllData();
    for (const guildData of guildListData) {
        const guildId = guildData.get('guildId');
        this.updateGuildInfo(guildId, false, false);
    }
    this.updateMemberDataTimeout = setTimeout(() => {
        this.openTimeout();
    }, 60 * 1000);

};
/**
 * 加载申请缓存
 */
GuildService.prototype.loadApplyDict = async function () {
    const guildListData = this.app.GuildCache.getAllData();
    for (const guildData of guildListData) {
        const guildId = guildData.get('guildId');
        const applyList = guildData.get('applyList');
        if (applyList) {
            for (const [uid, time] of Object.entries(applyList)) {
                if (!this.applyDict[uid]) {
                    this.applyDict[uid] = [];
                }
                this.applyDict[uid][guildId] = time;
            }
        }
    }
};
/**
 * 获取已申请的联盟
 */
GuildService.prototype.getApplyGuild = function (uid) {
    if (this.applyDict[uid]) {
        return Object.keys(this.applyDict[uid]);
    }
    return [];
};
/**
 * 是否申请
 */
GuildService.prototype.isApply = function (uid, guildId) {
    if (uid && this.applyDict[uid] && this.applyDict[uid][guildId]) {
        return true;
    }
    return false;
};
/**
 * 添加申请缓存
 */
GuildService.prototype.addApplyDict = function (uid, guildId, time) {
    if (guildId > 0) {
        if (!this.applyDict[uid]) {
            this.applyDict[uid] = {};
        }
        this.applyDict[uid][guildId] = time;
    }
};
/**
 * 移除申请缓存
 */
GuildService.prototype.delApplyDict = function (guildId, uids) {
    for (const uid of uids) {
        if (this.applyDict[uid] && this.applyDict[uid][guildId]) {
            delete this.applyDict[uid][guildId];
        }
    }
};
/**
 * 加载公会成员缓存
 */
GuildService.prototype.loadGuildMemberDict = async function () {
    const memberDB = this.app.GuildMemberCache.getAllData();
    if (memberDB) {
        for (const memberInfo of memberDB) {
            const guildId = memberInfo.get('guildId');
            if (await this.guildIdExists(guildId)) {
                const uid = memberInfo.get('uid');
                const job = memberInfo.get('job');
                if (!this.guildMemberDict[guildId]) {
                    this.guildMemberDict[guildId] = {};
                }
                this.guildMemberDict[guildId][uid] = job;
            }
        }
    }
};
/**
 * 移除公会缓存
 */
GuildService.prototype.delGuildDict = function (guildId) {
    if (this.guildMemberDict[guildId]) {
        delete this.guildMemberDict[guildId];
    }
};
/**
 * 添加成员缓存
 */
GuildService.prototype.addGuildMemberDict = function (guildId, uid, job) {
    if (guildId > 0) {
        if (!this.guildMemberDict[guildId]) {
            this.guildMemberDict[guildId] = {};
        }
        this.guildMemberDict[guildId][uid] = job;
    }
};
/**
 * 移除成员缓存
 */
GuildService.prototype.delGuildMemberDict = function (guildId, uid) {
    if (this.guildMemberDict[guildId] && this.guildMemberDict[guildId][uid]) {
        delete this.guildMemberDict[guildId][uid];
    }
};

/**
 * 更新联盟信息
 */
GuildService.prototype.updateGuildInfo = async function (guildId, isActive, isReturn = true) {
    const guildData = await this.app.GuildCache.queryOrCreate(guildId);
    const nowTime = Date.now();
    // 判断活跃度 不活跃 不处理
    if (!isActive) {
        const lastTime = guildData.get('lastTime') || 0;
        if (nowTime - lastTime > 24 * 3600 * 1000) {
            return;
        }
    }
    let totalPower = 0;
    let championsUid = 0;
    let championsName = '';
    const memberList = {};
    const memberDict = this.guildMemberDict[guildId];
    if (memberDict) {
        for (const [uid, job] of Object.entries(memberDict)) {
            const member = {};
            const brief = await this.app.Brief.getBrief(Number(uid));
            const mDB = await this.app.GuildMemberCache.queryOrCreate(Number(uid));
            if (brief) {
                member.name = brief.name;
                member.lv = parseInt(brief.lv);
                member.vip = parseInt(brief.vip);
                member.head = parseInt(brief.headImageId);
                member.sex = parseInt(brief.sex);
                member.power = parseInt(brief.power);
                member.lastLogoutTime = parseInt(brief.lastLogoutTime);
                mDB.update(member, true);
            }
            else {
                member.name = mDB.get('name') || '';
                member.lv = mDB.get('lv');
                member.vip = mDB.get('vip');
                member.head = mDB.get('head');
                member.sex = mDB.get('sex');
                member.power = mDB.get('power');
                member.lastLogoutTime = mDB.get('lastLogoutTime');
            }
            totalPower += member.power;
            if (job == code.guild.GUILD_JOB.CHAMPIONS) {
                championsUid = Number(uid);
                championsName = member.name;
            }
            memberList[uid] = job;
        }
    }
    // const memberDB = this.app.GuildMemberCache.getAllData();
    // if (memberDB) {
    //     for (const memberInfo of memberDB) {
    //         const member = {};
    //         const uid = memberInfo.get('uid');
    //         const gId = memberInfo.get('guildId');
    //         if (gId == guildId) {
    //             const brief = await this.app.Brief.getBrief(uid);
    //             if (brief) {
    //                 member.name = brief.name;
    //                 member.lv = parseInt(brief.lv);
    //                 member.vip = parseInt(brief.vip);
    //                 member.head = parseInt(brief.headImageId);
    //                 member.sex = parseInt(brief.sex);
    //                 member.power = parseInt(brief.power);
    //                 totalPower += member.power;
    //             }
    //             const mDB = await this.app.GuildMemberCache.queryOrCreate(uid);
    //             mDB.update(member, true);
    //             const job = mDB.get('job');
    //             if (job == code.guild.GUILD_JOB.CHAMPIONS) {
    //                 championsName = member.name;
    //             }
    //             memberList[uid] = job;
    //         }
    //     }
    // }
    const updateInfo = { totalPower: totalPower, championsUid: championsUid, championsName: championsName, memberList: memberList };
    if (isActive) {
        updateInfo.lastTime = Date.now();
    }
    const exp = guildData.get('exp');
    if (exp > code.guild.GUILD_UINT32_MAX) {
        updateInfo.exp = code.guild.GUILD_UINT32_MAX;
    }
    guildData.update(updateInfo);
    // console.log("______________guildId:", guildId, totalPower, championsName, memberList);
    return isReturn ? this.returnGuildInfo(guildData.dbValue()) : {};
};

/**
 * 获取联盟信息
 */
GuildService.prototype.getGuildInfo = async function (uid) {
    // 获取联盟玩家信息
    const memberData = await this.app.GuildMemberCache.query(uid);
    // 判断玩家的联盟是否存在
    if (memberData) {
        const guildId = memberData.get('guildId');
        if (await this.guildIdExists(parseInt(guildId))) {
            await this.guildAutoTransfer(guildId);
            const guildData = await this.app.GuildCache.query(guildId);
            if (guildData) {
                guildData.update({ lastTime: Date.now() });
                return this.returnGuildInfo(guildData.dbValue());
            }
        }
    }
    return undefined;
};
/**
 * 获取联盟列表
 */
GuildService.prototype.getGuildList = async function (uid) {
    const guildList = [];
    const guildListData = this.app.GuildCache.getAllData();
    guildListData.sort(function (a, b) {
        return b.get('lastTime') - a.get('lastTime');
    });
    for (const guildData of guildListData) {
        if (guildData.dbValue()) {
            const info = this.returnGuildInfo(guildData.dbValue(), uid);
            guildList.push(info);
            if (guildList.length >= code.guild.GUILD_LIST_NUM) {
                break;
            }
        }
    }

    return guildList;
};
/**
 * 获取联盟成员信息
 */
GuildService.prototype.getGuildMemberInfo = async function (uid) {
    let memberList = [];
    let applyList = [];
    // 获取联盟玩家信息
    const memberData = await this.app.GuildMemberCache.query(uid);
    // 判断玩家的联盟是否存在
    if (memberData) {
        const guildId = memberData.get('guildId');
        const guildData = await this.app.GuildCache.query(guildId);
        if (guildData) {
            memberList = await this.getMemberList(guildData);
            applyList = await this.getApplyList(guildData);
            guildData.update({ lastTime: Date.now() });
        }
    }
    return { memberList: memberList, applyList: applyList };
};

/**
 * 创建联盟
 * @param {*} uid 角色编号
 * @param {string} name 联盟名称
 * @param {string} badge 联盟徽章
 * @param {string} manifesto 联盟宣言
 * @param {Number} joinType 加入类型 0直接加入 1需要申请
 */
GuildService.prototype.createGuild = async function (uid, name, badge, manifesto, joinType) {

    const { err, res } = await this.app.Redis.incrby(code.redis.MAX_GUILD_ID.name, 1);
    if (err) {
        return null;
    }
    const newGuild = await this.app.GuildCache.queryOrCreate(res);
    const guildInfo = {};
    guildInfo.guildId = res;
    guildInfo.name = name;
    guildInfo.badge = badge;
    guildInfo.manifesto = manifesto;
    if (!manifesto || manifesto.length <= 0) {
        const noticeConfig = this.app.Config.TextCaptions.get(code.guild.GUILD_DEFAULT_MANIFESTO);
        if (noticeConfig) {
            guildInfo.manifesto = noticeConfig.Text;
        }
    }
    guildInfo.joinType = joinType;
    guildInfo.notice = '';
    const noticeConfig = this.app.Config.TextCaptions.get(code.guild.GUILD_DEFAULT_NOTICE);
    if (noticeConfig) {
        guildInfo.notice = noticeConfig.Text;
    }
    guildInfo.lv = 1;
    guildInfo.exp = 0;
    guildInfo.applyList = {};
    guildInfo.lastTime = Date.now();
    guildInfo.totalPower = 0;
    guildInfo.championsName = '';
    newGuild.update(guildInfo, true);
    this.log(guildInfo.guildId);
    return await this.joinGuild(uid, guildInfo.guildId, code.guild.GUILD_JOB.CHAMPIONS, false);
};
/**
 * 解散联盟
 */
GuildService.prototype.dissolveGuild = async function (memberInfo) {
    const guildId = memberInfo.guildId;
    const uid = memberInfo.uid;
    const name = memberInfo.name;
    // 删除联盟
    const guildData = await this.app.GuildCache.query(guildId);
    const dbValue = guildData.dbValue();
    // 成员离开联盟处理
    const list = guildData.get('memberList') || {};
    const champions = guildData.get('championsName') || '';
    const guildName = guildData.get('name') || '';
    const uidList = Object.keys(list) || [];
    for (const memberUid of uidList) {
        this.exitMember(memberUid, guildId);
    }
    this.app.GuildCache.delete(guildId, true);
    this.delGuildDict(guildId);
    this.destroyChannel(guildId);
    // 广播 memberUid 离开联盟
    await this.notifyLeagueInfo(code.guild.GUILD_OPERATE.DISSOLVE, uid, name, 0, uidList, Date.now());
    // 下发解散邮件
    await this.sendLeagueMail(uidList, code.mail.MAIL_CONFIG_ID.GUILD_DISSOLVE_MAIL, champions, util.time.getDateString(), guildName);

    // 联盟解散特殊处理 移除成员信息 日志中成员为0 即联盟已解散
    delete dbValue.memberList;
    this.app.Log.guildLog(dbValue);
};

/**
 * 加入联盟
 */
GuildService.prototype.joinGuild = async function (uid, guildId, job, isSendMail = true) {

    await this.delGuildApply(uid);

    const memberInfo = await this.joinMember(uid, guildId, job);

    const leagueInfo = await this.updateGuildInfo(guildId, true);

    // 广播 联盟所有成员 uid 加入联盟
    await this.notifyLeagueInfo(code.guild.GUILD_OPERATE.JOIN, uid, memberInfo.name, guildId, []);
    // 广播 联盟所有成员 成员信息变更
    await this.notifyLeagueMemberInfo(guildId, []);

    if (isSendMail) {
        await this.sendLeagueMail([uid], code.mail.MAIL_CONFIG_ID.GUILD_JOIN_MAIL, leagueInfo.name);
        // 添加聊天频道系统消息
        await this.sendLeagueChat(guildId, code.guild.GUILD_CHAT_SYSTEM_ID.JOIN, [memberInfo.name]);
    }
    this.log(guildId);
    return leagueInfo;
};
/**
 * 退出联盟
 */
GuildService.prototype.exitGuild = async function (memberInfo) {
    const uid = memberInfo.uid;
    const name = memberInfo.name;
    const guildId = memberInfo.guildId;
    const oldContribute = memberInfo.contribute;
    const newMemberInfo = await this.exitMember(uid, guildId);
    const newContribute = newMemberInfo.contribute;
    const leagueInfo = await this.updateGuildInfo(guildId, true);

    // 广播 uid 退出联盟
    await this.notifyLeagueInfo(code.guild.GUILD_OPERATE.LEAVE, uid, name, 0, [uid], newMemberInfo.leaveTime);
    // 广播 联盟所有成员 uid 离开联盟
    await this.notifyLeagueInfo(code.guild.GUILD_OPERATE.LEAVE, uid, name, guildId, []);
    // 广播 联盟所有成员 成员信息变更
    await this.notifyLeagueMemberInfo(guildId, []);
    await this.sendLeagueMail([uid], code.mail.MAIL_CONFIG_ID.GUILD_EXIT_MAIL, leagueInfo.name, oldContribute - newContribute, oldContribute, newContribute);
    // 添加聊天频道系统消息
    await this.sendLeagueChat(guildId, code.guild.GUILD_CHAT_SYSTEM_ID.EXIT, [name]);

    this.log(guildId);
};
/**
 * 逐出联盟
 */
GuildService.prototype.kickOutGuild = async function (kickOutInfo) {
    const kickOutUid = kickOutInfo.uid;
    const kickOutName = kickOutInfo.name;
    const guildId = kickOutInfo.guildId;
    const oldContribute = kickOutInfo.contribute;
    const newMemberInfo = await this.exitMember(kickOutUid, guildId);
    const newContribute = newMemberInfo.contribute;
    const leagueInfo = await this.updateGuildInfo(guildId, true);

    // 广播 kickOutUid 被逐出联盟
    await this.notifyLeagueInfo(code.guild.GUILD_OPERATE.KICK_OUT, kickOutUid, kickOutName, 0, [kickOutUid], newMemberInfo.leaveTime);
    // 广播 联盟所有成员 uid 被逐出联盟
    await this.notifyLeagueInfo(code.guild.GUILD_OPERATE.KICK_OUT, kickOutUid, kickOutName, guildId, []);
    // 广播 联盟所有成员 成员信息变更
    await this.notifyLeagueMemberInfo(guildId, []);
    await this.sendLeagueMail([kickOutUid], code.mail.MAIL_CONFIG_ID.GUILD_KICK_OUT_MAIL, leagueInfo.champions, oldContribute - newContribute, oldContribute, newContribute);

    // 添加聊天频道系统消息
    await this.sendLeagueChat(guildId, code.guild.GUILD_CHAT_SYSTEM_ID.KICK_OUT, [kickOutName]);

    this.log(guildId);
};

/**
 * 查询联盟
 */
GuildService.prototype.guildQuery = async function (condition) {
    const guildData = await this.app.GuildCache.query(condition);
    if (guildData) {
        return this.returnGuildInfo(guildData.dbValue());
    }
    else {
        const guildListData = this.app.GuildCache.getAllData();
        for (const data of guildListData) {
            const name = data.get('name');
            if (name == condition) {
                return this.returnGuildInfo(data.dbValue());
            }
        }
    }
    return undefined;
};
/**
 * 申请联盟
 */
GuildService.prototype.applyGuild = async function (uid, guildId) {
    const guildData = await this.app.GuildCache.query(guildId);
    if (guildData) {
        const nowSecond = util.time.nowSecond();
        this.addApplyDict(uid, guildId, nowSecond);
        const applyList = guildData.get('applyList');
        applyList[uid] = nowSecond;
        guildData.update({ applyList: applyList });
        // 申请广播
        await this.notifyLeagueApplyInfo(guildId, []);
        return this.returnGuildInfo(guildData.dbValue(), uid);
    }
    return null;
};
/**
 * 一键申请
 */
GuildService.prototype.guildOneKeyApply = async function (uid, guildIdList) {
    const noApplyGuildList = [];
    const applyGuildList = [];
    if (guildIdList && Array.isArray(guildIdList)) {
        // 获取未达上限联盟
        for (const guildId of guildIdList) {
            const guildData = await this.app.GuildCache.query(guildId);
            if (guildData) {
                const lv = guildData.get('lv');
                const memberList = guildData.get('memberList');
                const [num, maxNum] = this.getMemberNum(lv, memberList);
                if (num < maxNum) {
                    const joinType = guildData.get('joinType');
                    if (joinType > 0) {
                        applyGuildList.push(guildId);
                    }
                    else {
                        noApplyGuildList.push(guildId);
                    }
                }
            }
        }
    }
    // 获取无需审核的联盟
    // 有 随机抽取直接加入
    // 无 全部发起申请
    const leagueList = [];
    if (noApplyGuildList.length > 0) {
        const rand = util.random.random(0, noApplyGuildList.length - 1);
        const guildId = noApplyGuildList[rand];
        const guildInfo = await this.joinGuild(uid, guildId, code.guild.GUILD_JOB.MEMBER);
        leagueList.push(guildInfo);
    }
    else {
        for (const guildId of applyGuildList) {
            const guildInfo = this.applyGuild(uid, guildId);
            if (guildInfo) {
                leagueList.push(guildInfo);
            }
        }
    }
    return leagueList;
};
/**
 * 同意申请
 */
GuildService.prototype.guildAgree = async function (memberInfo, targetUid) {
    const guildId = memberInfo.guildId;
    // 加入联盟
    await this.joinGuild(targetUid, guildId, code.guild.GUILD_JOB.MEMBER);

    this.log(guildId);
};
/**
 * 拒绝申请
 */
GuildService.prototype.guildRefuse = async function (memberInfo, refuseUid) {
    const guildId = memberInfo.guildId;
    const uid = memberInfo.uid;
    const name = memberInfo.name;
    // 拒绝申请，移除申请
    const guildData = await this.app.GuildCache.query(guildId);
    if (guildData) {
        const applyList = guildData.get('applyList');
        const uids = refuseUid == '-1' ? Object.keys(applyList) : [refuseUid];
        this.delApplyDict(guildId, uids);
        for (const uid of uids) {
            delete applyList[uid];
        }
        guildData.update({ applyList: applyList });
        await this.notifyLeagueApplyInfo(guildId, []);

        // 通知玩家申请被拒绝
        await this.notifyLeagueInfo(code.guild.GUILD_OPERATE.REFUSE, uid, name, 0, uids);
    }
};
/**
 * 职位变更
 */
GuildService.prototype.guildJob = async function (memberInfo, changeMemberInfo, job) {
    const guildId = changeMemberInfo.guildId;
    const memberData = await this.app.GuildMemberCache.query(changeMemberInfo.uid);
    if (memberData) {
        memberData.update({ job: job });

        this.addGuildMemberDict(guildId, changeMemberInfo.uid, job);

        await this.updateGuildInfo(guildId, true, false);

        // 广播 联盟所有成员 uid 职位变更
        await this.notifyLeagueInfo(code.guild.GUILD_OPERATE.JOB_CHANGE, memberInfo.uid, memberInfo.name, guildId, []);
        // 广播 联盟所有成员 成员信息变更
        await this.notifyLeagueMemberInfo(guildId, []);

        // 添加聊天频道系统消息
        const jobName = this.app.Config.League.jobName(job);
        await this.sendLeagueChat(guildId, code.guild.GUILD_CHAT_SYSTEM_ID.JOB_CHANGE, [changeMemberInfo.name, jobName]);
    }
};
/**
 * 盟主转让
 */
GuildService.prototype.guildTransfer = async function (memberInfo, transferMemberInfo, transferType) {
    const guildId = memberInfo.guildId;
    const memberData = await this.app.GuildMemberCache.query(memberInfo.uid);
    const transferData = await this.app.GuildMemberCache.query(transferMemberInfo.uid);
    if (memberData && transferData) {
        memberData.update({ job: code.guild.GUILD_JOB.MEMBER });
        transferData.update({ job: code.guild.GUILD_JOB.CHAMPIONS });

        this.addGuildMemberDict(guildId, memberInfo.uid, code.guild.GUILD_JOB.MEMBER);
        this.addGuildMemberDict(guildId, transferMemberInfo.uid, code.guild.GUILD_JOB.CHAMPIONS);

        await this.updateGuildInfo(guildId, true, false);
        this.log(guildId);
        // 广播 联盟所有成员 uid 盟主转让
        await this.notifyLeagueInfo(code.guild.GUILD_OPERATE.TRANSFER, memberInfo.uid, memberInfo.name, guildId, []);
        // 广播 联盟所有成员 成员信息变更
        await this.notifyLeagueMemberInfo(guildId, []);
        // 添加聊天频道系统消息
        const memberName = this.app.Config.League.jobName(code.guild.GUILD_JOB.MEMBER);
        const championsName = this.app.Config.League.jobName(code.guild.GUILD_JOB.CHAMPIONS);
        await this.sendLeagueChat(guildId, code.guild.GUILD_CHAT_SYSTEM_ID.JOB_CHANGE, [memberInfo.name, memberName]);
        await this.sendLeagueChat(guildId, code.guild.GUILD_CHAT_SYSTEM_ID.JOB_CHANGE, [transferMemberInfo.name, championsName]);

        const guildName = await this.guildName(guildId);
        this.app.Log.guildTransferLog(transferType, guildId, guildName, memberInfo.uid, memberInfo.name, transferMemberInfo.uid, transferMemberInfo.name);
    }
};
/**
 * 修改
 */
GuildService.prototype.guildChangeInfo = async function (memberInfo, data, type) {
    const guildId = memberInfo.guildId;
    const guildData = await this.app.GuildCache.query(guildId);
    if (guildData) {
        guildData.update(data);

        await this.updateGuildInfo(guildId, true, false);

        await this.notifyLeagueInfo(code.guild.GUILD_OPERATE.UPDATE, memberInfo.uid, memberInfo.name, guildId, []);

        if (type == 1) {
            // 添加聊天频道系统消息
            await this.sendLeagueChat(guildId, code.guild.GUILD_CHAT_SYSTEM_ID.RENAME, [data.name]);
        }

        if (type == 1 || type == 3) {
            this.log(guildId);
        }
    }
};

/**
 * 修改公会公告
 */
GuildService.prototype.guildChangeNoticeAndmanifesto = async function (uid, name, guildId, data, type) {
    const guildData = await this.app.GuildCache.query(guildId);
    if (guildData) {
        guildData.update({ notice: data, manifesto: data });
        this.notifyLeagueInfo(code.guild.GUILD_OPERATE.UPDATE, uid, name, guildId, []);
        this.log(guildId);
    }
};
/**
 * 获取建设信息
 */
GuildService.prototype.guildBuildGetInfo = async function (uid) {
    const memberData = await this.app.GuildMemberCache.query(uid);
    let dayExp = 0;
    let recordList = [];
    const guildId = memberData.get('guildId');
    const nowTime = Date.now();
    const [buildDataList, awardList] = this.getBuildData(memberData, nowTime);
    const buildList = this.returnBuildInfo(buildDataList, nowTime);

    const guildData = await this.app.GuildCache.query(guildId);
    if (guildData) {
        const lv = guildData.get('lv');
        dayExp = guildData.get('dayBuildExp');
        const config = this.app.Config.LeagueLv.get(lv);
        if (dayExp > config.FundUpperLimit) {
            dayExp = config.FundUpperLimit;
        }
        recordList = guildData.get('buildRecord');
    }
    // console.log("建设信息：", dayExp, awardList, buildList, recordList);
    return [dayExp, awardList, buildList, recordList];
};
/**
 * 联盟建设
 */
GuildService.prototype.guildBuild = async function (uid, id) {
    // 8048
    const config = this.app.Config.LeagueBuild.get(id);
    if (!config) {
        return [code.err.ERR_LEAGUE_BUILD_ID_ERROR];
    }
    const memberData = await this.app.GuildMemberCache.query(uid);
    const guildId = memberData.get('guildId');
    // 未加入联盟 8047
    const isJoin = await this.guildIdExists(guildId);
    if (!isJoin) {
        return [code.err.ERR_LEAGUE_BUILD_NOT_GUILD];
    }
    const nowTime = Date.now();
    const buildData = this.getBuildData(memberData, nowTime);
    const buildDataList = buildData[0];
    if (buildDataList[id]) {
        const num = buildDataList[id][0] || 0;
        if (num >= config.LimitTimes) {
            // 已达建设上限 8049
            return [code.err.ERR_LEAGUE_BUILD_MAX];
        }
        const lastTime = buildDataList[id][1] || 0;
        // console.log("冷却：：：：：", util.time.getDateString(lastTime), util.time.getDateString(nowTime), util.time.getDateString(lastTime + config.Cd * 1000));
        if (lastTime < nowTime && nowTime < lastTime + config.Cd * 1000) {
            // 冷却中 8050
            return [code.err.ERR_LEAGUE_BUILD_CD];
        }
        // 消耗判断 8051
        let costInfo = config.Cost;
        if (id == 1) {
            let costNum = 0;
            const brief = await this.app.Brief.getBrief(uid) || {};
            const fameConfig = this.app.Config.Prestige.get(brief.lv || 1);
            costNum = fameConfig.MakeMoneySpeed * config.CashCostTime[num];
            costInfo = {};
            costInfo[code.currency.BIG_CURRENCY_ID.CASH] = costNum;
        }
        const costList = util.proto.encodeConfigAward([costInfo]);
        const retRole = await this.app.Redis.hget(code.redis.ROLE_ON_GAME.name, uid);
        if (retRole.err || !retRole.res) {
            return [code.err.FAILED];
        }
        const result = await this.app.rpcs.game.itemRemote.deleteItem.toServer(retRole.res, uid, costList, code.reason.OP_GUILD_BUILD_COST);
        if (!result.res) {
            return [code.err.ERR_LEAGUE_BUILD_COST];
        }
        buildDataList[id] = [num + 1, nowTime];
        let addContribute = config.Reward[code.guild.GUILD_ITEM_ID.CONTRIBUTE];
        const addGuildExp = config.Reward[code.guild.GUILD_ITEM_ID.GUILD_EXP];
        const technologyAdd = await this.getTechnologyBuildAdd(uid);
        addContribute = Math.floor(addContribute * (1 + technologyAdd / 10000));
        // 增加个人贡献
        await this.updateGuildContribute(uid, memberData, addContribute, code.reason.OP_GUILD_BUILD_GET, { buildList: buildDataList, buildLastTime: nowTime });

        const nextTime = nowTime + config.Cd * 1000;
        const buildInfo = { id: id, num: num + 1, time: nextTime < nowTime ? 0 : Math.floor(nextTime / 1000) };

        // 增加联盟经验
        const name = memberData.get('name');
        // 建设贡献记录
        const awardList = [];
        awardList.push({ itemID: code.guild.GUILD_ITEM_ID.CONTRIBUTE, itemNum: String(addContribute) });
        awardList.push({ itemID: code.guild.GUILD_ITEM_ID.GUILD_EXP, itemNum: String(addGuildExp) });
        const recordInfo = { time: Math.floor(nowTime / 1000), uid: String(uid), name: name, id: id, awardList: awardList };
        const dayExp = await this.updateGuildExp(uid, name, guildId, addGuildExp, true, recordInfo);
        // 广播建设信息变更
        await this.notifyLeagueBuildInfo(guildId, dayExp, recordInfo);
        return [code.err.SUCCEEDED, buildInfo];
    }
    return [code.err.SUCCEEDED];
};
/**
 * 领取建设宝箱
 */
GuildService.prototype.guildGetBuildBox = async function (uid, id) {
    // 8053
    const config = this.app.Config.LeagueBuildProgress.get(id);
    if (!config) {
        return [code.err.ERR_LEAGUE_BUILD_BOX_ERROR, []];
    }
    const memberData = await this.app.GuildMemberCache.query(uid);
    const guildId = memberData.get('guildId');
    // 未加入联盟 8052
    const isJoin = await this.guildIdExists(guildId);
    if (!isJoin) {
        return [code.err.ERR_LEAGUE_BUILD_BOX_NOT_GUILD, []];
    }

    const guildData = await this.app.GuildCache.query(guildId);
    if (guildData) {
        const dayBuildExp = guildData.get('dayBuildExp');
        // 今日资金不足 8054
        if (dayBuildExp < config.NeedFund) {
            return [code.err.ERR_LEAGUE_BUILD_BOX_NOT_ENOUGH, []];
        }
    }
    const nowTime = Date.now();
    const buildData = this.getBuildData(memberData, nowTime);
    const boxList = buildData[1] || [];
    // 宝箱已领取8055
    if (boxList.includes(id)) {
        return [code.err.ERR_LEAGUE_BUILD_BOX_IS_GET, boxList];
    }
    boxList.push(id);
    memberData.update({ buildBox: boxList, buildLastTime: nowTime });
    // 下发宝箱奖励
    const costList = util.proto.encodeConfigAward([config.Reward]);
    const retRole = await this.app.Redis.hget(code.redis.ROLE_ON_GAME.name, uid);
    if (retRole.err || !retRole.res) {
        return [code.err.FAILED, []];
    }
    this.app.rpcs.game.itemRemote.addItem.toServer(retRole.res, uid, costList, code.reason.OP_GUILD_BUILD_BOX_GET);
    return [code.err.SUCCEEDED, boxList, util.proto.encodeAward(costList)];
};
/**
 * 获取科技信息
 */
GuildService.prototype.guildTechnologyGetInfo = async function (uid) {
    const technologyList = [];
    const memberData = await this.app.GuildMemberCache.query(uid);
    if (memberData) {
        const technologyInfo = memberData.get('technologyInfo');
        for (const [id, lv] of Object.entries(technologyInfo)) {
            technologyList.push({ skillId: id, level: lv });
        }
        // console.log("科技信息：", technologyList);
    }
    return technologyList;
};
/**
 * 科技升级
 */
GuildService.prototype.guildTechnologyUpgrade = async function (uid, skillId) {
    if (!this.app.Config.LeagueSkill.judgeSkillId(skillId)) {
        return [code.err.ERR_LEAGUE_TECHNOLOGY_EXISTS];
    }
    const memberData = await this.app.GuildMemberCache.query(uid);
    const guildId = memberData.get('guildId');
    // 未加入联盟 8058
    const isJoin = await this.guildIdExists(guildId);
    if (!isJoin) {
        return [code.err.ERR_LEAGUE_TECHNOLOGY_NOT_GUILD];
    }
    const technologyInfo = memberData.get('technologyInfo');
    const lv = technologyInfo[skillId] || 0;
    const newLv = lv + 1;
    // 8059
    const config = this.app.Config.LeagueSkill.getConfig(skillId, newLv);
    if (!config) {
        return [code.err.ERR_LEAGUE_TECHNOLOGY_LV_LIMIT];
    }
    // 联盟等级不足
    const guildLv = await this.getGuildLv(guildId);
    if (guildLv < config.NeedLeagueLv) {
        return [code.err.ERR_LEAGUE_TECHNOLOGY_GUILD_LV];
    }
    const costList = util.proto.encodeConfigAward([config.Cost]);
    const retRole = await this.app.Redis.hget(code.redis.ROLE_ON_GAME.name, uid);
    if (retRole.err || !retRole.res) {
        return [code.err.FAILED];
    }
    const result = await this.app.rpcs.game.itemRemote.deleteItem.toServer(retRole.res, uid, costList, code.reason.OP_GUILD_TECHNOLOGY_UPGRADE_COST);
    if (!result.res) {
        return [code.err.ERR_LEAGUE_TECHNOLOGY_COST];
    }
    technologyInfo[skillId] = newLv;
    memberData.update({ technologyInfo: technologyInfo });

    // 通知game服科技加成变更
    const technologyAdd = await this.getTechnologyAdd(uid);
    // 科技效果提升 更新对应职业的主播
    let career = 0;
    if (config.EffectType == code.guild.GUILD_TECHNOLOGY_EFFECT_TYPE.CARD_ART) {
        career = code.card.CAREER_TYPE.ART;
    }
    else if (config.EffectType == code.guild.GUILD_TECHNOLOGY_EFFECT_TYPE.CARD_GAME) {
        career = code.card.CAREER_TYPE.GAME;
    }
    else if (config.EffectType == code.guild.GUILD_TECHNOLOGY_EFFECT_TYPE.CARD_AMUSEMENT) {
        career = code.card.CAREER_TYPE.ENTERTAINMENT;
    }
    await this.app.rpcs.game.guildRemote.changeTechnologyAdd.toServer(retRole.res, uid, technologyAdd, career);
    return [code.err.SUCCEEDED, { skillId: skillId, level: newLv }];
};
//----------------------------------------------------------------
/**
 * 获取所有公会id
 */
GuildService.prototype.getAllGuildId = function () {
    const guildListData = this.app.GuildCache.getAllData();
    return guildListData.map((guildData) => guildData.get('guildId'));
};
/**
 * 获取玩家公会id
 */
GuildService.prototype.getGuildId = async function (uid) {
    // 获取联盟玩家信息
    const memberData = await this.app.GuildMemberCache.query(uid);
    // 判断玩家的联盟是否存在
    if (memberData) {
        const guildId = memberData.get('guildId');
        if (await this.guildIdExists(guildId)) {
            return guildId;
        }
    }
    return 0;
};
GuildService.prototype.guildName = async function (guildId) {
    if (guildId && guildId > 0) {
        const guildData = await this.app.GuildCache.query(guildId);
        if (guildData) {
            return guildData.get("name");
        }
    }
    return '';
};
/**
 * 获取玩家公会名称
 */
GuildService.prototype.getGuildName = async function (uid) {
    const memberData = await this.app.GuildMemberCache.query(uid);
    if (memberData) {
        const guildId = memberData.get('guildId');
        return await this.guildName(guildId);
    }
    return '';
};
/**
 * 通过公会名称获取成员uids
 */
GuildService.prototype.getMemberFromGuildName = async function (name) {
    const guildListData = this.app.GuildCache.getAllData();
    const guildList = guildListData.filter((guildData) => { return name == guildData.get('name'); });
    if (guildList && guildList[0]) {
        return Object.keys(guildList[0].get('memberList'));
    }
    return [];
};
/**
 * 获取联盟成员信息
 */
GuildService.prototype.getGuildMember = async function (uid) {
    // 获取联盟玩家信息
    const memberData = await this.app.GuildMemberCache.query(uid);
    // 判断玩家的联盟是否存在
    if (memberData) {
        return memberData.dbValue();
    }
    return {};
};
/**
 * 联盟是否存在
 */
GuildService.prototype.guildIdExists = async function (guildId) {
    if (guildId && guildId > 0) {
        const guildData = await this.app.GuildCache.query(guildId);
        if (guildData && guildData.get("guildId") && guildData.get("guildId") > 0) {
            return true;
        }
    }
    return false;
};
/**
 * 获取玩家离线时间
 */
GuildService.prototype.getLeaveTime = async function (uid) {
    const memberData = await this.getGuildMember(uid);
    if (memberData) {
        if (this.judgeLeaveTime(memberData.leaveTime)) {
            return util.time.ms2s(memberData.leaveTime);
        }
    }
    return 0;
};
/**
 * 是否还在离开联盟的限制时间内
 */
GuildService.prototype.judgeLeaveTime = function (leaveTime = 0) {
    const nowTime = Date.now();
    const globalInfo = this.app.Config.Global.getGlobalFloat(code.guild.GUILD_LEAVE_LIMIT_TIME);
    if (leaveTime > 0 && nowTime < leaveTime + globalInfo) {
        return true;
    }
    return false;
};
/**
 * TODO GM清除离开联盟CD
 */
GuildService.prototype.clearLeaveTime = async function (uid) {
    const memberData = await this.app.GuildMemberCache.query(uid);
    if (memberData) {
        memberData.update({ leaveTime: 0 }, true);
    }
};
/**
 * 联盟是否满员
 */
GuildService.prototype.isFullMember = async function (guildId) {
    const guildData = await this.app.GuildCache.query(guildId);
    if (guildData) {
        const memberList = guildData.get("memberList") || {};
        const lv = guildData.get("lv") || 1;
        const num = Object.keys(memberList).length;
        let maxNum = 0;
        const config = this.app.Config.LeagueLv.get(lv);
        if (config) {
            maxNum = config.MemberUpperLimit;
        }
        if (num >= maxNum) {
            return true;
        }
    }
    return false;
};
/**
 * 获取加入类型
 */
GuildService.prototype.getJoinType = async function (guildId) {
    if (guildId && guildId > 0) {
        const guildData = await this.app.GuildCache.query(guildId);
        if (guildData) {
            return guildData.get("joinType");
        }
    }
    return 0;
};
/**
 * 获取联盟等级
 */
GuildService.prototype.getGuildLv = async function (guildId) {
    if (guildId && guildId > 0) {
        const guildData = await this.app.GuildCache.query(guildId);
        if (guildData) {
            return guildData.get("lv");
        }
    }
    return 0;
};
/**
 * 获取联盟等级
 */
GuildService.prototype.getGuildLvFromUid = async function (uid) {
    // 获取联盟玩家信息
    const memberData = await this.app.GuildMemberCache.query(uid);
    // 判断玩家的联盟是否存在
    if (memberData) {
        const guildId = memberData.get('guildId');
        if (guildId && guildId > 0) {
            const guildData = await this.app.GuildCache.query(guildId);
            if (guildData) {
                return guildData.get("lv");
            }
        }
    }
    return 0;
};
/**
 * 获取联盟成员列表
 */
GuildService.prototype.getGuildMemberList = async function (guildId) {
    if (guildId && guildId > 0) {
        const guildData = await this.app.GuildCache.query(guildId);
        if (guildData) {
            const returnList = [];
            const list = guildData.get('memberList') || {};
            for (const memberUid of Object.keys(list)) {
                returnList.push(parseInt(memberUid));
            }
            return returnList;
        }
    }
    return [];
};
/**
 * 移除玩家所有申请 即加入联盟就移除所有申请 比如 创建、加入、被同意
 */
GuildService.prototype.delGuildApply = async function (uid) {
    const applyGuild = this.getApplyGuild(uid);
    if (applyGuild.length > 0) {
        for (const applyGuildId of applyGuild) {
            const guildData = await this.app.GuildCache.query(applyGuildId);
            if (guildData) {
                this.delApplyDict(applyGuildId, [uid]);
                const applyList = guildData.get('applyList');
                delete applyList[uid];
                guildData.update({ applyList: applyList });
                await this.notifyLeagueApplyInfo(applyGuildId, []);
            }
        }
    }
};
/**
 * 玩家登陆 公会处理
 */
GuildService.prototype.loginGuildProcess = async function (uid) {
    const memberInfo = await this.getGuildMember(uid);
    // 加入公会频道
    await this.addChannelMember(memberInfo.guildId, memberInfo.uid);
    const technologyAdd = await this.getTechnologyAdd(uid);
    const guildLv = await this.getGuildLv(memberInfo.guildId);
    return { guildId: memberInfo.guildId, contribute: memberInfo.contribute, technologyAdd: technologyAdd, guildLv: guildLv };
};

/**
 * 玩家登出 公会处理
 */
GuildService.prototype.logoutGuildProcess = async function (uid) {
    const memberInfo = await this.getGuildMember(uid);
    // 离开公会频道
    await this.LeaveChannelMember(memberInfo.guildId, memberInfo.uid);
};

/**增加联盟经验 */
GuildService.prototype.addGuildExp = async function (uid, num) {
    // 获取联盟玩家信息
    const memberData = await this.app.GuildMemberCache.query(uid);
    if (memberData) {
        const guildId = memberData.get('guildId');
        const name = memberData.get('name');
        this.updateGuildExp(uid, name, guildId, num, false);
    }
};
/**
 * 更新联盟经验
 * @param {String} uid 操作者uid
 * @param {String} name 操作者编号
 * @param {Number} guildId 联盟编号
 * @param {Number} num 增加的联盟经验
 * @param {Boolean} isBuild 是否是建设增加的经验 判断资金(上限)
 * @param {Object} recordInfo 是否附带建设记录
 */
GuildService.prototype.updateGuildExp = async function (uid, name, guildId, num, isBuild, recordInfo) {
    let newDayBuildExp = 0;
    const guildData = await this.app.GuildCache.query(guildId);
    if (guildData) {
        const lv = guildData.get('lv');
        const exp = guildData.get('exp');
        let newLv = lv;
        let totalExp = exp + num;
        if (totalExp > code.guild.GUILD_UINT32_MAX) {
            totalExp = code.guild.GUILD_UINT32_MAX;
        }
        const maxLv = this.app.Config.LeagueLv.keyMax();
        for (let i = lv; i < maxLv; i++) {
            const config = this.app.Config.LeagueLv.get(i);
            //
            if (totalExp >= config.NeedFund) {
                totalExp -= config.NeedFund;
                newLv = i + 1;
            }
            else {
                break;
            }
        }
        const data = {};
        data.lv = newLv;
        data.exp = totalExp;
        data.lastTime = Date.now();
        if (isBuild) {
            const dayBuildExp = guildData.get('dayBuildExp');
            const config = this.app.Config.LeagueLv.get(data.lv);
            if (dayBuildExp < config.FundUpperLimit) {
                data.dayBuildExp = dayBuildExp + num;
            }
            newDayBuildExp = data.dayBuildExp;
            if (newDayBuildExp > config.FundUpperLimit) {
                newDayBuildExp = config.FundUpperLimit;
            }
        }
        if (recordInfo) {
            const buildRecord = guildData.get('buildRecord');
            buildRecord.push(recordInfo);
            data.buildRecord = buildRecord;
        }
        guildData.update(data);
        // 广播 联盟所有成员
        await this.notifyLeagueInfo(code.guild.GUILD_OPERATE.UPDATE, uid, name, guildId, []);
        if (lv != newLv) {
            // 通知玩家联盟等级
            const memberList = guildData.get('memberList');
            for (const memberUid of Object.keys(memberList)) {
                // 通知game服guildID修改
                const retRole = await this.app.Redis.hget(code.redis.ROLE_ON_GAME.name, memberUid);
                if (!retRole.err && retRole.res) {
                    this.app.rpcs.game.guildRemote.changeGuildData.toServer(retRole.res, memberUid, { guildId: guildId, guildLv: newLv });
                }
            }
        }
        this.log(guildId);
    }
    return newDayBuildExp;
};
/**
 * 增加联盟贡献
 */
GuildService.prototype.addGuildContribute = async function (uid, num, actionId) {
    const memberData = await this.app.GuildMemberCache.query(uid);
    if (memberData) {
        await this.updateGuildContribute(uid, memberData, num, actionId);
    }
};
/**
 * 更新联盟贡献
 * @param {String} uid 操作者uid
 * @param {Object} memberData 操作者编号
 * @param {Number} num 增加的贡献
 * @param {Object} data 是否附带更新信息
 */
GuildService.prototype.updateGuildContribute = async function (uid, memberData, num, actionId, data = {}) {
    const guildId = memberData.get('guildId');
    let contribute = memberData.get('contribute');
    contribute += num;
    if (contribute > code.guild.GUILD_UINT32_MAX) {
        contribute = code.guild.GUILD_UINT32_MAX;
    }
    data.contribute = contribute;
    let guildContribute = memberData.get('guildContribute');
    guildContribute += num;
    if (guildContribute > code.guild.GUILD_UINT32_MAX) {
        guildContribute = code.guild.GUILD_UINT32_MAX;
    }
    data.guildContribute = guildContribute;
    memberData.update(data);
    // 通知game服guildID修改
    this.changeGuildInfo(uid, guildId, contribute, guildId);
    // 如果在联盟 广播其他成员 该成员信息变更
    await this.notifyLeagueMemberOne(guildId, uid);
    const retRole = await this.app.Redis.hget(code.redis.ROLE_ON_GAME.name, uid);
    if (!retRole.err && retRole.res) {
        this.app.rpcs.game.itemRemote.itemLog.toServer(retRole.res, uid, 1, actionId, [{ itemID: code.guild.GUILD_ITEM_ID.CONTRIBUTE, itemNum: String(num) }]);
    }
};
/**
 * 扣除联盟贡献
 */
GuildService.prototype.delGuildContribute = async function (uid, num, actionId) {
    const memberData = await this.app.GuildMemberCache.query(uid);
    if (memberData) {
        const guildId = memberData.get('guildId');
        let contribute = memberData.get('contribute');
        contribute -= num;
        if (contribute <= 0) {
            contribute = 0;
        }
        memberData.update({ contribute: contribute });
        // 通知game服guildID修改
        this.changeGuildInfo(uid, guildId, contribute, guildId);
        // 如果在联盟 广播其他成员 该成员信息变更
        await this.notifyLeagueMemberOne(guildId, uid);
        const retRole = await this.app.Redis.hget(code.redis.ROLE_ON_GAME.name, uid);
        if (!retRole.err && retRole.res) {
            this.app.rpcs.game.itemRemote.itemLog.toServer(retRole.res, uid, -1, actionId, [{ itemID: code.guild.GUILD_ITEM_ID.CONTRIBUTE, itemNum: String(num) }]);
        }
    }
};
/**
 * 获取建设数据 判断是否重置
 * @param {Object} memberData 成员数据
 * @param {Number} nowTime 当前时间ms
 * @param {Boolean} isReset 是否直接重置
 */
GuildService.prototype.getBuildData = function (memberData, nowTime, isReset = false) {
    const lastTime = memberData.get('buildLastTime');
    let buildList = memberData.get('buildList');
    let awardList = memberData.get('buildBox');
    if (!buildList || !util.time.isSameDay(lastTime, nowTime) || isReset) {
        buildList = {};
        for (const id of this.app.Config.LeagueBuild.keys()) {
            buildList[id] = [0, 0];
        }
        awardList = [];
        memberData.update({ buildLastTime: nowTime, buildList: buildList, buildBox: awardList });
    }
    return [buildList, awardList];
};
/**
 * 公会零点处理
 */
GuildService.prototype.guildZeroProcess = async function () {
    const guildListData = this.app.GuildCache.getAllData();
    for (const guildData of guildListData) {
        const guildId = guildData.get('guildId');
        const dayBuildExp = guildData.get('dayBuildExp') || 0;
        const buildRecord = guildData.get('buildRecord') || [];
        if (dayBuildExp > 0 || buildRecord.length > 0) {
            guildData.update({ dayBuildExp: 0, buildRecord: [] });
            // 广播建设信息变更
            await this.notifyLeagueBuildInfo(guildId, 0);
        }
    }
};
/**
 * 公会成员零点处理
 */
GuildService.prototype.guildMemberZeroProcess = async function () {
    const nowTime = Date.now();
    const memberDB = this.app.GuildMemberCache.getAllData();
    for (const memberData of memberDB) {
        const uid = memberData.get('uid');
        const guildId = memberData.get('guildId');
        const connectId = await this.getConnectId(uid);
        if (guildId > 0 && connectId) {
            const [buildDataList, awardList] = this.getBuildData(memberData, nowTime, true);
            const buildList = this.returnBuildInfo(buildDataList, nowTime);
            this.notifyLeagueBuildList(uid, buildList, awardList);
        }
    }
};
/**
 * 玩家离线是否超过时间
 * @param {*} uid
 * @param {Number} time 离线超过的时间(毫秒)
 */
GuildService.prototype.isLogoutTime = async function (uid, nowTime, time) {
    const connectId = await this.getConnectId(uid);
    if (connectId) {
        // logger.info(`玩家在线  uid：${uid} `);
        return false;
    }
    else {
        const championsBrief = await this.app.Brief.getBrief(uid);
        if (!championsBrief || nowTime - Number(championsBrief.lastLogoutTime) <= time) {
            // logger.info(`玩家离线 ：uid：${uid} lastLogoutTime:${util.time.getDateString(Number(championsBrief.lastLogoutTime))} 未超过：${time} `);
            return false;
        }
        else {
            // logger.info(`玩家离线 ：uid：${uid} lastLogoutTime:${util.time.getDateString(Number(championsBrief.lastLogoutTime))} 超过：${time} `);
            return true;
        }
    }
};
/**
 * 会长自动转让 (TODO：每次获取公会信息的时候处理)
 */
GuildService.prototype.guildAutoTransfer = async function (guildId) {
    const guildData = await this.app.GuildCache.query(guildId);
    if (!guildData) {
        return;
    }
    const nowTime = Date.now();
    // 判断盟主是否离线超过7天
    const championsUid = guildData.get('championsUid');
    const isLogout = await this.isLogoutTime(championsUid, nowTime, code.guild.GUILD_TRANSFER_AUTO_OFFLINE_TIME);
    if (!isLogout) {
        logger.debug(`【盟主自动转让】盟主离线未超过7天 ：guild:${guildId} uid：${championsUid} 超过：:${code.guild.GUILD_TRANSFER_AUTO_OFFLINE_TIME} `);
        return;
    }

    const memberDict = this.guildMemberDict[guildId];
    if (!memberDict) {
        return;
    }
    // 获取三日内活跃成员
    // 优先按职位/联盟贡献转让盟主职位
    // 副盟主>精英>成员
    let transferUid = 0;
    let maxJob = code.guild.GUILD_JOB.MEMBER;
    let maxContribute = 0;
    for (const [id, job] of Object.entries(memberDict)) {
        const uid = Number(id)
        if (job != code.guild.GUILD_JOB.CHAMPIONS) {
            const isLogout = await this.isLogoutTime(uid, nowTime, code.guild.GUILD_TRANSFER_AUTO_TIME);
            if (isLogout) {
                logger.debug(`【盟主自动转让】成员离线 uid：${uid} 超过：${code.guild.GUILD_TRANSFER_AUTO_TIME}`);
                continue;
            }
            const memberData = await this.app.GuildMemberCache.query(uid);
            // 三日内活跃
            if (memberData) {
                const guildContribute = memberData.get('guildContribute');
                // 职位、贡献最高
                if (job <= maxJob && guildContribute >= maxContribute) {
                    maxJob = job;
                    maxContribute = guildContribute;
                    transferUid = uid;
                }
            }
        }
    }
    if (transferUid <= 0) {
        logger.info(`【盟主自动转让】无可转让成员 ：guild:${guildId} `);
        return;
    }
    logger.info(`【盟主自动转让】转让成员 ：guild:${guildId} uid:${transferUid} job:${maxJob} guildContribute:${maxContribute}`);
    // 转让盟主
    const championsMember = await this.getGuildMember(championsUid);
    const transferMember = await this.getGuildMember(transferUid);
    if (util.object.isNull(championsMember) || util.object.isNull(transferMember)) {
        logger.info(`【盟主自动转让】成员信息获取失败 ：guild:${guildId} ${championsUid} ${transferUid}`);
        return;
    }
    await this.guildTransfer(championsMember, transferMember, code.guild.GUILD_TRANSFER_TYPE.AUTO);
    // 下发邮件
    // 下发原盟主邮件
    await this.sendLeagueMail([championsUid], code.mail.MAIL_CONFIG_ID.GUILD_AUTO_OLD_CHAMPIONS_MAIL);
    // 下发新盟主邮件
    await this.sendLeagueMail([transferUid], code.mail.MAIL_CONFIG_ID.GUILD_AUTO_NEW_CHAMPIONS_MAIL, championsMember.name);
    logger.info(`【盟主自动转让】转让成功 ：guild:${guildId} championsUid:${championsUid} name:${championsMember.name} transferUid:${transferUid} name:${transferMember.name} `);

    this.log(guildId);
};
/**
 * 获取科技建设加成 建设获得贡献提升
 * @param {*} uid 玩家编号
 */
GuildService.prototype.getTechnologyBuildAdd = async function (uid) {
    const add = await this.technologyAdd(uid, code.guild.GUILD_TECHNOLOGY_EFFECT_TYPE.BUILD_CONTRIBUTE);
    return add || 0;
};
// /**
//  * 获取科技平台招募加成 招募所需成本降低
//  * @param {*} uid 玩家编号
//  * @param {code.guild.GUILD_TECHNOLOGY_EFFECT_TYPE} id 平台编号
//  */
// GuildService.prototype.getTechnologyRecruitStaffAdd = async function (uid, id) {
//     const add = await this.technologyAdd(uid, code.guild.GUILD_TECHNOLOGY_EFFECT_TYPE.RECRUIT_STAFF, id);
//     return add || 0;
// };
// /**
//  * 获取科技卡牌加成 主播基础热度、魅力提升
//  * @param {*} uid 玩家编号
//  * @param {code.card.CAREER_TYPE} career 职业
//  */
// GuildService.prototype.getTechnologyCardAdd = async function (uid, career) {
//     let effectType = 0;
//     switch (career) {
//         case code.card.CAREER_TYPE.ART:
//             effectType = code.guild.GUILD_TECHNOLOGY_EFFECT_TYPE.CARD_ART;
//             break;
//         case code.card.CAREER_TYPE.GAME:
//             effectType = code.guild.GUILD_TECHNOLOGY_EFFECT_TYPE.CARD_GAME;
//             break;
//         case code.card.CAREER_TYPE.ENTERTAINMENT:
//             effectType = code.guild.GUILD_TECHNOLOGY_EFFECT_TYPE.CARD_AMUSEMENT;
//             break;
//     }
//     let add = 0;
//     if (effectType > 0) {
//         add = await this.technologyAdd(uid, effectType);
//     }
//     return add || 0;
// };
/**
 * 获取属性加成
 * @param {*} uid
 * @param {Number} effectType
 * @param {Number} id
 * @returns {Number | Object} 
 */
GuildService.prototype.technologyAdd = async function (uid, effectType, id) {
    const memberData = await this.app.GuildMemberCache.query(uid);
    if (memberData) {
        const technologyInfo = memberData.get('technologyInfo');
        for (const [skillId, lv] of Object.entries(technologyInfo)) {
            const config = this.app.Config.LeagueSkill.getConfig(skillId, lv);
            if (config && config.EffectType == effectType) {
                switch (effectType) {
                    case code.guild.GUILD_TECHNOLOGY_EFFECT_TYPE.BUILD_CONTRIBUTE:
                        return config.Effect[code.guild.GUILD_ITEM_ID.CONTRIBUTE];
                    case code.guild.GUILD_TECHNOLOGY_EFFECT_TYPE.RECRUIT_STAFF:
                        if (config.Effect[id]) {
                            return config.Effect[id];
                        }
                        break;
                    case code.guild.GUILD_TECHNOLOGY_EFFECT_TYPE.CARD_ART:
                    case code.guild.GUILD_TECHNOLOGY_EFFECT_TYPE.CARD_GAME:
                    case code.guild.GUILD_TECHNOLOGY_EFFECT_TYPE.CARD_AMUSEMENT:
                        return config.Effect;
                }
            }
        }
    }
    return null;
};
/**
 * 获取科技玩家加成
 */
GuildService.prototype.getTechnologyAdd = async function (uid) {
    let recruitAdd = {};
    const cardAdd = {};
    const memberData = await this.app.GuildMemberCache.query(uid);
    if (memberData) {
        const technologyInfo = memberData.get('technologyInfo');
        for (const [skillId, lv] of Object.entries(technologyInfo)) {
            const config = this.app.Config.LeagueSkill.getConfig(skillId, lv);
            if (config) {
                if (config.EffectType == code.guild.GUILD_TECHNOLOGY_EFFECT_TYPE.RECRUIT_STAFF) {
                    recruitAdd = util.object.mergeObject(recruitAdd, config.Effect);
                }
                else if (config.EffectType == code.guild.GUILD_TECHNOLOGY_EFFECT_TYPE.CARD_ART) {
                    cardAdd[code.card.CAREER_TYPE.ART] = util.object.mergeObject(cardAdd[code.card.CAREER_TYPE.ART], config.Effect);
                }
                else if (config.EffectType == code.guild.GUILD_TECHNOLOGY_EFFECT_TYPE.CARD_GAME) {
                    cardAdd[code.card.CAREER_TYPE.GAME] = util.object.mergeObject(cardAdd[code.card.CAREER_TYPE.GAME], config.Effect);
                }
                else if (config.EffectType == code.guild.GUILD_TECHNOLOGY_EFFECT_TYPE.CARD_AMUSEMENT) {
                    cardAdd[code.card.CAREER_TYPE.ENTERTAINMENT] = util.object.mergeObject(cardAdd[code.card.CAREER_TYPE.ENTERTAINMENT], config.Effect);
                }
            }
        }
    }
    return { recruitAdd: recruitAdd, cardAdd: cardAdd };
};

//----------------------------------------------------------------
/**
 * 加入联盟成员
 */
GuildService.prototype.joinMember = async function (uid, guildId, job) {
    uid = Number(uid);
    const newMember = await this.app.GuildMemberCache.queryOrCreate(uid);
    const beforeGuildId = newMember.get('guildId');
    const nowTime = Date.now();
    const memberInfo = {};
    memberInfo.uid = uid;
    memberInfo.guildId = guildId;
    memberInfo.contribute = newMember.get("contribute") || 0;
    memberInfo.guildContribute = 0;
    memberInfo.job = job;
    memberInfo.joinTime = nowTime;
    memberInfo.leaveTime = 0;
    // 20200722 保留建设记录
    // memberInfo.buildList = {};
    // for (const id of this.app.Config.LeagueBuild.keys()) {
    //     memberInfo.buildList[id] = [0, 0];
    // }
    // memberInfo.buildBox = [];
    // memberInfo.buildLastTime = nowTime;
    const brief = await this.app.Brief.getBrief(memberInfo.uid);
    if (brief) {
        memberInfo.name = brief.name;
        memberInfo.lv = parseInt(brief.lv);
        memberInfo.vip = parseInt(brief.vip);
        memberInfo.head = parseInt(brief.headImageId);
        memberInfo.sex = parseInt(brief.sex);
        memberInfo.power = parseInt(brief.power);
    }
    newMember.update(memberInfo, true);
    await this.addChannelMember(guildId, memberInfo.uid);
    this.addGuildMemberDict(guildId, memberInfo.uid, job);
    // 全球项目广播
    this.app.Event.emit(code.eventServer.GUILD_PROJECT_JOIN.name, uid);
    // 通知game服guildID修改
    this.changeGuildInfo(memberInfo.uid, guildId, memberInfo.contribute, beforeGuildId);

    return memberInfo;
};
/**
 * 退出联盟
 */
GuildService.prototype.exitMember = async function (uid, guildId) {
    uid = Number(uid);
    const memberData = await this.app.GuildMemberCache.queryOrCreate(uid);
    const beforeGuildId = memberData.get('guildId');
    const oldMember = memberData.dbValue();
    const memberInfo = {};
    memberInfo.guildId = 0;
    const globalInfo = this.app.Config.Global.getGlobalFloat(code.guild.GUILD_CONTRIBUTE_RATIO);
    memberInfo.contribute = Math.floor(oldMember.contribute * (1 - globalInfo));
    memberInfo.guildContribute = 0;
    memberInfo.job = 0;
    memberInfo.joinTime = 0;
    memberInfo.leaveTime = Date.now();
    memberData.update(memberInfo, true);
    await this.LeaveChannelMember(guildId, uid);
    this.delGuildMemberDict(guildId, uid);
    // 全球项目结算
    this.app.Event.emit(code.eventServer.GUILD_PROJECT_SETTLEMENT.name, uid, guildId);
    // 通知game服guildID
    this.changeGuildInfo(uid, 0, memberInfo.contribute, beforeGuildId);
    return memberInfo;
};

/**
 * 通知game玩家信息
 */
GuildService.prototype.changeGuildInfo = async function (uid, guildId, contribute, beforeGuildId) {
    const info = {};
    info.guildId = guildId;
    info.contribute = contribute;
    info.beforeGuildId = beforeGuildId;
    info.guildLv = await this.getGuildLv(guildId);
    const gameId = await this.app.Online.whichGame(uid);
    if (gameId) {
        const { err } = await this.app.rpcs.game.guildRemote.changeGuildInfo.toServer(gameId, uid, info);
        if (!err) {
            // 正常调用无报错则直接返回
            return;
        }
    }
    // 找不到该玩家或者报错时处理
    await this.app.RankUpdate.guildIDChangedRankUpdate(uid, info.guildId, info.beforeGuildId);
};

/**
 * 获取公会成员列表
 */
GuildService.prototype.getMemberList = async function (guildData) {
    const memberList = [];
    if (guildData) {
        const list = guildData.get('memberList') || {};
        for (const [memberUid, job] of Object.entries(list)) {
            const memberInfo = await this.app.GuildMemberCache.query(parseInt(memberUid));
            if (memberInfo) {
                memberList.push(await this.returnMemberInfo(memberInfo.dbValue(), job));
            }
        }
    }
    return memberList;
};
/**
 * 获取公会申请列表
 */
GuildService.prototype.getApplyList = async function (guildData) {
    const applyList = [];
    if (guildData) {
        const list = guildData.get('applyList') || {};
        for (const [uid, time] of Object.entries(list)) {
            const memberInfo = await this.app.GuildMemberCache.query(parseInt(uid));
            if (memberInfo && memberInfo.get('guildId') > 0) {
                continue;
            }
            applyList.push(await this.returnApplyInfo(uid, time));
        }
    }
    return applyList;
};
/**
 * 获取联盟信息
 * @param {Number} guildId 联盟编号
 */
GuildService.prototype.getGuildByGuildId = async function (guildId) {
    const guildData = await this.app.GuildCache.query(guildId);
    if (guildData) {
        const info = {};
        const dbData = guildData.dbValue();
        info.name = dbData.name;
        info.badge = dbData.badge;
        info.lv = dbData.lv;
        info.champions = dbData.championsName;
        info.championsUid = dbData.championsUid;
        return info;
    }
    return undefined;
};
/**
 * 获取公会成员总人数
 */
GuildService.prototype.getMemberNum = function (lv, memberList) {
    let num = 0;
    if (memberList && typeof (memberList) == 'object') {
        num = Object.keys(memberList).length;
    }
    let maxNum = 0;
    const config = this.app.Config.LeagueLv.get(lv);
    if (config) {
        maxNum = config.MemberUpperLimit;
    }
    return [num, maxNum];
};
/**
 * 判断成员人数是否已满
 */
GuildService.prototype.judgeMemberLimit = async function (guildId, job) {
    const guildData = await this.app.GuildCache.query(guildId);
    if (guildData) {
        const memberList = guildData.get('memberList');
        let num = 0;
        for (const j of Object.values(memberList)) {
            if (j == job) {
                num += 1;
            }
        }
        const lv = guildData.get('lv');
        const maxNum = this.app.Config.LeagueLv.jobNum(lv, job);
        if (num >= maxNum) {
            return true;
        }
    }
    return false;
};
/**
 * 返回联盟信息
 */
GuildService.prototype.returnGuildInfo = function (guildData, uid) {
    const info = {};
    info.leagueId = guildData.guildId;
    info.name = guildData.name;
    info.badge = guildData.badge;
    info.manifesto = guildData.manifesto;
    info.notice = guildData.notice;
    info.lv = guildData.lv;
    info.exp = guildData.exp;
    info.joinType = guildData.joinType;
    info.totalPower = guildData.totalPower;
    info.isApply = this.isApply(uid, info.leagueId) ? 1 : 0;
    info.champions = guildData.championsName;
    // info.num = 0;
    // if (guildData.memberList && typeof (guildData.memberList) == 'object') {
    //     info.num = Object.keys(guildData.memberList).length;
    // }
    // info.maxNum = 0;
    // const config = this.app.Config.LeagueLv.get(info.lv);
    // if (config) {
    //     info.maxNum = config.MemberUpperLimit;
    // }
    const [num, maxNum] = this.getMemberNum(info.lv, guildData.memberList);
    info.num = num;
    info.maxNum = maxNum;

    return info;
};
/**
 * 返回成员信息
 */
GuildService.prototype.returnMemberInfo = async function (memberInfo, job) {
    const info = {};
    info.uid = JSON.stringify(memberInfo.uid);
    info.job = job;
    info.contribute = memberInfo.contribute || 0;
    info.leagueContribute = memberInfo.guildContribute || 0;
    info.roleInfo = {};
    info.roleInfo.uid = info.uid;
    info.roleInfo.name = memberInfo.name;
    info.roleInfo.lv = memberInfo.lv;
    info.roleInfo.vip = memberInfo.vip;
    info.roleInfo.head = memberInfo.head;
    info.roleInfo.sex = memberInfo.sex;
    info.roleInfo.power = memberInfo.power;
    const connectId = await this.getConnectId(info.uid);
    if (connectId) {
        info.roleInfo.isOnline = 0;
    }
    else {
        const brief = await this.app.Brief.getBrief(info.uid);
        if (brief && brief.lastLogoutTime) {
            info.roleInfo.isOnline = util.time.ms2s(Number(brief.lastLogoutTime));
        }
    }
    return info;
};
/**
 * 返回申请信息
 */
GuildService.prototype.returnApplyInfo = async function (uid, time) {
    const leagueApplyInfo = {};
    leagueApplyInfo.uid = String(uid);
    leagueApplyInfo.time = time;
    leagueApplyInfo.roleInfo = {};
    const brief = await this.app.Brief.getBrief(uid);
    if (brief) {
        leagueApplyInfo.roleInfo.uid = leagueApplyInfo.uid;
        leagueApplyInfo.roleInfo.name = brief.name;
        leagueApplyInfo.roleInfo.lv = parseInt(brief.lv || 1);
        leagueApplyInfo.roleInfo.vip = parseInt(brief.vip || 0);
        leagueApplyInfo.roleInfo.head = parseInt(brief.headImageId || 0);
        leagueApplyInfo.roleInfo.sex = parseInt(brief.sex || 0);
        leagueApplyInfo.roleInfo.power = parseInt(brief.power || 0);
        const connectId = await this.getConnectId(leagueApplyInfo.uid);
        if (connectId) {
            leagueApplyInfo.roleInfo.isOnline = 0;
        }
        else {
            if (brief.lastLogoutTime) {
                leagueApplyInfo.roleInfo.isOnline = util.time.ms2s(Number(brief.lastLogoutTime));
            }
        }
    }
    return leagueApplyInfo;
};
/**
 * 获取建设返回信息
 */
GuildService.prototype.returnBuildInfo = function (buildDataList, nowTime) {
    const buildList = [];
    for (const [id, info] of Object.entries(buildDataList)) {
        const config = this.app.Config.LeagueBuild.get(id);
        if (!config) {
            continue;
        }
        const num = info[0];
        const lastTime = info[1];
        const nextTime = lastTime + config.Cd * 1000;
        buildList.push({ id: id, num: num, time: nextTime < nowTime ? 0 : Math.floor(nextTime / 1000) });
    }
    return buildList;
};

//-------------------------------------------
/**
 * 发送联盟聊天系统消息
 */
GuildService.prototype.sendLeagueChat = async function (guildId, id, param) {
    await this.app.Chat.guildSysTpltChat(String(guildId), id, param);
};
/**
 * 发送联盟邮件
 */
GuildService.prototype.sendLeagueMail = async function (uids, mailId, ...param) {
    const mailConfig = this.app.Config.Mail.get(mailId);
    if (mailConfig) {
        const now = util.time.nowSecond();
        const mail = {
            title: mailConfig.Name || "",
            content: util.format.format(mailConfig.Text, ...param) || "",
            item: mailConfig.Item ? util.proto.encodeConfigAward(mailConfig.Item) : [],
            type: code.mail.TYPE.SYSTEM,
            sendTime: now,
            expirationTime: mailConfig.ExpirationTime > 0 ? now + mailConfig.ExpirationTime : 0,
            status: mailConfig.Item && mailConfig.Item.length > 0 ? code.mail.STATUS.UNRECEIVED : code.mail.STATUS.UNREAD,
        };
        for (const uid of uids) {
            this.app.Mail.sendCustomMail(Number(uid), mail);
        }
        // logger.info(`player:${this.player.uid} add new car:${cId} , carProtMax sendMail itemInfo:${JSON.stringify(itemInfo)}`);
    }
};

//-------------------------------------------
/**
 * 广播联盟信息
 * 0更新联盟信息
 * 1加入联盟 name谁加入
 * 2解散联盟 name谁解散
 * 3离开联盟 name谁离开
 * 4逐出联盟 name谁被逐出离开
 * 5申请被拒绝 
 * 
 */
GuildService.prototype.notifyLeagueInfo = async function (operate, operateUid, operateName, guildId, uids, leaveTime) {
    let leagueInfo = undefined;
    // 联盟信息
    const guildData = await this.app.GuildCache.query(guildId);
    if (guildData) {
        leagueInfo = this.returnGuildInfo(guildData.dbValue());
    }
    // 发送数据
    const data = {};
    data.type = operate;
    data.uid = String(operateUid);
    data.name = operateName;
    data.leagueInfo = leagueInfo;
    data.leaveTime = 0;
    if (this.judgeLeaveTime(leaveTime)) {
        data.leaveTime = util.time.ms2s(leaveTime);
    }
    if (uids && uids.length > 0) {
        for (const uid of uids) {
            await this.notify(uid, 'onLeagueInfoNotify', data);
        }
    }
    else {
        // 全员广播
        await this.broadcast(guildId, 'onLeagueInfoNotify', data);
    }
};
/**
 * 广播联盟成员信息
 */
GuildService.prototype.notifyLeagueMemberInfo = async function (guildId, uids) {
    // 联盟信息
    const guildData = await this.app.GuildCache.query(guildId);
    if (guildData) {
        // 发送数据
        const memberList = await this.getMemberList(guildData);
        const data = { memberList: memberList };
        if (uids && uids.length > 0) {
            for (const uid of uids) {
                await this.notify(uid, 'onLeagueMemberNotify', data);
            }
        }
        else {
            // 全员广播
            await this.broadcast(guildId, 'onLeagueMemberNotify', data);
        }
    }
};
/**
 * 广播联盟单个成员信息
 */
GuildService.prototype.notifyLeagueMemberOne = async function (guildId, uid) {
    if (this.guildIdExists(guildId)) {
        const memberInfo = await this.app.GuildMemberCache.query(parseInt(uid));
        if (memberInfo) {
            const dbInfo = memberInfo.dbValue();
            const info = await this.returnMemberInfo(memberInfo.dbValue(), dbInfo.job);
            await this.broadcast(guildId, 'onLeagueMemberOneNotify', { memberInfo: info });
        }
    }
};
/**
 * 广播联盟申请信息
 */
GuildService.prototype.notifyLeagueApplyInfo = async function (guildId, uids) {
    const guildData = await this.app.GuildCache.query(guildId);
    if (guildData) {
        // 发送数据
        const applyList = await this.getApplyList(guildData);
        const data = { applyList: applyList };
        if (uids && uids.length > 0) {
            for (const uid of uids) {
                await this.notify(uid, 'onLeagueApplyNotify', data);
            }
        }
        else {
            // 全员广播
            await this.broadcast(guildId, 'onLeagueApplyNotify', data);
        }
    }
};
/**
 * 广播联盟建设信息
 */
GuildService.prototype.notifyLeagueBuildInfo = async function (guildId, dayExp, recordInfo) {
    await this.broadcast(guildId, 'onLeagueBuildNotify', { dayExp: dayExp, recordInfo: recordInfo });
};
/**
 * 广播个人联盟建设信息
 */
GuildService.prototype.notifyLeagueBuildList = async function (uid, buildList, boxList) {
    await this.notify(uid, 'onLeagueBuildListNotify', { buildList: buildList, boxList: boxList });
};
/**
 * 广播成员信息
 */
GuildService.prototype.notify = async function (uid, messageName, data) {
    await this.app.Notify.notify(uid, messageName, data);
};
/**
 * ---------------------------------------------------------------------------
 * 联盟频道处理
 * ---------------------------------------------------------------------------
 */
/**
 * 获取联盟频道名称
 */
GuildService.prototype.getGuildChannelName = function (guildId) {
    return "guild_" + guildId;
};
GuildService.prototype.getConnectId = async function (uid) {
    const result = await this.app.Redis.hget(code.redis.ROLE_ON_CONNECTOR.name, uid);
    if (result.err) {
        return undefined;
    }
    return result.res;
};
/**
 * 获取联盟频道
 */
GuildService.prototype.getGuildChannel = async function (guildId) {
    if (!guildId || guildId <= 0) {
        return undefined;
    }
    if (!this.guildChannel[guildId]) {
        const channelName = this.getGuildChannelName(guildId);
        this.guildChannel[guildId] = this.app.get('channelService').getChannel(channelName, true);
        // 将所有联盟成员加入联盟频道
        // const guildData = await this.app.GuildCache.query(guildId);
        // if (guildData) {
        //     const list = guildData.get('memberList') || {};
        //     for (const uid of Object.keys(list)) {
        //         const connectID = await this.getConnectId(uid);
        //         if (connectID) {
        //             this.guildChannel[guildId].add(Number(uid), connectID);
        //         }
        //     }
        // }
    }
    return this.guildChannel[guildId];
};
/**
 * 销毁联盟频道
 */
GuildService.prototype.destroyChannel = function (guildId) {
    if (this.guildChannel[guildId]) {
        this.guildChannel[guildId].destroy();
    }
};
/**
 * 加入联盟频道
 */
GuildService.prototype.addChannelMember = async function (guildId, uid) {
    const channel = await this.getGuildChannel(guildId);
    if (channel) {
        const connectID = await this.getConnectId(uid);
        if (connectID) {
            channel.add(uid, connectID);
        }
    }

};
/**
 * 离开联盟频道
 */
GuildService.prototype.LeaveChannelMember = async function (guildId, uid) {
    const channel = await this.getGuildChannel(guildId);
    if (channel) {
        const info = channel.getMember(uid);
        if (info && info.sid) {
            channel.leave(uid, info.sid);
        }
    }
};
/**
 * 全公会广播
 */
GuildService.prototype.broadcast = async function (guildId, messageName, data) {
    const channel = await this.getGuildChannel(guildId);
    if (channel) {
        channel.pushMessage(messageName, data, {});
    }
};
/**
 * 公会log
 */
GuildService.prototype.log = async function (guildId) {
    const guildData = await this.app.GuildCache.query(guildId);
    if (!guildData) {
        return;
    }
    this.app.Log.guildLog(guildData.dbValue());
};