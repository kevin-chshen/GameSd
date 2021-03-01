/**
 * @description 创建角色表管理器
 * @author chshen
 * @date 2020/03/23
 **/
const BaseConfig = require('../baseConfig');

class CreateRole extends BaseConfig {
    constructor(){
        super();
    }

    reload(app, name) {
        super.reload(app, name);
    }

    /**
     * 获取角色头像
     * @param roleId 角色ID
    */
    getHead(roleId) {
        const role = this.get(roleId);
        return role ? role.Head : "undefined";
    }
}

module.exports = CreateRole;