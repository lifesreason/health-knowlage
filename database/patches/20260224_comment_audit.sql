-- 2026-02-24 comment audit workflow patch
-- 目标：评论改为“先审后发”，默认状态置为待审核

ALTER TABLE `biz_comment`
  MODIFY COLUMN `audit_status` TINYINT(4) DEFAULT 0 COMMENT '0待审核 1通过 2驳回';

-- reply_to_user_id 使用 NULL 表示非回复评论，避免 0 触发外键冲突
UPDATE `biz_comment` SET `reply_to_user_id` = NULL WHERE `reply_to_user_id` = 0;
ALTER TABLE `biz_comment`
  MODIFY COLUMN `reply_to_user_id` INT(11) DEFAULT NULL COMMENT '被回复人ID(为空表示非回复评论)';

-- 可选：为后台按状态筛选评论提供索引
SET @idx_exists := (
  SELECT COUNT(1)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'biz_comment'
    AND index_name = 'idx_comment_audit_status'
);
SET @sql := IF(@idx_exists = 0, 'CREATE INDEX `idx_comment_audit_status` ON `biz_comment` (`audit_status`, `created_at`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
