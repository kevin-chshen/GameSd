module.exports = {
    ABBR: "wpbz",   // 项目缩写

    // 账号验证码
    ACCOUNT_VERIFY_CODE: "mf",   
    ACCOUNT_VERIFY_CODE2: "sd",

    SESSION_ACCOUNT_MEMBER: "account",  // 通过session的账号成员判断是否通过验证
    SESSION_PLATFORM : "platform",      // 平台ID
    SESSION_AGENT : "agentId",       // 代理商ID
    SESSION_DEVICE : "deviceId",      // 设备ID

    // 蜂鸟sdk路径    
    // 'http://fnapi.4399sy.com/sdk/api/login.php?name=~s&uid=~s&ext=~s'
    FN_SDK_URL: "http://fnapi.4399sy.com/sdk/api/login.php?",
    // 兑换码check code
    CDKEY_CHECK_CODE_URL: 'http://api.4399data.com/?r=code/checkCode',
    // 兑换码update code
    CDKEY_UPDATE_CODE_URL: 'http://api.4399data.com/?r=code/updateCode',
    CDKEY_KEY:'wpbzcode#$32!$',

    // connector 服运行最大链接 
    NUM_MAX_SERVER_CONNECTOR: 3000,

    // 分配uid 时服务器ID的区段地址
    SERVER_REGION : 100000000000,
    
    INIT_FIRST_UID: 10000, // 玩家UID初始值

    // 服务器类型编码
    SERVER_TYPE_CODE: {
        'gate': 100,
        'auth': 200,
        'connector': 300,
        'log': 400,
        'game': 500,
        'battle': 600,
        'global': 700,
    },

    GAME_NAME: 'wpbz',
    // 游戏版本号，共四位字段。前三位字段根据游戏更新幅度变动：beta版第一字段应为0，正式版从1开始；第二字段用于里程碑式的重大更新；第三字段用于新内容增加或用于标识每周（定期）更新等。第四字段用于补丁修正使用。例如：游戏上线第21周其版本号为1.0.21.10
    VERSION: '0.0.0.2',         // mongo db 依据这个版本
    MYSQL_VERSION: '1.0.0',     // 0.0.0~999.999.999

    WEB_FNSDK_KEY: "wpbz@fnsdk$32!$",
    WEB_BACKEND_KEY: "wpbz@backend$32!$",

    // 大专区枚举
    AGENT_TYPE: {
        "1": 'android_cn'
    },

    GUILD_NOTICE_ILLEGAL_WARNING_MSG: "原公告内容含敏感词或涉嫌违反相关法律法规，为维护绿色上网环境，原公告已下架"
};