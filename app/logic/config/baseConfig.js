/**
 * @description 策划配置的基类
 * @author linjs
 * @date 2020/03/30
 */

const path = require('path');

class BaseConfig {
    constructor() {
        this.app = null;
        this.name = null;
        this.jsonPath = null;
        this.isLoaded = false;
        this.data = null;
    }

    reload(app, name) {
        if (!this.isLoaded) {
            this.app = app;
            this.name = name;
            this.jsonPath = path.join(app.getBase(), 'config/data', this.name + '.json');
            this.data = require(this.jsonPath);
            this.isLoaded = true;
        }
    }

    get(id) {
        return this.data[id];
    }

    keys() {
        return Object.keys(this.data);
    }

    values() {
        return Object.values(this.data);
    }

    entries() {
        return Object.entries(this.data);
    }

    keyMax() {
        return Math.max(...this.keys());
    }
}

module.exports = BaseConfig;