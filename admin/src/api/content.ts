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
