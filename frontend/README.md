# 银龄健康社区小程序 - HBuilderX 版本

## 项目说明

这是专为 HBuilderX 准备的 Uni-app 项目版本。

## 如何在 HBuilderX 中使用

### 方法一：导入现有项目

1. 打开 HBuilderX
2. 文件 → 打开目录
3. 选择 `hbuilderx-project` 目录

### 方法二：新建项目（推荐）

1. 打开 HBuilderX
2. 文件 → 新建 → 项目
3. 选择「uni-app」→「Vue3」模板
4. 创建后将本项目的文件覆盖到新项目中：
   - `pages/` - 所有页面
   - `components/` - 所有组件
   - `api/` - API 接口
   - `store/` - 状态管理
   - `styles/` - 全局样式
   - `static/` - 静态资源
   - `common/` - 公共工具
   - `App.vue` - 应用配置
   - `main.js` - 入口文件
   - `manifest.json` - 应用配置
   - `pages.json` - 页面路由

## 安装依赖

```bash
npm install
```

## 运行项目

### 微信小程序

1. 运行 → 运行到小程序模拟器 → 微信开发者工具
2. 或者：Ctrl + R (Windows) / Cmd + R (Mac)

### H5

1. 运行 → 运行到浏览器 → Chrome
2. 或者：Ctrl + R (Windows) / Cmd + R (Mac)

## 项目结构

```
hbuilderx-project/
├── api/              # API 接口
│   ├── auth.ts
│   ├── user.ts
│   ├── feed.ts
│   ├── circle.ts
│   ├── publish.ts
│   └── comment.ts
├── components/       # 组件
│   ├── auth-modal.vue
│   ├── comment-modal.vue
│   └── empty-state.vue
├── pages/            # 页面
│   ├── index/        # 首页
│   ├── video/        # 视频
│   ├── me/           # 我的
│   ├── detail/       # 详情
│   ├── circle/       # 圈子列表
│   ├── circle-detail/# 圈子详情
│   └── publisher/    # 发布器
├── static/           # 静态资源
│   ├── tabbar/
│   └── images/
├── store/            # 状态管理
│   ├── theme.ts
│   └── user.ts
├── styles/           # 全局样式
│   └── font-scale.scss
├── common/           # 公共工具
│   └── http.ts
├── uni_modules/      # uni-app 插件
├── App.vue           # 应用配置
├── main.js           # 入口文件
├── manifest.json     # 应用配置
├── pages.json        # 页面路由
└── package.json      # 依赖配置
```

## 注意事项

1. **依赖安装**: 确保在项目根目录运行 `npm install`
2. **uni_modules**: HBuilderX 会自动识别 uni_modules 目录中的插件
3. **easycom**: 已配置自动导入组件，无需手动引入
4. **页面路由**: 所有页面配置在 pages.json 中

## 常见问题

### 依赖安装失败

```bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### 运行时报错

1. 检查 Node.js 版本是否 >= 18
2. 确保已安装所有依赖
3. 清理 HBuilderX 缓存：工具 → 清除缓存

## 开发规范

- 使用 Vue 3 Composition API
- 使用 TypeScript（可选）
- 组件使用 setup script 语法
- 遵循 ESLint 代码规范

## 技术支持

如有问题，请查看：
- HBuilderX 官方文档: https://uniapp.dcloud.net.cn/
- Vue 3 文档: https://cn.vuejs.org/
- uView Plus 文档: https://uview-plus.jiangruyi.com/