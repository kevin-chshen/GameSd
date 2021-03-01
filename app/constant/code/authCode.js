/**
 * Created by chshen on 2020/03/12.
 * @file 验证
 */
module.exports = {
    LOGIN_TYPE: {        
        TEST: 1,       // 测试
        FN_SDK:2       // 蜂鸟sdk
    },

    // 兑换码错误信息
    CDKEY_CODE: {
        SUCCEED: 0,                 // 查询成功
        PARAMETERS_INCOMPLETE:-1,   // 表示 传入参数不全
        SIGNATURE_ERROR: -2,        // 签名出错 
        CODE_NOT_EXIST: -3,         // 不存在该激活码
        CODE_HAS_BEEN_ACTIVATED: -4, // 激活码已经激活
        THE_SAME_PACKAGE_HAS_EXCEEDED_LIMIT:-5,  //同一个礼包，（玩家兑换次数 / 玩家领取人数）已经超过限制
        UNKNOWN_ERROR: -6,           // 未知错误
        PACKAGE_EMPTY: -7,           // 礼包信息为空
        CODE_HAS_EXPIRED:-8,         // 激活码已经过期
        SERVER_NOT_IN_CODE_SERVER_LIST: -9, // 该玩家所在服不在激活码服列表中
        PLAYER_NOT_IN_CODE_PLATFORM_LIST: -10, // 该玩家所在平台不在激活码平台列表中
        LEVEL_NOT_MEET_GIFT_LEVEL_REQUIREMENTS: -11,     // 该玩家等级不符合礼包等级要求
        CODE_NOT_BELONG_CURRENT_LOCALE:-12,     // 该激活码不属于当前地区
    },
};
