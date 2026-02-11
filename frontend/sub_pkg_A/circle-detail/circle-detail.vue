<template>
  <view class="circle-page" :style="{ '--font-scale': fontScale }">
    <!-- 圈子封面头部 -->
    <view class="circle-hero">
      <image class="hero-bg" :src="circle.cover || 'https://via.placeholder.com/750x400'" mode="aspectFill"></image>
      <view class="hero-overlay"></view>
      <view class="hero-content">
        <text class="circle-name" :style="{ fontSize: `calc(22px * ${fontScale})` }">{{ circle.name }}</text>
        <text class="circle-desc" :style="{ fontSize: `calc(13px * ${fontScale})` }">{{ circle.description }}</text>
        <view class="circle-meta">
          <view class="meta-item">
            <text class="meta-value">{{ circle.memberCount || 0 }}</text>
            <text class="meta-label">成员</text>
          </view>
          <view class="meta-divider"></view>
          <view class="meta-item">
            <text class="meta-value">{{ circle.postCount || 0 }}</text>
            <text class="meta-label">帖子</text>
          </view>
        </view>
      </view>
      <button 
        class="join-btn" 
        :class="{ joined: circle.isJoined }" 
        @click="toggleJoin"
        :style="{ fontSize: `calc(14px * ${fontScale})` }"
      >
        {{ circle.isJoined ? '✓ 已加入' : '+ 加入圈子' }}
      </button>
    </view>

    <!-- 帖子列表 -->
    <scroll-view scroll-y class="post-list" @scrolltolower="loadMore">
      <view v-if="posts.length === 0 && !loading" class="empty-state">
        <text class="empty-icon">💬</text>
        <text class="empty-text" :style="{ fontSize: `calc(14px * ${fontScale})` }">暂无帖子，快来发布第一篇吧</text>
      </view>

      <view v-for="item in posts" :key="item.id" class="post-card" @click="goToDetail(item)">
        <view class="post-header">
          <image class="author-avatar" :src="item.user?.avatarUrl || '/static/default-avatar.png'" mode="aspectFill"></image>
          <view class="author-info">
            <text class="author-name" :style="{ fontSize: `calc(14px * ${fontScale})` }">{{ item.user?.nickname || '匿名用户' }}</text>
            <text class="post-time" :style="{ fontSize: `calc(12px * ${fontScale})` }">{{ formatTime(item.createdAt) }}</text>
          </view>
        </view>
        
        <text v-if="item.title" class="post-title" :style="{ fontSize: `calc(16px * ${fontScale})` }">{{ item.title }}</text>
        <text class="post-content" :style="{ fontSize: `calc(14px * ${fontScale})` }">{{ stripHtml(item.content) }}</text>
        
        <!-- 图片展示 -->
        <view v-if="item.mediaUrls?.length" class="post-images" :class="`img-count-${Math.min(item.mediaUrls.length, 3)}`">
          <image 
            v-for="(url, i) in item.mediaUrls.slice(0, 3)" 
            :key="i" 
            class="post-image" 
            :src="url" 
            mode="aspectFill"
          ></image>
        </view>

        <!-- 封面图 -->
        <image v-else-if="item.coverUrl" class="post-cover" :src="item.coverUrl" mode="aspectFill"></image>
        
        <view class="post-actions">
          <view class="action-item" @click.stop="handleLike(item)">
            <text class="action-icon">{{ item.isLiked ? '❤️' : '🤍' }}</text>
            <text class="action-count" :style="{ fontSize: `calc(13px * ${fontScale})` }">{{ item.likeCount || 0 }}</text>
          </view>
          <view class="action-item">
            <text class="action-icon">💬</text>
            <text class="action-count" :style="{ fontSize: `calc(13px * ${fontScale})` }">{{ item.commentCount || 0 }}</text>
          </view>
        </view>
      </view>

      <view v-if="loading" class="load-indicator">
        <view class="loading-dots">
          <view class="dot"></view>
          <view class="dot"></view>
          <view class="dot"></view>
        </view>
      </view>
      <view v-else-if="noMore && posts.length" class="load-indicator">
        <text class="no-more-text">—— 暂无更多 ——</text>
      </view>
    </scroll-view>

    <!-- 发布按钮 -->
    <view v-if="circle.isJoined" class="publish-fab" @click="goToPublish">
      <text class="fab-icon">✏️</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { onLoad, onPullDownRefresh } from '@dcloudio/uni-app';
import { useThemeStore } from '@/store/theme';
import { useUserStore } from '@/store/user';
import { storeToRefs } from 'pinia';
import { formatRelativeTime } from '@/common/utils';
import { circleApi, interactionApi } from '@/api';

const themeStore = useThemeStore();
const userStore = useUserStore();
const { fontScale } = storeToRefs(themeStore);

const circleId = ref(0);
const circle = ref<any>({ name: '', description: '', isJoined: false });
const posts = ref<any[]>([]);
const loading = ref(false);
const noMore = ref(false);
const page = ref(1);

const formatTime = (t: string) => formatRelativeTime(t);

const stripHtml = (html: string) => {
  if (!html) return '';
  let text = html.replace(/<[^>]*>/g, '');
  text = text.replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length > 120 ? text.slice(0, 120) + '...' : text;
};

const loadCircle = async () => {
  try {
    const res = await circleApi.getDetail(circleId.value);
    circle.value = res;
  } catch (error) {
    console.error('加载圈子失败', error);
  }
};

const loadPosts = async () => {
  if (loading.value || noMore.value) return;
  loading.value = true;
  try {
    const res = await circleApi.getPosts(circleId.value, { page: page.value, pageSize: 10 });
    const data = res.list || [];
    if (page.value === 1) posts.value = data;
    else posts.value.push(...data);
    if (data.length < 10) noMore.value = true;
    page.value++;
  } catch (error) {
    console.error('加载帖子失败', error);
  } finally {
    loading.value = false;
  }
};

const loadMore = () => loadPosts();

const toggleJoin = async () => {
  if (!userStore.requireLogin()) return;
  if (circle.value.isJoined) {
    uni.showModal({
      title: '提示',
      content: '确定退出该圈子吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await circleApi.leave(circleId.value);
            circle.value.isJoined = false;
            uni.showToast({ title: '已退出', icon: 'none' });
          } catch {
            uni.showToast({ title: '操作失败', icon: 'none' });
          }
        }
      },
    });
  } else {
    try {
      await circleApi.join(circleId.value);
      circle.value.isJoined = true;
      uni.showToast({ title: '加入成功', icon: 'success' });
    } catch {
      uni.showToast({ title: '加入失败', icon: 'none' });
    }
  }
};

const handleLike = async (item: any) => {
  if (!userStore.requireLogin()) return;
  item.isLiked = !item.isLiked;
  item.likeCount += item.isLiked ? 1 : -1;
  try {
    await interactionApi.like({ targetId: item.id, targetType: 'post' });
  } catch {
    item.isLiked = !item.isLiked;
    item.likeCount += item.isLiked ? 1 : -1;
  }
};

const goToDetail = (item: any) => {
  uni.navigateTo({ url: `/pages/detail/detail?id=${item.id}` });
};

const goToPublish = () => {
  uni.navigateTo({ url: `/sub_pkg_A/publisher/publisher?circleId=${circleId.value}` });
};

onLoad((options: any) => {
  if (options.id) circleId.value = +options.id;
});

onMounted(() => {
  loadCircle();
  loadPosts();
});

onPullDownRefresh(() => {
  page.value = 1;
  noMore.value = false;
  loadPosts().then(() => uni.stopPullDownRefresh());
});
</script>

<style lang="scss" scoped>
.circle-page {
  min-height: 100vh;
  background: #f5f6f8;
}

// 封面头部
.circle-hero {
  position: relative;
  height: 420rpx;
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  width: 100%;
  height: 100%;
}

.hero-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.6) 100%);
}

.hero-content {
  position: absolute;
  bottom: 32rpx;
  left: 32rpx;
  right: 160rpx;
}

.circle-name {
  display: block;
  color: #fff;
  font-weight: 700;
  margin-bottom: 8rpx;
  text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.3);
}

.circle-desc {
  display: block;
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 16rpx;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.circle-meta {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.meta-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.meta-value {
  font-size: 32rpx;
  font-weight: 700;
  color: #fff;
}

.meta-label {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.7);
}

.meta-divider {
  width: 1rpx;
  height: 40rpx;
  background: rgba(255, 255, 255, 0.3);
}

// 加入按钮
.join-btn {
  position: absolute;
  right: 24rpx;
  bottom: 32rpx;
  padding: 16rpx 32rpx;
  background: linear-gradient(135deg, #E17055, #d45d43);
  color: #fff;
  border: none;
  border-radius: 32rpx;
  font-weight: 500;
  box-shadow: 0 8rpx 20rpx rgba(225, 112, 85, 0.4);
  
  &.joined {
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    box-shadow: none;
  }
}

// 帖子列表
.post-list {
  height: calc(100vh - 420rpx);
  padding: 20rpx;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 100rpx 0;
  gap: 16rpx;
}

.empty-icon {
  font-size: 80rpx;
  opacity: 0.5;
}

.empty-text {
  color: #999;
}

// 帖子卡片
.post-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.post-header {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.author-avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  border: 2rpx solid #f0f0f0;
}

.author-info {
  flex: 1;
}

.author-name {
  display: block;
  font-weight: 500;
  color: #333;
}

.post-time {
  color: #999;
}

.post-title {
  display: block;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 8rpx;
  line-height: 1.4;
}

.post-content {
  display: block;
  color: #666;
  line-height: 1.6;
  margin-bottom: 16rpx;
}

// 图片展示
.post-images {
  display: grid;
  gap: 8rpx;
  margin-bottom: 16rpx;
  border-radius: 16rpx;
  overflow: hidden;
  
  &.img-count-1 { grid-template-columns: 1fr; }
  &.img-count-2 { grid-template-columns: 1fr 1fr; }
  &.img-count-3 { grid-template-columns: 1fr 1fr 1fr; }
}

.post-image {
  width: 100%;
  aspect-ratio: 1;
}

.post-cover {
  width: 100%;
  height: 300rpx;
  border-radius: 16rpx;
  margin-bottom: 16rpx;
}

// 操作栏
.post-actions {
  display: flex;
  gap: 40rpx;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.action-icon {
  font-size: 32rpx;
}

.action-count {
  color: #999;
}

// 加载状态
.load-indicator {
  text-align: center;
  padding: 32rpx;
}

.loading-dots {
  display: flex;
  justify-content: center;
  gap: 12rpx;
}

.dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  background: #E17055;
  animation: bounce 1.4s infinite ease-in-out both;
  
  &:nth-child(1) { animation-delay: -0.32s; }
  &:nth-child(2) { animation-delay: -0.16s; }
}

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

.no-more-text {
  color: #ccc;
  font-size: 26rpx;
}

// 浮动发布按钮
.publish-fab {
  position: fixed;
  right: 32rpx;
  bottom: calc(120rpx + env(safe-area-inset-bottom));
  width: 100rpx;
  height: 100rpx;
  background: linear-gradient(135deg, #E17055, #d45d43);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(225, 112, 85, 0.4);
}

.fab-icon {
  font-size: 44rpx;
}
</style>
