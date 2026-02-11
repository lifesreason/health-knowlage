<template>
  <view class="font-scaler">
    <text class="title">字体大小</text>
    <view class="scale-options">
      <view 
        v-for="item in scales" 
        :key="item.value" 
        class="scale-option"
        :class="{ active: modelValue === item.value }"
        @click="$emit('update:modelValue', item.value)"
      >
        <text :style="{ fontSize: `${14 * item.value}px` }">{{ item.label }}</text>
      </view>
    </view>
    <text class="preview" :style="{ fontSize: `${16 * modelValue}px` }">
      预览文字效果
    </text>
  </view>
</template>

<script setup lang="ts">
import { FONT_SCALES } from '@/store/theme';

defineProps<{ modelValue: number }>();
defineEmits(['update:modelValue']);

const scales = FONT_SCALES;
</script>

<style lang="scss" scoped>
.font-scaler { padding: 24rpx; }
.title { display: block; font-size: 28rpx; font-weight: bold; color: #333; margin-bottom: 24rpx; }
.scale-options { display: flex; gap: 24rpx; margin-bottom: 24rpx; }
.scale-option { flex: 1; height: 80rpx; background: #f5f5f5; border-radius: 12rpx; display: flex; align-items: center; justify-content: center; color: #666; }
.scale-option.active { background: #6C5CE7; color: #fff; }
.preview { display: block; padding: 24rpx; background: #f9f9f9; border-radius: 12rpx; text-align: center; color: #333; }
</style>
