<template>
  <view class="feed-card" @click="$emit('click')">
    <!-- 卡片头部 - 作者信息 -->
    <view class="card-header">
      <image class="author-avatar" :src="item.author?.avatar || item.user?.avatarUrl || '/static/default-avatar.png'" mode="aspectFill"></image>
      <view class="author-info">
        <text class="author-name" :style="{ fontSize: `calc(14px * ${fontScale})` }">{{ item.author?.nickname || item.user?.nickname || '系统管理员' }}</text>
        <text class="publish-time" :style="{ fontSize: `calc(12px * ${fontScale})` }">{{ formatRelativeTime(item.createdAt) }}</text>
      </view>
      <view v-if="item.circle" class="circle-badge">
        <text :style="{ fontSize: `calc(11px * ${fontScale})` }">{{ item.circle.name }}</text>
      </view>
    </view>

    <!-- 卡片内容 -->
    <view class="card-body">
      <!-- 标题 -->
      <text v-if="item.title" class="card-title" :style="{ fontSize: `calc(16px * ${fontScale})` }">{{ item.title }}</text>
      
      <!-- 正文摘要 -->
      <text v-if="item.content" class="card-content" :style="{ fontSize: `calc(14px * ${fontScale})` }">{{ stripHtml(item.content) }}</text>
      
      <!-- 图片展示 -->
      <view v-if="item.mediaUrls?.length" class="media-section">
        <view class="media-grid" :class="getGridClass(item.mediaUrls.length)">
          <image 
            v-for="(url, idx) in getDisplayImages(item.mediaUrls)" 
            :key="idx"
            class="media-image"
            :src="url"
            mode="aspectFill"
            @click.stop="previewImage(url, idx)"
          ></image>
          <view v-if="item.mediaUrls.length > 4" class="media-more">
            <text>+{{ item.mediaUrls.length - 4 }}</text>
          </view>
        </view>
      </view>
      
      <!-- 封面图（单图模式） -->
      <image v-else-if="item.coverUrl" class="cover-image" :src="item.coverUrl" mode="aspectFill"></image>
    </view>

    <!-- 卡片底部 - 互动数据 -->
    <view class="card-footer">
      <view class="action-item" @click.stop="$emit('like', item)">
        <view class="action-icon" :class="{ active: item.isLiked }">
          <image class="action-icon-image" :src="item.isLiked ? ICONS.likeActive : ICONS.like" mode="aspectFit"></image>
        </view>
        <text class="action-text" :style="{ fontSize: `calc(12px * ${fontScale})` }">{{ formatNumber(item.likeCount || 0) }}</text>
      </view>
      <view class="action-item">
        <view class="action-icon">
          <image class="action-icon-image" :src="ICONS.comment" mode="aspectFit"></image>
        </view>
        <text class="action-text" :style="{ fontSize: `calc(12px * ${fontScale})` }">{{ formatNumber(item.commentCount || 0) }}</text>
      </view>
      <view class="action-item">
        <view class="action-icon">
          <image class="action-icon-image" :src="ICONS.view" mode="aspectFit"></image>
        </view>
        <text class="action-text" :style="{ fontSize: `calc(12px * ${fontScale})` }">{{ formatNumber(item.viewCount || 0) }}</text>
      </view>
    </view>

    <!-- 视频标记 -->
    <view v-if="item.type === 2" class="video-badge">
      <image class="video-icon-image" src="/static/icons/common-play-white.png" mode="aspectFit"></image>
      <text class="video-duration" v-if="item.duration">{{ formatDuration(item.duration) }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { formatNumber, formatRelativeTime } from '@/common/utils';

const props = defineProps<{
  item: any;
  fontScale: number;
}>();

defineEmits(['click', 'like']);

const ICONS = {
  like: '/static/icons/feed-like.png',
  likeActive: '/static/icons/feed-like-active.png',
  comment: '/static/icons/feed-comment.png',
  view: '/static/icons/feed-view.png',
};

// 移除HTML标签
const stripHtml = (html: string) => {
  if (!html) return '';
  let text = html.replace(/<[^>]*>/g, '');
  text = text.replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"');
  text = text.replace(/\s+/g, ' ').trim();
  return text.length > 100 ? text.slice(0, 100) + '...' : text;
};

// 获取网格样式
const getGridClass = (count: number) => {
  if (count === 1) return 'grid-1';
  if (count === 2) return 'grid-2';
  if (count === 4) return 'grid-4';
  return 'grid-3';
};

// 限制显示的图片数量
const getDisplayImages = (urls: string[]) => {
  return urls.slice(0, 4);
};

// 预览图片
const previewImage = (url: string, index: number) => {
  uni.previewImage({ current: index, urls: props.item.mediaUrls || [url] });
};

// 格式化视频时长
const formatDuration = (seconds: number) => {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
};
</script>

<style lang="scss" scoped>
.feed-card {
  position: relative;
  background: #fff;
  border-radius: 24rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
}

// 头部
.card-header {
  display: flex;
  align-items: center;
  padding: 24rpx 28rpx 16rpx;
  gap: 16rpx;
}

.author-avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  border: 3rpx solid #fff;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
}

.author-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.author-name {
  color: #1a1a1a;
  font-weight: 600;
}

.publish-time {
  color: #999;
}

.circle-badge {
  background: linear-gradient(135deg, #fff5f3 0%, #ffeee8 100%);
  padding: 8rpx 16rpx;
  border-radius: 16rpx;
  border: 1rpx solid #ffd4c4;
  color: #E17055;
}

// 内容区
.card-body {
  padding: 0 28rpx 20rpx;
}

.card-title {
  display: block;
  color: #1a1a1a;
  font-weight: 700;
  line-height: 1.4;
  margin-bottom: 12rpx;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-clamp: 2;
  overflow: hidden;
}

.card-content {
  display: block;
  color: #666;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  line-clamp: 3;
  overflow: hidden;
}

// 图片网格
.media-section {
  margin-top: 16rpx;
}

.media-grid {
  display: grid;
  gap: 8rpx;
  border-radius: 16rpx;
  overflow: hidden;
  
  &.grid-1 {
    grid-template-columns: 1fr;
    .media-image { height: 360rpx; }
  }
  
  &.grid-2 {
    grid-template-columns: 1fr 1fr;
    .media-image { height: 240rpx; }
  }
  
  &.grid-3 {
    grid-template-columns: 1fr 1fr 1fr;
    .media-image { height: 180rpx; }
  }
  
  &.grid-4 {
    grid-template-columns: 1fr 1fr;
    .media-image { height: 200rpx; }
  }
}

.media-image {
  width: 100%;
  background: #f5f5f5;
}

.media-more {
  position: absolute;
  right: 28rpx;
  bottom: 28rpx;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
}

.cover-image {
  width: 100%;
  height: 320rpx;
  border-radius: 16rpx;
  margin-top: 16rpx;
}

// 底部
.card-footer {
  display: flex;
  align-items: center;
  padding: 16rpx 28rpx 24rpx;
  gap: 48rpx;
  border-top: 1rpx solid #f5f5f5;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.action-icon {
  width: 36rpx;
  height: 36rpx;
  border-radius: 10rpx;
  background: #f5f5f5;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;

  &.active {
    background: #ffe9e2;
    color: #d25f45;
    animation: pulse 0.3s ease;
  }
}

.action-icon-image {
  width: 20rpx;
  height: 20rpx;
}

@keyframes pulse {
  50% { transform: scale(1.2); }
}

.action-text {
  color: #999;
}

// 视频标记
.video-badge {
  position: absolute;
  top: 80rpx;
  right: 28rpx;
  display: flex;
  align-items: center;
  gap: 8rpx;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8rpx);
  padding: 10rpx 20rpx;
  border-radius: 20rpx;
}

.video-icon-image {
  width: 20rpx;
  height: 20rpx;
}

.video-duration {
  color: #fff;
  font-size: 22rpx;
}
</style>
