/**
 * 评论相关 API
 */
import http from '@/common/http';

export const commentApi = {
  /** 获取评论列表 */
  getList(params: { postId: number; page: number; pageSize: number }) {
    return http.get('/comment/list', { params });
  },

  /** 发表评论 */
  create(data: { postId: number; content: string; parentId?: number }) {
    return http.post('/comment/create', data);
  },

  /** 删除评论 */
  delete(id: number) {
    return http.delete(`/comment/${id}`);
  },

  /** 点赞评论 */
  like(id: number) {
    return http.post(`/comment/${id}/like`);
  },
};

export default commentApi;
