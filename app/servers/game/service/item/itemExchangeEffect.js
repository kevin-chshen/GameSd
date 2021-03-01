/**
 * @description 掉落物品兑换物品
 * @author jzy
 * @date 2020/06/19
 */

const code = require('@code');

const ItemExchangeEffect = function(){
    this.$id = 'game_ItemExchangeEffect';
};

module.exports = ItemExchangeEffect;


ItemExchangeEffect.prototype.Drop = async function(app, player, param, useTimes) {
    const idList = [];
    for(let i=0;i<useTimes;i++){
        idList.push(param);
    }
    const items = await player.Drop.dropBatch(idList);
    return {code:code.err.SUCCEEDED, award:items};
};

ItemExchangeEffect.prototype.CashProfit = async function (app, player, param, useTimes) {
    const totalTimes = param * useTimes;
    const addMoney = BigInt(totalTimes) * BigInt(player.cashPerSecond);
    const award = {itemID:code.currency.BIG_CURRENCY_ID.CASH,itemNum:String(addMoney)};
    return {code:code.err.SUCCEEDED, award:award};
};

ItemExchangeEffect.prototype.Treasure = async function (app, player, param, useTimes) {
    await app.Redis.watch(code.redis.DIAMOND_POOL.name);
    const {err, res} = await app.Redis.get(code.redis.DIAMOND_POOL.name);
    if(err){
        await app.Redis.unwatch(code.redis.DIAMOND_POOL.name);
        return {code:code.err.FAILED};
    }
    let award = [];
    if(res){
        award = {itemID:code.currency.CURRENCY_ID.DIAMOND, itemNum:Math.floor(Number(res)*param*useTimes/10000)};
        const {err} = await app.Redis.incrby(code.redis.DIAMOND_POOL.name, - Number(award.itemNum));
        if(err){
            await app.Redis.unwatch(code.redis.DIAMOND_POOL.name);
            return {code:code.err.FAILED};
        }
    }
    await app.Redis.unwatch(code.redis.DIAMOND_POOL.name);
    return {code:code.err.SUCCEEDED, award:award};
};

ItemExchangeEffect.prototype.Pay = async function (app, player, param, useTimes) {
    const payId = Number(param);
    const Amount = app.Config.Pay.get(payId).Rmb;
    const uid = player.uid;
    const params = {
        order_id: 0,
        game_id: 0,
        server_id: player.accountData.serverId,
        fnpid: player.accountData.platform,
        uid: player.accountData.account,
        pay_way: code.global.PAY_WAY_GM,
        amount: Amount,
        callback_info: [payId, uid, 'gm'].join('_'),
        order_status: "S",
        failed_desc: "",
        gold: -1,
    };
    for (let index = 0; index < useTimes; ++index) {
        const order_id = app.Id.genNext();
        params.order_id = order_id;
        app.rpcs.auth.payRemote.simulatePay({}, params);
    }
    return { code: code.err.SUCCEEDED, award: [] };
};