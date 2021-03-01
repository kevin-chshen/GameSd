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


-- tbllog_shop 字段修改
alter table tbllog_shop drop item_type_2;
alter table tbllog_shop change item_type_1 item_type int(11);

-- tbllog_pay 新增字段
ALTER TABLE tbllog_pay ADD money_type int(11) DEFAULT NULL COMMENT '货币类型';
ALTER TABLE tbllog_pay ADD pay_id varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '充值ID';


