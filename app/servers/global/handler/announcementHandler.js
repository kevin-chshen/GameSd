/**
 * @description 公告消息
 * @author chshen
 * @date 2020/06/18
 */
module.exports = function (app) {
    return new Handler(app);
};

const Handler = function (app) {
    this.app = app;
};

// 获取公告
Handler.prototype.getPostInfo = function (_msg, _session, next) {
    // 默认公告
    const allData = this.app.Announcement.getAllData();
    const infos = allData.reduce((res, data) =>{
        const o = data.get('data');
        return res.concat([{
            title: o.title,
            content: o.content,
            isHot: 0            // 不知道怎么识别是否重要 
        }]);
    }, []);
    const title = this.app.Config.TextCaptions.get(3);
    const content = this.app.Config.TextCaptions.get(4);
    infos.push({
        title: title.Text,
        content: content.Text.replace(/\\n\\u3000\\u3000/g, "\n\u3000\u3000"),
        isHot: 0 
    });
    next(null, { postInfoList: infos  });
};
