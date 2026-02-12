/**
 * 用户相关 API
 */
import http from '@/common/http';

export const userApi = {
  /** 获取用户信息 */
  getProfile() {
    return http.get('/user/profile');
  },

  /** 更新用户信息 */
  updateProfile(data: { nickname?: string; avatarUrl?: string; fontScale?: number }) {
    return http.put('/user/profile', data);
  },

  /** 获取用户统计数据 */
  getStats() {
    return http.get('/user/my-stats');
  },

  /** 获取用户发布列表 */
  getMyPosts(params: { status?: 'published' | 'audit'; page: number; pageSize: number }) {
    return http.get('/post/my-posts', { params });
  },

  /** 获取用户收藏列表 */
  getCollections(params: { page: number; pageSize: number }) {
    return http.get('/user/collections', { params });
  },

  /** 获取浏览历史 */
  getHistory(params: { page: number; pageSize: number }) {
    return http.get('/user/history', { params });
  },

  /** 记录浏览历史 */
  recordHistory(data: { postId: number }) {
    return http.post('/user/history', data);
  },
};

export default userApi;
