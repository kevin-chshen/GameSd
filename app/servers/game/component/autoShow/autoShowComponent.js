/**
 * @description 车展数据模块
 * @author jzy
 * @date 2020/05/18
 */

// const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const code = require('@code');
const bearcat = require('bearcat');
const assert = require('assert');

const AutoShowComponent = function(app, player){
    this.$id = 'game_AutoShowComponent';
    this.$scope = 'prototype';
    this.app = app;
    this.player = player;
};

module.exports = AutoShowComponent;
bearcat.extend('game_AutoShowComponent', 'game_Component');

AutoShowComponent.prototype.onInit = async function () {
    this.player.Event.on(code.event.ATTRIBUTE_CHANGE.name, (...params) => { this.attributeChange(...params); });
};

AutoShowComponent.prototype.isCanSetData = function(idList){
    if(idList.length>code.autoShow.MAX_UP_CARD_NUM){
        return false;
    }
    // const dataObj = this.getDataObj();
    // const dataList = Object.values(dataObj);
    // for(const id of idList){
    //     for(const data of dataList){
    //         if(data[id]){
    //             return false;
    //         }
    //     }
    // }
    for(const id of idList){
        const info = this.player.Card.getCardObj(Number(id));
        if(!info){
            return false;
        }
    }
    return true;
};
/**
 * 上架卡牌
 */
AutoShowComponent.prototype.setData = function(type, idList){
    const dataObj = this.getDataObj();
    const cardMap = {};
    for(const id of idList){
        const info = this.__getInfo(Number(id));
        assert(info, `card [${id}] info not exist`);
        cardMap[id] = info;
    }
    dataObj[type] = cardMap;
    this.update(dataObj);
    this.player.Event.emit(code.event.AUTO_SHOW_DATA_UPDATE.name);
};

/**
 * 下架卡牌
 */
AutoShowComponent.prototype.deleteData = function(type){
    const dataObj = this.getDataObj();
    delete dataObj[type];
    this.update(dataObj);
    this.player.Event.emit(code.event.AUTO_SHOW_DATA_UPDATE.name);
};


/**
 * 同步卡牌属性变化
 */
AutoShowComponent.prototype.attributeChange = function(){
    const dataObj = this.getDataObj();
    for(const type of Object.keys(dataObj)){
        const data = dataObj[type];
        for(const cardId of Object.keys(data)){
            data[cardId] = this.__getInfo(Number(cardId));
        }
    }
    this.update(dataObj);
    this.player.Event.emit(code.event.AUTO_SHOW_DATA_UPDATE.name);
};

/********************************internal function**********************************/

AutoShowComponent.prototype.__getInfo = function(cardId){
    const info = this.player.Card.getAutoShowCardInfo(cardId);
    if(info){
        return {
            level:info.level,
            star:info.star,
            attrs:info.attrs,
            power:info.power,
        };
    }
};

/**
 * 获取玩家车展数据对象
 * @return {JSON} {xxx:xxx, ...}
 */
AutoShowComponent.prototype.getDataObj = function()
{
    const playerData = this.player.get(code.player.Keys.AUTO_SHOW);
    return playerData;
};



/**
 * 更新玩家车展数据库
 * @param {Object} playerData 玩家车展数据对象
 */
AutoShowComponent.prototype.update = function(playerData){
    this.player.set(code.player.Keys.AUTO_SHOW, playerData);
};
