<template>
  <view class="empty-state">
    <view class="empty-illustration">
      <view class="empty-icon">
        <image class="empty-icon-image" :src="iconImageMap[type || 'empty'] || iconImageMap.empty" mode="aspectFit"></image>
      </view>
    </view>
    <text class="empty-title">{{ titleMap[type] || '暂无内容' }}</text>
    <text class="empty-message">{{ message }}</text>
    <button v-if="showRetry" class="retry-btn" @click="$emit('retry')">
      <image class="retry-icon-image" src="/static/icons/home-search-btn.png" mode="aspectFit"></image>
      <text>重新加载</text>
    </button>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  type?: 'empty' | 'error' | 'network' | 'deleted';
  message: string;
  showRetry?: boolean;
}>();

defineEmits(['retry']);

const iconImageMap: Record<string, string> = {
  empty: '/static/icons/detail-poster.png',
  error: '/static/icons/detail-share.png',
  network: '/static/icons/home-search-field.png',
  deleted: '/static/icons/detail-collect.png',
};

const titleMap: Record<string, string> = {
  empty: '暂无内容',
  error: '出错了',
  network: '网络异常',
  deleted: '内容已删除',
};
</script>

<style lang="scss" scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 48rpx;
}

.empty-illustration {
  width: 200rpx;
  height: 200rpx;
  background: linear-gradient(135deg, #fff5f3 0%, #ffeee8 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32rpx;
}

.empty-icon {
  width: 84rpx;
  height: 84rpx;
  border-radius: 22rpx;
  background: #ffe9e2;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-icon-image {
  width: 46rpx;
  height: 46rpx;
}

.empty-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 12rpx;
}

.empty-message {
  font-size: 28rpx;
  color: #999;
  text-align: center;
  margin-bottom: 40rpx;
}

.retry-btn {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 20rpx 48rpx;
  background: linear-gradient(135deg, #E17055, #d45d43);
  color: #fff;
  border-radius: 40rpx;
  font-size: 28rpx;
  border: none;
  box-shadow: 0 8rpx 24rpx rgba(225, 112, 85, 0.3);
}

.retry-icon-image {
  width: 30rpx;
  height: 30rpx;
}
</style>
