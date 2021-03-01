/**
 * @description 任务系统配置表
 * @author jzy
 * @date 2020/04/08
 */

const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const code = require("@code");

const BaseConfig = require('../baseConfig');
// let code = require('@code');
class Task extends BaseConfig {
    constructor() {
        super();
        this.typeCache = {};
        this.missionChain = {};
        this.headList = {};
        this.classifyTypeHeadList = {};
    }
    reload(app, name) {
        super.reload(app, name);

        this.typeCache = {};
        this.missionChain = {};
        this.headList = {};
        for (const mission of this.values()) {
            // 按大类分类ClassifyType
            const oldValue = this.typeCache[mission.Type] || [];
            if(oldValue.indexOf(mission.ConditionId)<0){
                oldValue.push(mission.ConditionId);
            }
            this.typeCache[mission.Type] = oldValue;

            // 任务链的头部
            if(mission.FrontId == 0){
                //大类
                const typeHead = this.headList[mission.Type] || [];
                typeHead.push(mission);
                this.headList[mission.Type] = typeHead;
                //链
                this.missionChain[mission.Id] = 0;
                //小类
                const classifyTypeHead = this.classifyTypeHeadList[mission.ConditionId] || [];
                classifyTypeHead.push(mission.Id);
                this.classifyTypeHeadList[mission.ConditionId] = classifyTypeHead;
            }else{
                this.missionChain[mission.Id] = mission.FrontId;
            }
        }
        for(const head of Object.keys(this.missionChain)){
            this.missionChain[head] = this.__getHead(head, this.missionChain);
        }
    }

    __getHead(id, tempChain){
        if(tempChain[id]==0){
            return 0;
        }
        let head = id;
        while(tempChain[head]!=0){
            if(tempChain[head]==undefined){
                logger.error(`任务表ID [${head}] 的前置id错误`);
                return head;
            }
            head = tempChain[head];
        }
        return head;
    }

    /**
     * 获取任务大类下的初始任务
     * @param {Number} type 
     */
    getInitMission(type){
        switch(type){
        case code.mission.MISSION_TYPE.MAIN:{
            if(this.headList[type].length!=1){
                logger.warn(`主线任务拥有的初始任务数量不为1，初始任务数量[${this.headList[type].length}]`);
            }
            return this.headList[type][0];
        }
        default:
            return (this.headList[type] || []).concat();
        }
    }

    /**
     * 获取任务链的初始任务id
     * @param {Number} id 
     */
    getMissionBeginId(id){
        if(this.missionChain[id]==0){
            return id;
        }
        return this.missionChain[id];
    }

    /**
     * 是否是最后一个任务
     * @param {Number} id 
     */
    isLasterMission(id){
        if(this.get(id).PostpositionId==0){
            return true;
        }else{
            return false;
        }
    }

    getNextMissionId(id){
        return this.get(id).PostpositionId;
    }

    /**
     * 是否是第一个任务
     * @param {Number} id 
     */
    isFirstMission(id){
        if(this.get(id).FrontId==0){
            return true;
        }else{
            return false;
        }
    }

    /**
     * 获得任务大类下的所有任务类型
     * @param {Number} type 
     */
    getMissionTypeList(type){
        return (this.typeCache[type] || []).concat();
    }

    /**
     * 获得任务小类下的所有任务链头id
     * @param {Number} type 
     */
    getMissionHeadByClassifyType(type){
        return (this.classifyTypeHeadList[type] || []).concat();
    }
}

module.exports = Task;