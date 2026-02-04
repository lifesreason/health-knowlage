<template>
  <view class="course-detail-container">
    <!-- 课程分类头部 -->
    <view class="category-header">
      <image class="category-cover" :src="categoryDetail?.coverUrl || '/static/images/default-circle.png'" mode="aspectFill"></image>
      <view class="category-info">
        <view class="category-name text-scale-xl">{{ categoryDetail?.name }}</view>
        <view class="category-desc text-scale">{{ categoryDetail?.description }}</view>
        <view class="category-stats text-scale-sm">
          <text class="stat-item">
            <text class="stat-icon">📚</text>
            {{ categoryDetail?.postCount || 0 }}节课程
          </text>
        </view>
      </view>
    </view>

    <!-- 课程列表 -->
    <scroll-view
      scroll-y
      class="course-list"
      @scrolltolower="loadMore"
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <view
        v-for="item in courseList"
        :key="item.id"
        class="course-item"
        @click="goToDetail(item.id)"
      >
        <view class="course-header">
          <image class="user-avatar" :src="item.user?.avatarUrl || '/static/images/default-avatar.png'" mode="aspectFill"></image>
          <view class="user-info">
            <view class="user-name text-scale">{{ item.user?.nickname }}</view>
            <view class="post-time text-scale-sm">{{ formatTime(item.createdAt) }}</view>
          </view>
          <view class="course-type">
            <text v-if="item.type === 2" class="type-tag video-tag">视频</text>
            <text v-else class="type-tag article-tag">图文</text>
          </view>
        </view>

        <view class="course-title text-scale-lg" v-if="item.title">{{ item.title }}</view>
        <view class="course-content text-scale">{{ item.content }}</view>

        <!-- 媒体内容 -->
        <view v-if="item.type === 2 && item.mediaUrls && item.mediaUrls.length > 0" class="course-video">
          <video class="video-player" :src="item.mediaUrls[0]" :poster="item.videoMeta?.coverUrl"></video>
        </view>
        <view v-else-if="item.mediaUrls && item.mediaUrls.length > 0" class="course-images">
          <image
            v-for="(img, index) in item.mediaUrls.slice(0, 3)"
            :key="index"
            class="course-image"
            :src="img"
            mode="aspectFill"
          ></image>
        </view>

        <view class="course-footer">
          <view class="course-stat">
            <text class="stat-icon">👁</text>
            <text class="text-scale-sm">{{ item.viewCount || 0 }}人学习</text>
          </view>
          <view class="course-stat">
            <text class="stat-icon">💬</text>
            <text class="text-scale-sm">{{ item.commentCount || 0 }}评论</text>
          </view>
          <view class="course-stat" @click.stop="handleLike(item)">
            <text :class="['stat-icon', item.liked ? 'liked' : '']">{{ item.liked ? '❤' : '♡' }}</text>
            <text class="text-scale-sm">{{ item.likeCount || 0 }}</text>
          </view>
        </view>
      </view>

      <!-- 加载更多 -->
      <view class="load-more" v-if="!noMore && courseList.length > 0">
        <text class="loading-icon">⏳</text>
        <text class="text-scale-sm">加载中...</text>
      </view>

      <!-- 没有更多 -->
      <view class="no-more" v-else-if="courseList.length > 0">
        <text class="text-scale-sm">没有更多了</text>
      </view>

      <!-- 空状态 -->
      <view v-if="courseList.length === 0 && !loading" class="empty-state">
        <text class="empty-icon">📭</text>
        <text class="text-scale">暂无课程内容</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getCircleDetail, getCirclePosts } from '@/api/circle';
import { likePost, unlikePost } from '@/api/feed';
import { useUserStore } from '@/store/user';

const userStore = useUserStore();

const categoryId = ref(0);
const categoryDetail = ref<any>(null);
const courseList = ref<any[]>([]);
const page = ref(1);
const pageSize = ref(10);
const loading = ref(false);
const refreshing = ref(false);
const noMore = ref(false);

// 加载课程分类详情
const loadCategoryDetail = async () => {
  try {
    categoryDetail.value = await getCircleDetail(categoryId.value);
  } catch (error) {
    console.error('加载课程分类详情失败', error);
  }
};

// 加载课程列表
const loadCourseList = async () => {
  if (loading.value || noMore.value) return;

  loading.value = true;
  try {
    const res = await getCirclePosts({
      circleId: categoryId.value,
      page: page.value,
      pageSize: pageSize.value,
    });

    if (page.value === 1) {
      courseList.value = res.list || [];
    } else {
      courseList.value.push(...(res.list || []));
    }

    if (courseList.value.length >= res.total) {
      noMore.value = true;
    }

    page.value++;
  } catch (error) {
    console.error('加载课程列表失败', error);
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
};

// 下拉刷新
const onRefresh = () => {
  refreshing.value = true;
  page.value = 1;
  courseList.value = [];
  noMore.value = false;
  loadCourseList();
};

// 加载更多
const loadMore = () => {
  if (!loading.value && !noMore.value) {
    loadCourseList();
  }
};

// 跳转详情
const goToDetail = (id: number) => {
  uni.navigateTo({
    url: `/pages/detail/detail?id=${id}`,
  });
};

// 点赞
const handleLike = async (item: any) => {
  if (!userStore.isLoggedIn) {
    uni.showToast({ title: '请先登录', icon: 'none' });
    return;
  }

  try {
    if (item.liked) {
      await unlikePost(item.id);
      item.liked = false;
      item.likeCount--;
    } else {
      await likePost(item.id);
      item.liked = true;
      item.likeCount++;
    }
  } catch (error) {
    console.error('点赞失败', error);
  }
};

// 格式化时间
const formatTime = (time: string) => {
  const now = Date.now();
  const diff = now - new Date(time).getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) {
    return '刚刚';
  } else if (diff < hour) {
    return `${Math.floor(diff / minute)}分钟前`;
  } else if (diff < day) {
    return `${Math.floor(diff / hour)}小时前`;
  } else {
    return `${Math.floor(diff / day)}天前`;
  }
};

onLoad((options: any) => {
  if (options.id) {
    categoryId.value = +options.id;
    loadCategoryDetail();
    loadCourseList();
  }
});
</script>

<style lang="scss" scoped>
.course-detail-container {
  min-height: 100vh;
  background-color: var(--bg-color);
  padding-bottom: 24rpx;
}

.category-header {
  background-color: #fff;
  padding: 32rpx 24rpx;
  display: flex;
  gap: 24rpx;
  margin-bottom: 16rpx;
}

.category-cover {
  width: 120rpx;
  height: 120rpx;
  border-radius: 12rpx;
  background: linear-gradient(135deg, var(--primary-color) 0%, #A29BFE 100%);
}

.category-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.category-name {
  font-weight: bold;
  color: var(--text-color);
}

.category-desc {
  color: var(--text-light);
  font-size: 28rpx;
}

.category-stats {
  color: var(--text-light);
  display: flex;
  gap: 24rpx;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4rpx;
}

.stat-icon {
  font-size: 24rpx;
}

.course-list {
  height: calc(100vh - 280rpx);
}

.course-item {
  background-color: #fff;
  margin: 0 24rpx 16rpx;
  padding: 24rpx;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.course-header {
  display: flex;
  gap: 16rpx;
  margin-bottom: 16rpx;
  align-items: center;
}

.user-avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 32rpx;
  background-color: #f0f0f0;
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.user-name {
  font-weight: bold;
  color: var(--text-color);
}

.post-time {
  color: var(--text-light);
  font-size: 24rpx;
}

.course-type {
  flex-shrink: 0;
}

.type-tag {
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
  font-size: 20rpx;
}

.video-tag {
  background-color: rgba(108, 92, 231, 0.1);
  color: var(--primary-color);
}

.article-tag {
  background-color: rgba(0, 184, 148, 0.1);
  color: var(--secondary-color);
}

.course-title {
  font-weight: bold;
  color: var(--text-color);
  margin-bottom: 12rpx;
}

.course-content {
  color: var(--text-light);
  margin-bottom: 16rpx;
  line-height: 1.6;
}

.course-video {
  width: 100%;
  height: 400rpx;
  border-radius: 12rpx;
  overflow: hidden;
  margin-bottom: 16rpx;
}

.video-player {
  width: 100%;
  height: 100%;
}

.course-images {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8rpx;
  margin-bottom: 16rpx;
}

.course-image {
  width: 100%;
  height: 200rpx;
  border-radius: 8rpx;
}

.course-footer {
  display: flex;
  gap: 48rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #f5f5f5;
}

.course-stat {
  display: flex;
  align-items: center;
  gap: 8rpx;
  color: var(--text-light);
}

.stat-icon {
  font-size: 32rpx;
  color: var(--text-light);
}

.stat-icon.liked {
  color: var(--accent-color);
}

.load-more,
.no-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  padding: 32rpx 0;
  color: var(--text-light);
}

.loading-icon {
  font-size: 32rpx;
  color: var(--text-light);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 24rpx;
}
</style>