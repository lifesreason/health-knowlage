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
  getOssPolicy(params: { fileType: 'image' | 'video' }) {
    return http.get('/oss/policy', { params });
  },

  /** 上传文件到 OSS */
  uploadToOss(policy: {
    host: string;
    fileName: string;
    policy: string;
    accessKeyId: string;
    signature: string;
  }, filePath: string) {
    return new Promise((resolve, reject) => {
      uni.uploadFile({
        url: policy.host,
        filePath,
        name: 'file',
        formData: {
          key: policy.fileName,
          policy: policy.policy,
          OSSAccessKeyId: policy.accessKeyId,
          signature: policy.signature,
          success_action_status: '200',
        },
        success: (res) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(`${policy.host}/${policy.fileName}`);
            return;
          }
          reject(new Error(`OSS 上传失败: ${res.statusCode}`));
        },
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
