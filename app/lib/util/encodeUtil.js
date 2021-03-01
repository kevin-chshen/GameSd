
/**
 * @description encode函数
 * @author chshen
 * @date 2020/06/17
 */

/**
 * rfc3986标准 encode
 * @param {String} string
 * @return {String} 
 */
module.exports.encodeRfc3986 = function (string) {
    return encodeURIComponent(string).replace(/[!'()*]/g, x => `%${x.charCodeAt(0).toString(16).toUpperCase()}`);
};