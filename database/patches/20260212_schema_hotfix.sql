-- 2026-02-12 schema hotfix
-- 适用于旧库未完整初始化导致的缺表问题

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

CREATE TABLE IF NOT EXISTS `rel_user_follow` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT(20) NOT NULL,
  `follow_user_id` BIGINT(20) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_follow` (`user_id`, `follow_user_id`),
  KEY `idx_follow_user` (`follow_user_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户关注关系表';

CREATE TABLE IF NOT EXISTS `biz_collect` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT(20) NOT NULL,
  `target_id` BIGINT(20) NOT NULL COMMENT '帖子ID',
  `target_type` TINYINT(4) NOT NULL COMMENT '1:帖子',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_target_collect` (`user_id`, `target_id`, `target_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='收藏记录表';

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

ALTER TABLE `biz_post` ADD COLUMN IF NOT EXISTS `collect_count` INT(11) DEFAULT 0 COMMENT '收藏量';
ALTER TABLE `biz_post` ADD COLUMN IF NOT EXISTS `lat` DECIMAL(10,6) DEFAULT NULL COMMENT '发布纬度';
ALTER TABLE `biz_post` ADD COLUMN IF NOT EXISTS `lng` DECIMAL(10,6) DEFAULT NULL COMMENT '发布经度';

SET @idx_exists := (
  SELECT COUNT(1)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'biz_post'
    AND index_name = 'idx_location'
);
SET @sql := IF(@idx_exists = 0, 'CREATE INDEX `idx_location` ON `biz_post` (`lat`, `lng`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
