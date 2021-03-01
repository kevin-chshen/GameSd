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
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `happend_time`(`happend_time`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;