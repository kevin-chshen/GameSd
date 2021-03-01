const player = require('./code/playerCode');
const item = require('./code/itemCode');
const currency = require('./code/currencyCode');
const dungeon = require('./code/dungeonCode');
const mission = require('./code/missionCode');
const activeReward = require('./code/activeReward');
const eventChoose = require('./code/eventChooseCode');
const eventSend = require('./code/eventSendCode');
const mongoBaseService = require('./code/mongoBaseServiceCode');
const battle = require('./code/battleCode');
const card = require('./code/cardCode');
const invest = require('./code/investCode');
const buff = require('./code/buffCode');
const friend = require('./code/friendCode');
const friendship = require('./code/friendshipCode');
const cardArray = require('./code/cardArrayCode');
const skill = require('./code/skillCode');
const auth = require('./code/authCode');
const db = require('./code/mongoCode');
const err = require('./export/errorCode');
const reason = require('./export/bonusReasonCode');
const redis = require('./code/redisCode');
const system = require('./code/systemCode');
const attribute = require('./code/attributeCode');
const log = require('./code/logCode');
const event = require('./code/eventCode');
const car = require('./code/carCode');
const brief = require('./code/briefCode');
const rank = require('./code/rankCode');
const live = require('./code/liveCode');
const sysOpen = require('./code/systemOpenCode');
const mail = require('./code/mailCode');
const fame = require('./code/fameCode');
const club = require('./code/clubCode');
const chat = require('./code/chatCode');
const id = require('./code/idCode');
const settings = require('./code/settingsCode');
const recovery = require('./code/recoveryCode');
const shop = require('./code/shopCode');
const global = require('./code/globalCode');
const eventServer = require('./code/eventServerCode');
const drop = require('./code/dropCode');
const guild = require('./code/guildCode');
const guildProject = require('./code/guildProjectCode');
const counter = require('./code/counterCode');
const web = require('./code/webCode');
const autoShow = require('./code/autoShowCode');
const flowRate = require('./code/flowRateCode');
const activity = require('./code/activityCode');
const cross = require('./code/crossCode');
const specialDelivery = require('./code/specialDeliveryCode');
const operate = require('./code/operateCode');

module.exports = {
    player,
    item,
    currency,
    dungeon,
    mission,
    eventChoose,
    eventSend,
    activeReward,
    mongoBaseService,
    battle,
    friend,
    friendship,
    cardArray,
    skill,
    buff,
    card,
    invest,
    auth,
    err,
    db,
    redis,
    system,
    attribute,
    log,
    event,
    car,
    brief,
    rank,
    live,
    sysOpen,
    mail,
    fame,
    club,
    chat,
    id,
    recovery,
    shop,
    global,
    eventServer,
    drop,
    guild,
    guildProject,
    counter,
    web,
    settings,
    autoShow,
    flowRate,
    activity,
    cross,
    specialDelivery,
    reason,
    operate,
};