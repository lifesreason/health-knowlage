import request from '@/utils/request';

// 获取用户列表
export function getUserList(params: { page: number; pageSize: number; keyword?: string }) {
  return request({
    url: '/user/list',
    method: 'get',
    params,
  });
}

// 更新用户状态
export function updateUserStatus(userId: number, status: number) {
  return request({
    url: `/user/${userId}/status`,
    method: 'put',
    data: { status },
  });
}