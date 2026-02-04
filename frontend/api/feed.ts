import http from '@/common/http';

export interface PostItem {
  id: number;
  userId: number;
  circleId: number;
  type: number;
  title: string;
  content: string;
  mediaUrls: string[];
  videoMeta: any;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  auditStatus: number;
  createdAt: string;
  user: {
    id: number;
    nickname: string;
    avatarUrl: string;
    role: number;
  };
}

/**
 * 获取首页推荐流
 */
export const getFeedList = (params: {
  type: 'recommend' | 'nearby' | 'follow';
  page: number;
  pageSize: number;
}) => {
  return http.get('/feed/list', { params });
};

/**
 * 获取帖子详情
 */
export const getPostDetail = (id: number) => {
  return http.get(`/post/${id}`);
};

/**
 * 点赞
 */
export const likePost = (postId: number) => {
  return http.post('/interaction/like', { targetId: postId, targetType: 1 });
};

/**
 * 取消点赞
 */
export const unlikePost = (postId: number) => {
  return http.delete('/interaction/like', { data: { targetId: postId, targetType: 1 } });
};

/**
 * 收藏
 */
export const collectPost = (postId: number) => {
  return http.post('/interaction/collect', { targetId: postId, targetType: 1 });
};

/**
 * 取消收藏
 */
export const uncollectPost = (postId: number) => {
  return http.delete('/interaction/collect', { data: { targetId: postId, targetType: 1 } });
};