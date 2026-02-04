# HBuilderX 项目使用指南

## 快速开始

### 1. 在 HBuilderX 中打开项目

1. 打开 HBuilderX
2. 文件 → 打开目录
3. 选择 `hbuilderx-project` 文件夹

### 2. 安装依赖

在 HBuilderX 终端或系统终端中运行：

```bash
cd hbuilderx-project
npm install
```

### 3. 运行项目

**方式一：使用 HBuilderX 菜单**
- 运行 → 运行到小程序模拟器 → 微信开发者工具

**方式二：使用快捷键**
- Windows: Ctrl + R
- Mac: Cmd + R

## 项目目录结构

```
hbuilderx-project/
├── api/              # API 接口层
│   ├── auth.ts       # 认证接口
│   ├── user.ts       # 用户接口
│   ├── feed.ts       # 内容流接口
│   ├── circle.ts     # 圈子接口
│   ├── publish.ts    # 发布接口
│   └── comment.ts    # 评论接口
├── common/           # 公共工具
│   └── http.ts       # 网络请求封装
├── components/       # 全局组件
│   ├── auth-modal.vue      # 登录弹窗
│   ├── comment-modal.vue   # 评论弹窗
│   └── empty-state.vue     # 空状态组件
├── pages/            # 页面
│   ├── index/        # 首页
│   ├── video/        # 视频页
│   ├── me/           # 我的
│   ├── detail/       # 内容详情
│   ├── circle/       # 圈子列表
│   ├── circle-detail/# 圈子详情
│   ├── publisher/    # 发布器
│   ├── publish/      # 旧发布页（保留）
│   └── settings/     # 设置页
├── static/           # 静态资源
│   ├── tabbar/       # 底部导航图标
│   └── images/       # 图片资源
├── store/            # 状态管理
│   ├── theme.ts      # 主题/字体设置
│   └── user.ts       # 用户信息
├── styles/           # 全局样式
│   └── font-scale.scss # 适老化字体样式
├── uni_modules/      # uni-app 插件目录
├── App.vue           # 应用入口
├── main.js           # 主入口文件
├── manifest.json     # 应用配置
├── pages.json        # 页面路由配置
└── package.json      # 依赖配置
```

## 主要功能页面

### 首页 (pages/index)
- 推荐内容流
- Tab 切换（推荐/附近/关注）
- 下拉刷新/上拉加载

### 圈子 (pages/circle)
- 圈子列表
- 搜索功能

### 圈子详情 (pages/circle-detail)
- 圈子信息
- 加入/退出圈子
- 圈子帖子列表

### 发布器 (pages/publisher)
- 图文发布
- 视频发布
- 圈子选择
- 话题添加

### 我的 (pages/me)
- 个人信息
- 设置入口
- 功能导航

## 配置说明

### manifest.json
- 小程序 AppID 配置
- 应用名称、版本号
- 权限配置

### pages.json
- 页面路由配置
- 全局样式配置
- TabBar 配置
- easycom 自动导入配置

## 依赖说明

主要依赖：

- **vue**: 3.4.21 - Vue 3 框架
- **pinia**: 2.1.7 - 状态管理
- **uview-plus**: 3.2.11 - UI 组件库
- **luch-request**: 3.1.1 - 网络请求
- **mp-html**: 1.5.1 - 富文本渲染

## 开发注意事项

### 1. TypeScript 支持

项目使用 TypeScript 开发，但在 HBuilderX 中也可以直接运行。如果需要更好的类型提示，建议使用 VS Code + Volar。

### 2. 组件自动导入

已配置 easycom，无需手动引入组件：

```vue
<template>
  <u-button type="primary">按钮</u-button>
  <auth-modal />
</template>
```

### 3. 状态管理

使用 Pinia 进行状态管理：

```javascript
import { useUserStore } from '@/store/user'

const userStore = useUserStore()
```

### 4. 网络请求

使用封装的 http 工具：

```javascript
import http from '@/common/http'

http.get('/api/xxx')
http.post('/api/xxx', data)
```

## 常见问题

### Q: 依赖安装失败？
A: 尝试清理缓存后重新安装：
```bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Q: 运行时报错？
A: 
1. 检查 Node.js 版本是否 >= 18
2. 确保已安装所有依赖
3. 清除 HBuilderX 缓存：工具 → 清除缓存

### Q: 如何配置小程序 AppID？
A: 在 `manifest.json` 中配置 mp-weixin 的 appid

### Q: 如何真机调试？
A: 运行 → 运行到小程序模拟器 → 真机调试

## 下一步

1. 配置小程序 AppID
2. 配置后端 API 地址
3. 配置 OSS 访问密钥
4. 开始开发！