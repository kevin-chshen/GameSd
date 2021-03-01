const BaseConfig = require('../baseConfig');
const utils = require('@util');
const code = require('@code');
class InvestName extends BaseConfig {
    constructor() {
        super();
    }

    reload(app, name) {
        super.reload(app, name);
    }

    getRandomName(sexType){
        const allValues = this.values();
        const line =  allValues[utils.random.random(0,allValues.length-1)];
        return line.FirstName + (sexType == code.player.SexType.MALE?line.SecondNameMan:line.SecondNameGril);
    }
}

module.exports = InvestName;