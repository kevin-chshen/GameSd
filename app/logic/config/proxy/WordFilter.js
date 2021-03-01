/**
 * @description 屏蔽字表管理器
 * @author chenyq
 * @date 2020/04/27
 **/
const BaseConfig = require('../baseConfig');

class WordFilter extends BaseConfig {
    constructor() {
        super();
    }

    reload(app, name) {
        super.reload(app, name);
        this.wordFilterList = [];
        for (const info of this.values()) {
            this.wordFilterList.push(info.Name);
        }
    }

    query(str) {
        return this.wordFilterList.some(function (word) {
            return str.includes(word);
        });
    }
}
module.exports = WordFilter;