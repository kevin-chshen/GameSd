const BaseConfig = require('../baseConfig');
const utils = require('@util');
class InvestName extends BaseConfig {
    constructor() {
        super();
        this.typeCache = {};
    }

    reload(app, name) {
        super.reload(app, name);

        this.typeCache = {};
        for (const each of this.values()) {
            const oldValue = this.typeCache[each.Type];
            this.typeCache[each.Type] = oldValue ? oldValue.concat(each.Name) : [each.Name];
        }
    }

    getRandomName(type){
        const list = this.typeCache[type];
        if(list && list.length>0){
            return list[utils.random.random(0,list.length - 1)];
        }
        return "";
    }
}

module.exports = InvestName;