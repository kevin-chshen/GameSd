/**
 * @description Helper的基础类
 * @author linjs
 * @date 2020/04/27
 */

const BaseHelper = function () {
    this.$id = 'logic_BaseHelper';
    this.name = 'Base';
    this.app = null;
};

module.exports = BaseHelper;

/**
 * 初始化
 */
BaseHelper.prototype.init = function (app) {
    this.app = app;
};

/**
 * 返回bearcat的id
 */
BaseHelper.prototype.getBearcatId = function () {
    return this.$id;
};

/**
 * 返回要注册到helper上的名字
 * 注册之后就可以通过this.app.
 */
BaseHelper.prototype.getHelperName = function () {
    return this.name;
};

/**
 * 测试函数
 */
BaseHelper.prototype.test = function () {
    console.log(`Helper[${this.name}] with id [${this.$id}] say hello to you`);
};
