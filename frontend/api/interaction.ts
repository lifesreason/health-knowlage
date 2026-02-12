/**
 * 互动相关 API（点赞、收藏、关注）
 */
import http from '@/common/http';

export const interactionApi = {
  toTargetType(targetType: 'post' | 'comment') {
    return targetType === 'post' ? 1 : 2;
  },

  /** 点赞/取消点赞 */
  like(data: { targetId: number; targetType: 'post' | 'comment' }) {
    return http.post('/interaction/like', {
      targetId: data.targetId,
      targetType: this.toTargetType(data.targetType),
    });
  },

  unlike(data: { targetId: number; targetType: 'post' | 'comment' }) {
    return http.delete('/interaction/like', {
      targetId: data.targetId,
      targetType: this.toTargetType(data.targetType),
    });
  },

  /** 收藏/取消收藏 */
  collect(data: { targetId: number; targetType: 'post' }) {
    return http.post('/interaction/collect', {
      targetId: data.targetId,
      targetType: this.toTargetType(data.targetType),
    });
  },

  uncollect(data: { targetId: number; targetType: 'post' }) {
    return http.delete('/interaction/collect', {
      targetId: data.targetId,
      targetType: this.toTargetType(data.targetType),
    });
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

  /** 获取单个帖子互动状态 */
  getPostStatus(postId: number) {
    return http.get('/interaction/post-status', { params: { postId } });
  },

  /** 批量获取帖子互动状态 */
  getPostBatchStatus(postIds: number[]) {
    return http.get('/interaction/post-status/batch', {
      params: { postIds: postIds.join(',') },
    });
  },
};

export default interactionApi;
