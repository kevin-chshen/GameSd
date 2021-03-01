const util = require('util');
/**
 * %s   String字符串
 * %d   Number数字 包括整形和浮点型
 * %j   JSON.json格式
 */
module.exports.format = function (str, ...param) {
    return util.format(str, ...param);
};
