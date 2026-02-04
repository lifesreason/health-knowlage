<template>
  <view class="empty-state">
    <image class="empty-image" :src="imageSrc" mode="aspectFit"></image>
    <text class="empty-text text-scale">{{ text }}</text>
    <button v-if="showAction" class="action-btn" @click="handleAction">
      <text class="text-scale">{{ actionText }}</text>
    </button>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  type?: 'network' | 'empty' | 'deleted' | 'login';
  text?: string;
  actionText?: string;
  showAction?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'empty',
  text: '暂无内容',
  actionText: '刷新',
  showAction: true,
});

const emit = defineEmits(['action']);

const imageSrc = computed(() => {
  const map: Record<string, string> = {
    network: '/static/images/empty-network.png',
    empty: '/static/images/empty.png',
    deleted: '/static/images/empty-deleted.png',
    login: '/static/images/empty-login.png',
  };
  return map[props.type] || map.empty;
});

const handleAction = () => {
  emit('action');
};
</script>

<style lang="scss" scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;
}

.empty-image {
  width: 200rpx;
  height: 200rpx;
  margin-bottom: 24rpx;
}

.empty-text {
  color: #999;
  font-size: 28rpx;
  margin-bottom: 32rpx;
}

.action-btn {
  background-color: #3cc51f;
  color: #fff;
  border: none;
  padding: 16rpx 48rpx;
  border-radius: 40rpx;
  font-size: 28rpx;
}
</style>