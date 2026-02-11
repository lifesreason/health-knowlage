-- 银龄健康社区数据库初始化脚本
-- SilverHealth Database Initialization Script

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS silverhealth
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE silverhealth;

-- 注意：使用 TypeORM 的 synchronize=true 时，表结构会自动创建
-- 这里只做一些基础配置和初始数据

-- 为了更好的性能，可以在生产环境中关闭 synchronize 并手动管理迁移
