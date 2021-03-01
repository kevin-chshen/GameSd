/**
 * @description 数组操作函数
 * @author chshen
 * @date 2020/04/10
 */

/**
 * 删除数组中指定元素
*/
module.exports.remove = function(List, val) {
    const index = List.indexOf(val);
    if (index > -1){
        List.splice(index, 1);
    }
};
