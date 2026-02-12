import request from '@/utils/request';

export function adminLogin(data: { username: string; password: string }) {
  return request({
    url: '/auth/admin/login',
    method: 'post',
    data,
  });
}
