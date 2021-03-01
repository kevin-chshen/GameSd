/**
 * @description 掉落相关组件
 * @author linjs
 * @date 2020/04/28
 */

const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const bearcat = require('bearcat');
const code = require('@code');

const DropComponent = function (app, player) {
    this.$id = 'game_DropComponent';
    this.$scope = 'prototype';
    this.app = app;
    this.player = player;
    this.lockGlobalDrop = null;     // 正在尝试全局掉落
};

module.exports = DropComponent;
bearcat.extend('game_DropComponent', 'game_Component');

DropComponent.prototype.onLoad = async function () {
    // 检查需要重置的下标id
    const timerIdVec = this.app.Config.DropSign.getTimerId(code.drop.SIGN_TYPE.PERSON);
    timerIdVec.map( (id) => {
        this.player.Timer.register(id, ({timerId: timerId}) => { this.onTimer(timerId); });
    });
};

/**
 * 根据id掉落
 * @param {Integer} id 掉落id
 * @param {Boolean} trace 是否追踪掉落过程
 * @returns {Array} 掉落的物品列表 如果有追踪掉落过程,则还有traceInfo
 */
DropComponent.prototype.drop = async function (id, trace = false) {
    if (this.lockGlobalDrop) {
        await this.lockGlobalDrop;
    }

    // 获取配置
    const config = this.app.Config.DropOne.get(id);
    if (config == null) {
        return trace ? { item: [], traceInfo: [] } : [];
    }

    // 掉落信息抽取
    const dropInfo = this._makeDropInfo(config, trace);
    // 如果涉及到全局掉落
    if (config.WhetherFullDrop) {
        // 全局相关的掉落,由global服处理
        this.lockGlobalDrop = this.app.rpcs.global.dropRemote.drop({}, dropInfo);
        const {err, res} = await this.lockGlobalDrop;
        this.lockGlobalDrop = null;
        if (err) {
            logger.error(`player drop [${id}] with error: ${JSON.stringify(err)}`);
            return trace ? { item: [], traceInfo: [] } : [];
        }
        return await this._affectDrop(config, res, trace);
    } else {
        // 个人相关的掉落
        const result = this.app.Helper.Drop.drop(dropInfo);
        return await this._affectDrop(config, result, trace);
    }
};

/**
 * 批量抽取
 */
DropComponent.prototype.dropBatchOld = async function (idList, trace = false) {
    if (this.lockGlobalDrop) {
        await this.lockGlobalDrop;
    }
    let resultList = [];
    const remoteDropInfoList = [];
    const remoteConfigList = [];
    for(const id of idList){
        // 获取配置
        const config = this.app.Config.DropOne.get(id);
        if (config == null) {
            if(trace){
                resultList.push({ item: [], traceInfo: [] });
            }else{
                resultList = resultList.concat([]);
            }
            continue;
        }

        // 掉落信息抽取
        const dropInfo = this._makeDropInfo(config, trace);
        // 如果涉及到全局掉落
        if (config.WhetherFullDrop) {
            // 全局相关的掉落,由global服处理
            remoteDropInfoList.push(dropInfo);
            remoteConfigList.push(config);
        } else {
        // 个人相关的掉落
            const result = this.app.Helper.Drop.drop(dropInfo);
            const info = await this._affectDrop(config, result, trace);
            if(trace){
                resultList.push(info);
            }else{
                resultList = resultList.concat(info);
            }
        }
    }

    if(remoteDropInfoList.length>0){
        this.lockGlobalDrop = this.app.rpcs.global.dropRemote.dropBatch({}, remoteDropInfoList);
        const {err, res} = await this.lockGlobalDrop;
        this.lockGlobalDrop = null;
        if (err) {
            logger.error(`player drop [${idList}] with error: ${JSON.stringify(err)}`);
            if(trace){
                resultList.push({ item: [], traceInfo: [] });
            }else{
                resultList = resultList.concat([]);
            }
            return resultList;
        }

        for(const i in res){
            const info = await this._affectDrop(remoteConfigList[i], res[i], trace);
            if(trace){
                resultList.push(info);
            }else{
                resultList = resultList.concat(info);
            }
        }
    }
    
    return resultList;
};
DropComponent.prototype.dropBatch = async function (idList, trace = false) {
    let allItem = [];
    let traceInfoVec = [];
    for (const index in idList) {
        const id = idList[index];
        if (trace) {
            const {item, traceInfo} = await this.drop(id, trace);
            allItem = allItem.concat(item);
            traceInfoVec = traceInfoVec.concat({outerTimes: index+1, traceInfo: traceInfo});
        } else {
            allItem = allItem.concat(await this.drop(id, trace));
        }
    }
    if (trace) {
        return {item: allItem, traceInfo: traceInfoVec};
    }
    return allItem;
};

/**
 * 多次掉落
 * @param {Integer} id 掉落id
 * @param {Integer} times 要掉落的次数
 * @param {Boolean} trace 是否显示掉落信息
 */
DropComponent.prototype.dropTimes = async function (id, times, trace = false) {
    let allItem = [];
    let traceInfoVec = [];
    for (let index = 0; index < times; index++) {
        if (trace) {
            const {item, traceInfo} = await this.drop(id, trace);
            allItem = allItem.concat(item);
            traceInfoVec = traceInfoVec.concat({outerTimes: index+1, traceInfo: traceInfo});
        } else {
            allItem = allItem.concat(await this.drop(id, trace));
        }
    }
    if (trace) {
        return {item: allItem, traceInfo: traceInfoVec};
    }
    return allItem;
};

DropComponent.prototype._makeDropInfo = function (dropConfig, trace) {
    const dropOne = this.app.Config.DropOne;
    let signValue = {};
    if (dropConfig.WhetherFullDrop) {
        const personSign = dropOne.getRelatedPersonSign(dropConfig.Id) || [];
        signValue = this.player.Counter.DropSign.getCounterGroup(personSign);
    } else {
        const allSign = dropOne.getRelatedSign(dropConfig.Id) || [];
        signValue = this.player.Counter.DropSign.getCounterGroup(allSign);
    }
    const times = dropOne.isNeedRecordTimes(dropConfig.Id) ? this.player.Counter.DropTimes.get(dropConfig.Id).get() : 0;
    // 目前玩家掉落只受到这5种因素影响
    return {
        id: dropConfig.Id,
        times: times,
        sex: this.player.sex,
        sign: signValue,
        payLv: 0,
        trace: trace,   // 显示掉落用
    };
};

DropComponent.prototype._affectDrop = async function (dropOneConfig, {times, bModify, item, newSign, traceInfo}, trace) {
    // 如果标记有修改
    if (bModify) {
        this.player.Counter.DropSign.setCounterGroup(newSign);
    }
    // 设置次数
    if (this.app.Config.DropOne.isNeedRecordTimes(dropOneConfig.Id)) {
        this.player.Counter.DropTimes.set(dropOneConfig.Id, times);
    }

    const res = await this.app.Item.exchangeDropItem(this.player, item);
    if(res.code!=code.err.SUCCEEDED){
        logger.error(`掉落物品兑换错误，错误码 ${res.code}`);
    }else{
        item = res.award;
    }
    

    if (trace) {
        return { item: item, traceInfo: traceInfo };
    } else {
        return item;
    }
};

/**
 * 重置计数器的时间到了之后的处理
 */
DropComponent.prototype.onTimer = function (timerId) {
    const signIdVec = this.app.Config.DropSign.getTimerIdToSignId(code.drop.SIGN_TYPE.PERSON, timerId);
    if (signIdVec && signIdVec.length > 0) {
        this.player.Counter.DropSign.resetCounterGroup(signIdVec);
    }
};
