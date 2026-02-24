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
        <view class="empty-icon">
          <image class="empty-icon-image" src="/static/icons/publisher-tab-video-active.png" mode="aspectFit"></image>
        </view>
        <text class="empty-title" :style="{ fontSize: `calc(18px * ${fontScale})` }">暂无视频内容</text>
        <text class="empty-desc" :style="{ fontSize: `calc(14px * ${fontScale})` }">暂未检索到视频，可刷新后重试</text>
        <view class="empty-actions">
          <button class="refresh-btn" @click="loadVideos" :style="{ fontSize: `calc(15px * ${fontScale})` }">
            刷新试试
          </button>
          <button class="home-btn" @click="goHome" :style="{ fontSize: `calc(15px * ${fontScale})` }">
            去首页逛逛
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
                <image class="pause-icon-image" src="/static/icons/common-play-white.png" mode="aspectFit"></image>
              </view>
            </view>

            <!-- 双击点赞动画 -->
            <view v-if="showLikeAnimation" class="like-animation">
              <view class="heart-icon">
                <image class="heart-icon-image" src="/static/icons/feed-like-active.png" mode="aspectFit"></image>
              </view>
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
                <view class="follow-tag" v-if="!item.isFollowed" @click.stop="handleFollow(item)">
                  <image class="follow-tag-icon" src="/static/icons/common-plus-white.png" mode="aspectFit"></image>
                  <text>关注</text>
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
              <view class="follow-btn" v-if="!item.isFollowed" @click.stop="handleFollow(item)">
                <image class="plus-icon-image" src="/static/icons/common-plus-white.png" mode="aspectFit"></image>
              </view>
            </view>
            <view class="sidebar-item" @click="handleLike(item)">
              <view class="icon-wrapper" :class="{ active: item.isLiked }">
                <image class="sidebar-icon-image" :src="item.isLiked ? '/static/icons/feed-like-active.png' : '/static/icons/feed-like.png'" mode="aspectFit"></image>
              </view>
              <text class="sidebar-count" :style="{ fontSize: `calc(12px * ${fontScale})` }">{{ formatNumber(item.likeCount) }}</text>
            </view>
            <view class="sidebar-item" @click="openComments(item)">
              <view class="icon-wrapper">
                <image class="sidebar-icon-image" src="/static/icons/feed-comment.png" mode="aspectFit"></image>
              </view>
              <text class="sidebar-count" :style="{ fontSize: `calc(12px * ${fontScale})` }">{{ formatNumber(item.commentCount) }}</text>
            </view>
            <view class="sidebar-item" @click="handleCollect(item)">
              <view class="icon-wrapper" :class="{ active: item.isCollected }">
                <image class="sidebar-icon-image" :src="item.isCollected ? '/static/icons/detail-collect-active.png' : '/static/icons/detail-collect.png'" mode="aspectFit"></image>
              </view>
              <text class="sidebar-count" :style="{ fontSize: `calc(12px * ${fontScale})` }">{{ formatNumber(item.collectCount || 0) }}</text>
            </view>
            <view class="sidebar-item">
              <button class="share-btn" open-type="share">
                <view class="icon-wrapper">
                  <image class="sidebar-icon-image" src="/static/icons/detail-share.png" mode="aspectFit"></image>
                </view>
              </button>
              <text class="sidebar-count" :style="{ fontSize: `calc(12px * ${fontScale})` }">分享</text>
            </view>
            <view class="sidebar-item" @click="handlePoster(item)">
              <view class="icon-wrapper">
                <image class="sidebar-icon-image" src="/static/icons/detail-poster.png" mode="aspectFit"></image>
              </view>
              <text class="sidebar-count" :style="{ fontSize: `calc(12px * ${fontScale})` }">海报</text>
            </view>
          </view>
        </swiper-item>
      </swiper>

      <!-- 顶部渐变遮罩 -->
      <view class="top-gradient" :style="{ height: (statusBarHeight + 80) + 'px' }"></view>
    </template>

    <!-- 评论弹窗 -->
    <CommentModal
      v-if="showComments && commentPostId > 0"
      :post-id="commentPostId"
      @close="showComments = false"
      @submitted="handleCommentSubmitted"
    />
    <canvas canvas-id="videoPosterCanvas" class="poster-canvas"></canvas>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { onLoad, onShow, onHide, onShareAppMessage } from '@dcloudio/uni-app';
import { useThemeStore } from '@/store/theme';
import { useUserStore } from '@/store/user';
import { storeToRefs } from 'pinia';
import { formatNumber } from '@/common/utils';
import { buildSharePoster, previewOrSavePoster } from '@/common/poster';
import CommentModal from '@/components/CommentModal.vue';
import { feedApi, interactionApi, postApi, userApi } from '@/api';

const themeStore = useThemeStore();
const userStore = useUserStore();
const { fontScale } = storeToRefs(themeStore);

const statusBarHeight = ref(0);
const videoList = ref<any[]>([]);
const currentIndex = ref(0);
const pausedVideos = ref<Record<number, boolean>>({});
const showLikeAnimation = ref(false);
const showComments = ref(false);
const commentPostId = ref(0);
const loading = ref(true);
const targetVideoId = ref<number | null>(null);
const MOBILE_DATA_PLAY_CONFIRM_KEY = 'video_mobile_data_play_allowed';
const posterLoading = ref(false);
const API_BASE_URL = 'http://localhost:3000/api/v1';

const currentVideo = computed(() => videoList.value[currentIndex.value]);

const getAuthor = (item: any) => item.author || item.user || {};

const applyTargetVideoIndex = () => {
  if (!videoList.value.length) {
    currentIndex.value = 0;
    return;
  }
  if (!targetVideoId.value) {
    currentIndex.value = 0;
    return;
  }
  const idx = videoList.value.findIndex((item) => Number(item.id) === Number(targetVideoId.value));
  currentIndex.value = idx >= 0 ? idx : 0;
};

const ensureTargetVideoInList = async () => {
  if (!targetVideoId.value || !Number.isFinite(targetVideoId.value)) return;
  const exists = videoList.value.some((item) => Number(item.id) === Number(targetVideoId.value));
  if (exists) return;

  try {
    const detail = await postApi.getDetail(Number(targetVideoId.value));
    if (Number(detail?.type) !== 2) return;
    const videoUrl = detail?.videoUrl || detail?.mediaUrls?.[0];
    if (!videoUrl) return;

    const mapped = {
      ...detail,
      author: detail.author || detail.user,
      videoUrl,
      coverUrl: detail.coverUrl || detail.videoMeta?.coverUrl || null,
      isFollowed: !!detail.author?.isFollowed || !!detail.user?.isFollowed,
      isLiked: !!detail.isLiked,
      isCollected: !!detail.isCollected,
    };

    if (userStore.isLoggedIn) {
      try {
        const status = await interactionApi.getPostStatus(Number(targetVideoId.value));
        mapped.isLiked = !!status.isLiked;
        mapped.isCollected = !!status.isCollected;
        mapped.isFollowed = !!status.isFollowedAuthor;
      } catch {
        // 忽略状态补齐失败
      }
    }

    videoList.value.unshift(mapped);
  } catch {
    // 忽略目标视频补拉失败，保留原视频流可用
  }
};

const ensureNetworkAllowed = async () => {
  const networkType = await new Promise<string>((resolve) => {
    uni.getNetworkType({
      success: (res) => resolve(res.networkType || 'unknown'),
      fail: () => resolve('unknown'),
    });
  });

  if (networkType === 'wifi' || networkType === 'unknown') {
    return true;
  }

  if (uni.getStorageSync(MOBILE_DATA_PLAY_CONFIRM_KEY)) {
    return true;
  }

  return new Promise<boolean>((resolve) => {
    uni.showModal({
      title: '流量播放提醒',
      content: '当前不是 Wi-Fi 环境，继续播放视频可能消耗较多流量，是否继续？',
      confirmText: '继续播放',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          uni.setStorageSync(MOBILE_DATA_PLAY_CONFIRM_KEY, true);
          resolve(true);
          return;
        }
        resolve(false);
      },
      fail: () => resolve(false),
    });
  });
};

// Get status bar height
try {
  const sysInfo = uni.getSystemInfoSync();
  statusBarHeight.value = sysInfo.statusBarHeight || 20;
} catch { statusBarHeight.value = 20; }

const loadVideos = async () => {
  loading.value = true;
  try {
    const canPlay = await ensureNetworkAllowed();
    if (!canPlay) {
      videoList.value = [];
      return;
    }

    const res = await feedApi.getVideoList({ page: 1, pageSize: 10 });
    videoList.value = (res.list || []).map((item: any) => ({
      ...item,
      author: item.author || item.user,
      isFollowed: !!item.author?.isFollowed || !!item.user?.isFollowed,
      isLiked: !!item.isLiked,
      isCollected: !!item.isCollected,
    }));

    if (userStore.isLoggedIn && videoList.value.length) {
      try {
        const statusRes = await interactionApi.getPostBatchStatus(videoList.value.map((item: any) => item.id));
        const statusMap = new Map((statusRes.list || []).map((item: any) => [item.postId, item]));
        videoList.value = videoList.value.map((item: any) => {
          const status = statusMap.get(item.id);
          if (!status) return item;
          return {
            ...item,
            isLiked: !!status.isLiked,
            isCollected: !!status.isCollected,
            isFollowed: !!status.isFollowedAuthor,
          };
        });
      } catch {
        // 忽略状态补齐失败，保持主列表可用
      }
    }

    await ensureTargetVideoInList();
    applyTargetVideoIndex();

    if (userStore.isLoggedIn && videoList.value[currentIndex.value]?.id) {
      userApi.recordHistory({ postId: videoList.value[currentIndex.value].id }).catch(() => {});
    }
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
  if (userStore.isLoggedIn && videoList.value[newIndex]?.id) {
    userApi.recordHistory({ postId: videoList.value[newIndex].id }).catch(() => {});
  }
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
  const prev = !!item.isLiked;
  item.isLiked = !prev;
  item.likeCount = Math.max(0, Number(item.likeCount || 0) + (item.isLiked ? 1 : -1));
  try {
    if (item.isLiked) {
      await interactionApi.like({ targetId: item.id, targetType: 'post' });
    } else {
      await interactionApi.unlike({ targetId: item.id, targetType: 'post' });
    }
  } catch {
    item.isLiked = prev;
    item.likeCount = Math.max(0, Number(item.likeCount || 0) + (item.isLiked ? 1 : -1));
  }
};

const handleCollect = async (item: any) => {
  if (!userStore.requireLogin()) return;
  const prev = !!item.isCollected;
  item.isCollected = !prev;
  item.collectCount = Math.max(0, Number(item.collectCount || 0) + (item.isCollected ? 1 : -1));
  try {
    if (item.isCollected) {
      await interactionApi.collect({ targetId: item.id, targetType: 'post' });
    } else {
      await interactionApi.uncollect({ targetId: item.id, targetType: 'post' });
    }
  } catch {
    item.isCollected = prev;
    item.collectCount = Math.max(0, Number(item.collectCount || 0) + (item.isCollected ? 1 : -1));
  }
};

const openComments = (item: any) => {
  const id = Number(item?.id || 0);
  if (!id) return;
  commentPostId.value = id;
  showComments.value = true;
};

const handleCommentSubmitted = (payload: { postId: number }) => {
  const targetId = Number(payload?.postId || 0);
  if (!targetId) return;
  const idx = videoList.value.findIndex((item) => Number(item.id) === targetId);
  if (idx === -1) return;
  const target = videoList.value[idx];
  target.commentCount = Number(target.commentCount || 0) + 1;
};

const goToProfile = (author: any) => {
  const nickname = author?.nickname;
  if (!nickname) return;
  uni.navigateTo({ url: `/pages/search/search?keyword=${encodeURIComponent(nickname)}` });
};

const handleFollow = async (item: any) => {
  if (!userStore.requireLogin()) return;
  const author = getAuthor(item);
  if (!author?.id) return;
  const prev = !!item.isFollowed;
  item.isFollowed = !prev;
  try {
    const res = await interactionApi.follow({ userId: author.id });
    item.isFollowed = !!res.followed;
  } catch {
    item.isFollowed = prev;
    uni.showToast({ title: '操作失败', icon: 'none' });
  }
};

const handlePoster = async (item: any) => {
  if (posterLoading.value) return;
  const author = getAuthor(item);
  posterLoading.value = true;
  uni.showLoading({ title: '生成海报中...' });
  try {
    const qrcodeUrl =
      `${API_BASE_URL}/share/wxacode?scene=${encodeURIComponent(`id=${item?.id || ''}`)}` +
      `&page=${encodeURIComponent('pages/video/video')}&width=280`;
    const poster = await buildSharePoster({
      canvasId: 'videoPosterCanvas',
      title: item?.title || '健康视频分享',
      subtitle: author?.nickname ? `作者：${author.nickname}` : '银龄健康社区',
      imageUrl: item?.coverUrl || item?.videoMeta?.coverUrl,
      qrcodeUrl,
    });
    await previewOrSavePoster(poster);
  } catch {
    uni.showToast({ title: '海报生成失败', icon: 'none' });
  } finally {
    uni.hideLoading();
    posterLoading.value = false;
  }
};

onShareAppMessage(() => {
  const video = currentVideo.value;
  return {
    title: video?.title || '银龄健康',
    path: `/pages/video/video?id=${video?.id}`,
    imageUrl: video?.coverUrl,
  };
});

onLoad((options: any) => {
  const id = Number(options?.id || 0);
  targetVideoId.value = Number.isFinite(id) && id > 0 ? id : null;
});

onShow(async () => {
  await loadVideos();
  await nextTick();
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

.empty-icon {
  width: 120rpx;
  height: 120rpx;
  border-radius: 30rpx;
  background: rgba(255, 255, 255, 0.14);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32rpx;
}

.empty-icon-image {
  width: 58rpx;
  height: 58rpx;
}
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

.pause-icon-image { width: 56rpx; height: 56rpx; margin-left: 8rpx; }

.like-animation {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  animation: likeScale 0.8s ease-out forwards;
  pointer-events: none;
}

.heart-icon {
  width: 240rpx;
  height: 240rpx;
  border-radius: 60rpx;
  background: rgba(225, 112, 85, 0.18);
  border: 2rpx solid rgba(255, 255, 255, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
}

.heart-icon-image {
  width: 132rpx;
  height: 132rpx;
}

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
  background: #E17055; padding: 0 18rpx;
  min-height: 88rpx;
  border-radius: 20rpx; font-size: 22rpx; color: #fff;
  display: flex;
  align-items: center;
  gap: 6rpx;
}

.follow-tag-icon {
  width: 18rpx;
  height: 18rpx;
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
  width: 88rpx; height: 88rpx;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  
  &::before {
    content: '';
    width: 40rpx;
    height: 40rpx;
    background: #E17055;
    border-radius: 50%;
    border: 3rpx solid #fff;
    position: absolute;
  }
}

.plus-icon-image { width: 22rpx; height: 22rpx; position: relative; z-index: 1; }

.icon-wrapper {
  width: 80rpx; height: 80rpx;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10rpx);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s ease;
  &.active { background: rgba(225, 112, 85, 0.3); transform: scale(1.1); }
}

.sidebar-icon {
  display: none;
}

.sidebar-icon-image {
  width: 34rpx;
  height: 34rpx;
}
.sidebar-count { color: #fff; text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.5); }

.share-btn {
  background: transparent; padding: 0; margin: 0; line-height: 1;
  &::after { display: none; }
}

.poster-canvas {
  position: fixed;
  left: -9999px;
  top: -9999px;
  width: 540px;
  height: 960px;
}
</style>
