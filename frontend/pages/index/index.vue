<template>
  <view class="home-page" :style="{ '--font-scale': fontScale }">
    <!-- 顶部区域 -->
    <view class="header-section">
      <!-- Logo 和问候 -->
      <view class="greeting-row">
        <view class="greeting-text">
          <text class="greeting-label">银龄健康</text>
          <text class="greeting-sub">为您的健康保驾护航</text>
        </view>
        <view class="header-actions">
          <view class="action-btn" @click="goToSearch">
            <text class="action-icon">搜</text>
          </view>
        </view>
      </view>
      
      <!-- 搜索栏 -->
      <view class="search-bar" @click="goToSearch">
        <text class="search-icon">⌕</text>
        <text class="search-placeholder" :style="{ fontSize: `calc(14px * ${fontScale})` }">搜索健康知识、医师、圈子...</text>
      </view>
    </view>

    <!-- Tabs 导航 -->
    <view class="tabs-container">
      <scroll-view scroll-x class="tabs-scroll" show-scrollbar="false">
        <view class="tabs-inner">
          <view
            v-for="tab in tabs"
            :key="tab.key"
            class="tab-item"
            :class="{ active: currentTab === tab.key }"
            @click="switchTab(tab.key)"
          >
            <text class="tab-text" :style="{ fontSize: `calc(15px * ${fontScale})` }">{{ tab.label }}</text>
            <view v-if="currentTab === tab.key" class="tab-indicator"></view>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 内容列表 -->
    <scroll-view
      scroll-y
      class="feed-scroll"
      @scrolltolower="loadMore"
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <!-- 骨架屏 -->
      <view v-if="loading && feedList.length === 0" class="skeleton-list">
        <view v-for="i in 3" :key="i" class="skeleton-card">
          <view class="skeleton-header">
            <view class="skeleton-avatar"></view>
            <view class="skeleton-name"></view>
          </view>
          <view class="skeleton-title"></view>
          <view class="skeleton-content"></view>
          <view class="skeleton-image"></view>
        </view>
      </view>

      <!-- 内容卡片 -->
      <view v-else class="feed-list">
        <FeedCard
          v-for="item in feedList"
          :key="item.id"
          :item="item"
          :font-scale="fontScale"
          @click="goToDetail(item)"
          @like="handleLike(item)"
        />
      </view>

      <!-- 加载更多 -->
      <view v-if="feedList.length > 0" class="load-more">
        <view v-if="loading" class="loading-indicator">
          <view class="loading-dot"></view>
          <view class="loading-dot"></view>
          <view class="loading-dot"></view>
        </view>
        <text v-else-if="noMore" class="no-more-text" :style="{ fontSize: `calc(13px * ${fontScale})` }">
          —— 已经到底啦 ——
        </text>
      </view>

      <!-- 空状态 -->
      <EmptyState
        v-if="!loading && feedList.length === 0"
        type="empty"
        message="暂无相关内容，去别处看看"
      />
      
      <!-- 底部安全区 -->
      <view class="safe-bottom"></view>
    </scroll-view>

    <!-- 发布按钮 -->
    <view class="publish-btn" @click="goToPublish">
      <text class="publish-icon">发</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad, onShow, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
import { useThemeStore } from '@/store/theme';
import { useUserStore } from '@/store/user';
import { storeToRefs } from 'pinia';
import FeedCard from '@/components/FeedCard.vue';
import EmptyState from '@/components/EmptyState.vue';
import { feedApi, interactionApi } from '@/api';

const themeStore = useThemeStore();
const userStore = useUserStore();
const { fontScale } = storeToRefs(themeStore);

// Tabs 配置
const tabs = [
  { key: 'recommend', label: '推荐' },
  { key: 'follow', label: '关注' },
  { key: 'nearby', label: '附近' },
];

const currentTab = ref('recommend');
const feedList = ref<any[]>([]);
const loading = ref(false);
const refreshing = ref(false);
const noMore = ref(false);
const page = ref(1);
const pageSize = 10;
const userLocation = ref<{ lat: number; lng: number } | null>(null);

const resolveUserLocation = async () => {
  if (userLocation.value) return userLocation.value;

  const location = await new Promise<{ lat: number; lng: number } | null>((resolve) => {
    uni.getLocation({
      type: 'gcj02',
      success: (res) => {
        resolve({ lat: res.latitude, lng: res.longitude });
      },
      fail: () => resolve(null),
    });
  });

  userLocation.value = location;
  return location;
};

// 切换Tab
const switchTab = (key: string) => {
  if (currentTab.value === key) return;
  currentTab.value = key;
  page.value = 1;
  noMore.value = false;
  loadFeed(true);
};

// 加载列表
const loadFeed = async (refresh = false) => {
  if (loading.value) return;
  if (currentTab.value === 'follow' && !userStore.token) {
    feedList.value = [];
    noMore.value = true;
    uni.showToast({ title: '请先登录查看关注内容', icon: 'none' });
    return;
  }
  loading.value = true;

  try {
    let res: any;
    if (currentTab.value === 'follow') {
      res = await feedApi.getFollowingList({
        page: page.value,
        pageSize,
      });
    } else if (currentTab.value === 'nearby') {
      const location = await resolveUserLocation();
      res = await feedApi.getNearbyList({
        lat: location?.lat || 0,
        lng: location?.lng || 0,
        page: page.value,
        pageSize,
      });
    } else {
      res = await feedApi.getList({
        page: page.value,
        pageSize,
        type: currentTab.value,
      });
    }

    const mergedList = (res.list || []).map((item: any) => ({
      ...item,
      isLiked: !!item.isLiked,
      isCollected: !!item.isCollected,
    }));

    if (userStore.isLoggedIn && mergedList.length) {
      try {
        const statusRes = await interactionApi.getPostBatchStatus(mergedList.map((item: any) => item.id));
        const statusMap = new Map((statusRes.list || []).map((item: any) => [item.postId, item]));
        mergedList.forEach((item: any) => {
          const status = statusMap.get(item.id);
          if (!status) return;
          item.isLiked = !!status.isLiked;
          item.isCollected = !!status.isCollected;
        });
      } catch {
        // 忽略状态补齐失败
      }
    }

    if (refresh) {
      feedList.value = mergedList;
    } else {
      feedList.value.push(...mergedList);
    }

    noMore.value = mergedList.length < pageSize;
  } catch (error) {
    console.error('加载失败', error);
    uni.showToast({ title: '加载失败', icon: 'none' });
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
};

// 下拉刷新
const onRefresh = () => {
  refreshing.value = true;
  page.value = 1;
  noMore.value = false;
  loadFeed(true);
};

// 加载更多
const loadMore = () => {
  if (noMore.value || loading.value) return;
  page.value++;
  loadFeed();
};

// 跳转详情
const goToDetail = (item: any) => {
  uni.navigateTo({ url: `/pages/detail/detail?id=${item.id}` });
};

// 跳转搜索
const goToSearch = () => {
  uni.navigateTo({ url: '/pages/search/search' });
};

// 跳转发布
const goToPublish = () => {
  if (!userStore.requireLogin()) return;
  uni.navigateTo({ url: '/sub_pkg_A/publisher/publisher' });
};

// 点赞
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
  } catch (error) {
    item.isLiked = !item.isLiked;
    item.likeCount += item.isLiked ? 1 : -1;
  }
};

onLoad(() => {
  loadFeed(true);
});

onShow(() => {
  // 可能需要刷新
});

onPullDownRefresh(() => {
  onRefresh();
  uni.stopPullDownRefresh();
});

onReachBottom(() => {
  loadMore();
});
</script>

<style lang="scss" scoped>
.home-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #fff5f3 0%, #f8f9fa 120rpx);
}

// 顶部区域
.header-section {
  padding: 24rpx 32rpx;
  padding-top: calc(24rpx + env(safe-area-inset-top));
  background: linear-gradient(135deg, #fff 0%, #fff5f3 100%);
}

.greeting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.greeting-text {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.greeting-label {
  font-size: 40rpx;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: 2rpx;
}

.greeting-sub {
  font-size: 24rpx;
  color: #666;
}

.header-actions {
  display: flex;
  gap: 16rpx;
}

.action-btn {
  width: 72rpx;
  height: 72rpx;
  background: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.action-icon {
  font-size: 28rpx;
  color: #e17055;
  font-weight: 700;
}

// 搜索栏
.search-bar {
  display: flex;
  align-items: center;
  gap: 16rpx;
  height: 80rpx;
  padding: 0 28rpx;
  background: #fff;
  border-radius: 40rpx;
  box-shadow: 0 4rpx 20rpx rgba(225, 112, 85, 0.08);
  border: 2rpx solid #ffeee8;
}

.search-icon {
  font-size: 28rpx;
  color: #b17866;
}

.search-placeholder {
  color: #bbb;
}

// Tabs
.tabs-container {
  background: #fff;
  padding-top: 8rpx;
}

.tabs-scroll {
  white-space: nowrap;
}

.tabs-inner {
  display: inline-flex;
  padding: 0 24rpx;
  gap: 8rpx;
}

.tab-item {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx 28rpx;
  position: relative;
}

.tab-text {
  color: #999;
  font-weight: 500;
  transition: all 0.2s ease;
}

.tab-item.active {
  .tab-text {
    color: #E17055;
    font-weight: 700;
  }
}

.tab-indicator {
  position: absolute;
  bottom: 4rpx;
  width: 40rpx;
  height: 6rpx;
  background: linear-gradient(90deg, #E17055, #d45d43);
  border-radius: 3rpx;
}

// 内容区
.feed-scroll {
  height: calc(100vh - 340rpx);
}

.feed-list {
  padding: 20rpx 24rpx;
}

// 骨架屏
.skeleton-list {
  padding: 20rpx 24rpx;
}

.skeleton-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
}

.skeleton-header {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.skeleton-avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: linear-gradient(90deg, #f5f5f5 25%, #eee 50%, #f5f5f5 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-name {
  width: 150rpx;
  height: 28rpx;
  border-radius: 14rpx;
  background: linear-gradient(90deg, #f5f5f5 25%, #eee 50%, #f5f5f5 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-title {
  width: 80%;
  height: 32rpx;
  border-radius: 16rpx;
  margin-bottom: 16rpx;
  background: linear-gradient(90deg, #f5f5f5 25%, #eee 50%, #f5f5f5 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-content {
  width: 60%;
  height: 24rpx;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
  background: linear-gradient(90deg, #f5f5f5 25%, #eee 50%, #f5f5f5 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-image {
  width: 100%;
  height: 300rpx;
  border-radius: 16rpx;
  background: linear-gradient(90deg, #f5f5f5 25%, #eee 50%, #f5f5f5 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

// 加载更多
.load-more {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32rpx;
  gap: 8rpx;
}

.loading-indicator {
  display: flex;
  gap: 8rpx;
}

.loading-dot {
  width: 12rpx;
  height: 12rpx;
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
}

// 安全区
.safe-bottom {
  height: calc(120rpx + env(safe-area-inset-bottom));
}

// 发布按钮
.publish-btn {
  position: fixed;
  right: 32rpx;
  bottom: calc(180rpx + env(safe-area-inset-bottom));
  width: 100rpx;
  height: 100rpx;
  background: linear-gradient(135deg, #E17055, #d45d43);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 32rpx rgba(225, 112, 85, 0.4);
  z-index: 100;
}

.publish-icon {
  font-size: 32rpx;
  color: #fff;
  font-weight: 700;
}
</style>
