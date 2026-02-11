/**
 * 公共工具函数
 */

/**
 * 格式化时间为相对时间
 */
export const formatRelativeTime = (time: string | Date): string => {
  const now = Date.now();
  const target = new Date(time).getTime();
  const diff = now - target;

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const month = 30 * day;
  const year = 365 * day;

  if (diff < minute) {
    return '刚刚';
  } else if (diff < hour) {
    return `${Math.floor(diff / minute)}分钟前`;
  } else if (diff < day) {
    return `${Math.floor(diff / hour)}小时前`;
  } else if (diff < month) {
    return `${Math.floor(diff / day)}天前`;
  } else if (diff < year) {
    return `${Math.floor(diff / month)}个月前`;
  } else {
    return `${Math.floor(diff / year)}年前`;
  }
};

/**
 * 格式化数字（超过1万显示为x.x万）
 */
export const formatNumber = (num: number): string => {
  if (num >= 10000) {
    return `${(num / 10000).toFixed(1)}万`;
  }
  return num.toString();
};

/**
 * 手机号脱敏
 */
export const maskPhone = (phone: string): string => {
  if (!phone || phone.length !== 11) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
};

/**
 * 防抖
 */
export const debounce = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300
): ((...args: Parameters<T>) => void) => {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

/**
 * 节流
 */
export const throttle = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300
): ((...args: Parameters<T>) => void) => {
  let lastTime = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastTime >= delay) {
      lastTime = now;
      fn(...args);
    }
  };
};

/**
 * 页面跳转（带登录检查）
 */
export const navigateTo = (url: string, requireLogin: boolean = false) => {
  if (requireLogin) {
    const userStore = useUserStore();
    if (!userStore.isLoggedIn) {
      uni.navigateTo({ url: '/sub_pkg_B/auth/auth' });
      return;
    }
  }
  uni.navigateTo({ url });
};

// 需要导入 store
import { useUserStore } from '@/store/user';
