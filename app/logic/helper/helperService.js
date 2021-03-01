/**
 * @description helper服务 
 * 1.将一些共有的函数抽象到一起,
 * 2.支持热更,函数复用
 * 3.使用this.app.Helper.File.FunctionName 直接调用
 * @author linjs
 * @date 2020/04/27
 */

const bearcat = require('bearcat');
const util = require('@util');
const path = require('path');

const HelperService = function () {
    this.$id = 'logic_HelperService';
    this.app = null;
};

module.exports = HelperService;
bearcat.extend('logic_HelperService', 'logic_BaseService');

/**
 * 服务初始化
 * 1.遍历文件夹,将所有文件挂到自身
 */
HelperService.prototype.init = async function () {
    const helperPath = path.join(this.app.getBase(), 'app/logic/helper');
    const helpFiles = await util.file.walk(helperPath, util.file.extFilter('.js'), util.file.fileNameCutter('.js'));
    helpFiles.map( (fileName) => {
        if (fileName == 'helperService') {
            return;
        }
        const helper = require(path.join(helperPath, fileName));
        const helperBean = bearcat.getBeanByFunc(helper);
        // 初始化
        helperBean.init(this.app);
        // 设置getter
        const id = helperBean.getBearcatId();
        const name = helperBean.getHelperName();
        Object.defineProperty(this, name, { get: function () {
            return bearcat.getBean(id);
        }});
    });
};
