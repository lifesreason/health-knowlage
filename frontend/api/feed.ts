/**
 * 信息流 API
 */
import http from '@/common/http';

export const feedApi = {
  /** 获取推荐列表 */
  getList(params: { type: string; page: number; pageSize: number }) {
    return http.get('/feed/list', { params });
  },

  /** 获取视频列表 */
  getVideoList(params: { page: number; pageSize: number }) {
    return http.get('/feed/videos', { params });
  },

  /** 获取附近内容 */
  getNearbyList(params: { lat?: number; lng?: number; page: number; pageSize: number }) {
    return http.get('/feed/nearby', { params });
  },

  /** 获取关注用户内容 */
  getFollowingList(params: { page: number; pageSize: number }) {
    return http.get('/feed/following', { params });
  },
};

export default feedApi;
