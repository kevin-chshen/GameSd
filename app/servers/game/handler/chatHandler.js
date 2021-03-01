/**
 * @description 聊天消息处理
 * @author linjs
 * @date 2020/04/21
 */

const code = require('@code');

module.exports = function (app) {
    return new Handler(app);
};

const Handler = function (app) {
    this.app = app;
};

/**
 * 玩家投递的聊天
 */
Handler.prototype.chat = async function (msg, session, next) {
    const player = session.player;
    // 信息长度校验
    if (msg.msgType == code.chat.MSG_TYPE.TXT && msg.text.length > code.chat.MAX_TXT_LENGTH) {
        next(null, { code: code.err.ERR_CHAT_TOO_LONG} );
        return;
    }

    // 如果是系统聊天类型,则不用检查,直接发送
    if (msg.msgType == code.chat.MSG_TYPE.SYSTEM) {
        await this.app.Chat.simulateChat(msg);
        next(null, { code: code.err.SUCCEEDED});
        return;
    }

    // 是否被禁言了
    if (player.Ban.isBanChat()) {
        next(null, { code: code.err.ERR_CHAT_BAN });
        return;
    }
    // 洗白只发送给自己
    if (msg.isSelf == 1) {
        const realMsg = this.app.Chat.makeChatMsg(player, msg);
        player.Notify.notify('chatSelfNotify', { msg: realMsg });
        next(null, { code: code.err.SUCCEEDED });
        return;
    }

    // TODO:敏感词汇过滤

    // 分类型检查
    switch (msg.channelId) {
    case code.chat.CHANNEL.WORLD:
        break;
    case code.chat.CHANNEL.GUILD:
        {
            if (msg.targetUid <= 0 || msg.targetUid != player.guildId) {
                next(null, { code: code.err.ERR_CHAT_NO_GUILD });
                return;
            }
        }
        break;
    case code.chat.CHANNEL.PRIVATE:
        {
            // 没有目标
            if (!msg.targetUid) {
                next(null, { code: code.err.ERR_CHAT_NO_TARGET });
                return;
            }
            // 我是否在对方的黑名单中
            const {err, res} = await this.app.rpcs.global.friendRemote.isBlock({}, msg.targetUid, player.uid);
            if (err || res) {
                next(null, { code: code.err.ERR_CHAT_BEING_BLOCK });
                return;
            }
        }
        break;
    default:
        break;
    }

    // 发送到目标
    if (await this.app.Chat.chat(player, msg)) {
        next(null, { code: code.err.SUCCEEDED });
        return;
    }
    next(null, { code: code.err.FAILED });
};

/**
 * 查询玩家的离线聊天内容(玩家登录时)
 */
Handler.prototype.queryOfflineChat = async function (msg, session, next) {
    const list = await this.app.Chat.queryOfflineChat(session.player);
    next(null, { code: code.err.SUCCEEDED, msgList: list });
};

/**
 * 查询玩家的在线/离线状态
 */
Handler.prototype.queryOnline = async function (msg, session, next) {
    const list = await this.app.Chat.queryOnline(msg.uid);
    next(null, { code: code.err.SUCCEEDED, list});
};
