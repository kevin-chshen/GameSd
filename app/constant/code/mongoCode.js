/**
 * Created by chshen 2020/03/13
 *
 * @file mongo数据库相关的常量值
 */

module.exports = {
    OP_INSERT: 1,
    OP_UPDATE: 2,
    OP_DELETE: 3,
    OP_UPDATE_WITH_ACTION: 4,      // 带动作更新,dbValue形如{$set: Object, $push: Object}

    COMMON: {
        LOGIN_LIMIT: "loginLimit"  // common表-connector限制登陆人数
    }
};
