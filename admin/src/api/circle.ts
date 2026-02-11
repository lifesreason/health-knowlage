import request from '@/utils/request';

// 获取圈子列表（管理后台）
export function getCircleList(params: { page: number; pageSize: number; keyword?: string }) {
  return request({
    url: '/circle/admin/list',
    method: 'get',
    params,
  });
}

// 创建圈子
export function createCircle(data: {
  name: string;
  description?: string;
  coverUrl?: string;
  sortOrder?: number;
  isRecommend?: boolean;
}) {
  return request({
    url: '/circle/admin/create',
    method: 'post',
    data,
  });
}

// 更新圈子
export function updateCircle(id: number, data: {
  name?: string;
  description?: string;
  coverUrl?: string;
  sortOrder?: number;
  isRecommend?: boolean;
}) {
  return request({
    url: `/circle/admin/${id}`,
    method: 'put',
    data,
  });
}

// 删除圈子
export function deleteCircle(id: number) {
  return request({
    url: `/circle/admin/${id}`,
    method: 'delete',
  });
}
