<template>
  <view class="category-container">
    <!-- 顶部搜索 -->
    <view class="search-bar" @click="goToSearch">
      <text class="search-icon">🔍</text>
      <text class="search-placeholder">搜索课程</text>
    </view>

    <!-- 课程分类列表 -->
    <scroll-view scroll-y class="category-list" @scrolltolower="loadMore">
      <view
        v-for="item in categoryList"
        :key="item.id"
        class="category-item"
        @click="goToDetail(item.id)"
      >
        <image
          class="category-cover"
          :src="item.coverUrl || '/static/images/default-circle.png'"
          mode="aspectFill"
        ></image>
        <view class="category-info">
          <view class="category-name text-scale-lg">{{ item.name }}</view>
          <view class="category-desc text-scale">{{ item.description }}</view>
          <view class="category-stats text-scale-sm">
            <text class="stat-item">
              <text class="stat-icon">📚</text>
              {{ item.postCount }}节课程
            </text>
          </view>
        </view>
        <view class="arrow-icon">
          <text class="icon">›</text>
        </view>
      </view>

      <!-- 加载更多 -->
      <view class="load-more" v-if="!noMore && categoryList.length > 0">
        <text class="loading-icon">⏳</text>
        <text class="text-scale-sm">加载中...</text>
      </view>

      <!-- 没有更多 -->
      <view class="no-more" v-else-if="categoryList.length > 0">
        <text class="text-scale-sm">没有更多了</text>
      </view>

      <!-- 空状态 -->
      <view v-if="categoryList.length === 0 && !loading" class="empty-state">
        <text class="empty-icon">📭</text>
        <text class="text-scale">暂无课程分类</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getCircleList, type CircleItem } from '@/api/circle';

const categoryList = ref<CircleItem[]>([]);
const loading = ref(false);
const noMore = ref(false);

// 加载课程分类列表
const loadCategoryList = async () => {
  if (loading.value || noMore.value) return;

  loading.value = true;
  try {
    const res = await getCircleList();
    categoryList.value = res || [];
    noMore.value = true;
  } catch (error) {
    console.error('加载课程分类失败', error);
  } finally {
    loading.value = false;
  }
};

// 跳转课程详情
const goToDetail = (id: number) => {
  uni.navigateTo({
    url: `/pages/circle-detail/circle-detail?id=${id}`,
  });
};

// 跳转搜索
const goToSearch = () => {
  uni.navigateTo({
    url: '/pages/search/search',
  });
};

// 加载更多（暂不实现分页）
const loadMore = () => {
  // 暂不实现分页
};

onMounted(() => {
  loadCategoryList();
});
</script>

<style lang="scss" scoped>
.category-container {
  min-height: 100vh;
  background-color: var(--bg-color);
  padding-bottom: 24rpx;
}

.search-bar {
  margin: 20rpx 24rpx;
  padding: 20rpx 24rpx;
  background-color: #fff;
  border-radius: 32rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.search-placeholder {
  font-size: 28rpx;
  color: #999;
}

.search-icon {
  font-size: 32rpx;
  color: #999;
}

.category-list {
  height: calc(100vh - 120rpx);
}

.category-item {
  background-color: #fff;
  margin: 0 24rpx 16rpx;
  padding: 24rpx;
  display: flex;
  align-items: center;
  gap: 24rpx;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
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
  gap: 8rpx;
}

.category-name {
  font-weight: bold;
  color: var(--text-color);
}

.category-desc {
  color: var(--text-light);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

.arrow-icon {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.arrow-icon .icon {
  font-size: 48rpx;
  color: var(--text-light);
  font-weight: 300;
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