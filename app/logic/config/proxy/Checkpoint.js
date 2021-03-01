/**
 * @description 主线关卡配置
 * @author jzy
 * @date 2020/03/23
 */

const BaseConfig = require('../baseConfig');
const code = require('@code');

class Checkpoint extends BaseConfig {
    constructor() {
        super();
    }
    reload(app, name) {
        super.reload(app, name);
    }

    /**
     * 获取初始化开始时候的赛事id
     */
    GetInitMatchID(){
        return this.keys()[0];
    }

    /**
     * 获取下一比赛id，返回值可能为null
     * @param {Number} matchID 
     */
    GetNextMatchID(matchID){
        const cfg = this.get(matchID);
        switch(cfg.Type){
        case code.dungeon.MATCH_TYPE.AUDITION:
        case code.dungeon.MATCH_TYPE.QUALIFYING:
        case code.dungeon.MATCH_TYPE.ELIMINATION:
            return ++matchID;
        case code.dungeon.MATCH_TYPE.FINAL:
        case code.dungeon.MATCH_TYPE.REWARD: {
            const checkpointID = cfg.CheckpointId;
            let chapterID = cfg.ChapterId;
            const CheckpointList = this.app.Config.Chapter.get(chapterID).CheckpointId;
            const nextCheckpointIndex = CheckpointList.indexOf(checkpointID) + 1;
            let nextCheckpoint;
            if(CheckpointList.length > nextCheckpointIndex){
                nextCheckpoint = CheckpointList[nextCheckpointIndex];
            } else {
                const nextChapter = this.app.Config.Chapter.get(++chapterID);
                if(nextChapter){
                    nextCheckpoint = nextChapter.CheckpointId[0];
                }else{
                    return;
                }
            }
            return nextCheckpoint * 10 + code.dungeon.MATCH_TYPE.AUDITION;
        }
        }
    }

    /**
     * 是否能进行打赏
     * @param {Number} matchID 
     */
    IsCanEncourage(matchID){
        if(matchID){
            switch(this.get(matchID).Type){
            case code.dungeon.MATCH_TYPE.FINAL:
            case code.dungeon.MATCH_TYPE.REWARD:
                return false;
            }
            return true;
        }else{
            return false;
        }
    }

    /**
     * 随机抽取事件ID
     * @param {Number} matchID 
     */
    GetRandomEventID(matchID){
        switch(this.get(matchID).EventType){
        case code.dungeon.EVENT_TYPE.CHOOSE:{
            return this.app.Config.EventChoose.getRandomEventID(code.eventChoose.EVENT_TYPE.DUNGEON);
        }
        case code.dungeon.EVENT_TYPE.DISPATCH:
            return this.app.Config.EventSend.getRandomEventID(code.eventSend.EVENT_TYPE.DUNGEON);
        }
    }
}

module.exports = Checkpoint;