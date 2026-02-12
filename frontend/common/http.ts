/**
 * HTTP 请求封装
 * 基于 luch-request，支持 Token 注入、错误处理、Loading 状态
 */
import Request from 'luch-request';
import { useUserStore } from '@/store/user';

// 基础配置 - 开发环境使用本地后端地址
// 注意：微信小程序开发时需要在开发者工具中开启【不校验合法域名】选项
const baseURL = 'http://localhost:3000/api/v1';

// 创建实例
const http = new Request({
  baseURL,
  timeout: 30000,
  header: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
type PendingRequest = {
  config: any;
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
};
const pendingRequests: PendingRequest[] = [];

const retryRequestWithToken = (config: any, token: string) => {
  const nextConfig = { ...config };
  nextConfig.header = nextConfig.header || {};
  nextConfig.header.Authorization = `Bearer ${token}`;
  nextConfig.loading = false;
  nextConfig.__isRetryRequest = true;
  return http.request(nextConfig);
};

const requestRefreshToken = async (refreshToken: string) => {
  return new Promise<{ accessToken: string; refreshToken: string }>((resolve, reject) => {
    uni.request({
      url: `${baseURL}/auth/refresh`,
      method: 'POST',
      data: { refreshToken },
      header: { 'Content-Type': 'application/json' },
      success: (res) => {
        const data: any = res.data;
        if (res.statusCode === 200 && data?.code === 0 && data?.data?.accessToken) {
          resolve(data.data);
          return;
        }
        reject(new Error(data?.msg || '刷新登录失败'));
      },
      fail: (err) => reject(err),
    });
  });
};

const flushPendingRequests = (error: Error | null, token?: string) => {
  const queue = pendingRequests.splice(0, pendingRequests.length);
  queue.forEach((item) => {
    if (error || !token) {
      item.reject(error || new Error('登录已过期'));
      return;
    }
    retryRequestWithToken(item.config, token).then(item.resolve).catch(item.reject);
  });
};

// 请求拦截器
http.interceptors.request.use(
  (config) => {
    // 添加 Token
    const userStore = useUserStore();
    if (userStore.token) {
      config.header = config.header || {};
      config.header.Authorization = `Bearer ${userStore.token}`;
    }

    // 显示 Loading（可通过 config.loading = false 关闭）
    if ((config as any).loading !== false) {
      uni.showLoading({
        title: '加载中...',
        mask: true,
      });
    }

    return config;
  },
  async (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
http.interceptors.response.use(
  (response) => {
    // 隐藏 Loading
    uni.hideLoading();

    const { data } = response;

    // 业务成功
    if (data.code === 0) {
      return data.data;
    }

    // 业务失败
    uni.showToast({
      title: data.msg || '请求失败',
      icon: 'none',
      duration: 2000,
    });

    return Promise.reject(new Error(data.msg || '请求失败'));
  },
  async (error) => {
    // 隐藏 Loading
    uni.hideLoading();

    const { statusCode, data } = error;
    const originalConfig = (error as any)?.config || {};
    const requestUrl = originalConfig?.url || '';
    const isRefreshRequest = typeof requestUrl === 'string' && requestUrl.includes('/auth/refresh');
    const isRetryRequest = !!originalConfig?.__isRetryRequest;

    // 401 未授权
    if (statusCode === 401) {
      const userStore = useUserStore();
      if (!isRefreshRequest && !isRetryRequest) {
        const refreshToken = uni.getStorageSync('refreshToken');
        if (!refreshToken) {
          userStore.logout();
          uni.showToast({
            title: '登录已过期，请重新登录',
            icon: 'none',
            duration: 2000,
          });
          return Promise.reject(new Error('登录已过期'));
        }

        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            pendingRequests.push({ config: originalConfig, resolve, reject });
          });
        }

        isRefreshing = true;
        try {
          const tokens = await requestRefreshToken(refreshToken);
          userStore.setToken(tokens.accessToken);
          if (tokens.refreshToken) {
            uni.setStorageSync('refreshToken', tokens.refreshToken);
          }
          flushPendingRequests(null, tokens.accessToken);
          return retryRequestWithToken(originalConfig, tokens.accessToken);
        } catch {
          userStore.logout();
          const refreshError = new Error('登录已过期');
          flushPendingRequests(refreshError);
          uni.showToast({
            title: '登录已过期，请重新登录',
            icon: 'none',
            duration: 2000,
          });
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      userStore.logout();
      uni.showToast({
        title: '登录已过期，请重新登录',
        icon: 'none',
        duration: 2000,
      });

      return Promise.reject(new Error('登录已过期'));
    }

    // 网络错误
    if (statusCode === 0 || !statusCode) {
      uni.showToast({
        title: '网络连接失败',
        icon: 'none',
        duration: 2000,
      });
      return Promise.reject(new Error('网络连接失败'));
    }

    // 其他错误
    const errorMsg = data?.msg || `请求失败 (${statusCode})`;
    uni.showToast({
      title: errorMsg,
      icon: 'none',
      duration: 2000,
    });

    return Promise.reject(new Error(errorMsg));
  }
);

export default http;
