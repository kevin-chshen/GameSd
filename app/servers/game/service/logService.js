/**
 * @description game服运营日志服务
 * @author linjs
 * @date 2020/03/16
 */
const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const code = require('@code');
const bearcat = require('bearcat');
const util = require('@util');

const LogService = function () {
    this.$id = 'game_LogService';
};
module.exports = LogService;
bearcat.extend('game_LogService', 'logic_BaseService');

/**
 * 用户信息表 (tbllog_player) 
 */
LogService.prototype.playerLog = async function (player) {
    const act = player.accountData;
    if (!act) {
        logger.error(`logService player uid:${player.uid} account data null, playerLog failed`);
        return;
    }
    let coin = player.Currency.get(code.currency.CURRENCY_ID.COIN);
    if (coin > 2147483647) {
        coin = 2147483647;
    }
    let guildName = '';
    if (player.guildId) {
        const { err, res } = await this.app.rpcs.global.guildRemote.getGuildInfo({}, player.uid);
        if (!err && res) {
            guildName = res.name;
        }
    }
    const ci = act.clientInfo;
    const logPlayer = {
        platform: [act.platform, ci.fngid].join('_'),    // 所属平台，记录SDK platform_id
        device: ci.device,        // 最后登录设备端，可选值如下： android、ios、web、pc
        role_id: player.uid,       // 角色ID
        role_name: player.name,    // 角色名
        account_name: [act.platform, act.account].join('_'), // 平台账号名
        user_name: ci.user_name,    // 平台帐号名
        dim_nation: '0',      // 阵营
        dim_prof: 1,          // 职业
        dim_sex: player.sex > 1 ? 0 : 1, // 性别(0=女，1=男，2=未知)
        reg_time: act.regTime,          // 注册时间
        reg_ip: act.regIp,    // 注册IP
        did: ci.did,          // 用户设备ID
        dim_level: player.lv,         // 用户等级
        dim_vip_level: player.vip,     // VIP等级
        dim_grade: 1,         // 用户段位ID
        dim_exp: 0,           // 当前经验,游戏没有玩家经验的概念
        dim_guild: guildName,    // 帮派名称
        dim_power: player.power,         // 战斗力
        gold_number: player.Currency.get(code.currency.CURRENCY_ID.DIAMOND),       // 剩余元宝数（充值兑换货币）
        bgold_number: 0,      // 剩余绑定元宝数（非充值兑换货币）
        coin_number: coin,       // 剩余金币数
        bcoin_number: 0,      // 剩余绑定金币数
        pay_money: player.rechargeMoney,       // 总充值
        first_pay_time: player.firstPayTime,   // 首充时间
        last_pay_time: player.lastPayTime,     // 最后充值时间
        last_login_time: util.time.ms2s(player.lastLogoutTime),   // 最后登录时间
        happend_time: util.time.nowSecond(),      // 变动时间
    };
    this.app.rpcs.log.logRemote.updateLog({}, code.log.LOG_TYPE_PLAYER, logPlayer, { role_id: player.uid });
};

/**
 * 角色创建日志（tbllog_role）
 */
LogService.prototype.roleLog = async function (player) {
    const act = player.accountData;
    if (!act) {
        logger.error(`logService player uid:${player.uid} account data null, login log failed`);
        return;
    }
    const ci = act.clientInfo;
    const logRole = {
        platform: [act.platform, ci.fngid].join('_'),
        device: act.clientInfo.device,
        role_id: player.uid,
        role_name: player.name,
        account_name: [act.platform, act.account].join('_'),
        user_ip: act.userIp,
        dim_prof: 0,
        dim_sex: player.sex > 1 ? 0 : 1, // 性别(0=女，1=男，2=未知)
        did: act.clientInfo.did,
        game_version: code.system.VERSION,
        happend_time: util.time.nowSecond(),
    };
    this.app.rpcs.log.logRemote.addLog({}, code.log.LOG_TYPE_ROLE, logRole);
};

/**
 * 事件日志
 */
LogService.prototype.eventLog = function (player, eventId) {
    const act = player.accountData;
    if (!act) {
        logger.error(`logService player uid:${player.uid} account data null, event log failed`);
        return;
    }
    const ci = act.clientInfo;
    const logEvent = {
        platform: [act.platform, ci.fngid].join('_'),
        device: act.clientInfo.device,
        role_id: player.uid,
        role_name: player.name,
        account_name: [act.platform, act.account].join('_'),
        event_id: eventId,
        user_ip: act.userIp,
        did: ci.did,
        game_version: code.system.VERSION,
        os: ci.os,
        os_version: ci.os_version,
        device_name: ci.device_name,
        screen: ci.screen,
        mno: ci.mno,
        nm: ci.nm,
        happend_time: util.time.nowSecond(),
    };
    this.app.rpcs.log.logRemote.addLog({}, code.log.LOG_TYPE_EVENT, logEvent);
};

/**
 * 登录日志
 * @param {Object} player
 */
LogService.prototype.loginLog = function (player) {
    const act = player.accountData;
    if (!act) {
        logger.error(`logService player uid:${player.uid} account data null, login log failed`);
        return;
    }
    const ci = act.clientInfo;
    // 登陆日志
    const logLogin = {
        platform: [act.platform, ci.fngid].join('_'),
        device: ci.device,
        role_id: player.uid,
        account_name: [act.platform, act.account].join('_'),
        dim_level: player.lv,
        user_ip: act.userIp,
        login_map_id: 0,
        did: ci.did,
        game_version: code.system.VERSION,
        os: ci.os,
        os_version: ci.os_version,
        device_name: ci.device_name,
        screen: ci.screen,
        mno: ci.mno,
        nm: ci.nm,
        happend_time: util.time.nowSecond(),
    };
    this.app.rpcs.log.logRemote.addLog({}, code.log.LOG_TYPE_LOGIN, logLogin);
};

/**
 * 退出日志
 * @param {Object} player
 * @param {Integer} reason 退出原因， 0表示正常退出
 * @param {String} msg 特殊信息
 */
LogService.prototype.quitLog = function (player, reason, msg) {
    const act = player.accountData;
    if (!act) {
        logger.error(`logService player uid:${player.uid} account data null, quit log failed`);
        return;
    }
    const ci = act.clientInfo;
    const logQuit = {
        platform: [act.platform, ci.fngid].join('_'),
        device: ci.device,
        role_id: player.uid,
        account_name: [act.platform, act.account].join('_'),
        login_level: player.loginLv,
        logout_level: player.lv,
        logout_ip: act.userIp,
        login_time: util.time.ms2s(player.lastLoginTime),
        logout_time: util.time.ms2s(player.lastLogoutTime),
        time_duration: util.time.ms2s(player.lastLogoutTime - player.lastLoginTime),
        logout_map_id: 0,
        reason_id: reason || 0,
        msg: msg || "",
        did: ci.did,
        game_version: code.system.VERSION,
    };
    this.app.rpcs.log.logRemote.addLog({}, code.log.LOG_TYPE_QUIT, logQuit);
};

/**
 * 货币变动日志
 * @api public
 * @param {Object} player
 * @param {Object} obj 数据对象  
 */
LogService.prototype.goldLog = function (player, obj) {
    if (obj.action_1 <= 0) {
        return;
    }
    const act = player.accountData;
    if (!act) {
        logger.error(`logService player uid:${player.uid} account data null, gold log failed`);
        return;
    }
    const ci = act.clientInfo;
    // int 最大表示范围
    const amount = (obj.amount > 2147483647) ? 2147483647 : obj.amount;
    const remain = (obj.remain > 2147483647) ? 2147483647 : obj.remain;
    const itemNum = (obj.itemNum > 2147483647) ? 2147483647 : obj.itemNum;
    const logGold = {
        platform: [act.platform, ci.fngid].join('_'),
        device: ci.device,
        role_id: player.uid,
        account_name: [act.platform, act.account].join('_'),
        dim_level: player.lv,
        dim_prof: 0,
        money_type: obj.moneyType,  // (1000: 每秒赚钱)
        amount: amount,
        money_remain: remain,
        item_id: obj.itemId,
        opt: obj.opt,   // 货币加减 （1=增加，-1=减少）
        action_1: obj.action_1,
        action_2: obj.action_2,
        item_number: itemNum,
        happend_time: util.time.nowSecond(),
    };
    this.app.rpcs.log.logRemote.addLog({}, code.log.LOG_TYPE_GOLD, logGold);
};

/**
 * PVP日志
 */
LogService.prototype.pvpLog = function () {
    const logPvp = {
    };
    this.app.rpcs.log.logRemote.addLog({}, code.log.LOG_TYPE_PVP, logPvp);
};

/**
 * 错误日志
 */
LogService.prototype.errorLog = function () {
    const logError = {
    };
    this.app.rpcs.log.logRemote.addLog({}, code.log.LOG_TYPE_ERROR, logError);
};

/**
 * 聊天日志
 */
LogService.prototype.chatLog = function (player, msg) {
    const act = player.accountData;
    if (!act) {
        logger.error(`logService player uid:${player.uid} account data null, chat log failed`);
        return;
    }
    const ci = act.clientInfo;
    const logChat = {
        platform: [act.platform, ci.fngid].join('_'),
        device: ci.device,
        account_name: [act.platform, act.account].join('_'),
        role_id: player.uid,
        role_name: player.name,
        dim_level: player.lv,
        user_ip: act.userIp,
        did: ci.did,
        channel: msg.channelId,
        msg: msg.text || "",
        type: msg.msgType == code.chat.MSG_TYPE.VOICE ? 0 : 1,
        target_role_id: parseInt(msg.targetUid) || 0,
        happend_time: util.time.nowSecond(),
    };
    this.app.rpcs.log.logRemote.addLog({}, code.log.LOG_TYPE_CHAT, logChat);
};

/**
 * 充值日志
 */
LogService.prototype.payLog = function (player, payType, orderId, payMoney, payGold, payWay, payId) {
    const act = player.accountData;
    if (!act) {
        logger.error(`logService player uid:${player.uid} account data null, pay log failed`);
        return;
    }
    const type = payWay != code.global.PAY_WAY_GM ? payType : 0;
    const ci = act.clientInfo;
    const logPay = {
        platform: [act.platform, ci.fngid].join('_'),
        device: ci.device,
        role_id: player.uid,
        account_name: [act.platform, act.account].join('_'),
        user_ip: act.userIp,
        dim_level: player.lv,
        pay_type: type,
        order_id: orderId,
        pay_money: payMoney,
        money_type: 0,
        pay_gold: payGold,
        did: ci.did,
        game_version: code.system.VERSION,
        happend_time: util.time.nowSecond(),
    };
    this.app.rpcs.log.logRemote.addLog({}, code.log.LOG_TYPE_PAY, logPay);
    const logPaySelf = logPay;
    logPaySelf.pay_id = payId;
    logPaySelf.dungeon_id = 0;
    if (player.dungeon && player.dungeon.matchID) {
        logPaySelf.dungeon_id = Number(player.dungeon.matchID);
    }
    logPaySelf.main_task_id = 0;
    if (player.mission && player.mission.chain && player.mission.chain[code.mission.MISSION_TYPE.MAIN]) {
        logPaySelf.main_task_id = Number(player.mission.chain[code.mission.MISSION_TYPE.MAIN]);
    }
    this.app.rpcs.log.logRemote.addLog({}, code.log.LOG_TYPE_PAY_SELF, logPaySelf);
};
/**
 * 等级变动日志
 * @param {Number} lastLv 上一等级
 * @param {Number} curLv 当前等级
 * @param {Number} lastExp 上一经验值
 * @param {Number} curExp 当前经验值
 */
LogService.prototype.levelUpLog = function (player, lastLv, curLv, lastExp, curExp) {
    const act = player.accountData;
    if (!act) {
        logger.error(`logService player uid:${player.uid} account data null, level up log failed`);
        return;
    }
    if (curLv <= lastLv) {
        return;
    }
    const ci = act.clientInfo;
    const logList = [];
    const nowTime = util.time.nowSecond();
    for (let i = lastLv + 1; i <= curLv; i++) {
        const logInfo = {
            platform: [act.platform, ci.fngid].join('_'),
            device: ci.device,
            account_name: [act.platform, act.account].join('_'),
            role_id: player.uid,
            role_name: player.name,
            last_level: i - 1,
            current_level: i,
            last_exp: lastExp,
            current_exp: curExp,
            happend_time: nowTime,
        };
        logList.push(logInfo);
    }
    if (logList.length > 0) {
        this.app.rpcs.log.logRemote.addBulkLog({}, code.log.LOG_TYPE_LEVEL_UP, logList);
    }
};
/**
 * 商城购买日志
 * @param {Number} moneyType
 * @param {Number} amount
 * @param {Number} itemId
 * @param {Number} itemNum
 */
LogService.prototype.shopBuyLog = function (player, cost, shopId, goodsId, num) {
    const act = player.accountData;
    if (!act) {
        logger.error(`logService player uid:${player.uid} account data null, shop buy log failed`);
        return;
    }
    const ci = act.clientInfo;
    const logList = [];
    const nowTime = util.time.nowSecond();
    for (const itemInfo of cost) {
        const logInfo = {
            platform: [act.platform, ci.fngid].join('_'),
            device: ci.device,
            role_id: player.uid,
            account_name: [act.platform, act.account].join('_'),
            shopId: shopId,
            dim_level: player.lv,
            dim_prof: 0,
            money_type: Number(itemInfo.itemID),
            amount: Number(itemInfo.itemNum),
            item_type: 0,
            item_id: goodsId,
            item_number: num,
            happend_time: nowTime,
        };
        logList.push(logInfo);
    }
    if (logList.length > 0) {
        this.app.rpcs.log.logRemote.addBulkLog({}, code.log.LOG_TYPE_SHOP, logList);
    }
};
/**
 * 道具产出/消耗日志
 * @param {Number} opt 操作类型 ( -1是使用【数量减少】，1是增加【数量增加】，0是修改【数量不变，状态变化】)
 * @param {Number} action_id 对应各自项目组的道具消耗项目字典,行为类型（dict_action.action_id）
 * @param {Array} itemList 道具列表[{itemID:xxx,itemNum:xxx} ...]
 */
LogService.prototype.itemsLog = function (player, opt, action_id, itemList) {
    const act = player.accountData;
    if (!act) {
        logger.error(`logService player uid:${player.uid} account data null, items log failed`);
        return;
    }
    if (action_id <= 0) {
        return;
    }
    const ci = act.clientInfo;
    const logList = [];
    for (const info of itemList) {
        const itemsInfo = {
            platform: [act.platform, ci.fngid].join('_'),
            device: ci.device,
            account_name: [act.platform, act.account].join('_'),
            role_id: player.uid,
            dim_level: player.lv,
            opt: opt,
            action_id: action_id,
            item_id: info.itemID,
            item_number: info.itemNum,
            map_id: 0,
            happend_time: util.time.nowSecond(),
        };
        logList.push(itemsInfo);
    }
    if (logList.length > 0) {
        this.app.rpcs.log.logRemote.addBulkLog({}, code.log.LOG_TYPE_ITEMS, logList);
    }
};
/**
 * 用户反馈日志
 */
LogService.prototype.complaintLog = function (player, type, title, content) {
    const act = player.accountData;
    if (!act) {
        logger.error(`logService player uid:${player.uid} account data null, complaint log failed`);
        return;
    }
    const ci = act.clientInfo;
    const logInfo = {
        platform: [act.platform, ci.fngid].join('_'),
        device: ci.device,
        role_id: player.uid,
        role_name: player.name,
        account_name: [act.platform, act.account].join('_'),
        game_abbrv: '',
        sid: 0,
        complaint_type: type,
        complaint_title: title,
        complaint_content: content,
        complaint_time: util.time.nowSecond(),
        // internal_id: 0,
        // reply_cnts: 0,
        // user_ip: '',
        // agent: '',
        pay_amount: 0,
        qq_account: 0,
        dim_level: player.lv,
        dim_vip_level: player.vip,
        // evaluate: 0,
        // sync_numbers: 0,
        // last_reply_time: 0,
        // is_spam: 0,
        // spam_reporter: '',
        // spam_time: 0,
    };
    this.app.rpcs.log.logRemote.addLog({}, code.log.LOG_TYPE_COMPLAINTS, logInfo);
};
/**
 * 邮件日志
 */
LogService.prototype.mailLog = function (player, mailInfo) {
    const act = player.accountData;
    if (!act) {
        logger.error(`logService player uid:${player.uid} account data null, mail log failed`);
        return;
    }
    let item_list = '';
    if (mailInfo.item && mailInfo.item.length > 0) {
        for (const itemInfo of mailInfo.item) {
            if (item_list.length > 0) {
                item_list += ',';
            }
            item_list += String(itemInfo.itemID) + ':' + String(itemInfo.itemNum);
        }
    }
    let mailStatus = 2;
    let getStatus = 2;
    if (mailInfo.status == code.mail.STATUS.READ) {
        mailStatus = 1;
    }
    else if (mailInfo.status == code.mail.STATUS.RECEIVED) {
        mailStatus = 1;
        getStatus = 1;
    }
    const ci = act.clientInfo;
    const logInfo = {
        platform: [act.platform, ci.fngid].join('_'),
        device: ci.device,
        mail_id: mailInfo.id,
        mail_sender_id: 0,
        mail_sender_name: '',
        mail_receiver_id: player.uid,
        mail_receiver_name: [act.platform, act.account].join('_'),
        mail_title: mailInfo.title,
        mail_content: mailInfo.content,
        mail_type: mailInfo.type,
        mail_money_list: '',
        mail_item_list: item_list,
        mail_status: mailStatus,
        get_status: getStatus,
        happend_time: util.time.nowSecond(),
    };
    this.app.rpcs.log.logRemote.addLog({}, code.log.LOG_TYPE_MAIL, logInfo);
};
/**
 * 更新邮件日志读取信息
 */
LogService.prototype.updateMailLog = function (player, mailId, status) {
    if (!player) {
        return;
    }
    const logInfo = {};
    if (status == code.mail.STATUS.READ) {
        logInfo.mail_status = 1;
    }
    else if (status == code.mail.STATUS.RECEIVED) {
        logInfo.mail_status = 1;
        logInfo.get_status = 1;
    }
    if (!util.object.isNull(logInfo)) {
        logInfo.happend_time = util.time.nowSecond();
        this.app.rpcs.log.logRemote.updateOneLog({}, code.log.LOG_TYPE_MAIL, logInfo, { mail_receiver_id: player.uid, mail_id: mailId });
    }
};
/**
 * 关卡日志
 * @param {Number} matchID 章节关卡
 */
LogService.prototype.dungeonLog = function (player, matchID) {
    this.dungeonPveLog(player, matchID);
    // const act = player.accountData;
    // if (!act) {
    //     logger.error(`logService player uid:${player.uid} account data null, dungeon log failed`);
    //     return;
    // }
    // const ci = act.clientInfo;
    // const logInfo = {
    //     platform: [act.platform, ci.fngid].join('_'),
    //     device: ci.device,
    //     account_name: [act.platform, act.account].join('_'),
    //     role_id: player.uid,
    //     role_name: player.name,
    //     matchID: matchID,
    //     happend_time: util.time.nowSecond(),
    // };
    // this.app.rpcs.log.logRemote.addLog({}, code.log.LOG_TYPE_DUNGEON, logInfo);
};
/**
 * 任务日志
 * @param {Number} taskId 任务id
 * @param {Number} taskType 任务类型
 */
LogService.prototype.missionLog = function (player, taskId, taskType) {
    this.taskLog(player, taskId, taskType);
    // const act = player.accountData;
    // if (!act) {
    //     logger.error(`logService player uid:${player.uid} account data null, mission log failed`);
    //     return;
    // }
    // const ci = act.clientInfo;
    // const logInfo = {
    //     platform: [act.platform, ci.fngid].join('_'),
    //     device: ci.device,
    //     account_name: [act.platform, act.account].join('_'),
    //     role_id: player.uid,
    //     role_name: player.name,
    //     taskId: taskId,
    //     taskType: taskType,
    //     happend_time: util.time.nowSecond(),
    // };
    // this.app.rpcs.log.logRemote.addLog({}, code.log.LOG_TYPE_MISSION, logInfo);
};

/**
 * 运营活动日志 记录于tbllog_pve
 * @param player  玩家
 * @param actId 活动Id
 * @param isStart 开启：true, 关闭：false
 * @param startMs
 * @param stopMs
 * @param isActivity false:运营活动 true:非运营活动
 */
LogService.prototype.operateActivityLog = function (player, actId, isStart, startMs, stopMs) {
    let actionId = 0;
    const actionType = 9;
    let type = 0;
    const cfg = this.app.Config.OperateBaseActivity.get(actId);
    if (!cfg) {
        return;
    }
    const accountData = player.accountData;
    actionId = Number(cfg.Id);
    type = Number(cfg.Type);
    if (actionId > 0) {
        const logPve = {};
        logPve.platform = accountData.platform;
        logPve.device = accountData.clientInfo.device;
        logPve.role_id = player.uid;
        logPve.account_name = accountData.account;
        logPve.dim_level = player.lv;
        logPve.action_type = actionType;
        logPve.action_id = actionId;
        logPve.pve_id = actionId;
        logPve.dim_power = player.power;
        logPve.status = isStart ? 1 : 2;
        logPve.info = String(type);
        logPve.begin_time = util.time.ms2s(startMs);
        logPve.end_time = util.time.ms2s(stopMs);
        logPve.time_duration = logPve.end_time - logPve.begin_time;
        logPve.happend_time = util.time.nowSecond();
        this.pveLog(logPve);
    }
};
/**
 * 活动日志 记录于tbllog_pve
 * @param timer {time:触发时间, id:xxx, isStart:xxx, startMs:xxx, stopMs:xxx, noticeId: 公告ID}
 * @param isActivity false:运营活动 true:非运营活动
 */
LogService.prototype.activityLog = function (timer, isActivity = false) {
    let actionId = 0;
    let actionType = 9;
    let type = 0;
    if (isActivity) {
        const cfg = this.app.Config.ActivityTime.get(timer.id);
        if (!cfg) {
            return;
        }
        actionId = Number(cfg.Id);
        type = Number(cfg.ActivityId);
        actionType = 5100;
    }
    else {
        const cfg = this.app.Config.OperateBaseActivity.get(timer.id);
        if (!cfg) {
            return;
        }
        actionId = Number(cfg.Id);
        type = Number(cfg.Type);
    }
    if (actionId > 0) {
        const logPve = {};
        logPve.platform = '';
        logPve.device = '';
        logPve.role_id = 0;
        logPve.account_name = '';
        logPve.dim_level = 0;
        logPve.action_type = actionType;
        logPve.action_id = actionId;
        logPve.pve_id = actionId;
        logPve.dim_power = 0;
        logPve.status = timer.isStart ? 1 : 2;
        logPve.info = String(type);
        logPve.begin_time = util.time.ms2s(timer.startMs);
        logPve.end_time = util.time.ms2s(timer.stopMs);
        logPve.time_duration = logPve.end_time - logPve.begin_time;
        logPve.happend_time = util.time.nowSecond();
        this.pveLog(logPve);
    }
};
/**
 * 任务日志 记录于tbllog_pve
 * @param {Object} player
 * @param {Number} taskId
 * @param {Number} taskType
 */
LogService.prototype.taskLog = function (player, taskId, taskType) {
    const act = player.accountData;
    if (!act) {
        logger.error(`logService player uid:${player.uid} account data null, pve task log failed`);
        return;
    }
    let actionTypeId = 1500;
    switch (taskType) {
        case code.mission.MISSION_TYPE.MAIN:
            actionTypeId = 1501;
            break;
        case code.mission.MISSION_TYPE.DAILY:
            actionTypeId = 1502;
            break;
        case code.mission.MISSION_TYPE.ACHIEVEMENT:
            actionTypeId = 1503;
            break;
        default:
            break;
    }
    const ci = act.clientInfo;
    const logPve = {
        platform: [act.platform, ci.fngid].join('_'),
        device: act.clientInfo.device,
        role_id: player.uid,
        account_name: [act.platform, act.account].join('_'),
        dim_level: player.lv,
        action_type: actionTypeId,
        action_id: taskId,
        pve_id: taskId,
        dim_power: player.power || 0,
        status: 2,
        info: String(taskId),
        begin_time: 0,
        end_time: 0,
        time_duration: 0,
        happend_time: util.time.nowSecond(),
    };
    this.pveLog(logPve);
};
/**
 * 关卡日志
 * @param {Number} matchID 章节关卡
 */
LogService.prototype.dungeonPveLog = function (player, matchID) {
    const act = player.accountData;
    if (!act) {
        logger.error(`logService player uid:${player.uid} account data null, pve dungeon log failed`);
        return;
    }
    const actionTypeId = 5;
    const actionId = matchID;

    const ci = act.clientInfo;
    const logPve = {
        platform: [act.platform, ci.fngid].join('_'),
        device: act.clientInfo.device,
        role_id: player.uid,
        account_name: [act.platform, act.account].join('_'),
        dim_level: player.lv,
        action_type: actionTypeId,
        action_id: actionId,
        pve_id: actionId,
        dim_power: player.power || 0,
        status: 2,
        info: String(matchID),
        begin_time: 0,
        end_time: 0,
        time_duration: 0,
        happend_time: util.time.nowSecond(),
    };
    this.pveLog(logPve);
};
/**
 * PVE日志
 */
LogService.prototype.pveLog = function (logPve) {
    this.app.rpcs.log.logRemote.addLog({}, code.log.LOG_TYPE_PVE, logPve);
};
