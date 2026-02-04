import http from '@/common/http';

/**
 * 获取评论列表
 */
export function getComments(params: {
  postId: number;
  page: number;
  pageSize: number;
}) {
  return http.get('/comment/list', params);
}

/**
 * 创建评论
 */
export function createComment(data: {
  postId: number;
  content: string;
  rootId?: number;
  replyToUserId?: number;
}) {
  return http.post('/comment/create', data);
}

/**
 * 点赞评论
 */
export function likeComment(commentId: number) {
  return http.post(`/comment/${commentId}/like`);
}

/**
 * 取消点赞评论
 */
export function unlikeComment(commentId: number) {
  return http.delete(`/comment/${commentId}/like`);
}