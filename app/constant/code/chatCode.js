/**
 * @description 聊天相关定义
 * @author linjs
 * @date 2020/04/22
 */

module.exports = {
    // 消息类型
    MSG_TYPE: {
        TXT: 1,         // 文本消息
        VOICE: 2,       // 语音消息
        SYSTEM: 3,      // 系统消息
    },
    // 频道类型
    CHANNEL: {
        NONE: 0,    // 空
        WORLD: 1,   // 世界
        GUILD: 2,   // 公会
        PRIVATE: 3, // 私聊
        BANNER: 4,  // 跑马灯
    },
    // 在线状态
    ONLINE: 1,
    OFFLINE: 2,
    // 字符串内容的最大长度
    MAX_TXT_LENGTH: 200,
    // 系统聊天者的uid为0
    SYSTEM_CHAT_UID: '0',
};
