
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
