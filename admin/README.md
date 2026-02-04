# 银龄健康 - 管理后台

基于 Vue 3 + Element Plus + Vite 的管理后台系统。

## 技术栈

- Vue 3.3+
- Element Plus 2.4+
- Vite 5.0+
- TypeScript
- Pinia
- Vue Router 4
- Axios

## 功能模块

- 首页仪表盘 - 系统统计和快捷操作
- 内容审核 - 人工审核工作台
- 用户管理 - 用户列表和状态管理

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3001

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## 默认账号

- 用户名: admin
- 密码: admin123

## 目录结构

```
admin/
├── src/
│   ├── api/          # API 接口
│   ├── components/   # 公共组件
│   ├── layout/       # 布局组件
│   ├── router/       # 路由配置
│   ├── store/        # 状态管理
│   ├── styles/       # 全局样式
│   ├── utils/        # 工具函数
│   ├── views/        # 页面组件
│   │   ├── audit/    # 审核页面
│   │   ├── user/     # 用户管理
│   │   ├── dashboard/# 首页
│   │   └── login/    # 登录页
│   ├── App.vue       # 根组件
│   └── main.ts       # 入口文件
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 注意事项

1. 后端服务需要运行在 http://localhost:3000
2. 开发环境已配置代理，所有 /api 请求会自动转发到后端
3. 生产环境需要配置正确的 API 地址

## 开发建议

1. 使用 TypeScript 进行类型检查
2. 遵循 Vue 3 Composition API 最佳实践
3. 组件使用 setup script 语法
4. 使用 Element Plus 组件库保持 UI 一致性