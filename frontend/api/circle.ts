import http from '@/common/http';

export interface CircleItem {
  id: number;
  name: string;
  description: string;
  coverUrl: string;
  memberCount: number;
  postCount: number;
  sortOrder: number;
  isRecommend: boolean;
  createdAt: string;
}

/**
 * 获取圈子列表
 */
export const getCircleList = () => {
  return http.get('/circle/list');
};

/**
 * 获取圈子详情
 */
export const getCircleDetail = (id: number) => {
  return http.get(`/circle/${id}`);
};

/**
 * 加入圈子
 */
export const joinCircle = (circleId: number) => {
  return http.post('/circle/join', { circleId });
};

/**
 * 退出圈子
 */
export const leaveCircle = (circleId: number) => {
  return http.post('/circle/leave', { circleId });
};

/**
 * 获取圈子帖子列表
 */
export const getCirclePosts = (params: {
  circleId: number;
  page: number;
  pageSize: number;
}) => {
  return http.get('/circle/posts', { params });
};

/**
 * 获取用户加入的圈子列表
 */
export const getUserCircles = (userId: number) => {
  return http.get('/circle/my-circles', { params: { userId } });
};