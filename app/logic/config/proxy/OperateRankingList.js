const BaseConfig = require('../baseConfig');

class OperateRankingList extends BaseConfig {
    constructor() {
        super();

        this.operate = {};  // [callId]:[cfg,cfg,cfg]
    }

    reload(app, name) {
        super.reload(app, name);

        this.operate = {};
        for (const data of this.values()) {
            const callId = data.CallId;

            if (!this.operate[callId]) {
                this.operate[callId] = [];
            }
            this.operate[callId].push(data);
        }
    }

    /**
     * 取运营活动配置
    */
    getRankCfg(callId, rank) {
        if (this.operate[callId]) {
            for(const data of this.operate[callId]){
                if(data.Day[0]<=rank&&rank<=data.Day[1]){
                    return data;
                }
            }
        }
        return undefined;
    }
    
    /**
     * 获取排行榜类型
     * @param {Number} callId 
     */
    getCallIdRankType(callId){
        if (this.operate[callId]){
            if(this.operate[callId][0]){
                return this.operate[callId][0].Type;
            }
        }
    }
}
module.exports = OperateRankingList;