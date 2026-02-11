<template>
  <view class="empty-state">
    <view class="empty-illustration">
      <text class="empty-icon">{{ iconMap[type] || '📭' }}</text>
    </view>
    <text class="empty-title">{{ titleMap[type] || '暂无内容' }}</text>
    <text class="empty-message">{{ message }}</text>
    <button v-if="showRetry" class="retry-btn" @click="$emit('retry')">
      <text class="retry-icon">🔄</text>
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

const iconMap: Record<string, string> = {
  empty: '📭',
  error: '😵',
  network: '📶',
  deleted: '🗑️',
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
  font-size: 80rpx;
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

.retry-icon {
  font-size: 28rpx;
}
</style>
