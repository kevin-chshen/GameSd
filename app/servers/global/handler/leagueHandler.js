/* eslint-disable indent */
/**
 * @description 联盟消息
 * @author chenyq
 * @date 2020/04/25
 */

// const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const code = require('@code');
const util = require('@util');

const DBGuild = require("@mongo/mongoGuild");

module.exports = function (app) {
    return new Handler(app);
};

const Handler = function (app) {
    this.app = app;
};
/**
 * 获取联盟信息
 */
Handler.prototype.leagueGetInfo = async function (msg, session, next) {
    // 玩家是否还在联盟中
    // 有 返回联盟信息
    // 无 返回联盟列表
    const guildInfo = await this.app.Guild.getGuildInfo(session.uid);
    let guildList = undefined;
    let leaveTime = 0;
    if (!guildInfo) {
        guildList = await this.app.Guild.getGuildList(session.uid);
        leaveTime = await this.app.Guild.getLeaveTime(session.uid);
    }
    next(null, { code: code.err.SUCCEEDED, leagueInfo: guildInfo, leagueList: guildList, leaveTime: leaveTime });
};
/**
 * 获取联盟成员信息
 */
Handler.prototype.leagueMemberInfo = async function (msg, session, next) {
    const info = await this.app.Guild.getGuildMemberInfo(session.uid);
    next(null, { code: code.err.SUCCEEDED, memberList: info.memberList, applyList: info.applyList });
};
/**
 * 创建联盟
 */
Handler.prototype.leagueCreate = async function (msg, session, next) {
    const uid = session.uid;
    const name = msg.name;
    const badge = msg.badge;
    const manifesto = msg.manifesto || '';
    const joinType = msg.joinType;
    // vip等级不足8021
    const brief = await this.app.Brief.getBrief(uid);
    const needVip = this.app.Config.Global.getGlobalFloat(code.guild.GUILD_CREATE_VIP, true);
    if (!brief || brief.vip < needVip) {
        next(null, { code: code.err.ERR_LEAGUE_CREATE_VIP });
        return;
    }
    const memberInfo = await this.app.Guild.getGuildMember(uid);
    // 是否已加入联盟8006
    const isJoin = await this.app.Guild.guildIdExists(memberInfo.guildId);
    if (isJoin) {
        next(null, { code: code.err.ERR_LEAGUE_CREATE_IS_JOIN });
        return;
    }
    // 离开联盟时间8007
    if (this.app.Guild.judgeLeaveTime(memberInfo.leaveTime)) {
        next(null, { code: code.err.ERR_LEAGUE_CREATE_LEAVE_TIME });
        return;
    }
    // 名称10个字符8001
    if (name === undefined || name.length === 0 || name.length > 10) {
        next(null, { code: code.err.ERR_LEAGUE_NAME_ERROR });
        return;
    }
    if (name.indexOf(' ') >= 0) {
        next(null, { code: code.err.ERR_LEAGUE_NAME_NOT_SPACE });
        return;
    }
    // 名称屏蔽字8002
    if (this.app.Config.WordFilter.query(name)) {
        next(null, { code: code.err.ERR_LEAGUE_NAME_WORD_FILTER });
        return;
    }
    // 重名8003
    const queryName = await DBGuild.query({ name: name });
    if (queryName.length != 0) {
        next(null, { code: code.err.ERR_LEAGUE_NAME_REPEAT });
        return;
    }
    // 宣言30个字符8004
    if (manifesto.length > 30) {
        next(null, { code: code.err.ERR_LEAGUE_MANIFESTO_ERROR });
        return;
    }
    // 宣言屏蔽字8005
    if (this.app.Config.WordFilter.query(manifesto)) {
        next(null, { code: code.err.ERR_LEAGUE_MANIFESTO_WORD_FILTER });
        return;
    }
    // 消耗判断8008
    const globalInfo = this.app.Config.Global.getGlobalJson(code.guild.GUILD_CREATE_COST);
    const costList = util.proto.encodeConfigAward([globalInfo]);
    const ret = await this.app.Redis.hget(code.redis.ROLE_ON_GAME.name, uid);
    if (ret.err || !ret.res) {
        next(null, { code: code.err.FAILED });
        return;
    }

    const result = await this.app.rpcs.game.itemRemote.deleteItem.toServer(ret.res, uid, costList, code.reason.OP_GUILD_CREATE_COST);
    if (!result.res) {
        next(null, { code: code.err.ERR_LEAGUE_CREATE_COST });
        return;
    }

    const guildInfo = await this.app.Guild.createGuild(uid, name, badge, manifesto, joinType);

    // 公会宣言写入聊天日志
    this.app.rpcs.game.guildRemote.guildDump.toServer(ret.res, uid, guildInfo.leagueId, name);
    this.app.rpcs.game.guildRemote.guildDump.toServer(ret.res, uid, guildInfo.leagueId, manifesto);
    next(null, { code: code.err.SUCCEEDED, leagueInfo: guildInfo });
};
/**
 * 解散联盟
 */
Handler.prototype.leagueDissolve = async function (msg, session, next) {
    const uid = session.uid;
    const memberInfo = await this.app.Guild.getGuildMember(uid);
    // 未加入联盟 或联盟不存在8009
    const isJoin = await this.app.Guild.guildIdExists(memberInfo.guildId);
    if (!isJoin) {
        next(null, { code: code.err.ERR_LEAGUE_DISSOLVE_NOT_JOIN });
        return;
    }
    // 权限判断8010
    if (!this.app.Config.League.jobOperate(code.guild.GUILD_JOB_OPERATE.DISSOLVE, memberInfo.job)) {
        next(null, { code: code.err.ERR_LEAGUE_DISSOLVE_JOB_ERROR });
        return;
    }
    await this.app.Guild.dissolveGuild(memberInfo);
    next(null, { code: code.err.SUCCEEDED });
};
/**
 * 加入联盟
 */
Handler.prototype.leagueJoin = async function (msg, session, next) {
    const uid = session.uid;
    const guildId = msg.leagueId;
    const memberInfo = await this.app.Guild.getGuildMember(uid);
    // 是否已加入联盟8011
    const isJoin = await this.app.Guild.guildIdExists(memberInfo.guildId);
    if (isJoin) {
        next(null, { code: code.err.ERR_LEAGUE_JOIN_IS_JOIN });
        return;
    }
    // 加入的联盟是否存在8012
    const isExists = await this.app.Guild.guildIdExists(guildId);
    if (!isExists) {
        next(null, { code: code.err.ERR_LEAGUE_JOIN_ERROR });
        return;
    }
    // 离开联盟时间8014
    if (this.app.Guild.judgeLeaveTime(memberInfo.leaveTime)) {
        next(null, { code: code.err.ERR_LEAGUE_JOIN_LEAVE_TIME });
        return;
    }
    // 联盟是否满员8013
    const isFull = await this.app.Guild.isFullMember(guildId);
    if (isFull) {
        next(null, { code: code.err.ERR_LEAGUE_JOIN_MAX });
        return;
    }
    // 判断是直接加入 还是 需要申请
    const joinType = await this.app.Guild.getJoinType(guildId);
    if (joinType > 0) {
        // 如果需要申请 是否已经申请
        if (this.app.Guild.isApply(uid, guildId)) {
            next(null, { code: code.err.ERR_LEAGUE_APPLY_IS_TRUE });
            return;
        }
        const leagueInfo = await this.app.Guild.applyGuild(uid, guildId);
        next(null, { code: code.err.SUCCEEDED, leagueInfo: leagueInfo });
    }
    else {
        const leagueInfo = await this.app.Guild.joinGuild(uid, guildId, code.guild.GUILD_JOB.MEMBER);
        next(null, { code: code.err.SUCCEEDED, leagueInfo: leagueInfo });
    }
};
/**
 * 退出联盟
 */
Handler.prototype.leagueExit = async function (msg, session, next) {
    const uid = session.uid;
    const memberInfo = await this.app.Guild.getGuildMember(uid);
    // 未加入联盟8015
    const isJoin = await this.app.Guild.guildIdExists(memberInfo.guildId);
    if (!isJoin) {
        next(null, { code: code.err.ERR_LEAGUE_EXIT_NOT_JOIN });
        return;
    }
    // 盟主无法退出联盟 请转移盟主再退出或解散联盟8016
    if (memberInfo.job == code.guild.GUILD_JOB.CHAMPIONS) {
        next(null, { code: code.err.ERR_LEAGUE_EXIT_JOB_ERROR });
        return;
    }
    await this.app.Guild.exitGuild(memberInfo);
    next(null, { code: code.err.SUCCEEDED });
};
/**
 * 逐出联盟
 */
Handler.prototype.leagueKickOut = async function (msg, session, next) {
    const uid = session.uid;
    const kickOutUid = Number(msg.uid);
    const memberInfo = await this.app.Guild.getGuildMember(uid);
    // 未加入联盟 8017
    const isJoin = await this.app.Guild.guildIdExists(memberInfo.guildId);
    if (!isJoin) {
        next(null, { code: code.err.ERR_LEAGUE_KICK_OUT_NOT_JOIN });
        return;
    }
    const kickOutInfo = await this.app.Guild.getGuildMember(kickOutUid);
    // 该成员已不在联盟 8018
    const join = await this.app.Guild.guildIdExists(kickOutInfo.guildId);
    if (!join) {
        next(null, { code: code.err.ERR_LEAGUE_KICK_OUT_MEMBER_EXISTS });
        return;
    }
    // 权限判断8019
    if (!this.app.Config.League.jobOperate(code.guild.GUILD_JOB_OPERATE.KICK_OUT, memberInfo.job)) {
        next(null, { code: code.err.ERR_LEAGUE_KICK_OUT_JOB_ERROR });
        return;
    }
    // 权限不足8020
    if (kickOutInfo.job <= memberInfo.job) {
        next(null, { code: code.err.ERR_LEAGUE_KICK_OUT_JOB_NOT_ENOUGH });
        return;
    }
    await this.app.Guild.kickOutGuild(kickOutInfo);
    next(null, { code: code.err.SUCCEEDED });
};
/**
 * 查询联盟
 */
Handler.prototype.leagueQuery = async function (msg, session, next) {
    const condition = msg.condition;
    const leagueInfo = await this.app.Guild.guildQuery(condition);
    next(null, { code: code.err.SUCCEEDED, leagueInfo: leagueInfo });
};
/**
 * 一键申请
 */
Handler.prototype.leagueOneKeyApply = async function (msg, session, next) {
    const uid = session.uid;
    const memberInfo = await this.app.Guild.getGuildMember(uid);
    // 是否已加入联盟8011
    const isJoin = await this.app.Guild.guildIdExists(memberInfo.guildId);
    if (isJoin) {
        next(null, { code: code.err.ERR_LEAGUE_JOIN_IS_JOIN });
        return;
    }
    // 离开联盟时间8014
    if (this.app.Guild.judgeLeaveTime(memberInfo.leaveTime)) {
        next(null, { code: code.err.ERR_LEAGUE_JOIN_LEAVE_TIME });
        return;
    }

    const leagueIdList = msg.leagueIdList;
    const leagueList = await this.app.Guild.guildOneKeyApply(uid, leagueIdList);
    next(null, { code: code.err.SUCCEEDED, leagueList: leagueList });
};
/**
 * 联盟申请同意
 */
Handler.prototype.leagueAgree = async function (msg, session, next) {
    const uid = session.uid;
    const targetUid = Number(msg.uid);
    const memberInfo = await this.app.Guild.getGuildMember(uid);
    // 未加入联盟 8023
    const isJoin = await this.app.Guild.guildIdExists(memberInfo.guildId);
    if (!isJoin) {
        next(null, { code: code.err.ERR_LEAGUE_AGREE_NOT_GUILD });
        return;
    }
    // 是否申请 8024
    // next(null, { code: code.err.ERR_LEAGUE_AGREE_NOT_APPLY });
    // 联盟是否满员8025
    const isFull = await this.app.Guild.isFullMember(memberInfo.guildId);
    if (isFull) {
        next(null, { code: code.err.ERR_LEAGUE_AGREE_MAX_MEMBER });
        return;
    }
    const targetInfo = await this.app.Guild.getGuildMember(targetUid);
    // 该玩家已加入联盟 8026
    const join = await this.app.Guild.guildIdExists(targetInfo.guildId);
    if (join) {
        // 移除申请

        next(null, { code: code.err.ERR_LEAGUE_AGREE_JOIN_GUILD });
        return;
    }
    // 权限判断8027
    if (!this.app.Config.League.jobOperate(code.guild.GUILD_JOB_OPERATE.APPLY, memberInfo.job)) {
        next(null, { code: code.err.ERR_LEAGUE_KICK_OUT_JOB_ERROR });
        return;
    }
    await this.app.Guild.guildAgree(memberInfo, targetUid);
    next(null, { code: code.err.SUCCEEDED });
};
/**
 * 联盟申请拒绝
 */
Handler.prototype.leagueRefuse = async function (msg, session, next) {
    const uid = session.uid;
    const refuseUid = Number(msg.uid);
    const memberInfo = await this.app.Guild.getGuildMember(uid);
    // 未加入联盟 8028
    const isJoin = await this.app.Guild.guildIdExists(memberInfo.guildId);
    if (!isJoin) {
        next(null, { code: code.err.ERR_LEAGUE_REFUSE_NOT_GUILD });
        return;
    }
    // 权限判断8029
    if (!this.app.Config.League.jobOperate(code.guild.GUILD_JOB_OPERATE.APPLY, memberInfo.job)) {
        next(null, { code: code.err.ERR_LEAGUE_REFUSE_JOB_ERROR });
        return;
    }
    await this.app.Guild.guildRefuse(memberInfo, refuseUid);
    next(null, { code: code.err.SUCCEEDED });
};
/**
 * 联盟职位变更
 */
Handler.prototype.leagueJob = async function (msg, session, next) {
    const uid = session.uid;
    const changeUid = Number(msg.uid);
    const job = msg.job;
    const memberInfo = await this.app.Guild.getGuildMember(uid);
    // 未加入联盟 8030
    const isJoin = await this.app.Guild.guildIdExists(memberInfo.guildId);
    if (!isJoin) {
        next(null, { code: code.err.ERR_LEAGUE_JOB_CHANGE_NOT_GUILD });
        return;
    }
    // 变更职位无法高于自己 8031
    if (job <= memberInfo.job) {
        next(null, { code: code.err.ERR_LEAGUE_JOB_CHANGE_JOB_MORE_THAN_SELF });
        return;
    }
    // 权限判断8032
    if (!this.app.Config.League.jobOperate(code.guild.GUILD_JOB_OPERATE.JOB_CHANGE, memberInfo.job)) {
        next(null, { code: code.err.ERR_LEAGUE_JOB_CHANGE_JOB_ERROR });
        return;
    }
    const changeMemberInfo = await this.app.Guild.getGuildMember(changeUid);
    // 该成员已不在联盟 8033
    const join = await this.app.Guild.guildIdExists(changeMemberInfo.guildId);
    if (!join) {
        next(null, { code: code.err.ERR_LEAGUE_JOB_CHANGE_MEMBER_EXISTS });
        return;
    }

    // 无法变更相同职位 8034
    if (job == changeMemberInfo.job) {
        next(null, { code: code.err.ERR_LEAGUE_JOB_CHANGE_JOB_NOW });
        return;
    }
    // 权限不足8035
    if (changeMemberInfo.job <= memberInfo.job) {
        next(null, { code: code.err.ERR_LEAGUE_JOB_CHANGE_JOB_NOT_ENOUGH });
        return;
    }
    // 职位数量是否已达上限 8036
    const isFull = await this.app.Guild.judgeMemberLimit(memberInfo.guildId, job);
    if (isFull) {
        next(null, { code: code.err.ERR_LEAGUE_JOB_CHANGE_JOB_MAX });
        return;
    }

    await this.app.Guild.guildJob(memberInfo, changeMemberInfo, job);
    next(null, { code: code.err.SUCCEEDED });
};
/**
 * 联盟盟主转让
 */
Handler.prototype.leagueTransfer = async function (msg, session, next) {
    const uid = session.uid;
    const transferUid = Number(msg.uid);
    const memberInfo = await this.app.Guild.getGuildMember(uid);
    // 未加入联盟 8037
    const isJoin = await this.app.Guild.guildIdExists(memberInfo.guildId);
    if (!isJoin) {
        next(null, { code: code.err.ERR_LEAGUE_TRANSFER_NOT_GUILD });
        return;
    }
    // 不是盟主，无法转让 8038
    if (memberInfo.job != code.guild.GUILD_JOB.CHAMPIONS) {
        next(null, { code: code.err.ERR_LEAGUE_TRANSFER_NOT_CHAMPIONS });
        return;
    }
    const transferMemberInfo = await this.app.Guild.getGuildMember(transferUid);
    // 该成员已不在联盟 8039
    const join = await this.app.Guild.guildIdExists(transferMemberInfo.guildId);
    if (!join) {
        next(null, { code: code.err.ERR_LEAGUE_TRANSFER_MEMBER_EXISTS });
        return;
    }
    // 只能转让给副盟主 8040
    if (transferMemberInfo.job != code.guild.GUILD_JOB.DEPUTY_CHAMPIONS) {
        next(null, { code: code.err.ERR_LEAGUE_TRANSFER_NOT_DEPUTY });
        return;
    }
    // 是否三日内有登录 8041
    const connectId = await this.app.Guild.getConnectId(transferUid);
    if (!connectId) {
        const brief = await this.app.Brief.getBrief(transferUid);
        if (brief && brief.lastLogoutTime &&
            Number(brief.lastLogoutTime) + code.guild.GUILD_TRANSFER_LOGOUT_TIME < Date.now()) {
            next(null, { code: code.err.ERR_LEAGUE_TRANSFER_NOT_LOGIN });
            return;
        }
    }

    await this.app.Guild.guildTransfer(memberInfo, transferMemberInfo, code.guild.GUILD_TRANSFER_TYPE.MANUALLY);
    next(null, { code: code.err.SUCCEEDED });
};
/**
 * 联盟信息变更
 * 0加入条件、1改名、2宣言、3公告、4徽章
 */
Handler.prototype.leagueChangeInfo = async function (msg, session, next) {
    const uid = session.uid;
    const type = msg.type;
    const newValue = msg.newValue;
    const memberInfo = await this.app.Guild.getGuildMember(uid);
    // 未加入联盟 8042
    const isJoin = await this.app.Guild.guildIdExists(memberInfo.guildId);
    if (!isJoin) {
        next(null, { code: code.err.ERR_LEAGUE_CHANGE_INFO_NOT_GUILD, type: type });
        return;
    }
    const retRole = await this.app.Redis.hget(code.redis.ROLE_ON_GAME.name, uid);
    // 1改名、2宣言、3公告 禁言后都不可修改
    if (type == 1 || type == 2 || type == 3) {
        if (!retRole.err && retRole.res) {
            const ret = await this.app.rpcs.game.playerRemote.isBanChat.toServer(retRole.res, uid);
            if (!ret.err && ret.res) {
                next(null, { code: code.err.ERR_CHAT_BAN, type: type });
                return;
            }
        }
    }
    let operateType = 0;
    let data = {};
    let queryName = '';
    let lv = 0;
    switch (type) {
        case 0:
            operateType = code.guild.GUILD_JOB_OPERATE.MODIFY;
            data = { joinType: Number(newValue) };
            break;
        case 1:
            // 名称10个字符 8001
            if (newValue === undefined || newValue.length === 0 || newValue.length > 10) {
                next(null, { code: code.err.ERR_LEAGUE_NAME_ERROR, type: type });
                return;
            }
            if (newValue.indexOf(' ') >= 0) {
                next(null, { code: code.err.ERR_LEAGUE_NAME_NOT_SPACE, type: type });
                return;
            }
            // 名称屏蔽字 8002
            if (this.app.Config.WordFilter.query(newValue)) {
                next(null, { code: code.err.ERR_LEAGUE_NAME_WORD_FILTER, type: type });
                return;
            }
            // 重名 8003
            queryName = await DBGuild.query({ name: newValue });
            if (queryName.length != 0) {
                next(null, { code: code.err.ERR_LEAGUE_NAME_REPEAT, type: type });
                return;
            }
            operateType = code.guild.GUILD_JOB_OPERATE.RENAME;
            data = { name: newValue };
            break;

        case 2:
            // 宣言30个字符 8004
            if (newValue.length > 30) {
                next(null, { code: code.err.ERR_LEAGUE_MANIFESTO_ERROR, type: type });
                return;
            }
            // 宣言屏蔽字 8005
            if (this.app.Config.WordFilter.query(newValue)) {
                next(null, { code: code.err.ERR_LEAGUE_MANIFESTO_WORD_FILTER, type: type });
                return;
            }
            operateType = code.guild.GUILD_JOB_OPERATE.MANIFESTO;
            data = { manifesto: newValue };
            // 公会宣言写入聊天日志
            this.app.rpcs.game.guildRemote.guildDump.toServer(retRole.res, uid, memberInfo.guildId, data.manifesto);
            break;

        case 3:
            // 公告30个字符 8044
            if (newValue.length > 30) {
                next(null, { code: code.err.ERR_LEAGUE_NOTICE_ERROR, type: type });
                return;
            }
            // 公告屏蔽字 8045
            if (this.app.Config.WordFilter.query(newValue)) {
                next(null, { code: code.err.ERR_LEAGUE_NOTICE_WORD_FILTER, type: type });
                return;
            }
            operateType = code.guild.GUILD_JOB_OPERATE.NOTICE;
            data = { notice: newValue };

            // 公会公告写入聊天日志
            this.app.rpcs.game.guildRemote.guildDump.toServer(retRole.res, uid, memberInfo.guildId, data.notice);
            break;

        case 4:
            lv = await this.app.Guild.getGuildLv(memberInfo.guildId);
            if (lv < this.app.Config.LeagueLv.iconNeedLv(newValue)) {
                next(null, { code: code.err.ERR_LEAGUE_ICON_LV_LIMIT, type: type });
                return;
            }
            operateType = code.guild.GUILD_JOB_OPERATE.ICON;
            data = { badge: newValue };
            break;
    }
    // 权限判断 8043
    if (!this.app.Config.League.jobOperate(operateType, memberInfo.job)) {
        next(null, { code: code.err.ERR_LEAGUE_CHANGE_INFO_NO_AUTH, type: type });
        return;
    }
    if (type == 1) {
        // 消耗判断8046
        const globalInfo = this.app.Config.Global.getGlobalJson(code.guild.GUILD_RENAME_COST);
        const costList = util.proto.encodeConfigAward([globalInfo]);
        if (!retRole.err && retRole.res) {
            const result = await this.app.rpcs.game.itemRemote.deleteItem.toServer(retRole.res, uid, costList, code.reason.OP_GUILD_RENAME_COST);
            if (!result.res) {
                next(null, { code: code.err.ERR_LEAGUE_CHANGE_RENAME_COST, type: type });
                return;
            }
        }
    }
    await this.app.Guild.guildChangeInfo(memberInfo, data, type);
    next(null, { code: code.err.SUCCEEDED, type: type });
};
/**
 * 联盟建设信息
 */
Handler.prototype.leagueBuildGetInfo = async function (msg, session, next) {
    const uid = session.uid;
    const memberInfo = await this.app.Guild.getGuildMember(uid);
    // 未加入联盟 8056
    const isJoin = await this.app.Guild.guildIdExists(memberInfo.guildId);
    if (!isJoin) {
        next(null, { code: code.err.SUCCEEDED });
        return;
    }
    const [dayExp, boxList, buildList, recordList] = await this.app.Guild.guildBuildGetInfo(uid);
    next(null, { code: code.err.SUCCEEDED, dayExp: dayExp, boxList: boxList, buildList: buildList, recordList: recordList });
};
/**
 * 联盟建设
 */
Handler.prototype.leagueBuild = async function (msg, session, next) {
    const uid = session.uid;
    const id = msg.id;
    const [returnCode, buildInfo] = await this.app.Guild.guildBuild(uid, id);
    next(null, { code: returnCode, buildInfo: buildInfo });
};
/**
 * 联盟领取建设宝箱
 */
Handler.prototype.leagueGetBuildBox = async function (msg, session, next) {
    const uid = session.uid;
    const id = msg.id;
    const [returnCode, boxList, awardList] = await this.app.Guild.guildGetBuildBox(uid, id);
    next(null, { code: returnCode, boxList: boxList, awardList: awardList });
};
/**
 * 联盟科技获取信息
 */
Handler.prototype.leagueTechnologyGetInfo = async function (msg, session, next) {
    const uid = session.uid;
    const technologyList = await this.app.Guild.guildTechnologyGetInfo(uid);
    next(null, { code: code.err.SUCCEEDED, technologyList: technologyList });
};
/**
 * 联盟科技升级
 */
Handler.prototype.leagueTechnologyUpgrade = async function (msg, session, next) {
    const uid = session.uid;
    const skillId = msg.skillId;
    const [returnCode, technologyInfo] = await this.app.Guild.guildTechnologyUpgrade(uid, skillId);
    next(null, { code: returnCode, technologyInfo: technologyInfo });
};