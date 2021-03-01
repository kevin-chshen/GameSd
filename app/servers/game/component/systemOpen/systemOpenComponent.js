/**
 * @description 系统开放组件
 * @author chshen
 * @date 2020/03/31
 */
const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const code = require('@code');
const bearcat = require('bearcat');

const SystemOpenComponent = function(app, player){
    this.$id = "game_SystemOpenComponent";
    this.$scope = 'prototype';
    this.app = app;
    this.player = player;
};

bearcat.extend('game_SystemOpenComponent', 'game_Component');

module.exports = SystemOpenComponent;

/**
 * 加载
*/
SystemOpenComponent.prototype.onLoad = function() {
    this.player.Event.on(code.event.DUNGEON_FORWARD.name, (isBattleWin)=>{
        if(isBattleWin){
            this.onEvent(code.sysOpen.TYPE.DUNGEON_FORWARD);
        }
    });
    this.player.Event.on(code.event.MISSION_COMPLETE.name, () => {
        this.onEvent(code.sysOpen.TYPE.MAIN_TASK);
    });
    this.player.Event.on(code.event.LEVEL_UP.name, () => {
        this.onEvent(code.sysOpen.TYPE.TITLE_LEVEL);
    });
    this.player.Event.on(code.event.GUILD_LV_CHANGE.name, () => {
        this.onEvent(code.sysOpen.TYPE.GUILD_LEVEL);
    });
};

SystemOpenComponent.prototype.onAfterLogin = function(){
    // 重新计算系统开启
    const systemOpens = this.player.systemOpens;
    for (const data of this.app.Config.GameUIActivity.values()) {
        if (!this.player.systemOpens[data.Id] && this.check(data.Id, false)) {
            systemOpens[data.Id] = true;
            this.player.Event.emit([code.event.SYSTEM_OPEN.name, data.Id]);
        }
    }
    this.player.systemOpens = systemOpens;
};

/**
 * 事件
*/
SystemOpenComponent.prototype.onEvent = function(type) {
    const openList = this.app.Config.GameUIActivity.getOpenListByType(type);
    for (const cfg of openList) {
        if (!this.player.systemOpens[cfg.Id] && this.check(cfg.Id)) {
            this.player.systemOpens[cfg.Id] = true;
            this.player.Event.emit([code.event.SYSTEM_OPEN.name, cfg.Id]);
        }
    }
};

/**
 * 检测系统开放
 * @param {Integer} systemId 系统ID
 * @return {Boolean} 返回结果
*/
SystemOpenComponent.prototype.check = function(systemId)
{
    const cfg = this.app.Config.GameUIActivity.get(systemId);
    if (cfg == null){
        logger.error(`can not find system id :${systemId}`);
        return true;
    }
    // 检测数据
    if (this.player.systemOpens[cfg.Id]) {
        return true;
    }

    let open = false;
    switch (cfg.UnlockType)
    {
    // 默认开放
    case code.sysOpen.TYPE.NONE:{
        open = true;
    } break;
    // 章节
    case code.sysOpen.TYPE.DUNGEON:{
        open = cfg.UnlockValue <= this.player.Dungeon.getMaxCompleteMatchID();
    } break;
    // 主线任务
    case code.sysOpen.TYPE.MAIN_TASK: {
        const mainId = this.player.Mission.getMaxCompleteMainMissionID();
        open = cfg.UnlockValue <= mainId;
    } break;
    // 头衔等级
    case code.sysOpen.TYPE.TITLE_LEVEL:{
        open = cfg.UnlockValue <= this.player.lv;
    }break;
    case code.sysOpen.TYPE.CLUB_1: {
        const clubLv = this.player.Club.getClubLv(code.club.CLUB_TYPE.CLUB_1);
        open = cfg.UnlockValue <= clubLv;
    } break;
    case code.sysOpen.TYPE.CLUB_2: {
        const clubLv = this.player.Club.getClubLv(code.club.CLUB_TYPE.CLUB_2);
        open = cfg.UnlockValue <= clubLv;
    } break;
    case code.sysOpen.TYPE.CLUB_3: {
        const clubLv = this.player.Club.getClubLv(code.club.CLUB_TYPE.CLUB_3);
        open = cfg.UnlockValue <= clubLv;
    } break;
    case code.sysOpen.TYPE.CLUB_4: {
        const clubLv = this.player.Club.getClubLv(code.club.CLUB_TYPE.CLUB_4);
        open = cfg.UnlockValue <= clubLv;
    } break;
    case code.sysOpen.TYPE.GUILD_LEVEL: {
        open = cfg.UnlockValue <= (this.player.guildLv || 0);
    } break;
    default:
        logger.warn(`not define system open type:${cfg.UnlockType}`);
        open =  false;
    }
    // 如果有bug 则这里自动修复
    this.player.systemOpens[cfg.Id] = open;

    return open;
};

