/**
 * 用户状态管理
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

interface UserInfo {
  id: number;
  openid: string;
  nickname: string;
  avatar: string;
  mobile: string;
  role: number; // 0: 普通用户, 1: 认证医师, 9: 管理员
}

export const useUserStore = defineStore(
  'user',
  () => {
    // 状态
    const token = ref<string>('');
    const userInfo = ref<UserInfo | null>(null);

    // 计算属性
    const isLoggedIn = computed(() => !!token.value);
    const isDoctor = computed(() => userInfo.value?.role === 1);
    const isAdmin = computed(() => userInfo.value?.role === 9);

    // 静默登录
    const silentLogin = async () => {
      try {
        // 尝试从本地获取 Token
        const savedToken = uni.getStorageSync('token');
        if (savedToken) {
          token.value = savedToken;
          
          // 获取用户信息
          const savedUserInfo = uni.getStorageSync('userInfo');
          if (savedUserInfo) {
            userInfo.value = savedUserInfo;
          }
        }
      } catch (error) {
        console.error('静默登录失败', error);
      }
    };

    // 微信登录
    const wxLogin = async (code: string) => {
      try {
        // TODO: 调用后端登录接口
        // const res = await authApi.login({ code });
        // setToken(res.token);
        // setUserInfo(res.userInfo);
        return true;
      } catch (error) {
        console.error('微信登录失败', error);
        return false;
      }
    };

    // 绑定手机号
    const bindPhone = async (encryptedData: string, iv: string) => {
      try {
        // TODO: 调用后端绑定接口
        // const res = await authApi.bind({ encryptedData, iv });
        // setUserInfo(res.userInfo);
        return true;
      } catch (error) {
        console.error('绑定手机号失败', error);
        return false;
      }
    };

    // 设置 Token
    const setToken = (newToken: string) => {
      token.value = newToken;
      uni.setStorageSync('token', newToken);
    };

    // 设置用户信息
    const setUserInfo = (info: UserInfo) => {
      userInfo.value = info;
      uni.setStorageSync('userInfo', info);
    };

    // 退出登录
    const logout = () => {
      token.value = '';
      userInfo.value = null;
      uni.removeStorageSync('token');
      uni.removeStorageSync('userInfo');
    };

    // 检查是否需要登录（用于拦截需要登录的操作）
    const requireLogin = (callback?: () => void) => {
      if (isLoggedIn.value) {
        callback?.();
        return true;
      }

      // 显示登录弹窗或跳转登录页
      uni.navigateTo({
        url: '/sub_pkg_B/auth/auth',
      });
      return false;
    };

    return {
      token,
      userInfo,
      isLoggedIn,
      isDoctor,
      isAdmin,
      silentLogin,
      wxLogin,
      bindPhone,
      setToken,
      setUserInfo,
      logout,
      requireLogin,
    };
  },
  {
    // 持久化配置
  }
);
