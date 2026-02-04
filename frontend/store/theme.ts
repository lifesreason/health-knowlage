import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useThemeStore = defineStore(
  'theme',
  () => {
    // 字体倍率：1.0 (标准), 1.2 (大字), 1.4 (特大)
    const fontScale = ref(1.0);

    // 设置字体倍率
    const setFontScale = (scale: number) => {
      fontScale.value = scale;
      // 更新全局 CSS 变量
      uni.setStorageSync('fontScale', scale);
      document.documentElement.style.setProperty('--font-scale', scale.toString());
    };

    // 初始化字体倍率
    const initFontScale = () => {
      const savedScale = uni.getStorageSync('fontScale');
      if (savedScale) {
        setFontScale(savedScale);
      }
    };

    return {
      fontScale,
      setFontScale,
      initFontScale,
    };
  },
);

// 在页面加载时初始化
const themeStore = useThemeStore();
themeStore.initFontScale();