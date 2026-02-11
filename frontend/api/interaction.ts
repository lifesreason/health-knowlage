/**
 * 互动相关 API（点赞、收藏、关注）
 */
import http from '@/common/http';

export const interactionApi = {
  /** 点赞/取消点赞 */
  like(data: { targetId: number; targetType: 'post' | 'comment' }) {
    return http.post('/interaction/like', data);
  },

  /** 收藏/取消收藏 */
  collect(data: { targetId: number; targetType: 'post' }) {
    return http.post('/interaction/collect', data);
  },

  /** 关注/取消关注用户 */
  follow(data: { userId: number }) {
    return http.post('/interaction/follow', data);
  },

  /** 获取我关注的用户列表 */
  getFollowing(params: { page: number; pageSize: number }) {
    return http.get('/interaction/following', { params });
  },

  /** 获取我的粉丝列表 */
  getFollowers(params: { page: number; pageSize: number }) {
    return http.get('/interaction/followers', { params });
  },
};

export default interactionApi;
