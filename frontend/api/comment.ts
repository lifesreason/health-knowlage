/**
 * 评论相关 API
 */
import http from '@/common/http';

export const commentApi = {
  /** 获取评论列表 */
  getList(params: { postId: number; page: number; pageSize: number; rootId?: number }) {
    return http.get('/comment', { params });
  },

  /** 发表评论 */
  create(data: { postId: number; content: string; rootId?: number; replyToUserId?: number }) {
    return http.post('/comment', data);
  },

  /** 删除评论 */
  delete(id: number) {
    return http.delete(`/comment/${id}`);
  },

  /** 点赞评论 */
  like(id: number) {
    return http.post(`/comment/${id}/like`);
  },

  /** 取消点赞评论 */
  deleteLike(id: number) {
    return http.delete(`/comment/${id}/like`);
  },
};

export default commentApi;
