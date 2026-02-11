/**
 * 帖子相关 API
 */
import http from '@/common/http';

export const postApi = {
  /** 获取帖子详情 */
  getDetail(id: number) {
    return http.get(`/post/${id}`);
  },

  /** 发布帖子 */
  publish(data: {
    circleId: number;
    type: number;
    title?: string;
    content: string;
    mediaUrls?: string[];
  }) {
    return http.post('/post/publish', data);
  },

  /** 删除帖子 */
  delete(id: number) {
    return http.delete(`/post/${id}`);
  },

  /** 获取 OSS 上传凭证 */
  getOssPolicy(data: { filename: string; type: string }) {
    return http.post('/oss/policy', data);
  },

  /** 上传文件到 OSS */
  uploadToOss(url: string, formData: Record<string, any>, filePath: string) {
    return new Promise((resolve, reject) => {
      uni.uploadFile({
        url,
        filePath,
        name: 'file',
        formData,
        success: (res) => resolve(res),
        fail: (err) => reject(err),
      });
    });
  },

  /** 搜索帖子 */
  search(params: { keyword: string; page: number; pageSize: number }) {
    return http.get('/post/search', { params });
  },
};

export default postApi;
