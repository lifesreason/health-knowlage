<template>
  <view class="video-page">
    <!-- 加载中状态 -->
    <view v-if="loading" class="state-container" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="loading-wrap">
        <view class="spinner">
          <view class="spinner-dot" v-for="i in 3" :key="i"></view>
        </view>
        <text class="loading-text" :style="{ fontSize: `calc(14px * ${fontScale})` }">正在加载视频...</text>
      </view>
    </view>

    <!-- 空状态 -->
    <view v-else-if="videoList.length === 0" class="state-container" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="empty-wrap">
        <text class="empty-icon">🎬</text>
        <text class="empty-title" :style="{ fontSize: `calc(18px * ${fontScale})` }">暂无视频内容</text>
        <text class="empty-desc" :style="{ fontSize: `calc(14px * ${fontScale})` }">精彩健康视频即将上线，敬请期待</text>
        <view class="empty-actions">
          <button class="refresh-btn" @click="loadVideos" :style="{ fontSize: `calc(15px * ${fontScale})` }">
            🔄 刷新试试
          </button>
          <button class="home-btn" @click="goHome" :style="{ fontSize: `calc(15px * ${fontScale})` }">
            🏠 去首页逛逛
          </button>
        </view>
      </view>
    </view>

    <!-- 视频流 -->
    <template v-else>
      <swiper
        class="video-swiper"
        vertical
        :current="currentIndex"
        @change="onSwiperChange"
      >
        <swiper-item v-for="(item, index) in videoList" :key="item.id">
          <view class="video-item" @click="togglePlay(index)" @dblclick="handleDoubleTap(item)">
            <!-- 视频播放器 -->
            <video
              :id="`video-${item.id}`"
              :src="item.videoUrl"
              :poster="item.coverUrl"
              class="video-player"
              :autoplay="index === currentIndex"
              :loop="true"
              object-fit="cover"
              show-center-play-btn
              enable-progress-gesture
              @play="onVideoPlay(index)"
              @pause="onVideoPause(index)"
              @ended="onVideoEnded(index)"
            ></video>

            <!-- 暂停图标 -->
            <view v-if="pausedVideos[index]" class="pause-overlay">
              <view class="pause-btn">
                <text class="pause-icon">▶</text>
              </view>
            </view>

            <!-- 双击点赞动画 -->
            <view v-if="showLikeAnimation" class="like-animation">
              <text class="heart-icon">❤️</text>
            </view>

            <!-- 视频信息 -->
            <view class="video-info">
              <view class="author-row" @click.stop="goToProfile(item.author || item.user)">
                <image 
                  class="author-avatar" 
                  :src="item.author?.avatar || item.user?.avatarUrl || '/static/default-avatar.png'" 
                  mode="aspectFill"
                ></image>
                <text class="author-name" :style="{ fontSize: `calc(14px * ${fontScale})` }">
                  {{ item.author?.nickname || item.user?.nickname || '系统' }}
                </text>
                <view class="follow-tag" v-if="!item.author?.isFollowed">
                  <text>+ 关注</text>
                </view>
              </view>
              <text class="video-title" :style="{ fontSize: `calc(16px * ${fontScale})` }">{{ item.title }}</text>
              <text class="video-desc" :style="{ fontSize: `calc(14px * ${fontScale})` }">{{ item.content }}</text>
              <view class="tags-row" v-if="item.tags?.length">
                <text class="tag-item" v-for="tag in item.tags" :key="tag">#{{ tag }}</text>
              </view>
            </view>
          </view>

          <!-- 侧边栏 -->
          <view class="sidebar">
            <view class="sidebar-item avatar-item" @click="goToProfile(item.author || item.user)">
              <image 
                class="sidebar-avatar" 
                :src="item.author?.avatar || item.user?.avatarUrl || '/static/default-avatar.png'" 
                mode="aspectFill"
              ></image>
              <view class="follow-btn" v-if="!item.author?.isFollowed">
                <text class="plus-icon">+</text>
              </view>
            </view>
            <view class="sidebar-item" @click="handleLike(item)">
              <view class="icon-wrapper" :class="{ active: item.isLiked }">
                <text class="sidebar-icon">{{ item.isLiked ? '❤️' : '🤍' }}</text>
              </view>
              <text class="sidebar-count" :style="{ fontSize: `calc(12px * ${fontScale})` }">{{ formatNumber(item.likeCount) }}</text>
            </view>
            <view class="sidebar-item" @click="openComments(item)">
              <view class="icon-wrapper">
                <text class="sidebar-icon">💬</text>
              </view>
              <text class="sidebar-count" :style="{ fontSize: `calc(12px * ${fontScale})` }">{{ formatNumber(item.commentCount) }}</text>
            </view>
            <view class="sidebar-item" @click="handleCollect(item)">
              <view class="icon-wrapper" :class="{ active: item.isCollected }">
                <text class="sidebar-icon">{{ item.isCollected ? '⭐' : '☆' }}</text>
              </view>
              <text class="sidebar-count" :style="{ fontSize: `calc(12px * ${fontScale})` }">{{ formatNumber(item.collectCount || 0) }}</text>
            </view>
            <view class="sidebar-item">
              <button class="share-btn" open-type="share">
                <view class="icon-wrapper">
                  <text class="sidebar-icon">📤</text>
                </view>
              </button>
              <text class="sidebar-count" :style="{ fontSize: `calc(12px * ${fontScale})` }">分享</text>
            </view>
          </view>
        </swiper-item>
      </swiper>

      <!-- 顶部渐变遮罩 -->
      <view class="top-gradient" :style="{ height: (statusBarHeight + 80) + 'px' }"></view>
    </template>

    <!-- 评论弹窗 -->
    <CommentModal
      v-if="showComments"
      :post-id="currentVideo?.id"
      @close="showComments = false"
    />
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { onShow, onHide, onShareAppMessage } from '@dcloudio/uni-app';
import { useThemeStore } from '@/store/theme';
import { useUserStore } from '@/store/user';
import { storeToRefs } from 'pinia';
import { formatNumber } from '@/common/utils';
import CommentModal from '@/components/CommentModal.vue';
import { feedApi, interactionApi } from '@/api';

const themeStore = useThemeStore();
const userStore = useUserStore();
const { fontScale } = storeToRefs(themeStore);

const statusBarHeight = ref(0);
const videoList = ref<any[]>([]);
const currentIndex = ref(0);
const pausedVideos = ref<Record<number, boolean>>({});
const showLikeAnimation = ref(false);
const showComments = ref(false);
const loading = ref(true);

const currentVideo = computed(() => videoList.value[currentIndex.value]);

// Get status bar height
try {
  const sysInfo = uni.getSystemInfoSync();
  statusBarHeight.value = sysInfo.statusBarHeight || 20;
} catch { statusBarHeight.value = 20; }

const loadVideos = async () => {
  loading.value = true;
  try {
    const res = await feedApi.getVideoList({ page: 1, pageSize: 10 });
    videoList.value = res.list || [];
  } catch (error) {
    console.error('加载视频失败', error);
    uni.showToast({ title: '加载失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
};

const goHome = () => {
  uni.switchTab({ url: '/pages/index/index' });
};

const onSwiperChange = (e: any) => {
  const oldIndex = currentIndex.value;
  const newIndex = e.detail.current;
  const oldVideoContext = uni.createVideoContext(`video-${videoList.value[oldIndex]?.id}`);
  oldVideoContext?.pause();
  currentIndex.value = newIndex;
  const newVideoContext = uni.createVideoContext(`video-${videoList.value[newIndex]?.id}`);
  newVideoContext?.play();
};

const togglePlay = (index: number) => {
  const videoContext = uni.createVideoContext(`video-${videoList.value[index]?.id}`);
  if (pausedVideos.value[index]) {
    videoContext?.play();
    pausedVideos.value[index] = false;
  } else {
    videoContext?.pause();
    pausedVideos.value[index] = true;
  }
};

const handleDoubleTap = (item: any) => {
  if (!item.isLiked) handleLike(item);
  showLikeAnimation.value = true;
  setTimeout(() => { showLikeAnimation.value = false; }, 800);
};

const onVideoPlay = (index: number) => { pausedVideos.value[index] = false; };
const onVideoPause = (index: number) => { pausedVideos.value[index] = true; };
const onVideoEnded = (_index: number) => {};

const handleLike = async (item: any) => {
  if (!userStore.requireLogin()) return;
  item.isLiked = !item.isLiked;
  item.likeCount += item.isLiked ? 1 : -1;
  try {
    if (item.isLiked) {
      await interactionApi.like({ targetId: item.id, targetType: 'post' });
    } else {
      await interactionApi.unlike({ targetId: item.id, targetType: 'post' });
    }
  } catch {
    item.isLiked = !item.isLiked;
    item.likeCount += item.isLiked ? 1 : -1;
  }
};

const handleCollect = async (item: any) => {
  if (!userStore.requireLogin()) return;
  item.isCollected = !item.isCollected;
  item.collectCount = (item.collectCount || 0) + (item.isCollected ? 1 : -1);
  try {
    if (item.isCollected) {
      await interactionApi.collect({ targetId: item.id, targetType: 'post' });
    } else {
      await interactionApi.uncollect({ targetId: item.id, targetType: 'post' });
    }
  } catch {
    item.isCollected = !item.isCollected;
    item.collectCount = (item.collectCount || 0) + (item.isCollected ? 1 : -1);
  }
};

const openComments = (_item: any) => { showComments.value = true; };

const goToProfile = (author: any) => {
  if (!author?.id) return;
  uni.navigateTo({ url: `/pages/detail/detail?userId=${author.id}` });
};

onShareAppMessage(() => {
  const video = currentVideo.value;
  return {
    title: video?.title || '银龄健康',
    path: `/pages/video/video?id=${video?.id}`,
    imageUrl: video?.coverUrl,
  };
});

onShow(() => {
  loadVideos();
  if (currentVideo.value) {
    const videoContext = uni.createVideoContext(`video-${currentVideo.value.id}`);
    videoContext?.play();
  }
});

onHide(() => {
  if (currentVideo.value) {
    const videoContext = uni.createVideoContext(`video-${currentVideo.value.id}`);
    videoContext?.pause();
  }
});
</script>

<style lang="scss" scoped>
.video-page {
  width: 100vw;
  height: 100vh;
  background: #111;
  position: relative;
}

.state-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(150deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
}

.loading-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32rpx;
}

.spinner {
  display: flex;
  gap: 16rpx;
}

.spinner-dot {
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;
  background: #E17055;
  animation: spinnerBounce 1.4s ease-in-out infinite both;
  &:nth-child(1) { animation-delay: -0.32s; }
  &:nth-child(2) { animation-delay: -0.16s; }
}

@keyframes spinnerBounce {
  0%, 80%, 100% { transform: scale(0.4); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}

.loading-text { color: rgba(255, 255, 255, 0.6); }

.empty-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 80rpx;
}

.empty-icon { font-size: 120rpx; margin-bottom: 32rpx; }
.empty-title { color: #fff; font-weight: 700; margin-bottom: 16rpx; }
.empty-desc { color: rgba(255, 255, 255, 0.5); text-align: center; margin-bottom: 56rpx; }

.empty-actions { display: flex; gap: 24rpx; }

.refresh-btn {
  height: 84rpx;
  padding: 0 40rpx;
  background: linear-gradient(135deg, #E17055, #d45d43);
  color: #fff;
  border: none;
  border-radius: 42rpx;
  font-weight: 500;
  box-shadow: 0 8rpx 24rpx rgba(225, 112, 85, 0.3);
}

.home-btn {
  height: 84rpx;
  padding: 0 40rpx;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  border: 2rpx solid rgba(255, 255, 255, 0.2);
  border-radius: 42rpx;
  font-weight: 500;
}

.video-swiper { width: 100%; height: 100%; }
.video-item { width: 100%; height: 100%; position: relative; }
.video-player { width: 100%; height: 100%; }

.top-gradient {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 200rpx;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.4) 0%, transparent 100%);
  pointer-events: none;
  z-index: 10;
}

.pause-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.1);
}

.pause-btn {
  width: 140rpx; height: 140rpx;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(20rpx);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pause-icon { font-size: 56rpx; color: #fff; margin-left: 8rpx; }

.like-animation {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  animation: likeScale 0.8s ease-out forwards;
  pointer-events: none;
}

.heart-icon { font-size: 240rpx; }

@keyframes likeScale {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
  50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
}

.video-info {
  position: absolute;
  bottom: 160rpx; left: 32rpx; right: 160rpx;
}

.author-row {
  display: flex; align-items: center; gap: 16rpx; margin-bottom: 20rpx;
}

.author-avatar {
  width: 64rpx; height: 64rpx; border-radius: 50%;
  border: 2rpx solid rgba(255, 255, 255, 0.8);
}

.author-name {
  color: #fff; font-weight: 600;
  text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.3);
}

.follow-tag {
  background: #E17055; padding: 6rpx 16rpx;
  border-radius: 20rpx; font-size: 22rpx; color: #fff;
}

.video-title {
  display: block; color: #fff; font-weight: 700; margin-bottom: 12rpx;
  text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.3);
}

.video-desc {
  display: block; color: rgba(255, 255, 255, 0.9); line-height: 1.5;
  text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.3);
  display: -webkit-box; -webkit-line-clamp: 2;
  -webkit-box-orient: vertical; overflow: hidden;
}

.tags-row { display: flex; flex-wrap: wrap; gap: 12rpx; margin-top: 16rpx; }
.tag-item { color: #74b9ff; font-size: 26rpx; }

.sidebar {
  position: absolute; right: 20rpx; bottom: 200rpx;
  display: flex; flex-direction: column; gap: 28rpx; align-items: center;
}

.sidebar-item {
  display: flex; flex-direction: column; align-items: center; gap: 6rpx;
}

.avatar-item { margin-bottom: 16rpx; }

.sidebar-avatar {
  width: 96rpx; height: 96rpx; border-radius: 50%;
  border: 3rpx solid #fff;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.3);
}

.follow-btn {
  position: relative; top: -20rpx;
  width: 40rpx; height: 40rpx;
  background: #E17055; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  border: 3rpx solid #fff;
}

.plus-icon { color: #fff; font-size: 28rpx; font-weight: 700; }

.icon-wrapper {
  width: 80rpx; height: 80rpx;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10rpx);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s ease;
  &.active { background: rgba(225, 112, 85, 0.3); transform: scale(1.1); }
}

.sidebar-icon { font-size: 44rpx; }
.sidebar-count { color: #fff; text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.5); }

.share-btn {
  background: transparent; padding: 0; margin: 0; line-height: 1;
  &::after { display: none; }
}
</style>
