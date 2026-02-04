import http from 'luch-request';
import { useUserStore } from '@/store/user';

// 基础配置
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const instance = http.create({
  baseURL,
  timeout: 30000,
  header: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    // 添加 Token
    const userStore = useUserStore();
    if (userStore.token) {
      config.header.Authorization = `Bearer ${userStore.token}`;
    }

    // 显示 Loading
    if (config.loading !== false) {
      uni.showLoading({
        title: '加载中...',
        mask: true,
      });
    }

    return config;
  },
  (config) => {
    return Promise.reject(config);
  },
);

// 响应拦截器
instance.interceptors.response.use(
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
  (error) => {
    // 隐藏 Loading
    uni.hideLoading();

    const { statusCode, data } = error;

    // 401 未授权，清除登录信息
    if (statusCode === 401) {
      const userStore = useUserStore();
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
  },
);

export default instance;