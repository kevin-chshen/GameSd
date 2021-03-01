
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for tbllog_player
-- ----------------------------
DROP TABLE IF EXISTS `tbllog_player`;
CREATE TABLE `tbllog_player`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `platform` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '所属平台，记录SDK platform_id',
  `device` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '最后登录设备端，可选值如下： android、ios、web、pc',
  `role_id` bigint(20) NOT NULL COMMENT '角色ID',
  `role_name` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '角色名',
  `account_name` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '平台账号ID',
  `user_name` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '平台帐号名',
  `dim_nation` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '阵营',
  `dim_prof` int(11) DEFAULT NULL COMMENT '职业',
  `dim_sex` tinyint(255) DEFAULT NULL COMMENT '性别(0=女，1=男，2=未知)',
  `reg_time` int(11) DEFAULT NULL COMMENT '注册时间',
  `reg_ip` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '注册IP',
  `did` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '用户设备ID',
  `dim_level` int(11) DEFAULT NULL COMMENT '用户等级',
  `dim_vip_level` int(11) DEFAULT NULL COMMENT 'VIP等级',
  `dim_grade` int(11) DEFAULT NULL COMMENT '用户段位ID',
  `dim_exp` int(11) DEFAULT NULL COMMENT '当前经验',
  `dim_guild` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '帮派名称',
  `dim_power` int(11) DEFAULT NULL COMMENT '战斗力',
  `gold_number` int(11) DEFAULT NULL COMMENT '剩余元宝数（充值兑换货币）',
  `bgold_number` int(11) DEFAULT NULL COMMENT '剩余绑定元宝数（非充值兑换货币）',
  `coin_number` int(11) DEFAULT NULL COMMENT '剩余金币数',
  `bcoin_number` int(11) DEFAULT NULL COMMENT '剩余绑定金币数',
  `pay_money` int(11) DEFAULT NULL COMMENT '总充值',
  `first_pay_time` int(11) DEFAULT NULL COMMENT '首充时间',
  `last_pay_time` int(11) DEFAULT NULL COMMENT '最后充值时间',
  `last_login_time` int(11) DEFAULT NULL COMMENT '最后登录时间',
  `happend_time` int(11) DEFAULT NULL COMMENT '变动时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `role_id`(`role_id`) USING BTREE,
  INDEX `reg_time`(`reg_time`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tbllog_role
-- ----------------------------
DROP TABLE IF EXISTS `tbllog_role`;
CREATE TABLE `tbllog_role`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `platform` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '所属平台，记录SDK platform_id',
  `device` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '设备端：android、ios、web、pc',
  `role_id` bigint(255) DEFAULT NULL COMMENT '角色ID',
  `role_name` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '角色名称',
  `account_name` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '平台账号ID',
  `user_ip` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '玩家IP',
  `dim_prof` int(11) DEFAULT NULL COMMENT '职业ID',
  `dim_sex` tinyint(4) DEFAULT NULL COMMENT '性别(0=女，1=男，2=未知)',
  `did` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '用户设备ID',
  `game_version` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '游戏版本号',
  `happend_time` int(11) DEFAULT NULL COMMENT '事件发生时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `happend_time`(`happend_time`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tbllog_event
-- ----------------------------
DROP TABLE IF EXISTS `tbllog_event`;
CREATE TABLE `tbllog_event`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `platform` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '所属平台，记录SDK platform_id',
  `device` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '设备端：android、 ios、 web、 pc',
  `role_id` bigint(20) DEFAULT NULL COMMENT '角色ID',
  `account_name` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '平台账号ID',
  `event_id` int(11) DEFAULT NULL COMMENT '事件ID（每个游戏自定义，对应dict_link_step.StepId）',
  `user_ip` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '用户IP',
  `did` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '用户设备唯一ID',
  `game_version` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '游戏版本号',
  `os` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '手游专用 手机操作系统，如： android、iOS',
  `os_version` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '手游专用 操作系统版本号，如： 2.3.4',
  `device_name` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '手游专用 设备名称，如： 三星GT-S5830',
  `screen` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '手游专用 屏幕分辨率，如： 480*800',
  `mno` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '手游专用 移动网络运营商(mobile network operators)，如： 中国移动、中国联通',
  `nm` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '手游专用 联网方式(Networking mode)，如： 3G、WIFI',
  `happend_time` int(11) DEFAULT NULL COMMENT '事件发生时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `happend_time`(`happend_time`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tbllog_login
-- ----------------------------
DROP TABLE IF EXISTS `tbllog_login`;
CREATE TABLE `tbllog_login`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `platform` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '所属平台，记录SDK platform_id',
  `device` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '设备端：android、 ios 、web、 pc',
  `role_id` bigint(20) DEFAULT NULL COMMENT '角色ID',
  `account_name` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '平台账号ID',
  `dim_level` int(11) DEFAULT NULL COMMENT '等级',
  `user_ip` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '登录IP',
  `login_map_id` int(11) DEFAULT NULL COMMENT '登录地图ID',
  `did` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '用户设备ID',
  `game_version` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '游戏版本号',
  `os` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '手游专用 手机操作系统，如： android、iOS',
  `os_version` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '手游专用 操作系统版本号，如： 2.3.4',
  `device_name` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '手游专用 设备名称，如： 三星GT-S5830 MI 2S , Nexus 5 iPhone9 , 1',
  `screen` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '手游专用 屏幕分辨率，如： 480*800',
  `mno` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '手游专用 移动网络运营商(mobile network operators)，如： 中国移动、中国联通',
  `nm` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '手游专用 联网方式(Networking mode)，如： 3G、WIFI',
  `happend_time` int(11) DEFAULT NULL COMMENT '事件发生时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `happend_time`(`happend_time`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tbllog_quit
-- ----------------------------
DROP TABLE IF EXISTS `tbllog_quit`;
CREATE TABLE `tbllog_quit`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `platform` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '所属平台，记录SDK platform_id',
  `device` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '设备端：android、 ios 、 web、 pc',
  `role_id` bigint(20) DEFAULT NULL COMMENT '	角色ID',
  `account_name` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '平台账号ID',
  `login_level` int(11) DEFAULT NULL COMMENT '登录等级',
  `logout_level` int(11) DEFAULT NULL COMMENT '登出等级',
  `logout_ip` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '登出IP',
  `login_time` int(11) DEFAULT NULL COMMENT '登录时间',
  `logout_time` int(11) DEFAULT NULL COMMENT '退出时间',
  `time_duration` int(11) DEFAULT NULL COMMENT '在线时长',
  `logout_map_id` int(11) DEFAULT NULL COMMENT '退出地图ID',
  `reason_id` int(11) DEFAULT NULL COMMENT '退出异常或者原因，reason 对应字典表(0表示正常退出)',
  `msg` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '特殊信息',
  `did` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '用户设备ID',
  `game_version` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '游戏版本号',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `logout_time`(`logout_time`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tbllog_online
-- ----------------------------
DROP TABLE IF EXISTS `tbllog_online`;
CREATE TABLE `tbllog_online`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `platform` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '所属平台，记录SDK platform_id',
  `device` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '设备端：android、 ios 、 web 、 pc',
  `people` int(11) DEFAULT NULL COMMENT '当前在线玩家总人数',
  `device_cnt` int(11) DEFAULT NULL COMMENT '当前在线玩家总设备数',
  `ip_cnt` int(11) DEFAULT NULL COMMENT '当前在线IP数',
  `happend_time` int(11) DEFAULT NULL COMMENT '事件发生时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `happend_time`(`happend_time`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tbllog_gold
-- ----------------------------
DROP TABLE IF EXISTS `tbllog_gold`;
CREATE TABLE `tbllog_gold`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `platform` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '所属平台，记录SDK platform_id',
  `device` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '设备端：android、 ios 、 web 、 pc',
  `role_id` bigint(20) DEFAULT NULL COMMENT '角色ID',
  `account_name` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '平台账号ID',
  `dim_level` int(11) DEFAULT NULL COMMENT '等级',
  `dim_prof` int(11) DEFAULT NULL COMMENT '职业ID',
  `money_type` tinyint(255) DEFAULT NULL COMMENT '货币类型（1=钻石，2=绑定钻石，3=金币，4=绑定金币，5=礼券，6=积分/荣誉, 7=兑换）',
  `amount` int(11) DEFAULT NULL COMMENT '货币数量',
  `money_remain` int(11) DEFAULT NULL COMMENT '剩余货币数量',
  `item_id` int(11) DEFAULT NULL COMMENT '涉及的道具ID',
  `opt` int(11) DEFAULT NULL COMMENT '货币加减 （1=增加，2=减少）',
  `action_1` int(11) DEFAULT NULL COMMENT '行为分类1 （一级消费点） 对应(dict_action.action_id)',
  `action_2` int(11) DEFAULT NULL COMMENT '若存在一级消费点,不存在二级消费点,则将二级消费点设置为一级消费点的值',
  `item_number` int(11) DEFAULT NULL COMMENT '物品数量',
  `happend_time` int(11) DEFAULT NULL COMMENT '事件发生时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `happend_time`(`happend_time`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tbllog_pvp
-- ----------------------------
DROP TABLE IF EXISTS `tbllog_pvp`;
CREATE TABLE `tbllog_pvp`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `platform` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '所属平台，记录SDK platform_id',
  `device` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '设备端：android、 ios、 web、 pc',
  `role_id` bigint(20) DEFAULT NULL COMMENT '角色ID',
  `account_name` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '平台账号ID',
  `dim_level` int(11) DEFAULT NULL COMMENT '玩家等级',
  `action_type` int(11) DEFAULT NULL COMMENT '类型id（对应dict_action.action_type_id）,现pvp日志分为PVP字典(12)以及战场字典(10), 如果游戏没有区分，则记为0',
  `pvp_type` int(11) DEFAULT NULL COMMENT 'pvp 类型，1=>1v1, 2=>2v2, 3=>3v3, 4=>4v4, 5=>5v5, 10=>10v10，其他从1000开始',
  `pvp_id` int(11) DEFAULT NULL COMMENT 'PVP地图ID，对应dict_action中的action_id，表示该pvp行为所在的地图',
  `continuous` int(11) DEFAULT NULL COMMENT '连续战斗局数，从1开始',
  `begin_time` int(11) DEFAULT NULL COMMENT '事件发生时间',
  `end_time` int(11) DEFAULT NULL COMMENT '事件结束时间',
  `time_duration` int(11) DEFAULT NULL COMMENT 'PVP战斗时长',
  `dim_power` int(11) DEFAULT NULL COMMENT '战斗力',
  `game_id` int(11) DEFAULT NULL COMMENT '游戏场次或者记录成room_id',
  `status` int(11) DEFAULT NULL COMMENT '状态 (0=提前退出，1=完成比赛，2=开始匹配，-1=退出匹配或匹配失败)',
  `result` int(11) DEFAULT NULL COMMENT '结果（1=战胜，2=战败，3=战平，4=无胜负（类似虫虫、球球的自由模式需要用到4））',
  `happend_time` int(11) DEFAULT NULL COMMENT '事件发生时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `end_time`(`end_time`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tbllog_error
-- ----------------------------
DROP TABLE IF EXISTS `tbllog_error`;
CREATE TABLE `tbllog_error`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `platform` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '所属平台，记录SDK platform_id',
  `device` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '设备端：android、 ios 、 web 、pc',
  `role_id` bigint(20) DEFAULT NULL COMMENT '角色ID',
  `account_name` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '平台账号ID',
  `error_msg` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '错误信息',
  `did` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '用户设备ID',
  `game_version` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '游戏版本号',
  `os` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '手游专用 手机操作系统，如： android、iOS',
  `os_version` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '手游专用 操作系统版本号，如： 2.3.4',
  `device_name` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '手游专用 设备名称，如： 三星GT-S5830',
  `Screen` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '手游专用 屏幕分辨率，如： 480*800',
  `Mno` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '手游专用 移动网络运营商(mobile network operators)，如： 中国移动、中国联通',
  `Nm` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '手游专用 联网方式(Networking mode)，如： 3G、WIFI',
  `happend_time` int(11) DEFAULT NULL COMMENT '错误发生时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `happend_time`(`happend_time`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tbllog_chat
-- ----------------------------
DROP TABLE IF EXISTS `tbllog_chat`;
CREATE TABLE `tbllog_chat`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `platform` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '所属平台，记录SDK platform_id',
  `device` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '设备端：android、 ios 、 web 、pc',
  `account_name` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '平台账号ID',
  `role_id` bigint(20) DEFAULT NULL COMMENT '角色ID',
  `role_name` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '角色名',
  `dim_level` int(11) DEFAULT NULL COMMENT '玩家等级',
  `user_ip` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '玩家IP',
  `did` varchar(64) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '用户设备ID',
  `channel` int(11) DEFAULT NULL COMMENT '聊天频道（提供字典表）',
  `msg` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '聊天信息',
  `type` int(255) DEFAULT NULL COMMENT '内容类型(0代表语音,1代表文本)',
  `target_role_id` bigint(20) DEFAULT NULL COMMENT '聊天对象ID',
  `happend_time` int(11) DEFAULT NULL COMMENT '聊天发生时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `happend_time`(`happend_time`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tbllog_pay
-- ----------------------------
DROP TABLE IF EXISTS `tbllog_pay`;
CREATE TABLE `tbllog_pay`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `platform` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '所属平台，记录SDK platform_id',
  `device` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '设备端：android、 ios 、 web 、 pc',
  `role_id` bigint(20) DEFAULT NULL COMMENT '角色ID',
  `account_name` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '平台账号ID',
  `user_ip` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '玩家IP',
  `dim_level` int(11) DEFAULT NULL COMMENT '等级',
  `pay_type` int(11) DEFAULT NULL COMMENT '充值类型, 0为测试订单（不计入流水部分）, 其他为正式订单(如1)',
  `order_id` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '订单号',
  `pay_money` float DEFAULT NULL COMMENT '充值金额（总充值金额）',
  `money_type` int(11) DEFAULT NULL COMMENT '货币类型',
  `pay_gold` int(11) DEFAULT NULL COMMENT '充值获得的元宝/金币数',
  `did` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '用户设备ID',
  `game_version` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '游戏版本号',
  `happend_time` int(11) DEFAULT NULL COMMENT '事件发生时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `happend_time`(`happend_time`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;


-- ----------------------------
-- Table structure for tbllog_pay_self
-- ----------------------------
DROP TABLE IF EXISTS `tbllog_pay_self`;
CREATE TABLE `tbllog_pay_self`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `platform` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '所属平台，记录SDK platform_id',
  `device` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '设备端：android、 ios 、 web 、 pc',
  `role_id` bigint(20) DEFAULT NULL COMMENT '角色ID',
  `account_name` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '平台账号ID',
  `user_ip` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '玩家IP',
  `dim_level` int(11) DEFAULT NULL COMMENT '等级',
  `pay_type` int(11) DEFAULT NULL COMMENT '充值类型, 0为测试订单（不计入流水部分）, 其他为正式订单(如1)',
  `order_id` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '订单号',
  `pay_money` float DEFAULT NULL COMMENT '充值金额（总充值金额）',
  `money_type` int(11) DEFAULT NULL COMMENT '货币类型',
  `pay_gold` int(11) DEFAULT NULL COMMENT '充值获得的元宝/金币数',
  `did` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '用户设备ID',
  `game_version` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '游戏版本号',
  `happend_time` int(11) DEFAULT NULL COMMENT '事件发生时间',
  `pay_id` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '充值ID',
  `dungeon_id` int(11) DEFAULT NULL COMMENT '当前主线关卡ID',
  `main_task_id` int(11) DEFAULT NULL COMMENT '当前主线任务ID',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `happend_time`(`happend_time`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tbllog_guild
-- ----------------------------
DROP TABLE IF EXISTS `tbllog_guild`;
CREATE TABLE `tbllog_guild`  (
  `platform` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '所属平台，记录SDK platform_id',
  `device` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '设备端：android、 ios 、 web 、 pc',
  `guild_id` bigint(20) NOT NULL COMMENT '帮派id',
  `guild_name` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '帮派名称',
  `guild_level` int(11) NULL DEFAULT NULL COMMENT '帮派等级',
  `guild_exp` bigint(20) NULL DEFAULT NULL COMMENT '帮派经验',
  `guild_rank` int(11) NULL DEFAULT NULL COMMENT '	帮派排名',
  `guild_member` int(11) NULL DEFAULT NULL COMMENT '帮派人数',
  `happend_time` int(11) NULL DEFAULT NULL COMMENT '事件发生时间',
  `guild_leader_id` bigint(11) NULL DEFAULT NULL COMMENT '帮主ID',
  `guild_leader_name` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '帮主名称',
  `guild_leader_power` bigint(20) NULL DEFAULT NULL COMMENT '帮主ID战力',
  `guild_leader_vip` int(11) NULL DEFAULT NULL COMMENT '帮主VIP等级',
  `guild_notice` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '帮派公告(可选)',
  `guild_power` bigint(20) NULL DEFAULT NULL COMMENT '帮派总战力，全部角色战力累加(可选)',
  `guild_money` int(11) NULL DEFAULT NULL COMMENT '帮派资金(可选)',
  PRIMARY KEY (`guild_id`) USING BTREE,
  INDEX `happend_time`(`happend_time`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tbllog_level_up
-- ----------------------------
DROP TABLE IF EXISTS `tbllog_level_up`;
CREATE TABLE `tbllog_level_up`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `platform` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '所属平台，记录SDK platformID_gameID ',
  `device` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '设备端：android、 ios 、 web、 pc',
  `role_id` bigint(20) NOT NULL COMMENT '角色ID',
  `role_name` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '	角色名',
  `account_name` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '平台账号ID',
  `last_level` int(11) NULL DEFAULT NULL COMMENT '上一等级',
  `current_level` int(11) NULL DEFAULT NULL COMMENT '当前等级',
  `last_exp` int(11) NULL DEFAULT NULL COMMENT '上一经验值',
  `current_exp` int(11) NULL DEFAULT NULL COMMENT '当前经验值',
  `happend_time` int(11) NULL DEFAULT NULL COMMENT '变动时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `happend_time`(`happend_time`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tbllog_items
-- ----------------------------
DROP TABLE IF EXISTS `tbllog_items`;
CREATE TABLE `tbllog_items`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `platform` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '所属平台，记录SDK platformID_gameID',
  `device` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '设备端：android、 ios 、web 、pc',
  `role_id` bigint(20) NULL DEFAULT NULL COMMENT '角色ID',
  `account_name` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '平台账号ID',
  `dim_level` int(11) NULL DEFAULT NULL COMMENT '玩家等级',
  `opt` int(2) NULL DEFAULT NULL COMMENT '操作类型 ( -1是使用【数量减少】，1是增加【数量增加】，0是修改【数量不变，状态变化】)',
  `action_id` int(11) NULL DEFAULT NULL COMMENT '对应各自项目组的道具消耗项目字典,行为类型（dict_action.action_id）',
  `item_id` int(11) NULL DEFAULT NULL COMMENT '道具ID',
  `item_number` int(11) NULL DEFAULT NULL COMMENT '道具获得/消耗数量',
  `map_id` int(11) NULL DEFAULT NULL COMMENT '物品产出所在地图ID(dict_action.action_id)',
  `happend_time` int(11) NULL DEFAULT NULL COMMENT '事件发生时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `happend_time`(`happend_time`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tbllog_shop
-- ----------------------------
DROP TABLE IF EXISTS `tbllog_shop`;
CREATE TABLE `tbllog_shop`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `platform` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '所属平台，记录SDK platformID_gameID',
  `device` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '设备端：android、 ios 、web 、 pc',
  `role_id` bigint(20) NULL DEFAULT NULL COMMENT '角色ID',
  `account_name` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '平台账号ID',
  `shopId` int(11) NULL DEFAULT NULL COMMENT '商城类型ID',
  `dim_level` int(11) NULL DEFAULT NULL COMMENT '玩家等级',
  `dim_prof` int(11) NULL DEFAULT NULL COMMENT '职业ID',
  `money_type` int(11) NULL DEFAULT NULL COMMENT '货币类型',
  `amount` int(11) NULL DEFAULT NULL COMMENT '货币数量(总价)',
  `item_type` int(11) NULL DEFAULT NULL COMMENT '物品类型id（礼包类型id）',
  `item_id` int(11) NULL DEFAULT NULL COMMENT '物品ID（礼包id）',
  `item_number` int(11) NULL DEFAULT NULL COMMENT '物品数量（礼包数量）',
  `happend_time` int(11) NULL DEFAULT NULL COMMENT '事件发生时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `happend_time`(`happend_time`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ****************************************************************************************
-- 游戏log表
-- ****************************************************************************************
-- ----------------------------
-- Table structure for tbllog_flowRate_settlement
-- ----------------------------
DROP TABLE IF EXISTS `tbllog_flowRate_settlement`;
CREATE TABLE `tbllog_flowRate_settlement`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `rankInfo` MEDIUMTEXT CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '排行信息',
  `happend_time` int(11) DEFAULT NULL COMMENT '事件发生时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `happend_time`(`happend_time`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tbllog_guild_transfer
-- ----------------------------
DROP TABLE IF EXISTS `tbllog_guild_transfer`;
CREATE TABLE `tbllog_guild_transfer`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `transferType` int(11) NULL DEFAULT NULL COMMENT '转让类型 0自动，1手动',
  `guildId` int(11) NULL DEFAULT NULL COMMENT '联盟id',
  `guildName` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '联盟名称',
  `oldUid` bigint(20) NULL DEFAULT NULL COMMENT '旧盟主编号',
  `oldName` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '旧盟主名称',
  `newUid` bigint(20) NULL DEFAULT NULL COMMENT '新盟主编号',
  `newName` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '新盟主名称',
  `happend_time` int(11) NULL DEFAULT NULL COMMENT '事件发生时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `happend_time`(`happend_time`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tbllog_guild_project
-- ----------------------------
DROP TABLE IF EXISTS `tbllog_guild_project`;
CREATE TABLE `tbllog_guild_project`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `guildId` int(11) NULL DEFAULT NULL COMMENT '联盟id',
  `state` int(11) NULL DEFAULT NULL COMMENT '项目状态(阶段结束的时候 1选择结束项目开始、2筹备结束、3谈判结束、4运营结束)',
  `info` MEDIUMTEXT CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '项目信息',
  `happend_time` int(11) DEFAULT NULL COMMENT '事件发生时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `happend_time`(`happend_time`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;


-- ----------------------------
-- Table structure for tbllog_complaints
-- ----------------------------
DROP TABLE IF EXISTS `tbllog_complaints`;
CREATE TABLE `tbllog_complaints`  (
  `complaint_id` int(11) NOT NULL AUTO_INCREMENT,
  `platform` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '所属平台，记录SDK platformID_gameID',
  `device` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '设备端：android、 ios 、web 、 pc',
  `role_id` bigint(20) NULL DEFAULT NULL COMMENT '角色ID',
  `role_name` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '角色名称',
  `account_name` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '平台账号ID',
  `game_abbrv` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '游戏简称(由平台技术中心填写)',
  `sid` int(11) NULL DEFAULT NULL COMMENT '游戏服编号(由平台技术中心填写)',
  `complaint_type` int(11) NULL DEFAULT NULL COMMENT '投诉类型(‘全部’,11=’bug’,12=’投诉’,13=’建议’,10=’其他’, 15=’咨询’)',
  `complaint_title` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '投诉标题',
  `complaint_content` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '投诉正文',
  `complaint_time` int(11) NULL DEFAULT NULL COMMENT '玩家提交投诉时间',
  `internal_id` int(11) NULL DEFAULT NULL COMMENT '内部编号(由平台技术中心填写)',
  `reply_cnts` int(11) NULL DEFAULT NULL COMMENT 'GM回帖数(由平台技术中心填写)',
  `user_ip` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '用户IP(可不填)',
  `agent` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '代理商名称，如’4399’(可不填)',
  `pay_amount` int(11) NULL DEFAULT NULL COMMENT '玩家已充值总额(可不填)',
  `qq_account` int(11) NULL DEFAULT NULL COMMENT '玩家的qq帐号(可不填)',
  `dim_level` int(11) NULL DEFAULT NULL COMMENT '玩家等级',
  `dim_vip_level` int(11) NULL DEFAULT NULL COMMENT 'VIP等级',
  `evaluate` int(11) NULL DEFAULT NULL COMMENT '评分: 0未评,1优秀,2一般,3很差(可不填)',
  `sync_numbers` int(11) NULL DEFAULT NULL COMMENT '同步次数(可不填)',
  `last_reply_time` int(11) NULL DEFAULT NULL COMMENT '最后回复时间(可不填)',
  `is_spam` int(11) NULL DEFAULT NULL COMMENT '是否标记为垃圾问题(可不填)',
  `spam_reporter` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT 'spam注释(可不填)',
  `spam_time` int(11) NULL DEFAULT NULL COMMENT 'spam生成时间(可不填)',
  PRIMARY KEY (`complaint_id`) USING BTREE,
  INDEX `complaint_time`(`complaint_time`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tbllog_mail
-- ----------------------------
DROP TABLE IF EXISTS `tbllog_mail`;
CREATE TABLE `tbllog_mail`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `platform` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '所属平台，记录SDK platform_id',
  `device` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '设备端：android、 ios 、 web 、 pc',
  `mail_id` bigint(20) NOT NULL COMMENT '邮件ID',
  `mail_sender_id` bigint(20) NOT NULL COMMENT '发送者ID(角色ID)',
  `mail_sender_name` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '	发送者平台账号ID',
  `mail_receiver_id` bigint(20) NOT NULL COMMENT '接收者ID(角色ID)',
  `mail_receiver_name` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '接收者平台账号ID',
  `mail_title` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '邮件标题',
  `mail_content` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '邮件内容',
  `mail_type` int(11) NULL DEFAULT NULL COMMENT '邮件类型(0系统邮件，1用户邮件)',
  `mail_money_list` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '货币类型:数量，组合用逗号隔,如<gold:1, bind_gold:2>',
  `mail_item_list` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '道具id:数量，组合用逗号隔开，如<item1:1, item2:2>',
  `mail_status` int(11) NULL DEFAULT NULL COMMENT '邮件接收状态(1=已读，2=未读)',
  `get_status` int(11) NULL DEFAULT NULL COMMENT '物品领取状态（1=已领取，2=未领取）',
  `happend_time` int(11) DEFAULT NULL COMMENT '事件发生时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `happend_time`(`happend_time`) USING BTREE,
  INDEX `update_index`(`mail_id`, `mail_receiver_id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tbllog_dungeon
-- ----------------------------
DROP TABLE IF EXISTS `tbllog_dungeon`;
CREATE TABLE `tbllog_dungeon`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `platform` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '所属平台，记录SDK platformID_gameID ',
  `device` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '设备端：android、 ios 、 web、 pc',
  `role_id` bigint(20) NOT NULL COMMENT '角色ID',
  `role_name` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '	角色名',
  `account_name` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '平台账号ID',
  `matchID` int(11) NULL DEFAULT NULL COMMENT '章节关卡编号',
  `happend_time` int(11) NULL DEFAULT NULL COMMENT '变动时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `happend_time`(`happend_time`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tbllog_mission
-- ----------------------------
DROP TABLE IF EXISTS `tbllog_mission`;
CREATE TABLE `tbllog_mission`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `platform` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '所属平台，记录SDK platformID_gameID ',
  `device` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '设备端：android、 ios 、 web、 pc',
  `role_id` bigint(20) NOT NULL COMMENT '角色ID',
  `role_name` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '	角色名',
  `account_name` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '平台账号ID',
  `taskId` int(11) NULL DEFAULT NULL COMMENT '任务编号',
  `taskType` int(11) NULL DEFAULT NULL COMMENT '任务类型',
  `happend_time` int(11) NULL DEFAULT NULL COMMENT '变动时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `happend_time`(`happend_time`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;


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


-- ****************************************************************************************
-- 运营log表
-- ****************************************************************************************

-- ----------------------------
-- Table structure for tbllog_operate_interface
-- ----------------------------
DROP TABLE IF EXISTS `tbllog_operate_interface`;
CREATE TABLE `tbllog_operate_interface`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `path` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT 'path',
  `query` MEDIUMTEXT CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT 'query',
  `result` MEDIUMTEXT CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT 'result',
  `happend_time` int(11) NULL DEFAULT NULL COMMENT '事件发生时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `happend_time`(`happend_time`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

SET FOREIGN_KEY_CHECKS = 1;