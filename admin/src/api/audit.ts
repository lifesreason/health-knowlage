import request from '@/utils/request';

// 获取待审核列表
export function getPendingList(params: { page: number; pageSize: number; status?: number }) {
  return request({
    url: '/audit/pending',
    method: 'get',
    params,
  });
}

// 获取审核统计
export function getAuditStats() {
  return request({
    url: '/audit/stats',
    method: 'get',
  });
}

// 获取审核历史
export function getAuditHistory(postId: number) {
  return request({
    url: `/audit/history/${postId}`,
    method: 'get',
  });
}

// 审核通过
export function approvePost(postId: number) {
  return request({
    url: `/audit/${postId}/approve`,
    method: 'post',
  });
}

// 审核驳回
export function rejectPost(postId: number, rejectReason: string) {
  return request({
    url: `/audit/${postId}/reject`,
    method: 'post',
    data: { rejectReason },
  });
}

// 批量审核
export function batchAudit(data: { postIds: number[]; action: 'approve' | 'reject'; rejectReason?: string }) {
  return request({
    url: '/audit/batch',
    method: 'post',
    data,
  });
}