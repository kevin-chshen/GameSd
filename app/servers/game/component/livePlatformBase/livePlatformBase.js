/**
 * @description 直播平台对象
 * @author chshen
 * @data 2020/04/02
 */
const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const code = require('@code');
/**
 * 数据结构
 * {
 *     level 平台等级
 *     num 超级管家数量
 *     // 直播平台自身的每秒收益
 *     earnPerSecond: "string"
 *     cards:{
 *         "cardId":slot 槽位
 *     }
 * }
*/

const LivePlatformBase = function (app, player, mgr, platform) {
    this.$id = 'game_LivePlatformBase';
    this.$scope = "prototype";
    this.app = app;
    this.player = player;

    this.com = mgr;
    this.data = platform;

    // 暴露属性具体看 注释的数据结构
    if (this.data) {
        for (const attrName in this.data) {
            Object.defineProperty(this, attrName, {
                get: function () {
                    return this.data[attrName];
                },
                set: function (value) {
                    this.data[attrName] = value;
                }
            });
        }
    }
};
module.exports = LivePlatformBase;

/**
 * 获取数据
*/
LivePlatformBase.prototype.values = function () {
    return this.data;
};

/**
 * 激活平台
*/
LivePlatformBase.prototype.active = function () {

    // 与前端约定激活的时候不要单独通知 平台赚钱，由激活协议通知,这一前端逻辑好写
    this.__dealEarnPerSec(false);

    this.com.updatePlatforms(this.data);

    // 触发激活事件
    this.player.Event.emit(code.event.LIVE_PLATFORM_ACTIVE.name, this.data.id);
};
/**
 * 平台升级, 默认加1
*/
LivePlatformBase.prototype.upgrade = function () {

    this.data.level += 1;

    this.__dealEarnPerSec(false);

    this.com.updatePlatforms(this.data);
    this.player.Event.emit(code.event.PLATFORM_UP_LEVEL.name);
};

/**
 * 添加管家
 * @param {Integer} numAdd 添加数量
 * return {Integer} 返回员工总数
*/
LivePlatformBase.prototype.addStaff = function (numAdd) {
    this.data.num += numAdd;

    this.__dealEarnPerSec(true);

    this.com.updatePlatforms(this.data);
    this.player.Event.emit(code.event.PLATFORM_RECRUIT.name);
    return this.data.num;
};

/**
 * 上任
 * @param {Integer} cardId
 * @param {Integer} slot
 * return {List} 更新列表
*/
LivePlatformBase.prototype.onJob = function (cardId, slot) {
    if (!cardId || !slot) {
        logger.warn(`LivePlatformBase onJob params error, player:${this.player.uid}`);
        return [];
    }
    // 存在其他卡片
    let existCard; // object
    for (const [cid, slt] of Object.entries(this.data.cards)) {
        if (slt == slot) {
            existCard = { cardId: Number(cid), slot: slot };
        }
    }
    // 无需变化
    if (existCard && cardId == existCard.cardId) {
        return [];
    }

    const update = [];
    let cal = true;
    const existSlot = this.data.cards[cardId];
    // 通知前端更新
    const platformIdId = this.data.id;
    update.push({ cardId: cardId, slot: slot, platformId: platformIdId });
    if (existCard) {
        // 置换
        if (existSlot) {
            update.push({ cardId: existCard.cardId, slot: existSlot, platformId: platformIdId });
        }
        // 顶替
        else {
            update.push({ cardId: existCard.cardId, slot: 0, platformId: 0 });
        }
    }

    // 修改内存数据
    if (existCard) {
        // 移动
        if (existSlot) {
            const mvSlot = existSlot;
            this.data.cards[cardId] = slot;
            this.data.cards[existCard.cardId] = mvSlot;
            cal = false;
        }
        // 顶替
        else {
            const removeCardId = existCard.cardId;
            delete this.data.cards[removeCardId];
            this.com.removeCard(removeCardId);

            // 新增
            this.data.cards[cardId] = slot;
            this.com.replaceCard(platformIdId, cardId);
        }
    }
    else {
        // 移动位置
        if (existSlot) {
            cal = false;
        }
        // 加入
        else {
            this.com.replaceCard(this.data.id, cardId);
        }
        this.data.cards[cardId] = slot;

        this.com.replaceCard(platformIdId, cardId);
    }

    // 计算赚钱
    if (cal) {
        this.__dealEarnPerSec(true);
    }

    this.com.updatePlatforms(this.data);

    return update;
};

/**
 * 卸任
 * @param {Integer} cardId 
 * @return {List} 更新列表
*/
LivePlatformBase.prototype.retire = function (cardId) {

    // 卡牌不在平台中
    if (!(cardId in this.data.cards)) {
        return [];
    }

    const update = [];
    // 移除卡片
    delete this.data.cards[cardId];
    this.com.removeCard(cardId);

    this.__dealEarnPerSec(true);

    this.com.updatePlatforms(this.data);

    update.push({ cardId: cardId, slot: 0, platformId: 0 });

    return update;
};

/**
 * 计算赚速度并保持数据
 * @api public
*/
LivePlatformBase.prototype.dealAndSaveEarnPerSec = function () {

    this.__dealEarnPerSec(true);

    this.com.updatePlatforms(this.data);
};

/**
 * 处理平台每秒收益
 * @api private
*/
LivePlatformBase.prototype.__dealEarnPerSec = function (notify) {
    const oldEarn = this.data.earnPerSecond;

    const earn = this.__calEarnPerSec();
    this.data.earnPerSecond = earn;

    // 同步更新平台每秒赚钱
    if (notify) {
        this.app.get('channelService').pushMessageByUids("onSyncLivePlatformEarnPerSecondNotify", {
            platformId: this.data.id,
            data: earn.toString()
        }, [{ uid: this.player.uid, sid: this.player.connectorId }]);
    }

    // 主平台 或者 赚钱速度发生变化
    if (oldEarn != earn || this.data.id == code.live.PLATFORM_BASE) {
        this.player.Event.emit(code.event.CASH_PER_SECOND.name);
    }
};

LivePlatformBase.prototype.__calEarnPerSec = function () {

    const platformId = this.data.id;
    const level = this.data.level;
    // 每秒收益
    const cfg = this.app.Config.LivePlatform.getConfig(platformId, level);
    if (cfg) {
        // 基地
        if (platformId == code.live.PLATFORM_BASE) {
            // 所有平台重新计算赚钱速度
            this.com.dealAndSaveEarnPerSec();
            // 自动点击加钱
            if (cfg.Cd != 0) {
                this.com.autoClickAddMoney = cfg.BaseReward || 0;
            }
            return 0;
        }
        // 非基地
        else {
            const cards = this.data.cards;
            const num = this.data.num;
            let cardPopularity = 0;
            for (const cardId in cards) {
                cardPopularity += this.player.Card.getCardPopularity(cardId);
            }
            let cardSkillAdd = 0;
            for (const cardId in cards) {
                const card = this.player.Card.getCardObj(cardId);
                const cfg = this.app.Config.Card.get(cardId);
                if (cfg && card) {
                    const effect = this.app.Config.SkillManage.getEffects(cfg.SkillManage, card.getStar(), platformId);
                    cardSkillAdd += effect;
                }
            }
            const basePlatformReward = this.com.getBasePlatformLeaveReward();
            const base = cfg.BaseReward + num * cfg.StaffReward + cardPopularity;
            const coefficient = basePlatformReward + cfg.LevelReward;
            // TODO 百分比加成=1+头衔加成+主播技能加成+管理经验加成+装潢加成
            // 头衔加成
            const famePer = this.player.Fame.GetFameData(code.fame.FAME_CONFIG_DATA.REVENUE_PLUS) || 0;
            const cfgManageLv = this.app.Config.ManageLevel.get(this.player.mgrLv);
            let revenuePlus = 0;
            if (cfgManageLv) {
                revenuePlus = cfgManageLv.RevenuePlus;
            }
            const per = 10000 + cardSkillAdd + famePer + revenuePlus;
            return String(BigInt(base) * BigInt(coefficient) * BigInt(per) / BigInt(10000));
        }
    }
    return '0';
};