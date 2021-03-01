/**
 * @description 全局事件
 * @author chshen
 * @date 2020/04/26
 */
const assert = require('assert');

/**
 * counter key 属性缓存
 */
const counterKeyProp = {};


/**
 * counter key 配置
 * @param {String} name 名字
 * @param {String} bearcatId 存储对象对应的bearcat类型
 */
module.exports = {
    // 一些函数
    isValidKey,
    // player service计时器事件
    PLAYER_SERVICE_TIMER: makeEventServerKeyType({
        name: 'PlayerServiceTimer'
    }),
    // 活动开启
    ACTIVITY_START_TIMER: makeEventServerKeyType({
        name: 'ActivityStartTimer'
    }),
    // 活动关闭
    ACTIVITY_STOP_TIMER: makeEventServerKeyType({
        name: 'ActivityStopTimer' 
    }),
    OPERATE_START_TIMER: makeEventServerKeyType({
        name: 'OperateStartTimer'  // 运营活动开启
    }),
    OPERATE_STOP_TIMER: makeEventServerKeyType({
        name: 'OperateStopTimer'   // 运营活动关闭
    }),
    OPERATE_INIT_FINISH: makeEventServerKeyType({
        name: 'OperateInitFinish'   // 运营活动管理初始化完毕
    }),
    GUILD_PROJECT_JOIN: makeEventServerKeyType({
        name: 'guildProjectJoin'        // 公会项目加入公会触发
    }),
    GUILD_PROJECT_SETTLEMENT: makeEventServerKeyType({
        name: 'guildProjectSettlement'  // 公会项目结算
    }),
};

/**
 * 生成key相关的配置
 * @param {Object} config 配置
 */
function makeEventServerKeyType(config) {
    assert(counterKeyProp[config.name] == null, `counter key [${config.name}] duplicate`);
    const prop = {
        name: config.name
    };
    counterKeyProp[config.name] = prop;
    return prop;
}

/**
 * 是否有效的key
 * @param {String} name key的名称
 */
function isValidKey(name) {
    return counterKeyProp[name] != null;
}