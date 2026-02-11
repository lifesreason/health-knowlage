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
  updateProfile(data: { nickname?: string; avatar?: string }) {
    return http.put('/user/profile', data);
  },

  /** 获取用户统计数据 */
  getStats() {
    return http.get('/user/stats');
  },

  /** 获取用户发布列表 */
  getMyPosts(params: { page: number; pageSize: number }) {
    return http.get('/user/posts', { params });
  },

  /** 获取用户收藏列表 */
  getCollections(params: { page: number; pageSize: number }) {
    return http.get('/user/collections', { params });
  },

  /** 获取浏览历史 */
  getHistory(params: { page: number; pageSize: number }) {
    return http.get('/user/history', { params });
  },
};

export default userApi;
