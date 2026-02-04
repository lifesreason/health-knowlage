# 智慧养生学堂

专为中老年人打造的养生知识学习平台，提供营养饮食、健康避坑、适老化运动、政策常识等丰富课程。

## 项目简介

智慧养生学堂是一个适老化设计的在线学习平台，专注于为中老年人提供优质的健康养生知识和便捷的学习体验。

### 核心特色

- 🎨 **适老化设计** - 可调节字体大小、大点击热区、高对比度色彩
- 📚 **优质课程** - 食物、禁忌、健身、银龄无忧四大分类
- 🎓 **学习记录** - 完整的学习历史和进度跟踪
- 🔒 **安全可靠** - 实名认证、内容审核、隐私保护
- 💜 **舒适体验** - 紫色系视觉设计，护眼配色

## 技术架构

### 后端
- **框架**: NestJS
- **数据库**: MySQL 8.0
- **缓存**: Redis 6.0
- **认证**: JWT
- **文档**: Swagger

### 前端 (小程序)
- **框架**: Uni-app (Vue 3)
- **工具**: HBuilderX
- **UI**: uView Plus
- **状态**: Pinia
- **请求**: luch-request

### 管理后台
- **框架**: Vue 3
- **UI**: Element Plus
- **构建**: Vite
- **语言**: TypeScript

## 项目结构

```
health-knowlage/
├── backend/           # 后端服务
│   ├── src/
│   │   ├── common/    # 公共模块
│   │   ├── config/    # 配置
│   │   ├── entities/  # 数据库实体
│   │   └── modules/   # 业务模块
│   ├── package.json
│   └── tsconfig.json
├── frontend/          # 小程序前端 (HBuilderX)
│   ├── api/           # API 接口
│   ├── common/        # 公共工具
│   ├── components/    # 组件
│   ├── pages/         # 页面
│   ├── static/        # 静态资源
│   ├── store/         # 状态管理
│   ├── styles/        # 全局样式
│   ├── uni_modules/   # uni-app 插件
│   ├── App.vue
│   ├── main.js
│   ├── manifest.json
│   ├── pages.json
│   └── package.json
├── admin/             # 管理后台
│   ├── src/
│   │   ├── api/       # API 接口
│   │   ├── layout/    # 布局
│   │   ├── views/     # 页面
│   │   └── router/    # 路由
│   ├── package.json
│   └── vite.config.ts
├── database/          # 数据库脚本
│   └── init.sql
└── doc/               # 项目文档
```

## 快速开始

### 环境要求

- Node.js >= 18.0
- MySQL >= 8.0
- Redis >= 6.0
- HBuilderX (开发小程序)
- 微信开发者工具

### 安装依赖

```bash
# 后端
cd backend
npm install

# 小程序前端
cd frontend
npm install

# 管理后台
cd admin
npm install
```

### 配置环境变量

#### 后端配置 (backend/.env)

```env
# 数据库
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DATABASE=silverhealth

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d

# 微信小程序
WECHAT_APPID=your_appid
WECHAT_SECRET=your_secret

# OSS
OSS_ACCESS_KEY_ID=your_access_key
OSS_ACCESS_KEY_SECRET=your_secret
OSS_BUCKET=your_bucket
OSS_REGION=your_region
```

#### 前端配置 (frontend/manifest.json)

在 manifest.json 中配置小程序 AppID。

### 初始化数据库

```bash
mysql -u root -p < database/init.sql
```

### 启动服务

#### 后端服务

```bash
cd backend
npm run start:dev
```

访问 Swagger 文档: http://localhost:3000/api/docs

#### 小程序前端

**使用 HBuilderX:**

1. 打开 HBuilderX
2. 文件 → 打开目录
3. 选择 `frontend` 目录
4. 运行 → 运行到小程序模拟器 → 微信开发者工具

**安装依赖：**
```bash
cd frontend
npm install
```

#### 管理后台

```bash
cd admin
npm run dev
```

访问: http://localhost:3001

默认账号: admin / admin123

## 功能模块

### 用户端

- ✅ 微信登录
- ✅ 手机号绑定
- ✅ 个人中心
- ✅ 字体设置 (适老化)
- ✅ 学习记录

### 内容模块

- ✅ 首页课程推荐
- ✅ 课程分类浏览
- ✅ 图文课程学习
- ✅ 视频课程学习
- ✅ 课程详情
- ✅ 点赞收藏
- ✅ 评论互动

### 课程分类

- 🍚 **食物** - 营养饮食课程
- ⚠️ **禁忌** - 健康避坑课程
- 🏃 **健身** - 适老化运动课程
- 🌿 **银龄无忧** - 政策与常识课程

### 审核模块

- ✅ 课程审核
- ✅ 人工审核
- ✅ 批量审核
- ✅ 审核历史

### 管理模块

- ✅ 用户管理
- ✅ 封禁/解封
- ✅ 数据统计
- ✅ 课程发布 (仅管理员)

## API 接口

详细接口文档请查看 Swagger: http://localhost:3000/api/docs

### 主要接口

| 接口 | 方法 | 描述 |
|------|------|------|
| /auth/login | POST | 微信登录 |
| /auth/bind | POST | 绑定手机号 |
| /feed/list | GET | 获取推荐流 |
| /post/publish | POST | 发布内容 |
| /circle/list | GET | 获取圈子列表 |
| /comment/list | GET | 获取评论列表 |
| /audit/pending | GET | 获取待审核列表 |

## 数据库设计

主要数据表:

- `sys_user` - 用户表
- `sys_doctor_profile` - 医师认证表
- `biz_circle` - 圈子表
- `biz_post` - 帖子表
- `biz_comment` - 评论表
- `biz_like` - 点赞表
- `sys_audit_log` - 审核日志表

详细设计请查看: `doc/数据库设计文档.md`

## 适老化设计

### 字体倍率

- 标准: 1.0x
- 大字: 1.2x
- 特大: 1.4x

### 交互设计

- 点击热区 >= 44px
- 大字体显示
- 高对比度色彩
- 简化操作流程

## 开发规范

### 前端 (HBuilderX)

- 使用 Vue 3 Composition API
- 组件使用 setup script 语法
- 遵循 ESLint 代码规范
- 使用 Pinia 进行状态管理

### 后端

- 遵循 NestJS 最佳实践
- 使用 TypeORM 操作数据库
- 接口统一返回格式
- 添加 Swagger 注解

## 测试

```bash
# 后端测试
cd backend
npm run test

# 前端测试
cd frontend
# 在 HBuilderX 中运行
```

## 部署

### 后端部署

```bash
cd backend
npm run build
pm2 start dist/main.js
```

### 前端部署

```bash
cd frontend
# 在 HBuilderX 中发行 → 小程序-微信
```

### 管理后台部署

```bash
cd admin
npm run build
```

## 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 许可证

本项目采用 MIT 许可证。

## 联系方式

如有问题，请提交 Issue 或联系项目维护者。

---

**最后更新**: 2026-02-04

**版本**: 1.0.0 (智慧养生学堂)