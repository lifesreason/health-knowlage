import http from '@/common/http';

/**
 * 获取用户信息
 */
export const getUserInfo = () => {
  return http.get('/user/profile');
};

/**
 * 更新用户信息
 */
export const updateUserInfo = (data: {
  nickname?: string;
  avatarUrl?: string;
  fontScale?: number;
}) => {
  return http.put('/user/profile', data);
};

/**
 * 退出登录
 */
export const logout = () => {
  return http.post('/auth/logout');
};