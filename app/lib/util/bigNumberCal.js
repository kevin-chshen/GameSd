const bigNumberCal = {
    /**
     * 对比2个数字 1231113113213.12  大数值小数点会被去掉
     * @param {*} _coin1 
     * @param {*} _coin2 
     * @returns {Boolean} _coin1 >= _coin2 ? 
     */
    compare: function (_coin1, _coin2){
        return BigInt(_coin1) >= BigInt(_coin2);
    },

    add: function (_coin1, _coin2){
        return (BigInt(_coin1) + BigInt(_coin2)).toString();
    },

    reduce: function (_coin1, _coin2){
        return (BigInt(_coin1) - BigInt(_coin2)).toString();
    },

    multi: function (_coin1, _coin2){
        return (BigInt(_coin1) * BigInt(_coin2)).toString();
    },
    // unitCoin: ['万', '亿', '兆', '京', '垓', '秭', '穰', '沟', '涧', '正', '载', '极'],

    // //检查是否有单位
    // checkHasUnit: function (_coin) {
    //     if (typeof _coin === 'number') {
    //         console.log("----传过来的值是number类型，不是string,请检查---", _coin);
    //         _coin = _coin + '';
    //     }
    //     const lastChat = _coin.charAt(_coin.length - 1);
    //     for (let i = 0; i < this.unitCoin.length; i++) {
    //         if (this.unitCoin[i] == lastChat) {
    //             return {
    //                 index: (i + 1),
    //                 unit: this.unitCoin[i]
    //             };
    //         }
    //     }
    //     return null;
    // },

    // /**
    //  * 对比2个数字 1231113113213.12  大数值小数点会被去掉
    //  * @param {*} _coin1 
    //  * @param {*} _coin2 
    //  * @returns {string} _coin1 >= _coin2 ? 
    //  */
    // compare: function (_coin1, _coin2) {
    //     const coin1 = this.openSpecial(_coin1);
    //     const coin2 = this.openSpecial(_coin2);
    //     if (parseFloat(coin1) < 1000000 && parseFloat(coin2) < 1000000) {
    //         return (parseFloat(coin1) >= parseFloat(coin2));
    //     }
    //     if (coin1.length > coin2.length) {
    //         return true;
    //     } else if (coin1.length < coin2.length) {
    //         return false;
    //     } else {
    //         for (let i = 0, len = coin1.length; i < len; i++) {
    //             if (parseInt(coin1[i]) > parseInt(coin2[i])) {
    //                 return true;
    //             } else if (parseInt(coin1[i]) < parseInt(coin2[i])) {
    //                 return false;
    //             }
    //         }
    //         //全部相等
    //         return true;
    //     }
    // },

    // /**
    //  * 展开特殊符号 11.01K
    //  * @param {string} _coin
    //  * @param {string} _isToFixed
    //  * @returns {string} "11010"
    //  */
    // openSpecial: function (_coin, isToFixed) {
    //     if (isToFixed == undefined) isToFixed = true;
    //     if (typeof _coin === 'number') {
    //         _coin = _coin + '';
    //     }
    //     const unitData = this.checkHasUnit(_coin);
    //     const pointIndex = _coin.indexOf('.');
    //     if (unitData) {
    //         //去掉单位
    //         const coinNum = _coin.substr(0, _coin.length - 1);
    //         //如果有小数点，先把小数点乘掉
    //         if (pointIndex != -1) {
    //             _coin = (parseFloat(coinNum) * 1000).toFixed();
    //             unitData.index--;
    //             _coin += "0";
    //         } else {
    //             _coin = coinNum;
    //         }
    //         //往后面添加0, 一个单位4个0
    //         for (let i = 0; i < unitData.index; i++) {
    //             _coin += "0000";
    //         }
    //     } else if (pointIndex != -1 && isToFixed) {
    //         _coin = _coin.substr(0, pointIndex);
    //     }
    //     return _coin;
    // },

    // /**
    //  * 将数字字符转回特殊字符表示  
    //  * @param {string} _coin  123456.12
    //  * @returns {string} "123.45K" 
    //  */
    // closeNumToSpecial: function (_coin, _isShowNext) {
    //     if (_isShowNext == undefined) _isShowNext = false;
    //     if (typeof _coin === 'number') {
    //         _coin = _coin + '';
    //     }
    //     //e+显示转换
    //     if(_coin.indexOf("e+") != -1){
    //         // console.log("before:" + _coin);
    //         const _coinArr = _coin.split("e+");
    //         let _r = parseInt(_coinArr[1]) - _coinArr[0].length + 1;
    //         if(_coinArr[0].indexOf(".") != -1){
    //             _r++;
    //         }
    //         let _b = _coinArr[0].replace(".", "");
    //         while(_r > 0){
    //             _r--;
    //             _b += "0";
    //         }
    //         _coin = _b;
    //         // console.log("after:" + _coin);
    //     }
    //     const unitData = this.checkHasUnit(_coin);
    //     if (unitData) return _coin;
    //     const pointIndex = _coin.indexOf('.');
    //     let coinNum = _coin;
    //     if (pointIndex != -1) {
    //         coinNum = _coin.substr(0, pointIndex);
    //     }
    //     let unit = '';
    //     const cLen = coinNum.length;
    //     if (cLen <= 6) {
    //         //整数位<6,直接返回值
    //         return parseFloat(_coin).toFixed();
    //     } else {
    //         let count = Math.floor(cLen / 4);
    //         if ((count == (cLen / 4)) || _isShowNext) {
    //             count -= 1;
    //         }
    //         unit = this.unitCoin[count - 1];
    //         const front = coinNum.substr(0, cLen - (count * 4));

    //         if(count >= 2) {
    //             if (front.length < 3) {
    //                 // afterUnit = this.unitCoin[count - 2];
    //                 const after = coinNum.substr(front.length, 4);
    //                 return front + "." + after + unit;
    //             } else {
    //                 return front + unit;
    //             }
    //         }else{
    //             return front + unit;
    //         }
    //     }
    // },

    // //去掉前面的0
    // delFrontZero: function (_coin) {
    //     return _coin.replace(/\b(0+)/gi, "");
    // },

    // /**
    //  * 相加
    //  * @param {string} _coin1 
    //  * @param {string} _coin2 
    //  * @returns {string} 没有带符号的字符串1232431313134 
    //  */
    // add: function (_coin1, _coin2) {
    //     let numberCount = 0;
    //     if (typeof (_coin1) == 'number') {
    //         _coin1 = _coin1 + '';
    //         numberCount++;
    //     }
    //     if (typeof (_coin2) == 'number') {
    //         _coin2 = _coin2 + '';
    //         numberCount++;
    //     }
    //     if (numberCount == 2) {
    //         return (parseFloat(_coin1) + parseFloat(_coin2)) + "";
    //     }
    //     let coin1 = this.openSpecial(_coin1);
    //     let coin2 = this.openSpecial(_coin2);
    //     if (parseFloat(coin1) < 1000000 && parseFloat(coin2) < 1000000) {
    //         return (parseFloat(coin1) + parseFloat(coin2)).toFixed();
    //     }
    //     let total = '';
    //     let carry = 0;
    //     let temp = "";
    //     if (coin1.length < coin2.length) {
    //         temp = coin1;
    //         coin1 = coin2;
    //         coin2 = temp;
    //     }
    //     for (let i = 0, len = coin1.length - coin2.length; i < len; i++) {
    //         coin2 = "0" + coin2;
    //     }
    //     for (let i = coin1.length - 1; i >= 0; i--) {
    //         let sum = parseInt(coin1[i]) + parseInt(coin2[i]) + carry;
    //         carry = Math.floor(sum / 10);
    //         sum = String(sum);
    //         let bit = parseInt(sum) >= 10 ? sum.substr(1, 1) : sum;
    //         if (i == 0) {
    //             bit = sum;
    //         }
    //         total = bit + total;
    //     }
    //     if (total.indexOf("NaN") != -1) {
    //         logger.error("-----add计算出错---coin1=" + _coin1 + "  coin2 =" + _coin2);
    //         return;
    //     }
    //     return this.delFrontZero(total);
    // },

    // /**
    //  * 减法
    //  * @param {string} _coin1 
    //  * @param {string} _coin2
    //  * @returns {string} 没有带符号的字符串1232431313134 
    //  */
    // reduce: function (_coin1, _coin2) {
    //     let numberCount = 0;
    //     if (typeof (_coin1) == 'number') {
    //         _coin1 = _coin1 + '';
    //         numberCount++;
    //     }
    //     if (typeof (_coin2) == 'number') {
    //         _coin2 = _coin2 + '';
    //         numberCount++;
    //     }
    //     if (numberCount == 2) {
    //         return (parseFloat(_coin1) - parseFloat(_coin2)) + "";
    //     }
    //     let coin1 = this.openSpecial(_coin1);
    //     let coin2 = this.openSpecial(_coin2);
    //     if (parseFloat(coin1) < 1000000 && parseFloat(coin2) < 1000000) {
    //         return (parseFloat(coin1) - parseFloat(coin2)).toFixed();
    //     }
    //     //判断符号
    //     const symbol = coin1.length >= coin2.length ? "" : "-";
    //     let total = '';
    //     let carry = 0;
    //     let temp = "";
    //     if (coin1.length < coin2.length) {
    //         temp = coin1;
    //         coin1 = coin2;
    //         coin2 = temp;
    //     }
    //     for (let i = 0, len = coin1.length - coin2.length; i < len; i++) {
    //         coin2 = "0" + coin2;
    //     }
    //     for (let i = coin1.length - 1; i >= 0; i--) {
    //         let red = parseInt(coin1[i]) - parseInt(coin2[i]) - carry;
    //         if (red < 0) {
    //             red = red + 10;
    //             carry = 1;
    //         } else {
    //             carry = 0;
    //         }
    //         total = red + total;
    //     }
    //     if (total.indexOf("NaN") != -1) {
    //         logger.error("-----reduce计算出错啦---coin1=" + _coin1 + "  coin2 =" + _coin2);
    //         return;
    //     }
    //     if (symbol == "-") {
    //         logger.warn("----请注意减法结果为负数---coin1=" + _coin1 + "  coin2 =" + _coin2);
    //     }
    //     return symbol + this.delFrontZero(total);
    // },

    // /**
    //  * 乘法
    //  * @param {string} _coin1  大数
    //  * @param {string} _coin2  小数
    //  * @returns {string} 没有带符号的字符串1232431313134
    //  */
    // multi: function (_coin1, _coin2) {
    //     let numberCount = 0;
    //     if (typeof (_coin1) == 'number') {
    //         _coin1 = _coin1 + '';
    //         numberCount++;
    //     }
    //     if (typeof (_coin2) == 'number') {
    //         _coin2 = _coin2 + '';
    //         numberCount++;
    //     }
    //     if (numberCount == 2) {
    //         return (parseFloat(_coin1) * parseFloat(_coin2)) + "";
    //     }
    //     let coin1 = this.openSpecial(_coin1);
    //     let coin2 = this.openSpecial(_coin2, false);
    //     if (parseFloat(coin1) < 1000000 && parseFloat(coin2) < 1000000) {
    //         return (parseFloat(coin1) * parseFloat(coin2)).toFixed();
    //     }
    //     //乘数是小数
    //     const pointIndex = _coin2.indexOf('.');
    //     if (pointIndex != -1) {
    //         const front = _coin2.substr(0, pointIndex);
    //         const after = _coin2.substring(pointIndex + 1, _coin2.length);
    //         const frontTotal = this.multi(_coin1, front);
    //         let afterTotal = this.multi(_coin1, after);
    //         const afterFront = afterTotal.substr(0, afterTotal.length - after.length);
    //         const afterAfter = afterTotal.substring(afterTotal.length - after.length, afterTotal.length);
    //         afterTotal = afterFront + "." + afterAfter;
    //         return this.add(frontTotal, afterTotal);
    //     }
    //     let total = '';
    //     let carry = 0;
    //     let temp = '';
    //     if (coin1.length > coin2.length) {
    //         temp = coin1;
    //         coin1 = coin2;
    //         coin2 = temp;
    //     }
    //     for (let i = coin1.length - 1; i >= 0; i--) {
    //         temp = '';
    //         for (let j = coin2.length - 1; j >= 0; j--) {
    //             let single = (parseInt(coin1[i]) * parseInt(coin2[j])) + carry;
    //             carry = Math.floor(single / 10);
    //             single = single + '';
    //             let bit = parseInt(single) >= 10 ? single.substr(1, 1) : single;
    //             if (j == 0) {
    //                 bit = single;
    //             }
    //             temp = bit + temp;
    //         }
    //         //尾巴补个位0
    //         for (let m = coin1.length - 1; m > i; m--) {
    //             temp += '0';
    //         }
    //         //每个乘数结果相加
    //         if (total == '') {
    //             total = temp;
    //         } else {
    //             total = this.add(total, temp);
    //         }
    //     }
    //     if (total.indexOf("NaN") != -1) {
    //         logger.error("-----multi计算出错啦---coin1=" + _coin1 + "  coin2 =" + _coin2);
    //         return;
    //     }
    //     return this.delFrontZero(total);
    // },
};
module.exports = bigNumberCal;

// console.log(bigNumberCal.add("999999999999999999999999","999999999999999999999999"));
// console.log(bigNumberCal.closeNumToSpecial("10000000000"));
// console.log(bigNumberCal.openSpecial("10.01万"));