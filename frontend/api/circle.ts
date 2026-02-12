/**
 * 圈子相关 API
 */
import http from '@/common/http';

export const circleApi = {
  /** 获取圈子列表 */
  getList(params?: { page?: number; pageSize?: number }) {
    return http.get('/circle/list', { params });
  },

  /** 获取圈子详情 */
  getDetail(id: number) {
    return http.get(`/circle/${id}`);
  },

  /** 获取圈子帖子列表 */
  getPosts(id: number, params: { page: number; pageSize: number }) {
    return http.get(`/circle/${id}/posts`, { params });
  },

  /** 加入圈子 */
  join(id: number) {
    return http.post('/circle/join', { circleId: id });
  },

  /** 退出圈子 */
  leave(id: number) {
    return http.post('/circle/leave', { circleId: id });
  },

  /** 获取我加入的圈子 */
  getMyCircles() {
    return http.get('/circle/user/joined');
  },
};

export default circleApi;
