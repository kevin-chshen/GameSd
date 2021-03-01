/**
 * @description 对物品的一些操作
 * @author jzy
 * @date 2020/04/29
 */

const code = require("@code");

/**
 * @param {Object|Array} itemInfoList {itemID:xxx,itemNum:xxx}或者其数组形式[{itemID:xxx,itemNum:xxx}]
 * @param {Number} num 乘以的数量
 * @param {Number} base 基值，实际物品数量乘以的倍数为 num/base
 */
module.exports.multi = function(itemInfoList, num, base = 1){
    if(Array.isArray(itemInfoList)){
        const list = [];
        for(const item of itemInfoList){
            if(Object.values(code.currency.BIG_CURRENCY_ID).indexOf(item.itemID)>=0){
                list.push({itemID:item.itemID, itemNum:(BigInt(item.itemNum)*BigInt(num)/BigInt(base)).toString()});
            }else{
                list.push({itemID:item.itemID, itemNum:Math.floor(item.itemNum*num/base)});
            }
        }
        return list;
    }else{
        const item = itemInfoList;
        if(Object.values(code.currency.BIG_CURRENCY_ID).indexOf(item.itemID)>=0){
            return {itemID:item.itemID, itemNum:(BigInt(item.itemNum)*BigInt(num)/BigInt(base)).toString()};
        }else{
            return {itemID:item.itemID, itemNum:Math.floor(item.itemNum*num/base)};
        }
    }
};
