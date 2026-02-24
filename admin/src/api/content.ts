import request from '@/utils/request';

// 获取帖子列表（管理后台）
export function getPostList(params: {
  page: number;
  pageSize: number;
  keyword?: string;
  status?: number;
  circleId?: number;
}) {
  return request({
    url: '/post/admin/list',
    method: 'get',
    params,
  });
}

// 删除帖子
export function deletePost(id: number) {
  return request({
    url: `/post/admin/${id}`,
    method: 'delete',
  });
}

// 创建帖子（管理后台）
export function createPost(data: {
  circleId: number;
  type: number;
  title?: string;
  content: string;
  coverUrl?: string;
  mediaUrls?: string[];
}) {
  return request({
    url: '/post/admin/create',
    method: 'post',
    data,
  });
}

// 获取评论列表（管理后台）
export function getCommentList(params: {
  page: number;
  pageSize: number;
  keyword?: string;
  postId?: number;
  status?: number;
}) {
  return request({
    url: '/comment/admin/list',
    method: 'get',
    params,
  });
}

// 删除评论
export function deleteComment(id: number) {
  return request({
    url: `/comment/admin/${id}`,
    method: 'delete',
  });
}

// 审核通过评论
export function approveComment(id: number) {
  return request({
    url: `/comment/admin/${id}/approve`,
    method: 'post',
  });
}

// 审核驳回评论
export function rejectComment(id: number) {
  return request({
    url: `/comment/admin/${id}/reject`,
    method: 'post',
  });
}

// 批量审核评论
export function batchAuditComments(data: { commentIds: number[]; action: 'approve' | 'reject' }) {
  return request({
    url: '/comment/admin/batch-audit',
    method: 'post',
    data,
  });
}

// 获取数据统计
export function getOverviewStats() {
  return request({
    url: '/stats/overview',
    method: 'get',
  });
}

// 获取趋势数据
export function getTrendStats(params: { days: number }) {
  return request({
    url: '/stats/trend',
    method: 'get',
    params,
  });
}

// 获取推荐缓存统计
export function getFeedCacheStats(params?: { windowMinutes?: number }) {
  return request({
    url: '/stats/feed-cache',
    method: 'get',
    params,
  });
}
