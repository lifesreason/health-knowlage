import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: () => import('@/layout/index.vue'),
      redirect: '/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('@/views/dashboard/index.vue'),
          meta: { title: '首页', icon: 'Odometer' },
        },
        {
          path: 'user',
          name: 'User',
          component: () => import('@/views/user/index.vue'),
          meta: { title: '用户管理', icon: 'User' },
        },
        {
          path: 'circle',
          name: 'Circle',
          component: () => import('@/views/circle/index.vue'),
          meta: { title: '圈子管理', icon: 'Opportunity' },
        },
        {
          path: 'content',
          name: 'Content',
          component: () => import('@/views/content/index.vue'),
          meta: { title: '内容管理', icon: 'Document' },
        },
        {
          path: 'comment',
          name: 'Comment',
          component: () => import('@/views/comment/index.vue'),
          meta: { title: '评论管理', icon: 'ChatDotRound' },
        },
        {
          path: 'audit',
          name: 'Audit',
          component: () => import('@/views/audit/index.vue'),
          meta: { title: '内容审核', icon: 'Checked' },
        },
        {
          path: 'statistics',
          name: 'Statistics',
          component: () => import('@/views/statistics/index.vue'),
          meta: { title: '数据统计', icon: 'DataLine' },
        },
        {
          path: 'settings',
          name: 'Settings',
          component: () => import('@/views/settings/index.vue'),
          meta: { title: '系统设置', icon: 'Setting' },
        },
      ],
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/login/index.vue'),
      meta: { title: '登录' },
    },
  ],
});

export default router;