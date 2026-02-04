import http from '@/common/http';

/**
 * 获取 OSS 上传签名
 */
export const getOssPolicy = (fileType: 'image' | 'video') => {
  return http.get('/oss/policy', { params: { fileType } });
};

/**
 * 发布图文
 */
export const publishImagePost = (data: {
  circleId: number;
  title: string;
  content: string;
  mediaUrls: string[];
}) => {
  return http.post('/post/publish', {
    type: 1,
    ...data,
  });
};

/**
 * 发布视频
 */
export const publishVideoPost = (data: {
  circleId: number;
  title: string;
  content: string;
  videoUrl: string;
  videoMeta: {
    duration: number;
    coverUrl: string;
    size: number;
  };
}) => {
  return http.post('/post/publish', {
    type: 2,
    ...data,
  });
};

/**
 * 获取我的发布列表
 */
export const getMyPosts = (params: {
  status: 'published' | 'audit';
  page: number;
  pageSize: number;
}) => {
  return http.get('/post/my-posts', { params });
};