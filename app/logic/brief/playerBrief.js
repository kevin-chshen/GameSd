/**
 * @description 角色缩略信息
 * @author linjs
 * @date 2020/03/27
 */

const code = require('@code');

/**
 * 生成角色缩略信息的访问结构体
 * @param {Object} infoMap 缩略信息数组
 */
const PlayerBrief = function (infoMap) {
    this.$id = 'logic_PlayerBrief';
    this.$scope = 'prototype';
    this.infoMap = infoMap;

    // 将角色缩略属性映射成lazy getter函数
    for (const {name, jsonKey} of code.brief.getAllBriefKeyProp()) {
        Object.defineProperty(this, name, {
            configurable: true,
            get: function() {
                let value = null;
                if (jsonKey) {
                    value = JSON.parse(this.infoMap[name]);
                } else {
                    value = this.infoMap[name];
                }
                Object.defineProperty(this, name, { get: function() {
                    return value;
                }});
                return value;
            },
        });
    }
};

module.exports = PlayerBrief;

