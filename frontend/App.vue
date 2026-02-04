<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app';

onLaunch(() => {
  console.log('App Launch');
  // 初始化应用配置
});

onShow(() => {
  console.log('App Show');
});

onHide(() => {
  console.log('App Hide');
});
</script>

<style lang="scss">
/* 全局样式 */
@import './styles/font-scale.scss';

page {
  background-color: var(--bg-color);
  font-size: 28rpx;
  line-height: 1.6;
}

/* 适老化基础样式 */
:root {
  --font-scale: 1;
}

/* 文字大小随字体倍率变化 */
.text-scale {
  font-size: calc(28rpx * var(--font-scale));
}

.text-scale-sm {
  font-size: calc(24rpx * var(--font-scale));
}

.text-scale-lg {
  font-size: calc(32rpx * var(--font-scale));
}

.text-scale-xl {
  font-size: calc(36rpx * var(--font-scale));
}

/* 通用样式 */
.container {
  padding: 24rpx;
}

.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.text-ellipsis-2 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 点击热区 */
.clickable-area {
  min-width: 88rpx;
  min-height: 88rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
</style>