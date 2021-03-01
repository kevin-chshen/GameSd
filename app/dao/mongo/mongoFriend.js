/**
 * @description 好友列表
 * @author jzy
 * @date 2020/04/15
 */

const MongoDataBase = require('../../logic/mongo/mongoDataBase');

class MongoFriend extends MongoDataBase {
    constructor(data) {
        super(data);
    }
}

module.exports = MongoFriend;

MongoFriend.prototype._collectionName = 'friend';
MongoFriend.prototype._columns = {
    uid: { type: "number", default: 0 },
    friendList: { type: "object", default: [] },
    receiveAskList: { type: "object", default: [] },
    blackList: { type: "object", default: [] },
};
MongoFriend.prototype._index = 'uid';