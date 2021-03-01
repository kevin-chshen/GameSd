
const code = require('@code');
/**
 * 封装奖励字段 转换成 协议使用的奖励字段
 * @param {Mixed} itemList Array或Object [{itemID:xxx,itemNum:xxx} ...]
 * @returns {Array} award[]
 */
module.exports.encodeAward = function(itemList, isCombine = true){
    const result = [];
    // 大数直接转成字符串防止直接相加减误操作
    const bigCurrencyIDs = Object.values(code.currency.BIG_CURRENCY_ID);
    if(!Array.isArray(itemList)){
        itemList = [itemList];
    }
    if(isCombine){
        const temp = {};
        for(const item of itemList){
            const itemID = item.itemID;
            let itemNum = item.itemNum;
            if(bigCurrencyIDs.indexOf(itemID)>=0){
                itemNum = BigInt(itemNum);
                temp[itemID] = (temp[itemID] || BigInt(0)) + itemNum;
            }else{
                temp[itemID] = (temp[itemID] || 0) + itemNum;
            }
        }
        for(const itemID in temp){
            result.push({itemID:Number(itemID), itemNum:temp[itemID].toString()});
        }
        return result;
    }else{
        for(const item of itemList){
            result.push({itemID:Number(item.itemID), itemNum:item.itemNum.toString()});
        }
        return result;
    }
};


/**
 * 把配置表的奖励配置格式 转换成 可直接使用的物品格式
 * @param {Mixed} itemList Array或Object [{123:1},{321:2}...] 或者 {123:1,231:2}
 * @returns {Array} [{itemID:xxx,itemNum:xxx} ...]
 */
module.exports.encodeConfigAward = function(itemList){
    const result = [];
    // 大数直接转成字符串防止直接相加减误操作
    const bigCurrencyIDs = Object.values(code.currency.BIG_CURRENCY_ID);
    if(!Array.isArray(itemList)){
        itemList = [itemList];
    }
    for(const item of itemList){
        for(let itemID in item){
            itemID = parseInt(itemID);
            let itemNum = item[itemID];
            if(bigCurrencyIDs.indexOf(itemID)>=0){
                itemNum = itemNum.toString();
            }
            result.push({itemID:itemID,itemNum:itemNum});
        }
    }
    return result;
};


/**
 * 把配置表的奖励配置格式 转换成 可直接使用的物品格式
 * @param {Array} itemList  [物品ID,数量]
 * @returns {Array} [{itemID:xxx,itemNum:xxx} ...]
 */
module.exports.encodeAwardByArray = function (itemList) {
    const result = [];
    if (Array.isArray(itemList)) {
        for (let index = 0, len =itemList.length; index < len; index +=2) {
            result.push({ itemID: itemList[index], itemNum: itemList[index+1] });
        }
    } 
    return result;
};