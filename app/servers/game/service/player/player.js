/**
 * @description 角色组合类
 * @author linjs
 * @date 2020/03/18
 */

const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const bearcat = require('bearcat');
const code = require('@code');
const MongoAccount = require('@mongo/mongoAccount');

/**
 * 角色组件列表
 * @param {String} name 组件名称,最终通过player.name访问,首字母必须大写
 * @param {String} id 组件的bearcat id
 */
const Components = [
    { name: 'Event', id: 'game_EventComponent' },
    { name: 'Notify', id: 'game_NotifyComponent' },
    { name: 'Counter', id: 'game_CounterComponent' },
    { name: 'Test', id: 'game_TestComponent' },
    { name: 'Timer', id: 'game_TimerComponent' },
    { name: 'Currency', id: 'game_CurrencyComponent' },
    { name: 'Backpack', id: 'game_BackpackComponent' },
    { name: 'Item', id: 'game_ItemComponent' },
    { name: 'Fame', id: 'game_FameComponent' },
    { name: 'Recovery', id: 'game_RecoveryComponent' },
    { name: 'Dungeon', id: 'game_DungeonComponent' },
    { name: 'Invest', id: 'game_InvestComponent' },
    { name: 'Friendship', id: 'game_FriendshipComponent' },
    { name: 'Mission', id: 'game_MissionComponent' },
    { name: 'Attribute', id: 'game_AttributeComponent' },
    { name: 'Card', id: 'game_CardComponent' },
    { name: 'LivePfBase', id: 'game_LivePlatformBaseComponent' },
    { name: 'LivePfEvent', id: 'game_LivePlatformEventComponent' },
    { name: 'Brief', id: 'game_BriefComponent' },
    { name: 'Rank', id: 'game_RankComponent' },
    { name: 'RoleBase', id: 'game_RoleBaseComponent' },
    { name: 'SysOpen', id: 'game_SystemOpenComponent' },
    { name: 'Car', id: 'game_CarComponent' },
    { name: 'Mail', id: 'game_MailComponent' },
    { name: 'Club', id: 'game_ClubComponent' },
    { name: 'Shop', id: 'game_ShopComponent' },
    { name: 'Drop', id: 'game_DropComponent' },
    { name: 'Pay', id: 'game_PayComponent' },
    { name: 'Guild', id: 'game_GuildComponent' },
    { name: 'AutoShow', id: 'game_AutoShowComponent' },
    { name: 'AutoShowWork', id: 'game_AutoShowWorkComponent' },
    { name: 'ShopTemporary', id: 'game_ShopTemporaryComponent' },
    { name: 'ActInvestFunds', id: 'game_ActInvestFundsComponent' },
    { name: 'Operate', id: 'game_OperateComponent' },
    { name: 'MonthCard', id: 'game_ActMonthCardComponent' },
    { name: 'SpecialDelivery', id: 'game_SpecialDeliveryComponent' },
    { name: 'LoginDays', id: 'game_LoginDaysComponent' },
    { name: 'FlowRate', id: 'game_FlowRateComponent' },
    { name: 'Ban', id: 'game_BanComponent' },
    { name: 'Guide', id: 'game_GuideComponent' },
    { name: 'OZGCom', id: 'game_OperateZeroGiftComponent' },
    
];

const Player = function (app, uid) {
    this.$id = 'game_Player';
    this.$scope = 'prototype';
    this._app = app;
    this._uid = uid;
    this._connectorId = null;   // 所在的connector服务器id
    this._components = {};
    this._dataObj = null;
    this._accountData = null;
    this._sid = null;
    this._login_level = 0;

    // 设置角色uid的getter函数
    Object.defineProperty(this, 'uid', { get: function () { return this._uid; } });
    // 设置角色accountData的getter函数
    Object.defineProperty(this, 'accountData', { get: function () { return this._accountData; } });
    // 设置角色connector的getter/setter函数
    Object.defineProperty(this, 'connectorId', {
        get: function () { return this._connectorId; },
        set: function (value) { this._connectorId = value; }
    });
    // 设置玩家的sessionId的getter/setter函数
    Object.defineProperty(this, 'sid', {
        get: function () { return this._sid; },
        set: function (value) { this._sid = value; }
    });
    // 设置玩家玩家登录时的等级的getter函数
    Object.defineProperty(this, 'loginLv', { get: function () { return this._login_level; } });
    
    // 设置角色上属性的getter,setter函数
    for (const attrName of Object.values(code.player.Keys)) {
        if (attrName !== 'uid') {
            Object.defineProperty(this, attrName, { 
                get: function () {
                    return this.get(attrName);
                },
                set: function (value) {
                    this.set(attrName, value, false);
                }
            });
        }
    }

    // 设置角色上的所有插件的getter函数
    for (const {name, id} of Components) {
        const component = bearcat.getBean(id, app, this);
        this._components[name] = component;
        Object.defineProperty(this, name, { get: function () {
            return component;
        }});
    }
};
module.exports = Player;

/**
 * 获取玩家属性数据
 * @param  {String} key 玩家属性字段
 * @return {Mixed}
 */
Player.prototype.get = function (key) {
    return this._dataObj.get(key);
};

/**
 * 设置玩家属性数据, 初始化用
 * @param  {String} key 玩家属性字段
 * @param  {Mixed} value 玩家属性值
 * @param  {Bool} isUpdate 是否更新
 * @param  {Bool} isImmediately 是否立即更新
 * @return {void}
 */
Player.prototype.set = function (key, value, isImmediately) {
    if (key == null || value == null) {
        logger.error(`player ${this._uid} set error, key ${key}, value ${value}`);
        return;
    }
    isImmediately = isImmediately || false;
    this._dataObj.update({ [key]:value}, isImmediately);
};

/**
 * 强制保存玩家所有数据
 * @return {void}
 */
Player.prototype.flush = async function () {
    await this._dataObj.flush();
};

/**
 * 更新玩家数据,没有立即落地
*/
Player.prototype.update = function (){
    this._dataObj.update();
};

/**
 * 角色的持久化数据
 * @return {MongoPlayer}
 */
Player.prototype.getDataObj = function () {
    return this._dataObj;
};

/**
 * 角色初始化:主要处理事件监听相关
 */
Player.prototype.init = async function () {
    // 完成后通知所有组件,玩家初始化完成
    await callAll(this, 'onInit');
};

Player.prototype.deInit = async function () {
    this._dataObj = null;
    this._accountData = null;
};

/**
 * 角色加载数据
 */
Player.prototype.load = async function (data) {
    // 角色加载数据
    this._dataObj = data;

    // 账号数据提取
    const mongoData = await MongoAccount.query({ uid: this._uid });
    if (mongoData && mongoData.length > 0 && mongoData[0]._data) {
        logger.info(`player ${this.uid} load account data ok`);
        this._accountData = mongoData[0]._data;
    }

    // 登录时的日志
    this._login_level = this.lv;

    // 完成后通知所有组件,数据加载完成
    await callAll(this, 'onLoad');
};

/**
 * 角色登录
 */
Player.prototype.login = async function() {
    // 角色登录
    // 完成后通知所有组件,角色登录
    await callAll(this, 'onLogin');
};

/**
 * 角色登录后处理
 */
Player.prototype.afterLogin = async function () {
    // 角色登录后
    // 完成后通知所有组件,角色登录后
    await callAll(this, 'onAfterLogin');
};

/**
 * 角色重新登录
 */
Player.prototype.reLogin = async function () {
    await callAll(this, 'onReLogin');
};

/**
 * 角色重连
 */
Player.prototype.reConnect = async function () {
    await callAll(this, 'onReConnect');
};

/**
 * 登录后
*/
Player.prototype.afterLoad = async function() {
    await callAll(this, 'onAfterLoad');
};

/**
 * 角色登出
 */
Player.prototype.logout = async function () {
    await callAll(this, 'onLogout');
};

/**
 * 角色数据清理（退出缓存）
 */
Player.prototype.clean = async function () {
    await callAll(this, 'onClean');
};

/**
 * 角色关服处理
 */
Player.prototype.shutdown = async function (_reason) {
    // 先将玩家登出
    await callAll(this, 'onLogout', 'shutdown');
    // 再清理所有缓存
    await callAll(this, 'onClean');
    // 强制刷新数据库
    return await this.flush();
};

/**
 * 角色跨天
 * @param {Boolean} isOnTime
 * @param {Integer} count 触发次数
 */
Player.prototype.dayChange = async function (isOnTime, count) {
    callAll(this, 'onDayChange', isOnTime, count);
};

/**
 * 角色跨周
 * @param {Boolean} isOnTime
 * @param {Integer} count 触发次数
 */
Player.prototype.weekChange = async function (isOnTime, count) {
    callAll(this, 'onWeekChange', isOnTime, count);
};

/**
 * 调用所有组件上的指定接口
 * @param {Object} player 玩家实例
 * @param {String} fun 函数名称
 * @param {Any} ...args
 */
async function callAll(player, fun, ...args) {
    return await Promise.all(Object.values(player._components).map(async (component) => {
        component[fun](...args);
    }));
}
