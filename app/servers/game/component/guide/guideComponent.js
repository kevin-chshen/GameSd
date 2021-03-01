/**
 * @description 新手引导
 * @author jzy
 * @date 2020/06/23
 */

const bearcat = require('bearcat');
const code = require('@code');

const GuideComponent = function(app, player){
    this.$id = 'game_GuideComponent';
    this.$scope = 'prototype';
    this.app = app;
    this.player = player;
};

module.exports = GuideComponent;
bearcat.extend('game_GuideComponent', 'game_Component');

/**
 * 获取已做过新手引导的记录
 */
GuideComponent.prototype.getGuideInfo = function(){
    const dataObj = this.getData();
    const result = [];
    for(const key of Object.keys(dataObj)){
        result.push({
            k: Number(key),
            v: Number(dataObj[key])
        });
    }
    return {guideInfo: result};
};

/**
 * 记录值
 * @param {Number} key 
 * @param {Number} value 
 */
GuideComponent.prototype.setGuide = function(key, value){
    const dataObj = this.getData();
    dataObj[key] = value;
    this.update(dataObj);
    return {code:code.err.SUCCEEDED, updateKv:{
        k: Number(key),
        v: Number(dataObj[key])
    }};
};

/**
 * 获取玩家数据对象
 * @return {JSON} {xxx:xxx, ...}
 */
GuideComponent.prototype.getData = function()
{
    const playerData = this.player.get(code.player.Keys.GUIDE) || {};
    return playerData;
};



/**
 * 更新玩家主线数据库
 * @param {Object} playerData 玩家数据对象
 */
GuideComponent.prototype.update = function(playerData){
    this.player.set(code.player.Keys.GUIDE, playerData);
};
