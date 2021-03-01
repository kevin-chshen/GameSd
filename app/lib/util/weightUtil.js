/**
 * @description 时间处理
 * @author chshen
 * @data 2020/04/07
 */
const logger = require('pomelo-logger').getLogger('pomelo', __filename);
/**
 * 权重随机
 * @param {Array} weightList [{id:权重ID，w:权重, ...args}]
 * @return {Object}
*/
module.exports.randomByWeight = function(weightList) {
    if (Array.isArray(weightList)) {
        let total = 0;
        const weightListTemp = {};
        for (const data of weightList) {
            total += data.w;
            weightListTemp[data.id] = data;
        }
        const temp = [];
        let preW = 0;
        for (let index = 0, len = weightList.length; index < len; ++index) {
            const weight = weightList[index];
            const val = weight.w / total;
            temp.push({ id: weight.id, min: preW, max: preW + val});
            preW += val;
        }

        const rand = Math.random();
        for (const data of temp) {
            if (data.min < rand && rand <= data.max) {
                return weightListTemp[data.id];
            }
        }
        logger.debug("randomByWeight failed rand:%j, weightList:%j", rand, weightList);
    }
    return null;
};