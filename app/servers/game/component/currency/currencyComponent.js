/**
 * @description 货币管理器
 * @author jzy
 * @date 2020/03/13
 */

const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const code = require('@code');
const assert = require('assert');
const bigNumberCal = require("@util/bigNumberCal");
const bearcat = require('bearcat');

/**
 * 添加货币后触发事件
*/
const AfterAddCurrencyFunc = {
    // 添加管理经验后触发事件
    [code.currency.CURRENCY_ID.MGR_EXP] : (player) => {
        player.Event.emit(code.event.MGR_EXP_CHANGED.name);
    },
    // 添加人气后触发事件
    [code.currency.CURRENCY_ID.REPUTATION] : (player) =>{
        player.Event.emit(code.event.FAME_UP.name);
    },
};

const CurrencyComponent = function(app, player){
    this.$id = 'game_CurrencyComponent';
    this.$scope = 'prototype';
    this.app = app;
    this.player = player;
};

module.exports = CurrencyComponent;
bearcat.extend('game_CurrencyComponent', 'game_Component');

/**
 * 角色登录
*/
CurrencyComponent.prototype.onLogin = function() {
    logger.debug(`player${this.player.uid} login currency component`);

    // 定时器每秒加钱 考虑是否 换成没N秒
    this.cashMoneyTimer = setInterval(() => {
        this.__addMoney();
    }, 1000);
};

CurrencyComponent.prototype.__addMoney = function() {
    const addMoney = BigInt(this.player.LivePfBase.autoClickAddMoney) + BigInt(this.player.cashPerSecond);
    this.player.Currency.add(code.currency.BIG_CURRENCY_ID.CASH, addMoney.toString(), 0, false);
};
/**
 * 角色登出
*/
CurrencyComponent.prototype.onLogout = function()
{
    logger.debug(`player${this.player.uid} logout currency component`);

    // 删除赚钱定时器
    clearInterval(this.cashMoneyTimer);
};

/**
 * 判断是否能够增加货币
 */
CurrencyComponent.prototype.isCanAdd = function(currencyId, num){
    const obj = this.getCurrency();
    if(Object.values(code.currency.BIG_CURRENCY_ID).indexOf(currencyId)<0){
        const account = (obj[currencyId] || 0)*1;
        const result = account + num;
        if(result > code.currency.MAX_CURRENCY_NUM){
            return code.err.ERR_ITEM_CURRENCY_TOO_LARGE;
        }
    }
    return code.err.SUCCEEDED;
};

/**
 * 判断货币是否充足
 */
CurrencyComponent.prototype.isEnough = function(currencyId, num){
    const currentNum = this.get(currencyId);
    if(Object.values(code.currency.BIG_CURRENCY_ID).indexOf(currencyId)<0){
        if(currentNum<num){
            return false;
        }
    }else{
        if(!bigNumberCal.compare(currentNum,num)){
            return false;
        }
    }
    return true;
};

/**
 * 增加货币值
 * @param {Number} currencyId 货币id
 * @param {String} num 例如："1000000000000000"
 * @return {String} 返回当前现金总额
 */
CurrencyComponent.prototype.add = function(currencyId, num, actionID = 0, notifyChanges = true){
    //检查
    assert(this.app.Config.Item.isValidCurrency(currencyId), `增加货币，货币ID ${currencyId} 无效`);
    const bigCurrency = Object.values(code.currency.BIG_CURRENCY_ID);
    const obj = this.getCurrency();
    let account;
    let result;
    if(bigCurrency.indexOf(currencyId)>=0){
        assert(bigNumberCal.compare(num,"0"), `增加货币，货币ID ${currencyId}，数量必须为整数`);
        account = (obj[currencyId] || "0").toString();
        result = bigNumberCal.add(account, num);
    }else{
        assert(num>0, `增加货币，货币ID ${currencyId}，数量必须为整数`);
        account = Number(obj[currencyId] || 0);
        result = account + Number(num);
        assert(result<=code.currency.MAX_CURRENCY_NUM, `增加普通货币，货币ID[${currencyId}]超过最大值[${code.currency.MAX_CURRENCY_NUM}]`);
    }

    // 设置货币上限
    if (currencyId == code.currency.CURRENCY_ID.FIRE_POWER) {
        const limit = Math.floor(this.app.Config.Global.get(code.live.GLOBAL_FIRE_POWER_MAX).GlobalFloat);
        result = (limit < result) ? limit: result;
    }

    //修改
    obj[currencyId] = result;
    this.update(obj);

    if(notifyChanges){
        this.notifyChanges([currencyId]);
    }

    // 货币变动日志, 现金不记录
    if (code.currency.BIG_CURRENCY_ID.CASH != currencyId) {
        this.app.Log.goldLog(this.player, {
            moneyType: currencyId,
            amount: num,
            remain: result,
            itemId: 0,
            opt: 1,
            action_1: actionID,
            action_2: actionID,
            itemNum: 0,
        });
    }else{
        // 现金增加事件
        this.player.Event.emit(code.event.CASH_ADD.name, num);
    }

    //  添加货币后触发事件
    if (currencyId in AfterAddCurrencyFunc) {
        AfterAddCurrencyFunc[currencyId](this.player);
    }

    return result;
};

/**
 * 减少货币值
 * @param {Number} currencyId 货币id
 * @param {String} num 例如："1000000000000000"
 * @param {Enum} deleteType 删除货币的方式
 */
CurrencyComponent.prototype.delete = function(currencyId, num, actionID = 0, deleteType = code.currency.DELETE_TYPE.Normal, notifyChanges = true){
    //检查
    assert(this.app.Config.Item.isValidCurrency(currencyId), `减少货币，货币ID ${currencyId} 无效`);
    const bigCurrency = Object.values(code.currency.BIG_CURRENCY_ID);
    const obj = this.getCurrency();
    let account;
    let result;
    let isResultNegative;
    if(bigCurrency.indexOf(currencyId)>=0){
        assert(bigNumberCal.compare(num,"0"), `减少货币，货币ID ${currencyId}，数量必须为整数`);
        account = (obj[currencyId] || "0").toString();
        result = bigNumberCal.reduce(account, num);
        isResultNegative = bigNumberCal.compare(result,"0");
    }else{
        assert(num>=0, `减少货币，货币ID ${currencyId}，数量必须为整数`);
        account = Number(obj[currencyId] || 0);
        result = account - Number(num);
        isResultNegative = result>=0;
    }
    switch(deleteType){
    case code.currency.DELETE_TYPE.Normal:
        assert(isResultNegative, `减少货币，货币ID ${currencyId} 修改失败，数量不足`);
        break;
    case code.currency.DELETE_TYPE.AsMuch:
        result = isResultNegative? result : 0;
        break;
    case code.currency.DELETE_TYPE.Debt:
        break;
    default:
        break;
    }
    

    //修改
    obj[currencyId] = result;
    this.update(obj);

    if(notifyChanges){
        this.notifyChanges([currencyId]);
    }

    // 货币变动日志, 现金不记录
    if (code.currency.BIG_CURRENCY_ID.CASH != currencyId) {
        this.app.Log.goldLog(this.player, {
            moneyType: currencyId,
            amount: num,
            remain: result,
            itemId: 0,
            opt: -1,
            action_1: actionID,
            action_2: actionID,
            itemNum: 0,
        });
    }
};

/**
 * 推送物品变化消息
 */
CurrencyComponent.prototype.notifyChanges = function(ids){
    const data = {currencyInfo:[],bigCurrencyInfo:[]};
    const currencyObj = this.getCurrency();
    const bigCurrency = Object.values(code.currency.BIG_CURRENCY_ID);
    ids = ids==undefined?Object.keys(currencyObj):ids;
    for (const key in ids) {
        const currencyID = ids[key];
        if(bigCurrency.indexOf(currencyID)>=0){
            const currencyNum = (currencyObj[currencyID]==undefined?"0":currencyObj[currencyID]).toString();
            data.bigCurrencyInfo.push({id:currencyID,num:currencyNum});
        }else{
            const currencyNum = (currencyObj[currencyID] || 0) * 1;
            data.currencyInfo.push({id:currencyID,num:currencyNum});
        }
    }

    if(data.currencyInfo.length>0 || data.bigCurrencyInfo.length>0){
        this.app.get('channelService').pushMessageByUids("onCurrencyDataNotify", data,
            [{uid: this.player.uid, sid: this.player.connectorId}]);
    }
};
/**
 * 获取货币值
 * @param {Number} currencyId 货币id
 */
CurrencyComponent.prototype.get = function(currencyId){
    assert(this.app.Config.Item.isValidCurrency(currencyId), `货币ID "${currencyId}" 无效`);
    const obj = this.getCurrency();
    const bigCurrency = Object.values(code.currency.BIG_CURRENCY_ID);
    let num = obj[currencyId] || 0;
    if(bigCurrency.indexOf(currencyId)<0){
        num = num * 1;
    }else{
        num = num.toString();
    }
    return num;
};

/**
 * 获取玩家货币数据对象
 * @return {JSON} {xxx:xxx, ...}
 */
CurrencyComponent.prototype.getCurrency = function()
{
    const playerCurrency = this.player.get(code.player.Keys.CURRENCY) || {};
    return playerCurrency;
};

/**
 * 更新玩家货币数据库
 * @param {Object} playerCurrency 玩家货币数据对象
 */
CurrencyComponent.prototype.update = function(playerCurrency){
    this.player.set(code.player.Keys.CURRENCY,playerCurrency);
};

