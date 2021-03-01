/**
 * @description 系统开放码
 * @author chshen
 * @date 2020/03/31
 */
module.exports = {
    /**
     *  例子1：{“ret”:“101”, “msg”:“role_name错误”} ,role_name是被发现错误的参数key
        例子2：{“ret”:“202”, “msg”:“验证失败”}
        例子3：{“ret”:“301”, “msg”:“部分数据操作失败”,“desc”:{“role_name”:“用户名”},“data”:[{“role_name”:“观音人人爱”},{“role_name”：“天天好心情”}]} (msg可自定义)
        例子4：{“ret”:“0”, “msg”:“成功”}
        例子5：{“ret”:“0”,“msg”:“成功”,“desc”:{字段描述},“data”:[{数据1},{数据2}],“totalNum”:3244}
    */
    // 后台日志
    BACKEND: {
        // 100~199(表示参数错误，游戏方自定义)	返回具体错误参数，例子1
        DEFINE: {
            PAY_PARAMS_ERR: 101,            // 充值参数错误
            PAY_ORDER_STATUS_ERR: 102,      // 充值定单状态错误
        },
        // 200~299(表示flag标志错误，游戏方自定义)	验证失败，例子2
        CHECK: {
            CHECK_FAILED: 202,    // 重置参数错误
        },
        // 300~399(表示数据失败，游戏方自定义)	用于返回失败的用户列表，例子3，此类型必须返回有数据的desc和data

        // 0(表示成功)	成功，例子4，5
        SUCCEED: 0,
    },

    // 蜂鸟sdk
    FN_SDK :{
        PAY : {
            RET_OK: 1,               // 成功
            RET_DUPLICATE: 2,        // 重复订单
            RET_PARAM_ERROR : -1,    // 参数不全
            RET_MD5_FAIL : -2,       // 验证失败
            RET_USER_NOT_EXISTS : -3,// 用户不存在
            RET_TIMEOUT : -4,        // 超时
            RET_FAILED : -5          // 失败
        }
    }
};
