# 项目开发进度

## 当前状态（2026-02-24）

项目已完成核心可用链路，包含：
- 小程序登录与手机号绑定（微信授权 + 手动验证码）
- 内容发布、评论、点赞、收藏（已真实落库）
- 管理后台登录与后台接口权限收敛（JWT + 管理员角色）
- 圈子浏览/加入/退出
- 审核后台基础能力
- 评论“先审后发”闭环（用户提交待审 + 管理端评论审核）

当前仍有部分扩展能力未闭环（见“待完善项”）。

---

## 已完成

### Phase 0: 基建与架构 ✅
- [x] 项目目录结构创建
- [x] NestJS 后端初始化
- [x] Uni-app 前端初始化
- [x] 管理后台（Vue3 + Element Plus）初始化
- [x] 全局异常过滤器 / 响应拦截器 / 公共装饰器
- [x] 前端网络层封装（luch-request）
- [x] 适老化基建（`--font-scale` + Theme Store）

### Phase 1: 用户体系与核心浏览 ✅
- [x] 微信登录接口
- [x] 手机号绑定接口（微信授权）
- [x] 手动验证码绑定接口（开发环境模拟）
- [x] 管理后台登录接口
- [x] 首页推荐流接口
- [x] 内容发布/删除接口
- [x] OSS 上传签名接口

### Phase 2: 社区互动与内容生产（核心） ✅
- [x] 圈子：列表 / 详情 / 加入 / 退出 / 圈子帖子
- [x] 评论：创建 / 列表 / 删除 / 点赞 / 取消点赞
- [x] 点赞：帖子点赞 / 取消点赞
- [x] 收藏：帖子收藏 / 取消收藏（真实落库）
- [x] 我的收藏列表接口
- [x] 我的发布状态筛选：已发布 / 审核中 / 驳回，并支持驳回后重新发布引导

### Phase 3: 管理后台与安全治理（基础） ✅
- [x] 管理后台页面基础框架
- [x] 审核工作台基础功能
- [x] 用户管理（列表/封禁状态更新）
- [x] 后台敏感接口鉴权收敛（`JwtAuthGuard + RolesGuard`）
- [x] 路由登录守卫与真实登录接入

### 数据结构与工程配置 ✅
- [x] `database/init.sql` 与实体主键策略对齐（自增）
- [x] `docker-compose.yml` 使用 `database/init.sql` 初始化
- [x] 小程序构建脚本修复（`UNI_INPUT_DIR=.`）

---

## 待完善项

### 功能待完善
- [ ] Feed 个性化策略仍可增强（当前已支持推荐/关注/附近分流，附近无定位时按时间+互动降级）
- [ ] 自动机审云侧生产参数仍待开通（当前可由人工审核兜底）
- [ ] 隐私设置目前为前端本地配置，尚未落库到后端

### 测试与上线待完善
- [ ] 单元测试
- [ ] 集成测试
- [ ] 性能测试
- [ ] 弱网/机型兼容测试
- [ ] 生产部署与上线提审准备

---

## 主要可用接口（当前代码）

### 认证模块
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/bind`
- `POST /api/v1/auth/send-code`
- `POST /api/v1/auth/bind/phone`
- `POST /api/v1/auth/admin/login`
- `POST /api/v1/auth/logout`

### 用户模块
- `GET /api/v1/user/profile`
- `PUT /api/v1/user/profile`
- `GET /api/v1/user/my-stats`
- `GET /api/v1/user/collections`
- `POST /api/v1/user/history`
- `GET /api/v1/user/history`

### 内容模块
- `GET /api/v1/feed/list`
- `GET /api/v1/feed/nearby`
- `GET /api/v1/feed/following`
- `GET /api/v1/feed/videos`
- `GET /api/v1/post/search`
- `POST /api/v1/post/publish`
- `GET /api/v1/post/:id`
- `GET /api/v1/post/my-posts`
- `DELETE /api/v1/post/:id`
- `GET /api/v1/oss/policy`

### 互动模块
- `POST /api/v1/interaction/like`
- `DELETE /api/v1/interaction/like`
- `POST /api/v1/interaction/collect`
- `DELETE /api/v1/interaction/collect`
- `POST /api/v1/interaction/follow`
- `GET /api/v1/interaction/following`
- `GET /api/v1/interaction/followers`
- `GET /api/v1/interaction/post-status`
- `GET /api/v1/interaction/post-status/batch`

### 圈子模块
- `GET /api/v1/circle/list`
- `GET /api/v1/circle/:id`
- `GET /api/v1/circle/:id/posts`
- `POST /api/v1/circle/join`
- `POST /api/v1/circle/leave`
- `GET /api/v1/circle/user/joined`

### 评论模块
- `GET /api/v1/comment`
- `POST /api/v1/comment`
- `DELETE /api/v1/comment/:id`
- `POST /api/v1/comment/:id/like`
- `DELETE /api/v1/comment/:id/like`
- `GET /api/v1/comment/admin/list`
- `POST /api/v1/comment/admin/:id/approve`
- `POST /api/v1/comment/admin/:id/reject`
- `POST /api/v1/comment/admin/batch-audit`

### 审核与统计模块（管理员）
- `GET /api/v1/audit/pending`
- `GET /api/v1/audit/stats`
- `GET /api/v1/audit/history/:postId`
- `POST /api/v1/audit/:postId/approve`
- `POST /api/v1/audit/:postId/reject`
- `POST /api/v1/audit/batch`
- `GET /api/v1/stats/overview`
- `GET /api/v1/stats/trend`
