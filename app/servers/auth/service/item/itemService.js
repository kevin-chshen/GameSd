/**
 * @description handler服务item
 * @author chenyq
 * @date 2020/06/12
 */
// const logger = require('pomelo-logger').getLogger('pomelo', __filename);
const bearcat = require('bearcat');
// const MongoAccount = require('@mongo/mongoAccount');
// const MongoPlayer = require('@mongo/mongoPlayer');
const code = require('@code');
// const util = require('@util');

const ItemService = function () {
    this.$id = 'auth_ItemService';
    this.app = null;
};
module.exports = ItemService;
bearcat.extend('auth_ItemService', 'logic_BaseService');

/**
参数名称	     类型	必须  示例	描述
sendType	    Number	是  1	sendType=1 角色名发送
                                sendType=2 角色id发送
                                sendType=3 平台账号ID发送
                                sendType=4 条件发送
                                sendType=5 全服发送
                                sendType=6 在线玩家发送
                                sendType=7（赛季玩家）
                                sendType=8（非赛季玩家）
roleName	    String	是	观音也销魂,白富美有人怜	以逗号分隔的角色名，若昵称中包含逗号则会被转义为%2C
roleId	        String	是	1001,1002,2001	以逗号分隔的角色Id
accountName	    String	是	4399a1,4399a2	以逗号分隔的平台帐号ID,包含逗号则会被转义为%2C
minVip	        Number	是	1	条件：vip最低值，大于等于值为符合条件
maxVip	        Number	是	10	条件：vip最大值，小于等于值为符合条件
minLevel	    Number	是	2	条件：等级最低值，大于等于值为符合条件
maxLevel	    Number	是	10	条件：等级最高值，小于等于值为符合条件
minLoginTime	Number	是	1358851700	条件：最后一次登录时间最小值，大于等于该值为符合条件
maxLoginTime	Number	是	10	条件：最后一次登录时间最大值，小于等于该值为符合条件
minLoginOutTime	Number	是	1358851700	条件：最后一次登出时间最小值，大于等于该值为符合条件
maxLoginOutTime	Number	是	1358851754	条件：最后一次登出时间最大值，小于等于该值为符合条件
minRegTime	    Number	是	1358851700	条件：时间戳，最早注册时间，大于等于该值为符合条件
maxRegTime	    Number	是	10	条件：时间戳，最晚注册时间，小于等于该值为符合条件
sex	            Number	是	1	条件：玩家性别，空为全部，1=男， 2=女
career	        Number	是	2	条件：玩家职业，与游戏中职业的枚举值一致，空为全部
guild	        String	是	第下第一帮	条件：帮派名称
mailTitle	    String	是	这是邮件标题哦	邮件标题
mailContent	    String	是	有新副本可以玩啦，快去看看哦	邮件内容
vipType	        Number	是	1	空为全部、1：VIP玩家、2：非VIP玩家
moneyData	    String	是	[{“id”：1,“name”：“金币”，“nums”：5}，｛“id”：2,“name”：“绑定礼券”，“nums”：50｝]	Json格式的货币数据,id是货币类型id，name货币名称，num货币数量,空为[]
propsData	    String	是	[{“id”:10001,“name”：“聚宝盆”，“nums”：2，“bind”：1，“strengthLevel”:null,”propsExistDay”:null }]	
                                Id是道具id，name是道具名称，num是数量，bind=1表示绑定，Bind=0表示非绑定，strengthLevel表示强化等级,propsExistDay表示道具有效期 空为[]
existDay	    Number	否	1	0，游戏方自定义，表示阅后即焚或者不做任何操作；其他数值表示阅后多少天后删除
internalTag	    Number	否	1	1为内部玩家，其他不传
orderId	        String	是	c4ca4238a0b923820dcc509a6f75849b	本次请求对应的订单号。用作记录订单处理的情况。
 */
ItemService.prototype.sendItem = async function (params) {
    const sendType = Number(params.sendType);
    const roleName = params.roleName;
    const roleId = params.roleId;
    const accountName = params.accountName;
    const minVip = Number(params.minVip);
    const maxVip = Number(params.maxVip);
    const minLevel = Number(params.minLevel);
    const maxLevel = Number(params.maxLevel);
    const minLoginTime = Number(params.minLoginTime);
    const maxLoginTime = Number(params.maxLoginTime);
    const minLoginOutTime = Number(params.minLoginOutTime);
    const maxLoginOutTime = Number(params.maxLoginOutTime);
    const minRegTime = Number(params.minRegTime);
    const maxRegTime = Number(params.maxRegTime);
    const sex = Number(params.sex);
    const career = Number(params.career);
    const guild = params.guild;
    const mailTitle = params.mailTitle;
    const mailContent = params.mailContent;
    const vipType = Number(params.vipType);
    const moneyData = params.moneyData;
    const propsData = params.propsData;
    let existDay = Number(params.existDay);
    // const internalTag = Number(params.internalTag);
    // const orderId = params.orderId;
    if (existDay == 0) {
        existDay = 1;
    }
    const itemList = await this.app.Helper.OperateMail.getItemList(moneyData, propsData);
    if (sendType != code.operate.OPERATE_SEND_TYPE.GLOBAL) {
        const uidList = await this.app.Helper.OperateMail.queryUidList(sendType, roleName, roleId, accountName, minVip, maxVip, minLevel, maxLevel, minLoginTime, maxLoginTime, minLoginOutTime, maxLoginOutTime, minRegTime, maxRegTime, sex, career, guild, vipType);
        if (uidList.length > 0) {
            const mail = this.app.Helper.OperateMail.getItemMail(mailTitle, mailContent, itemList, existDay);
            for (const uid of uidList) {
                this.app.rpcs.global.mailRemote.sendCustomMail({}, uid, mail);
            }
            // logger.info(`player:${this.player.uid} add new car:${cId} , carProtMax sendMail itemInfo:${JSON.stringify(itemInfo)}`);
        }
    }
    else {
        const mail = this.app.Helper.OperateMail.getGlobalMail(mailTitle, mailContent, itemList, existDay, vipType);
        // 发送全局邮件
        this.app.rpcs.global.mailRemote.sendGlobalMail({}, mail);
    }
    // log记录

    return { ret: 0, msg: "success" };
};
