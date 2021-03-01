/**
 * @description 颜色相关
 * @author chenyq
 * @date 2020/07/22
 */

const code = require('@code');

/**
 * 主播名称附加颜色码
 * @param {String} name 名称
 * @param {Number} quality 品质
 */
module.exports.getNameColor = function (name, quality) {
    const color = code.card.QUALITY_COLOR[quality];
    if (color) {
        return '<Color=' + color + '>' + name + '</Color>';
    }
    else {
        return name;
    }
};
