/**
 * @description 任务消息
 * @author jzy
 * @date 2020/04/13
 */

// const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const code = require('@code');
// const utils = require('@util');

module.exports = function(app) {
    return new Handler(app);
};

const Handler = function(app) {
    this.app = app;
};

Handler.prototype.getMission = function(msg, session, next){
    const player = session.player;
    const data = {
        mainMission:player.Mission.getMissionStatus(code.mission.MISSION_TYPE.MAIN),
        dailyMission:player.Mission.getMissionStatus(code.mission.MISSION_TYPE.DAILY),
        achievement:player.Mission.getMissionStatus(code.mission.MISSION_TYPE.ACHIEVEMENT),
        liveness:player.Mission.getLiveness(),
        achievementPoints:player.Mission.getAchievementPoints(),
        hasReceiveLiveness:player.Mission.getLivenessBox(),
        hasReceivePoints:player.Mission.getAchievementPointsBox(),
    };
    player.Mission.updateMissionInfoCache(data.mainMission, data.dailyMission, data.achievement);
    next(null,data);
};

Handler.prototype.completeMission = function(msg, session, next){
    const player = session.player;
    const missionId = msg.missionId;
    const data = player.Mission.completeMission(missionId);
    if(data.code==code.err.SUCCEEDED){
        player.Mission.updateMissionInfoCache(data.missionInfo);
    }
    next(null,data);
};

Handler.prototype.receiveLivenessReward = function(msg, session, next){
    const player = session.player;
    const id = msg.id;
    next(null, player.Mission.receiveLivenessBoxReward(id));
};

Handler.prototype.receiveAchievementPointsReward = function(msg, session, next){
    const player = session.player;
    const id = msg.id;
    next(null, player.Mission.receivePointsReward(id));
};