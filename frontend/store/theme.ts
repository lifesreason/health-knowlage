/**
 * 主题状态管理 - 适老化字体倍率
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

// 字体倍率配置
export const FONT_SCALES = [
  { label: '标准', value: 1.0 },
  { label: '大', value: 1.2 },
  { label: '特大', value: 1.4 },
];

export const useThemeStore = defineStore('theme', () => {
  // 字体倍率：1.0 (标准), 1.2 (大字), 1.4 (特大)
  const fontScale = ref<number>(1.0);

  // 当前倍率标签
  const currentScaleLabel = computed(() => {
    const item = FONT_SCALES.find((s) => s.value === fontScale.value);
    return item?.label || '标准';
  });

  // 设置字体倍率
  const setFontScale = (scale: number) => {
    // 限制在有效范围内
    const validScale = Math.max(1.0, Math.min(1.4, scale));
    fontScale.value = validScale;
    
    // 保存到本地
    uni.setStorageSync('fontScale', validScale);
    
    // 更新 CSS 变量（仅 H5 环境有效，小程序需要其他方式）
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--font-scale', validScale.toString());
    }
  };

  // 初始化字体倍率
  const initFontScale = () => {
    try {
      const savedScale = uni.getStorageSync('fontScale');
      if (savedScale && typeof savedScale === 'number') {
        setFontScale(savedScale);
      }
    } catch (error) {
      console.error('初始化字体倍率失败', error);
    }
  };

  // 切换到下一个倍率
  const toggleFontScale = () => {
    const currentIndex = FONT_SCALES.findIndex((s) => s.value === fontScale.value);
    const nextIndex = (currentIndex + 1) % FONT_SCALES.length;
    setFontScale(FONT_SCALES[nextIndex].value);
  };

  return {
    fontScale,
    currentScaleLabel,
    setFontScale,
    initFontScale,
    toggleFontScale,
  };
});
