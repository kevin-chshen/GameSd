/**
 * @description 字符串相关api
 * @author linjs
 * @date 2020/03/17
 */

/**
 * 首字母转换成大写
 * @param {String} string 要转换的字符串
 * @return {String} 转换后的字符串
 */
module.exports.upperFirst = function (string) {
    return string.substring(0, 1).toUpperCase() + string.substring(1);
};

/**
 * 首字母转换成小写
 * @param {String} string 要转换的字符串
 * @return {String} 转换后的字符串
 */
module.exports.lowerFirst = function (string) {
    return string.substring(0, 1).toLowerCase() + string.substring(1);
};

/**
 * 判断一个变量是否是字符串
 * @param {String} value 待判断的变量
 */
module.exports.isString = function (value) {
    return typeof value === 'string';
};
