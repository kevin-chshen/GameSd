/**
 * @description 时间处理
 * @author chshen
 * @data 2020/04/07
 */
//const bearcat = require('bearcat');
const moment = require('moment');
moment.locale('zh-cn');

/**
 * 获取当前时间戳秒
*/
module.exports.nowSecond = function () {
    return Math.floor(Date.now() / 1000);
};

/**
 * 获取当前时间戳毫秒
*/
module.exports.nowMS = function () {
    return Date.now();
};


/**
 * 毫秒转秒
 * @param {Integer} ms 毫秒
*/
module.exports.ms2s = function (ms) {
    return Math.floor(Number(ms) / 1000);
};

/**
 * moment() 参数说明
 *      undefined   默认当天时间
 *      string      2013-02-08 24:00:00.000 等
 *      object      例 { year :2010, month :0, day :5, hour :15, minute :10, second :3, millisecond :123} 等
 *      number      例 1586361600000
 *      详情参考：http://momentjs.cn/docs/#/parsing/
 */
/**
 * 获取当天00:00点时间戳(秒)
 * @param {Undefined | String | Object | Number} ms
 */
module.exports.curDayStartUnix = function (ms) {
    return moment(ms).startOf('day').unix();
};
/**
 * 获取当天23:59点时间戳(秒)
 * @param {Undefined | String | Object | Number} ms
 */
module.exports.curDayEndUnix = function (ms) {
    return moment(ms).endOf('day').unix();
};
/**
 * 判断是否是同一天 lTime 和 rTime必须同为毫秒
 * @param {Undefined | String | Object | Number} lTime
 * @param {Undefined | String | Object | Number} rTime 格式必须与lTime一致 同为毫秒或其他(可为undefined 默认当前时间毫秒)
 */
module.exports.isSameDay = function (lTime, rTime) {
    if(lTime && lTime < 10000000000){
        lTime = lTime * 1000;
    }
    if(rTime && rTime < 10000000000){
        rTime = rTime * 1000;
    }
    return moment(rTime).isSame(lTime, 'day');
};

/**
 * 判断是否是同一周
 * @param {Undefined | String | Object | Number} lTime
 * @param {Undefined | String | Object | Number} rTime 格式必须与lTime一致 同为毫秒或其他(可为undefined 默认当前时间毫秒)
 */
module.exports.isSameWeek = function (lTime, rTime) {
    if(lTime && lTime < 10000000000){
        lTime = lTime * 1000;
    }
    if(rTime && rTime < 10000000000){
        rTime = rTime * 1000;
    }
    return moment(rTime).isSame(lTime, 'week');
};

/**
 * 判断是否是同一月
 * @param {Undefined | String | Object | Number} lTime
 * @param {Undefined | String | Object | Number} rTime 格式必须与lTime一致 同为毫秒或其他(可为undefined 默认当前时间毫秒)
 */
module.exports.isSameMonth = function (lTime, rTime) {
    if(lTime && lTime < 10000000000){
        lTime = lTime * 1000;
    }
    if(rTime && rTime < 10000000000){
        rTime = rTime * 1000;
    }
    return moment(rTime).isSame(lTime, 'month');
};

/**
 * 当前月剩余几天
 */
module.exports.curMonthRemainDay = function () {
    const d = new Date();
    /*  生成实际的月份: 由于curMonth会比实际月份小1, 故需加1 */
    d.setMonth(d.getMonth() + 1);
    const today = d.getDate();
    d.setDate(0);
    return d.getDate() - today;
};

/**
 * 计算本月时间
*/
module.exports.calCurMonthDayMs = function (day, h, m, s, ms) {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    d.setDate(0);
    d.setDate(Math.min(day, d.getDate()));
    d.setHours(h, m, s, ms);
    return d.getTime();
};

/**
 * 计算下个月时间
 * @param {Integer} day 下个月第几天
 * note 如果天数大于 下月最大时间则去最大，如2月29日， 传31日则 最大也是29日那天
*/
module.exports.calNextMonthDayMs = function (day, h, m, s, ms) {
    const d = new Date();
    d.setMonth(d.getMonth() + 2);
    d.setDate(0);
    d.setDate(Math.min(day, d.getDate()));
    d.setHours(h, m, s, ms);
    return d.getTime();
};

/**
 * 计算今日时间
*/
module.exports.calTodayMs = function (h, m, s, ms) {
    return (new Date()).setHours(h, m, s, ms);
};

/**
 * 今天从0点到现在距离多少秒
*/
module.exports.nowOffsetZeroMs = function(){
    const d = new Date();
    return ((d.getHours() * 60 + d.getMinutes()) * 60 + d.getSeconds()) * 1000;
};

/**
 * 时间字符串距离当前多少天，距离时间是按凌晨算的
 * 只计算天关系，不具体到小时以后的精度
 * 例如 2020-4-26 与 2020-4-27（当前） 距离 -1 天
 * timeStr时间格式："1995-12-25" / 2013-02-08 09:30:26 / moment 支持的都可以 
 * http://momentjs.cn/docs/#/parsing/string/
*/
module.exports.timeStrFormNowDay = function(timeStr) {
    const day = moment(timeStr);
    const m = new moment();
    const diff = moment([day.year(), day.month(), day.date()]).diff([m.year(), m.month(), m.date()]);
    // 一天的毫秒时间
    return Math.floor(diff / (86400000));
};

/**
 * 时间格式转时间戳
*/
module.exports.timeStr2MS = function (timeStr) {
    return (new Date(timeStr)).getTime();
};

/**
 * 时间戳间隔几个月
*/
module.exports.durMonths = function (rshMs, lshMS) {
    const dur = moment.duration(Math.abs(lshMS - rshMs));
    return dur.years(dur) * 12 + dur.months();
};

/**
 * 今日凌晨时间戳
*/
module.exports.todayZeroMs = function(){
    return (new Date()).setHours(0,0,0,0);
};


/**
 * 今日凌晨时间戳 之后的N天
*/
module.exports.nextNDayMs = function (n) {
    return (new Date()).setHours(0, 0, 0, 0) + n * 86400000;
};

/**
 * 获取周几对应的偏移时间
*/
module.exports.weekDayOffsetTodayMs = function (weekDay, hours, minutes) {
    const d = new Date();
    const todayWeek = d.getDay();
    return d.setHours(hours, minutes, 0, 0) + (weekDay - todayWeek) * 86400000;
};

/**
 * 获取当前时间且转换为[YYYY年MM月DD日 HH时mm分ss秒]格式
 */
module.exports.getDateString = function(ms){
    return moment(ms).format('YYYY年MM月DD日 HH时mm分ss秒');
};

/**
 * 距离多少天
*/
module.exports.durDays = function(lshMs, rshMs) {
    const lsh = (new Date(lshMs)).setHours(0, 0, 0, 0);
    const rsh = (new Date(rshMs)).setHours(0, 0, 0, 0);
    return Math.floor(Math.abs(rsh - lsh)/86400000);
};
