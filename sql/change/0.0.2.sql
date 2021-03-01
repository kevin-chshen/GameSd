
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
