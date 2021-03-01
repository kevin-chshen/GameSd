



-- dict_item 新增字段
ALTER TABLE dict_item ADD item_type int(11) DEFAULT 0 COMMENT '道具类型(普通道具记0，礼包记录礼包类型id, 商店1，神秘商店2)';
ALTER TABLE dict_item ADD item_type_name varchar(1024) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT '普通道具' COMMENT '道具类型名称(礼包类型名称)';


-- tbllog_pay_self 新增字段
ALTER TABLE tbllog_pay_self ADD dungeon_id int(11) DEFAULT 0 COMMENT '当前主线关卡ID';
ALTER TABLE tbllog_pay_self ADD main_task_id int(11) DEFAULT 0 COMMENT '当前主线任务ID';
