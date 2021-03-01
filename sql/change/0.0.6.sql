
-- ----------------------------
-- Table structure for dict_link_step
-- ----------------------------
DROP TABLE IF EXISTS `dict_link_step`;
CREATE TABLE `dict_link_step` (
  `step_id` int(11) NOT NULL COMMENT '步骤ID',
  `next_step_id` int(11) NOT NULL COMMENT '本步骤的下一个步骤ID',
  `step_name` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '本次步骤名称',
  `order_id` int(11) DEFAULT NULL COMMENT '顺序ID',
  `step_section` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '步骤所属的主任务阶段',
  `step_type` int(11) DEFAULT NULL COMMENT '任务类型，1代表主线任务、2代表强制引导、3代表支线'
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tbllog_pve
-- ----------------------------
DROP TABLE IF EXISTS `tbllog_pve`;
CREATE TABLE `tbllog_pve`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `platform` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '所属平台，记录SDK platform_id',
  `device` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '设备端：android、 ios、 web、 pc',
  `role_id` bigint(20) DEFAULT NULL COMMENT '角色ID',
  `account_name` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '平台账号ID',
  `dim_level` int(11) DEFAULT NULL COMMENT '玩家等级',
  `action_type` int(11) DEFAULT NULL COMMENT '功能类型ID(对应dict_action.action_type_id)，无区分时记为0',
  `action_id` int(11) DEFAULT NULL COMMENT '功能ID(对应dict_action.action_id)',
  `pve_id` int(11) DEFAULT NULL COMMENT '功能ID（对应dict_action.action_id）',
  `dim_power` int(11) DEFAULT NULL COMMENT '战斗力',
  `status` int(11) DEFAULT NULL COMMENT '状态：1=进入（开始），2=结束（完成），3=提前退出（未完成），4=超时（未完成）',
  `info` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '行为特定标志，没有记空',
  `begin_time` int(11) DEFAULT NULL COMMENT '事件发生时间',
  `end_time` int(11) DEFAULT NULL COMMENT '事件结束时间',
  `time_duration` int(11) DEFAULT NULL COMMENT 'PVE战斗时长',
  `happend_time` int(11) DEFAULT NULL COMMENT '事件发生时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `end_time`(`end_time`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

INSERT INTO `dict_action_type` VALUES (1501,'主线任务'),(1502,'每日任务'),(1503,'成就任务'),(5100,'非运营活动字典');

INSERT INTO `dict_link_step` VALUES
(10001,10002,'签约主播文文',0,'',1),
(10002,10003,'与丫丫娱乐签订合作协议',0,'',1),
(10003,10004,'派遣文文到丫丫娱乐进行直播',0,'',1),
(10004,10005,'给丫丫娱乐招募10名超管',0,'',1),
(10005,10006,'点击商务区获取收益5次',0,'',1),
(10006,10007,'签约主播子君',0,'',1),
(10007,10008,'与奇秀签订合作协议',0,'',1),
(10008,10009,'派遣子君到奇秀进行直播',0,'',1),
(10009,10010,'给奇秀招募10名超管',0,'',1),
(10010,10011,'点击商务区获取收益20次',0,'',1),
(10011,10012,'将文文升级到10级',0,'',1),
(10012,10013,'将子君升级到10级',0,'',1),
(10013,10014,'主线<1-1>晋级到入围赛',0,'',1),
(10014,10015,'通关主线<1-1>',0,'',1),
(10015,10016,'领取主线<1-1>宝箱奖励',0,'',1),
(10016,10017,'2名主播升级到15级',0,'',1),
(10017,10018,'点击商务区获取收益40次',0,'',1),
(10018,10019,'通关主线<1-2>',0,'',1),
(10019,10020,'领取主线<1-2>宝箱奖励',0,'',1),
(10020,10021,'给丫丫娱乐招募20名超管',0,'',1),
(10021,10022,'与丫丫娱乐达成2级合作协议',0,'',1),
(10022,10023,'2名主播升级到20级',0,'',1),
(10023,10024,'通关主线<1-3>',0,'',1),
(10024,10025,'领取主线<1-3>宝箱奖励',0,'',1),
(10025,10026,'与奇秀达成2级合作协议',0,'',1),
(10026,10027,'2名主播升级到25级',0,'',1),
(10027,10028,'通关主线<1-4>',0,'',1),
(10028,10029,'升级头衔到<主播助理>',0,'',1),
(10029,10030,'签约主播枇杷酱',0,'',1),
(10030,10031,'与猫爪直播签订合作协议',0,'',1),
(10031,10032,'派遣枇杷酱到猫爪直播进行直播',0,'',1),
(10032,10033,'给猫爪直播招募20名超管',0,'',1),
(10033,10034,'上阵3名主播',0,'',1),
(10034,10035,'将枇杷酱升级到25级',0,'',1),
(10035,10036,'通关主线<1-5>',0,'',1),
(10036,10037,'领取主线<1-5>宝箱奖励',0,'',1),
(10037,10038,'商务区拓展业务到2级',0,'',1),
(10038,10039,'点击商务区获取收益80次',0,'',1),
(10039,10040,'与章鱼直播签订合作协议',0,'',1),
(10040,10041,'任意主播包装2次',0,'',1),
(10041,10042,'通关主线<2-1>',0,'',1),
(10042,10043,'与3个平台达成2级合作协议',0,'',1),
(10043,10044,'人才市场购买10个土拨鼠碎片',0,'',1),
(10044,10045,'签约主播土拨鼠',0,'',1),
(10045,10046,'派遣土拨鼠到章鱼直播进行直播',0,'',1),
(10046,10047,'与4个平台达成2级合作协议',0,'',1),
(10047,10048,'通关主线<2-2>',0,'',1),
(10048,10049,'点击商务区获取收益120次',0,'',1),
(10049,10050,'给丫丫娱乐招募40名超管',0,'',1),
(10050,10051,'通关主线<2-3>',0,'',1),
(10051,10052,'给奇秀招募40名超管',0,'',1),
(10052,10053,'主播总等级达到120级',0,'',1),
(10053,10054,'进行1次火力全开',0,'',1),
(10054,10055,'通关主线<2-4>',0,'',1),
(10055,10056,'给奇秀招募60名超管',0,'',1),
(10056,10057,'任意平台达成3级合作协议',0,'',1),
(10057,10058,'通关主线<2-5>',0,'',1),
(10058,10059,'主播总等级达到170级',0,'',1),
(10059,10060,'2名主播包装+1',0,'',1),
(10060,10061,'通关主线<3-1>',0,'',1),
(10061,10062,'升级头衔到<主播经纪人>',0,'',1),
(10062,10063,'派遣2名主播到奇秀进行直播',0,'',1),
(10063,10064,'主播总等级达到210级',0,'',1),
(10064,10065,'通关主线<3-2>',0,'',1),
(10065,10066,'给丫丫娱乐招募60名超管',0,'',1),
(10066,10067,'2个平台达成3级合作协议',0,'',1),
(10067,10068,'主播总等级达到230级',0,'',1),
(10068,10069,'通关主线<3-3>',0,'',1),
(10069,10070,'进行5次推广注资',0,'',1),
(10070,10071,'立即或联合推广1个方案',0,'',1),
(10071,10072,'主播总等级达到250级',0,'',1),
(10072,10073,'通关主线<3-4>',0,'',1),
(10073,10074,'共招募200名超管',0,'',1),
(10074,10075,'主播总等级达到270级',0,'',1),
(10075,10076,'通关主线<3-5>',0,'',1),
(10076,10077,'签约6名主播（推荐霸格）',0,'',1),
(10077,10078,'与海鲜直播签订合作协议',0,'',1),
(10078,10079,'派遣主播到海鲜直播进行直播',0,'',1),
(10079,10080,'与海鲜直播达成2级合作协议',0,'',1),
(10080,10081,'3名主播包装+1',0,'',1),
(10081,10082,'通关主线<4-1>',0,'',1),
(10082,10083,'共招募220名超管',0,'',1),
(10083,10084,'主播总等级达到300级',0,'',1),
(10084,10085,'人才市场再次购买主播碎片',0,'',1),
(10085,10086,'通关主线<4-2>',0,'',1),
(10086,10087,'每秒赚钱速度达到11.4万',0,'',1),
(10087,10088,'流量为王挑战1次',0,'',1),
(10088,10089,'主播总等级达到320级',0,'',1),
(10089,10090,'通关主线<4-3>',0,'',1),
(10090,10091,'共招募240名超管',0,'',1),
(10091,10092,'立即或联合推广2个方案',0,'',1),
(10092,10093,'通关主线<4-4>',0,'',1),
(10093,10094,'共招募260名超管',0,'',1),
(10094,10095,'主播总等级达到350级',0,'',1),
(10095,10096,'通关主线<4-5>',0,'',1),
(10096,10097,'立即或联合推广3个方案',0,'',1),
(10097,10098,'主播总等级达到380级',0,'',1),
(10098,10099,'共招募280名超管',0,'',1),
(10099,10100,'通关主线<5-1>',0,'',1),
(10100,10101,'升级头衔到<初级合伙人>',0,'',1),
(10101,10102,'豪车商店购置1个豪车',0,'',1),
(10102,10103,'任意主播装备豪车',0,'',1),
(10103,10104,'通关主线<5-2>',0,'',1),
(10104,10105,'任意豪车升级到2级',0,'',1),
(10105,10106,'主播总等级达到430级',0,'',1),
(10106,10107,'通关主线<5-3>',0,'',1),
(10107,10108,'拥有2辆豪车',0,'',1),
(10108,10109,'共招募300名超管',0,'',1),
(10109,10110,'主播总等级达到460级',0,'',1),
(10110,10111,'通关主线<5-4>',0,'',1),
(10111,10112,'拥有4辆豪车',0,'',1),
(10112,10113,'主播总等级达到490级',0,'',1),
(10113,10114,'通关主线<5-5>',0,'',1),
(10114,10115,'共招募330名超管',0,'',1),
(10115,10116,'立即或联合推广4个方案',0,'',1),
(10116,10117,'通关主线<6-1>',0,'',1),
(10117,10118,'共招募350名超管',0,'',1),
(10118,10119,'豪车总等级达到5级',0,'',1),
(10119,10120,'通关主线<6-2>',0,'',1),
(10120,10121,'立即或联合推广5个方案',0,'',1),
(10121,10122,'主播总等级达到540级',0,'',1),
(10122,10123,'通关主线<6-3>',0,'',1),
(10123,10124,'进行1次团建挑战',0,'',1),
(10124,10125,'共招募380名超管',0,'',1),
(10125,10126,'主播总等级达到570级',0,'',1),
(10126,10127,'通关主线<6-4>',0,'',1),
(10127,10128,'豪车总等级达到10级',0,'',1),
(10128,10129,'主播总等级达到600级',0,'',1),
(10129,10130,'通关主线<6-5>',0,'',1),
(10130,10131,'共招募410名超管',0,'',1),
(10131,10132,'立即或联合推广6个方案',0,'',1),
(10132,10133,'通关主线<7-1>',0,'',1),
(10133,10134,'共招募430名超管',0,'',1),
(10134,10135,'豪车总等级达到15级',0,'',1),
(10135,10136,'通关主线<7-2>',0,'',1),
(10136,10137,'立即或联合推广7个方案',0,'',1),
(10137,10138,'主播总等级达到640级',0,'',1),
(10138,10139,'通关主线<7-3>',0,'',1),
(10139,10140,'共招募460名超管',0,'',1),
(10140,10141,'主播总等级达到670级',0,'',1),
(10141,10142,'通关主线<7-4>',0,'',1),
(10142,10143,'俱乐部<歌舞升平>升级1次',0,'',1),
(10143,10144,'豪车总等级达到20级',0,'',1),
(10144,10145,'通关主线<7-5>',0,'',1),
(10145,10146,'共招募500名超管',0,'',1),
(10146,10147,'立即或联合推广8个方案',0,'',1),
(10147,10148,'主播总等级达到700级',0,'',1),
(10148,10149,'通关主线<8-1>',0,'',1),
(10149,10150,'共招募520名超管',0,'',1),
(10150,10151,'豪车总等级达到25级',0,'',1),
(10151,10152,'通关主线<8-2>',0,'',1),
(10152,10153,'立即或联合推广9个方案',0,'',1),
(10153,10154,'主播总等级达到730级',0,'',1),
(10154,10155,'通关主线<8-3>',0,'',1),
(10155,10156,'共招募550名超管',0,'',1),
(10156,10157,'主播总等级达到750级',0,'',1),
(10157,10158,'通关主线<8-4>',0,'',1),
(10158,10159,'升级头衔到<高级合伙人>',0,'',1),
(10159,10160,'豪车总等级达到30级',0,'',1),
(10160,10161,'主播总等级达到770级',0,'',1),
(10161,10162,'通关主线<8-5>',0,'',1),
(10162,10163,'共招募580名超管',0,'',1),
(10163,10164,'立即或联合推广10个方案',0,'',1),
(10164,10165,'通关主线<9-1>',0,'',1),
(10165,10166,'共招募600名超管',0,'',1),
(10166,10167,'豪车总等级达到35级',0,'',1),
(10167,10168,'通关主线<9-2>',0,'',1),
(10168,10169,'立即或联合推广12个方案',0,'',1),
(10169,10170,'主播总等级达到800级',0,'',1),
(10170,10171,'通关主线<9-3>',0,'',1),
(10171,10172,'共招募630名超管',0,'',1),
(10172,10173,'主播总等级达到820级',0,'',1),
(10173,10174,'通关主线<9-4>',0,'',1),
(10174,10175,'豪车总等级达到40级',0,'',1),
(10175,10176,'主播总等级达到840级',0,'',1),
(10176,10177,'通关主线<9-5>',0,'',1),
(10177,10178,'共招募680名超管',0,'',1),
(10178,10179,'立即或联合推广14个方案',0,'',1),
(10179,10180,'通关主线<10-1>',0,'',1),
(10180,10181,'共招募700名超管',0,'',1),
(10181,10182,'豪车总等级达到45级',0,'',1),
(10182,10183,'通关主线<10-2>',0,'',1),
(10183,10184,'立即或联合推广16个方案',0,'',1),
(10184,10185,'主播总等级达到870级',0,'',1),
(10185,10186,'通关主线<10-3>',0,'',1),
(10186,10187,'共招募730名超管',0,'',1),
(10187,10188,'主播总等级达到890级',0,'',1),
(10188,10189,'通关主线<10-4>',0,'',1),
(10189,10190,'豪车总等级达到50级',0,'',1),
(10190,10191,'主播总等级达到910级',0,'',1),
(10191,10192,'通关主线<10-5>',0,'',1),
(10192,10193,'共招募760名超管',0,'',1),
(10193,10194,'立即或联合推广18个方案',0,'',1),
(10194,10195,'通关主线<11-1>',0,'',1),
(10195,10196,'共招募780名超管',0,'',1),
(10196,10197,'豪车总等级达到55级',0,'',1),
(10197,10198,'通关主线<11-2>',0,'',1),
(10198,10199,'立即或联合推广20个方案',0,'',1),
(10199,10200,'主播总等级达到940级',0,'',1),
(10200,10201,'通关主线<11-3>',0,'',1),
(10201,10202,'升级头衔到<高级合伙人>',0,'',1),
(10202,10203,'开启1次车展',0,'',1),
(10203,10204,'共招募810名超管',0,'',1),
(10204,10205,'主播总等级达到960级',0,'',1),
(10205,10206,'通关主线<11-4>',0,'',1),
(10206,10207,'豪车总等级达到60级',0,'',1),
(10207,10208,'主播总等级达到980级',0,'',1),
(10208,10209,'通关主线<11-5>',0,'',1),
(10209,10210,'共招募860名超管',0,'',1),
(10210,10211,'立即或联合推广22个方案',0,'',1),
(10211,10212,'通关主线<12-1>',0,'',1),
(10212,10213,'共招募880名超管',0,'',1),
(10213,10214,'豪车总等级达到65级',0,'',1),
(10214,10215,'通关主线<12-2>',0,'',1),
(10215,10216,'立即或联合推广24个方案',0,'',1),
(10216,10217,'主播总等级达到1010级',0,'',1),
(10217,10218,'通关主线<12-3>',0,'',1),
(10218,10219,'共招募910名超管',0,'',1),
(10219,10220,'主播总等级达到1030级',0,'',1),
(10220,10221,'通关主线<12-4>',0,'',1),
(10221,10222,'豪车总等级达到70级',0,'',1),
(10222,10223,'主播总等级达到1050级',0,'',1),
(10223,10224,'通关主线<12-5>',0,'',1),
(10224,10225,'共招募940名超管',0,'',1),
(10225,10226,'立即或联合推广26个方案',0,'',1),
(10226,10227,'通关主线<13-1>',0,'',1),
(10227,10228,'共招募970名超管',0,'',1),
(10228,10229,'豪车总等级达到75级',0,'',1),
(10229,10230,'通关主线<13-2>',0,'',1),
(10230,10231,'立即或联合推广28个方案',0,'',1),
(10231,10232,'主播总等级达到1080级',0,'',1),
(10232,10233,'通关主线<13-3>',0,'',1),
(10233,10234,'共招募1000名超管',0,'',1),
(10234,10235,'主播总等级达到1100级',0,'',1),
(10235,10236,'通关主线<13-4>',0,'',1),
(10236,10237,'豪车总等级达到80级',0,'',1),
(10237,10238,'主播总等级达到1120级',0,'',1),
(10238,10239,'通关主线<13-5>',0,'',1),
(10239,10240,'共招募1050名超管',0,'',1),
(10240,10241,'立即或联合推广30个方案',0,'',1),
(10241,10242,'通关主线<14-1>',0,'',1),
(10242,10243,'共招募1070名超管',0,'',1),
(10243,10244,'豪车总等级达到85级',0,'',1),
(10244,10245,'通关主线<14-2>',0,'',1),
(10245,10246,'立即或联合推广32个方案',0,'',1),
(10246,10247,'主播总等级达到1150级',0,'',1),
(10247,10248,'通关主线<14-3>',0,'',1),
(10248,10249,'共招募1090名超管',0,'',1),
(10249,10250,'主播总等级达到1180级',0,'',1),
(10250,10251,'通关主线<14-4>',0,'',1),
(10251,10252,'豪车总等级达到90级',0,'',1),
(10252,10253,'主播总等级达到1210级',0,'',1),
(10253,10254,'通关主线<14-5>',0,'',1),
(10254,10255,'共招募1110名超管',0,'',1),
(10255,10256,'立即或联合推广34个方案',0,'',1),
(10256,10257,'通关主线<15-1>',0,'',1),
(10257,10258,'共招募1130名超管',0,'',1),
(10258,10259,'豪车总等级达到95级',0,'',1),
(10259,10260,'通关主线<15-2>',0,'',1),
(10260,10261,'立即或联合推广36个方案',0,'',1),
(10261,10262,'主播总等级达到1240级',0,'',1),
(10262,10263,'通关主线<15-3>',0,'',1),
(10263,10264,'共招募1150名超管',0,'',1),
(10264,10265,'主播总等级达到1270级',0,'',1),
(10265,10266,'通关主线<15-4>',0,'',1),
(10266,10267,'豪车总等级达到100级',0,'',1),
(10267,10268,'主播总等级达到1300级',0,'',1),
(10268,10269,'通关主线<15-5>',0,'',1),
(10269,10270,'共招募1170名超管',0,'',1),
(10270,10271,'立即或联合推广38个方案',0,'',1),
(10271,10272,'通关主线<16-1>',0,'',1),
(10272,10273,'共招募1190名超管',0,'',1),
(10273,10274,'豪车总等级达到105级',0,'',1),
(10274,10275,'通关主线<16-2>',0,'',1),
(10275,10276,'立即或联合推广40个方案',0,'',1),
(10276,10277,'主播总等级达到1330级',0,'',1),
(10277,10278,'通关主线<16-3>',0,'',1),
(10278,10279,'共招募1210名超管',0,'',1),
(10279,10280,'主播总等级达到1360级',0,'',1),
(10280,10281,'通关主线<16-4>',0,'',1),
(10281,10282,'豪车总等级达到110级',0,'',1),
(10282,10283,'主播总等级达到1390级',0,'',1),
(10283,10284,'通关主线<16-5>',0,'',1),
(10284,10285,'共招募1230名超管',0,'',1),
(10285,10286,'立即或联合推广42个方案',0,'',1),
(10286,10287,'通关主线<17-1>',0,'',1),
(10287,10288,'共招募1250名超管',0,'',1),
(10288,10289,'豪车总等级达到115级',0,'',1),
(10289,10290,'通关主线<17-2>',0,'',1),
(10290,10291,'立即或联合推广44个方案',0,'',1),
(10291,10292,'主播总等级达到1420级',0,'',1),
(10292,10293,'通关主线<17-3>',0,'',1),
(10293,10294,'共招募1270名超管',0,'',1),
(10294,10295,'主播总等级达到1450级',0,'',1),
(10295,10296,'通关主线<17-4>',0,'',1),
(10296,10297,'豪车总等级达到120级',0,'',1),
(10297,10298,'主播总等级达到1480级',0,'',1),
(10298,10299,'通关主线<17-5>',0,'',1),
(10299,10300,'共招募1290名超管',0,'',1),
(10300,10301,'立即或联合推广46个方案',0,'',1),
(10301,10302,'通关主线<18-1>',0,'',1),
(10302,10303,'共招募1300名超管',0,'',1),
(10303,10304,'豪车总等级达到125级',0,'',1),
(10304,10305,'通关主线<18-2>',0,'',1),
(10305,10306,'立即或联合推广48个方案',0,'',1),
(10306,10307,'主播总等级达到1510级',0,'',1),
(10307,10308,'通关主线<18-3>',0,'',1),
(10308,10309,'共招募1320名超管',0,'',1),
(10309,10310,'主播总等级达到1540级',0,'',1),
(10310,10311,'通关主线<18-4>',0,'',1),
(10311,10312,'豪车总等级达到130级',0,'',1),
(10312,10313,'主播总等级达到1570级',0,'',1),
(10313,10314,'通关主线<18-5>',0,'',1),
(10314,10315,'共招募1340名超管',0,'',1),
(10315,10316,'立即或联合推广50个方案',0,'',1),
(10316,10317,'通关主线<19-1>',0,'',1),
(10317,10318,'共招募1350名超管',0,'',1),
(10318,10319,'豪车总等级达到135级',0,'',1),
(10319,10320,'通关主线<19-2>',0,'',1),
(10320,10321,'立即或联合推广52个方案',0,'',1),
(10321,10322,'主播总等级达到1600级',0,'',1),
(10322,10323,'通关主线<19-3>',0,'',1),
(10323,10324,'共招募1370名超管',0,'',1),
(10324,10325,'主播总等级达到1630级',0,'',1),
(10325,10326,'通关主线<19-4>',0,'',1),
(10326,10327,'豪车总等级达到140级',0,'',1),
(10327,10328,'主播总等级达到1660级',0,'',1),
(10328,10329,'通关主线<19-5>',0,'',1),
(10329,10330,'共招募1390名超管',0,'',1),
(10330,10331,'立即或联合推广54个方案',0,'',1),
(10331,10332,'通关主线<20-1>',0,'',1),
(10332,10333,'共招募1400名超管',0,'',1),
(10333,10334,'豪车总等级达到145级',0,'',1),
(10334,10335,'通关主线<20-2>',0,'',1),
(10335,10336,'立即或联合推广56个方案',0,'',1),
(10336,10337,'主播总等级达到1690级',0,'',1),
(10337,10338,'通关主线<20-3>',0,'',1),
(10338,10339,'共招募1420名超管',0,'',1),
(10339,10340,'主播总等级达到1720级',0,'',1),
(10340,10341,'通关主线<20-4>',0,'',1),
(10341,10342,'豪车总等级达到150级',0,'',1),
(10342,10343,'主播总等级达到1750级',0,'',1),
(10343,10344,'通关主线<20-5>',0,'',1),
(10344,10345,'共招募1440名超管',0,'',1),
(10345,10346,'立即或联合推广58个方案',0,'',1),
(10346,10347,'通关主线<21-1>',0,'',1),
(10347,10348,'共招募1450名超管',0,'',1),
(10348,10349,'豪车总等级达到155级',0,'',1),
(10349,10350,'通关主线<21-2>',0,'',1),
(10350,10351,'立即或联合推广60个方案',0,'',1),
(10351,10352,'主播总等级达到1780级',0,'',1),
(10352,10353,'通关主线<21-3>',0,'',1),
(10353,10354,'共招募1470名超管',0,'',1),
(10354,10355,'主播总等级达到1810级',0,'',1),
(10355,10356,'通关主线<21-4>',0,'',1),
(10356,10357,'豪车总等级达到160级',0,'',1),
(10357,10358,'主播总等级达到1840级',0,'',1),
(10358,10359,'通关主线<21-5>',0,'',1),
(10359,10360,'共招募1490名超管',0,'',1),
(10360,10361,'立即或联合推广63个方案',0,'',1),
(10361,10362,'通关主线<22-1>',0,'',1),
(10362,10363,'共招募1500名超管',0,'',1),
(10363,10364,'豪车总等级达到165级',0,'',1),
(10364,10365,'通关主线<22-2>',0,'',1),
(10365,10366,'立即或联合推广66个方案',0,'',1),
(10366,10367,'主播总等级达到1870级',0,'',1),
(10367,10368,'通关主线<22-3>',0,'',1),
(10368,10369,'共招募1520名超管',0,'',1),
(10369,10370,'主播总等级达到1900级',0,'',1),
(10370,10371,'通关主线<22-4>',0,'',1),
(10371,10372,'豪车总等级达到170级',0,'',1),
(10372,10373,'主播总等级达到1930级',0,'',1),
(10373,10374,'通关主线<22-5>',0,'',1),
(10374,10375,'共招募1540名超管',0,'',1),
(10375,10376,'立即或联合推广69个方案',0,'',1),
(10376,10377,'通关主线<23-1>',0,'',1),
(10377,10378,'共招募1550名超管',0,'',1),
(10378,10379,'豪车总等级达到175级',0,'',1),
(10379,10380,'通关主线<23-2>',0,'',1),
(10380,10381,'立即或联合推广72个方案',0,'',1),
(10381,10382,'主播总等级达到1960级',0,'',1),
(10382,10383,'通关主线<23-3>',0,'',1),
(10383,10384,'共招募1570名超管',0,'',1),
(10384,10385,'主播总等级达到1990级',0,'',1),
(10385,10386,'通关主线<23-4>',0,'',1),
(10386,10387,'豪车总等级达到180级',0,'',1),
(10387,10388,'主播总等级达到2020级',0,'',1),
(10388,10389,'通关主线<23-5>',0,'',1),
(10389,10390,'共招募1590名超管',0,'',1),
(10390,10391,'立即或联合推广75个方案',0,'',1),
(10391,10392,'通关主线<24-1>',0,'',1),
(10392,10393,'共招募1600名超管',0,'',1),
(10393,10394,'豪车总等级达到185级',0,'',1),
(10394,10395,'通关主线<24-2>',0,'',1),
(10395,10396,'立即或联合推广78个方案',0,'',1),
(10396,10397,'主播总等级达到2050级',0,'',1),
(10397,10398,'通关主线<24-3>',0,'',1),
(10398,10399,'共招募1620名超管',0,'',1),
(10399,10400,'主播总等级达到2080级',0,'',1),
(10400,10401,'通关主线<24-4>',0,'',1),
(10401,10402,'豪车总等级达到190级',0,'',1),
(10402,10403,'主播总等级达到2110级',0,'',1),
(10403,10404,'通关主线<24-5>',0,'',1),
(10404,10405,'共招募1640名超管',0,'',1),
(10405,10406,'立即或联合推广81个方案',0,'',1),
(10406,10407,'通关主线<25-1>',0,'',1),
(10407,10408,'共招募1650名超管',0,'',1),
(10408,10409,'豪车总等级达到195级',0,'',1),
(10409,10410,'通关主线<25-2>',0,'',1),
(10410,10411,'立即或联合推广84个方案',0,'',1),
(10411,10412,'主播总等级达到2140级',0,'',1),
(10412,10413,'通关主线<25-3>',0,'',1),
(10413,10414,'共招募1670名超管',0,'',1),
(10414,10415,'主播总等级达到2170级',0,'',1),
(10415,10416,'通关主线<25-4>',0,'',1),
(10416,10417,'豪车总等级达到200级',0,'',1),
(10417,10418,'主播总等级达到2200级',0,'',1),
(10418,10419,'通关主线<25-5>',0,'',1),
(10419,10420,'共招募1690名超管',0,'',1),
(10420,10421,'立即或联合推广87个方案',0,'',1),
(10421,10422,'通关主线<26-1>',0,'',1),
(10422,10423,'共招募1700名超管',0,'',1),
(10423,10424,'豪车总等级达到205级',0,'',1),
(10424,10425,'通关主线<26-2>',0,'',1),
(10425,10426,'立即或联合推广90个方案',0,'',1),
(10426,10427,'主播总等级达到2230级',0,'',1),
(10427,10428,'通关主线<26-3>',0,'',1),
(10428,10429,'共招募1720名超管',0,'',1),
(10429,10430,'主播总等级达到2260级',0,'',1),
(10430,10431,'通关主线<26-4>',0,'',1),
(10431,10432,'豪车总等级达到210级',0,'',1),
(10432,10433,'主播总等级达到2290级',0,'',1),
(10433,10434,'通关主线<26-5>',0,'',1),
(10434,10435,'共招募1740名超管',0,'',1),
(10435,10436,'立即或联合推广93个方案',0,'',1),
(10436,10437,'通关主线<27-1>',0,'',1),
(10437,10438,'共招募1750名超管',0,'',1),
(10438,10439,'豪车总等级达到215级',0,'',1),
(10439,10440,'通关主线<27-2>',0,'',1),
(10440,10441,'立即或联合推广96个方案',0,'',1),
(10441,10442,'主播总等级达到2320级',0,'',1),
(10442,10443,'通关主线<27-3>',0,'',1),
(10443,10444,'共招募1770名超管',0,'',1),
(10444,10445,'主播总等级达到2350级',0,'',1),
(10445,10446,'通关主线<27-4>',0,'',1),
(10446,10447,'豪车总等级达到220级',0,'',1),
(10447,10448,'主播总等级达到2380级',0,'',1),
(10448,10449,'通关主线<27-5>',0,'',1),
(10449,10450,'共招募1790名超管',0,'',1),
(10450,10451,'立即或联合推广99个方案',0,'',1),
(10451,10452,'通关主线<28-1>',0,'',1),
(10452,10453,'共招募1800名超管',0,'',1),
(10453,10454,'豪车总等级达到225级',0,'',1),
(10454,10455,'通关主线<28-2>',0,'',1),
(10455,10456,'立即或联合推广102个方案',0,'',1),
(10456,10457,'主播总等级达到2410级',0,'',1),
(10457,10458,'通关主线<28-3>',0,'',1),
(10458,10459,'共招募1820名超管',0,'',1),
(10459,10460,'主播总等级达到2440级',0,'',1),
(10460,10461,'通关主线<28-4>',0,'',1),
(10461,10462,'豪车总等级达到230级',0,'',1),
(10462,10463,'主播总等级达到2470级',0,'',1),
(10463,10464,'通关主线<28-5>',0,'',1),
(10464,10465,'共招募1840名超管',0,'',1),
(10465,10466,'立即或联合推广105个方案',0,'',1),
(10466,10467,'通关主线<29-1>',0,'',1),
(10467,10468,'共招募1850名超管',0,'',1),
(10468,10469,'豪车总等级达到235级',0,'',1),
(10469,10470,'通关主线<29-2>',0,'',1),
(10470,10471,'立即或联合推广108个方案',0,'',1),
(10471,10472,'主播总等级达到2500级',0,'',1),
(10472,10473,'通关主线<29-3>',0,'',1),
(10473,10474,'共招募1870名超管',0,'',1),
(10474,10475,'主播总等级达到2530级',0,'',1),
(10475,10476,'通关主线<29-4>',0,'',1),
(10476,10477,'豪车总等级达到240级',0,'',1),
(10477,10478,'主播总等级达到2560级',0,'',1),
(10478,10479,'通关主线<29-5>',0,'',1),
(10479,10480,'共招募1890名超管',0,'',1),
(10480,10481,'立即或联合推广111个方案',0,'',1),
(10481,10482,'通关主线<30-1>',0,'',1),
(10482,10483,'共招募1900名超管',0,'',1),
(10483,10484,'豪车总等级达到245级',0,'',1),
(10484,10485,'通关主线<30-2>',0,'',1),
(10485,10486,'立即或联合推广114个方案',0,'',1),
(10486,10487,'主播总等级达到2590级',0,'',1),
(10487,10488,'通关主线<30-3>',0,'',1),
(10488,10489,'共招募1920名超管',0,'',1),
(10489,10490,'主播总等级达到2620级',0,'',1);