-- 银龄健康社区小程序 - 数据库初始化脚本
-- 版本: V1.0.0
-- 数据库: MySQL 8.0
-- 字符集: utf8mb4

-- 创建数据库
CREATE DATABASE IF NOT EXISTS silverhealth
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_general_ci;

USE silverhealth;

-- ============================================
-- 1. 用户与权限域 (User Domain)
-- ============================================

-- 1.1 用户基础表 sys_user
CREATE TABLE IF NOT EXISTS `sys_user` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `openid` VARCHAR(64) NOT NULL COMMENT '微信OpenID',
  `unionid` VARCHAR(64) DEFAULT NULL COMMENT '微信UnionID(预留)',
  `nickname` VARCHAR(64) NOT NULL DEFAULT '用户' COMMENT '昵称',
  `avatar_url` VARCHAR(255) DEFAULT '' COMMENT '头像URL',
  `mobile_cipher` VARCHAR(128) DEFAULT NULL COMMENT '手机号(AES加密存储)',
  `role` TINYINT(4) DEFAULT 0 COMMENT '角色: 0普通用户, 1认证医师, 9管理员',
  `font_scale` DECIMAL(2,1) DEFAULT 1.0 COMMENT '适老化字体倍率(1.0-1.4)',
  `is_verified` TINYINT(1) DEFAULT 0 COMMENT '是否实名认证',
  `status` TINYINT(4) DEFAULT 1 COMMENT '状态: 1正常, 0封禁',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` TINYINT(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_openid` (`openid`),
  KEY `idx_mobile` (`mobile_cipher`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户基础表';

-- 1.2 医师认证表 sys_doctor_profile
CREATE TABLE IF NOT EXISTS `sys_doctor_profile` (
  `user_id` BIGINT(20) NOT NULL COMMENT '关联sys_user.id',
  `real_name` VARCHAR(32) NOT NULL COMMENT '真实姓名',
  `hospital` VARCHAR(64) NOT NULL COMMENT '所属医院',
  `department` VARCHAR(32) NOT NULL COMMENT '科室',
  `title` VARCHAR(32) NOT NULL COMMENT '职称(主治医师等)',
  `cert_img_url` VARCHAR(255) NOT NULL COMMENT '资格证图片URL',
  `audit_status` TINYINT(4) DEFAULT 0 COMMENT '0待审 1通过 2驳回',
  `reject_reason` VARCHAR(128) DEFAULT NULL COMMENT '驳回原因',
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='医师认证详情表';

-- ============================================
-- 2. 社区核心域 (Community Domain)
-- ============================================

-- 2.1 圈子表 biz_circle
CREATE TABLE IF NOT EXISTS `biz_circle` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT '圈子ID',
  `name` VARCHAR(32) NOT NULL COMMENT '圈子名称',
  `description` VARCHAR(255) DEFAULT NULL COMMENT '简介',
  `cover_url` VARCHAR(255) DEFAULT NULL COMMENT '封面图',
  `member_count` INT(11) DEFAULT 0 COMMENT '成员数(缓存)',
  `post_count` INT(11) DEFAULT 0 COMMENT '帖子数(缓存)',
  `sort_order` INT(11) DEFAULT 0 COMMENT '排序权重',
  `is_recommend` TINYINT(1) DEFAULT 0 COMMENT '是否推荐到首页',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` TINYINT(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_sort` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='圈子表';

-- 2.2 用户-圈子关系表 rel_user_circle
CREATE TABLE IF NOT EXISTS `rel_user_circle` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT(20) NOT NULL,
  `circle_id` BIGINT(20) NOT NULL,
  `role` TINYINT(4) DEFAULT 0 COMMENT '0成员 1圈主',
  `joined_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_circle` (`user_id`, `circle_id`),
  KEY `idx_circle_user` (`circle_id`, `joined_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='圈子成员关系表';

-- 2.3 用户-关注关系表 rel_user_follow
CREATE TABLE IF NOT EXISTS `rel_user_follow` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT(20) NOT NULL COMMENT '关注人ID',
  `follow_user_id` BIGINT(20) NOT NULL COMMENT '被关注人ID',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_follow` (`user_id`, `follow_user_id`),
  KEY `idx_follow_user` (`follow_user_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户关注关系表';

-- ============================================
-- 3. 内容生产域 (Content Domain)
-- ============================================

-- 3.1 帖子/内容表 biz_post
CREATE TABLE IF NOT EXISTS `biz_post` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT '帖子ID',
  `user_id` BIGINT(20) NOT NULL COMMENT '作者ID',
  `circle_id` BIGINT(20) NOT NULL COMMENT '所属圈子ID',
  `type` TINYINT(4) NOT NULL COMMENT '1:图文 2:视频',
  `title` VARCHAR(128) DEFAULT NULL COMMENT '标题(视频必填)',
  `content` TEXT COMMENT '正文或视频描述',
  `media_urls` JSON DEFAULT NULL COMMENT '媒体资源JSON array',
  `video_meta` JSON DEFAULT NULL COMMENT '视频元数据(时长/封面/大小)',
  `lat` DECIMAL(10,6) DEFAULT NULL COMMENT '发布纬度',
  `lng` DECIMAL(10,6) DEFAULT NULL COMMENT '发布经度',
  `view_count` INT(11) DEFAULT 0 COMMENT '浏览量',
  `like_count` INT(11) DEFAULT 0 COMMENT '点赞量',
  `comment_count` INT(11) DEFAULT 0 COMMENT '评论量',
  `collect_count` INT(11) DEFAULT 0 COMMENT '收藏量',
  `audit_status` TINYINT(4) DEFAULT 0 COMMENT '0审核中 1公开 2驳回',
  `reject_reason` VARCHAR(64) DEFAULT NULL COMMENT '驳回提示(用户可见)',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` TINYINT(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_user_posts` (`user_id`, `created_at`),
  KEY `idx_feed_query` (`circle_id`, `audit_status`, `created_at`) COMMENT 'Feed流查询核心索引',
  KEY `idx_location` (`lat`, `lng`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='帖子内容表';

-- 3.2 评论表 biz_comment
CREATE TABLE IF NOT EXISTS `biz_comment` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT '评论ID',
  `post_id` BIGINT(20) NOT NULL COMMENT '关联帖子',
  `user_id` BIGINT(20) NOT NULL COMMENT '评论人',
  `root_id` BIGINT(20) DEFAULT 0 COMMENT '根评论ID(0为一级评论)',
  `reply_to_user_id` INT(11) DEFAULT NULL COMMENT '被回复人ID(为空表示非回复评论)',
  `content` VARCHAR(1024) NOT NULL COMMENT '内容',
  `like_count` INT(11) DEFAULT 0,
  `audit_status` TINYINT(4) DEFAULT 0 COMMENT '0待审核 1通过 2驳回(先审后发)',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `is_deleted` TINYINT(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_post_root` (`post_id`, `root_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='评论表';

-- ============================================
-- 4. 互动与系统域 (Interaction & System)
-- ============================================

-- 4.1 点赞记录表 biz_like
CREATE TABLE IF NOT EXISTS `biz_like` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT(20) NOT NULL,
  `target_id` BIGINT(20) NOT NULL COMMENT '帖子ID或评论ID',
  `target_type` TINYINT(4) NOT NULL COMMENT '1:帖子 2:评论',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_target` (`user_id`, `target_id`, `target_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='点赞记录表';

-- 4.2 收藏记录表 biz_collect
CREATE TABLE IF NOT EXISTS `biz_collect` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT(20) NOT NULL,
  `target_id` BIGINT(20) NOT NULL COMMENT '帖子ID',
  `target_type` TINYINT(4) NOT NULL COMMENT '1:帖子',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_target_collect` (`user_id`, `target_id`, `target_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='收藏记录表';

-- 4.3 内容安全审核日志 sys_audit_log
CREATE TABLE IF NOT EXISTS `sys_audit_log` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT,
  `target_id` BIGINT(20) NOT NULL COMMENT '帖子ID',
  `audit_type` TINYINT(4) NOT NULL COMMENT '1机器 2人工',
  `result` TINYINT(4) NOT NULL COMMENT '1通过 2驳回 3复审',
  `risk_label` VARCHAR(32) DEFAULT NULL COMMENT '风险标签(涉黄/暴恐)',
  `details` TEXT COMMENT 'API返回的原始JSON',
  `operator` VARCHAR(32) DEFAULT 'SYSTEM' COMMENT '操作人',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_target` (`target_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='审核日志表';

-- 4.4 浏览历史表 biz_user_history
CREATE TABLE IF NOT EXISTS `biz_user_history` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT(20) NOT NULL,
  `post_id` BIGINT(20) NOT NULL,
  `last_viewed_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_post_history` (`user_id`, `post_id`),
  KEY `idx_user_viewed` (`user_id`, `last_viewed_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户浏览历史表';

-- ============================================
-- 5. 初始化数据
-- ============================================

-- 初始化圈子数据
INSERT INTO `biz_circle` (`id`, `name`, `description`, `sort_order`) VALUES
(1001, '银龄无忧', '老年健康政策与科学知识', 100),
(1002, '食物', '中医食疗与营养搭配', 90),
(1003, '禁忌', '老年生活注意事项', 80),
(1004, '健身', '适合长辈的低强度运动', 70);

-- 初始化管理员账号 (密码: admin123, 需要在应用层使用 bcrypt 加密)
-- 注意: 这里的 password_hash 是占位符，实际应该由应用层生成
-- INSERT INTO `sys_user` (`id`, `openid`, `nickname`, `role`, `status`) VALUES
-- (1, 'admin_openid', '系统管理员', 9, 1);

-- 完成提示
SELECT '数据库初始化完成！' AS message;
