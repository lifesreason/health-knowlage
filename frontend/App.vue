<template>
  <view class="app-container" :style="{ '--font-scale': fontScale }">
    <!-- 页面内容 -->
  </view>
</template>

<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app';
import { useThemeStore } from '@/store/theme';
import { useUserStore } from '@/store/user';
import { storeToRefs } from 'pinia';

const themeStore = useThemeStore();
const userStore = useUserStore();
const { fontScale } = storeToRefs(themeStore);

onLaunch(() => {
  console.log('App Launch');
  
  // 初始化主题设置
  themeStore.initFontScale();
  
  // 尝试静默登录
  userStore.silentLogin();
});

onShow(() => {
  console.log('App Show');
});

onHide(() => {
  console.log('App Hide');
});
</script>

<style lang="scss">
@import '@/styles/accessible.scss';

/* 全局样式 */
page {
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', 'Microsoft YaHei', sans-serif;
  font-size: calc(16px * var(--font-scale, 1));
  line-height: 1.6;
  color: #1a1a1a;
  background-color: #f5f6f8;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* 通用样式 */
.app-container {
  min-height: 100vh;
}

/* 全局动画 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20rpx); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

/* 文本缩放类 */
.text-scale {
  font-size: calc(16px * var(--font-scale, 1));
}

.text-scale-sm {
  font-size: calc(14px * var(--font-scale, 1));
}

.text-scale-lg {
  font-size: calc(18px * var(--font-scale, 1));
}

.text-scale-xl {
  font-size: calc(20px * var(--font-scale, 1));
}

/* 点击热区 - 适老化 */
.clickable {
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 通用卡片样式 */
.card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 28rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}

/* 通用按钮样式 */
.btn-primary {
  background: linear-gradient(135deg, #E17055, #d45d43);
  color: #ffffff;
  border: none;
  border-radius: 40rpx;
  font-weight: 600;
  box-shadow: 0 8rpx 24rpx rgba(225, 112, 85, 0.3);
}

.btn-outline {
  background: transparent;
  color: #E17055;
  border: 2rpx solid #E17055;
  border-radius: 40rpx;
}

/* 通用分隔线 */
.divider {
  height: 1rpx;
  background: #f0f0f0;
  margin: 20rpx 0;
}

/* 隐藏滚动条 */
::-webkit-scrollbar {
  display: none;
}

/* 安全区域底部 */
.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}

/* 图片懒加载过渡 */
image {
  transition: opacity 0.3s ease;
}

/* 全局 rich-text 样式 */
.rich-content {
  image, img {
    max-width: 100% !important;
    border-radius: 12rpx;
    margin: 12rpx 0;
  }
  
  p {
    margin: 0 0 16rpx 0;
    line-height: 1.8;
  }
  
  h1, h2, h3 {
    font-weight: 700;
    margin: 24rpx 0 12rpx 0;
    color: #1a1a1a;
  }
}
</style>
