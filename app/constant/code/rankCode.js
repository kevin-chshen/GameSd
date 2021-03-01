/**
 * @description 排行榜定义
 * @author jzy
 * @date 2020/05/11
 */

const playerKeys = require('./playerCode').Keys;
const briefKeys = require('./briefCode');



/**
 * 排行榜定义，playerKey和computeFun必填一个，优先playerKey
 * @param {String} dataVersion 数据版本号，修改会重新刷数据
 * @param {String} redisKey 排行榜redis表名称区别标识
 * @param {Number} personOpenKey 个人排行榜系统开启配置ID
 * @param {String} playerKey 对应的玩家属性名 playerCode中定义的属性
 * @param {Function} computeFun 计算函数,形如  compute(MongoPlayer) 通过玩家数据计算出来的值
 * @param {Boolean} isLeague 是否包含联盟排行榜
 * *****
 * @param {String} briefKey 缩略信息key 用于快速访问排行分数的一个可选途径
 * @param {Function} computeBriefFunc 可选 用于转换briefKey的值变成分数
 */
const Keys = {
    EARN:{
        dataVersion:"0.1.0",
        redisKey:"earn",
        personOpenKey:501,
        playerKey:playerKeys.COIN_PER_SECOND,
        isLeague:true,
        /*****/
        briefKey:briefKeys.CASH_PER_SECOND.name,
    },
    POWER:{
        dataVersion:"0.1.0",
        redisKey:"power",
        personOpenKey:502,
        playerKey:playerKeys.POWER,
        isLeague:true,
        /*****/
        briefKey:briefKeys.POWER.name,
    },
    CAR:{
        dataVersion:"0.1.0",
        redisKey:"car",
        personOpenKey:504,
        computeFunc:function(playerData){
            let total = 0;
            const data = playerData.get(playerKeys.CAR_TOP_THREE);
            if(Array.isArray(data)){
                for(const [,value] of data){
                    total += parseInt(value);
                }
            }
            return total;
        },
        /*****/
        briefKey:briefKeys.CAR_TOP_THREE.name,
        computeBriefFunc:function(data){
            let total = 0;
            for(const info of data){
                total += info[1];
            }
            return total;
        },
    }
};


/***************************************/


module.exports = {
    RANK_KEYS:Keys,
    
    /**
     * redis个人榜后缀
     */
    PERSON_SUFFIX:"person",
    /**
     * redis联盟榜后缀
     */
    LEAGUE_SUFFIX:"league",

    /**
     * 排行榜请求每页数量
     */
    PAGE_OFFSET: 20,
    /**
     * 排行榜最大数量
     */
    RANK_MAX_NUM: 100,
    /**
     * 查询缓存清除时间
     */
    CACHE_CLEAN_TIME: 5*1000,
    /**
     * 个人排行榜分数最小值
     */
    MIN_SCORE_VALUE: 1,


    /*****************其他*****************/
    /**
     * 大类
     */
    RANK_MAIN_TYPE:{
        PERSON:1,
        LEAGUE:2,
    },
    /**
     * 第二分类
     */
    RANK_SECOND_TYPE:{
        EARN:1,
        POWER:2,
        FLOWRATE:3,
        CAR:4,
    },
    RANK_SECOND_TYPE_LEAGUE:{
        EARN:1,
        POWER:2,
    },
    /**
     * 膜拜奖励全局表ID
     */
    GLOBAL_ID_WORSHIP:801,
};