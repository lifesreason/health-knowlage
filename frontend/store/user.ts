import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface UserInfo {
  id: number;
  openid: string;
  nickname: string;
  avatarUrl: string;
  role: number;
  fontScale: number;
  isVerified: boolean;
}

export const useUserStore = defineStore(
  'user',
  () => {
    // 用户信息
    const userInfo = ref<UserInfo | null>(null);

    // Token
    const token = ref('');

    // 初始化时从本地存储加载
    const init = () => {
      const savedToken = uni.getStorageSync('token');
      const savedUserInfo = uni.getStorageSync('userInfo');
      
      if (savedToken) {
        token.value = savedToken;
      }
      
      if (savedUserInfo) {
        userInfo.value = savedUserInfo;
      }
    };

    // 设置用户信息
    const setUserInfo = (info: UserInfo) => {
      userInfo.value = info;
      uni.setStorageSync('userInfo', info);
    };

    // 设置 Token
    const setToken = (newToken: string) => {
      token.value = newToken;
      uni.setStorageSync('token', newToken);
    };

    // 登出
    const logout = () => {
      userInfo.value = null;
      token.value = '';
      uni.removeStorageSync('token');
      uni.removeStorageSync('userInfo');
    };

    // 检查是否已登录
    const isLoggedIn = () => {
      return !!token.value;
    };

    // 检查是否为认证医师
    const isDoctor = () => {
      return userInfo.value?.role === 1;
    };

    // 检查是否为管理员
    const isAdmin = () => {
      return userInfo.value?.role === 9;
    };

    return {
      userInfo,
      token,
      init,
      setUserInfo,
      setToken,
      logout,
      isLoggedIn,
      isDoctor,
      isAdmin,
    };
  },
);

// 在页面加载时初始化
const userStore = useUserStore();
userStore.init();