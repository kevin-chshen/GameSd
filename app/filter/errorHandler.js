/**
 * @description 过滤器 ErrorHandler
 * @author chenyq
 * @date 2020/07/09
 */

module.exports = function (err, msg, resp, session, opts, cb) {
    if (err == "lock") {
        cb(err, { code: 600, uid: session.uid }, opts);
    }
    else {
        cb(err, resp, opts);
    }
};
