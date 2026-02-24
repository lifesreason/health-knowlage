<template>
  <view class="search-page" :style="{ '--font-scale': fontScale }">
    <!-- 搜索头部 -->
    <view class="search-header">
      <view class="search-bar">
        <view class="search-icon">
          <image class="search-icon-image" src="/static/icons/home-search-field.png" mode="aspectFit"></image>
        </view>
        <input 
          v-model="keyword" 
          type="text" 
          placeholder="搜索健康知识、医师、圈子..."
          confirm-type="search"
          :focus="true"
          @confirm="doSearch"
          class="search-input"
          :style="{ fontSize: `calc(14px * ${fontScale})` }"
        />
        <view v-if="keyword" class="clear-icon" @click="keyword = ''">
          <image class="clear-icon-image" src="/static/icons/common-close-muted.png" mode="aspectFit"></image>
        </view>
      </view>
      <text class="cancel-btn" @click="goBack" :style="{ fontSize: `calc(14px * ${fontScale})` }">取消</text>
    </view>

    <!-- 搜索历史（无关键词时显示） -->
    <view v-if="!keyword" class="history-section">
      <!-- 热门搜索 -->
      <view class="section-card">
        <view class="section-header">
          <text class="section-title" :style="{ fontSize: `calc(15px * ${fontScale})` }">热门搜索</text>
        </view>
        <view class="hot-list">
          <view 
            v-for="(item, index) in hotKeywords" 
            :key="index" 
            class="hot-item"
            @click="keyword = item; doSearch()"
          >
            <text class="hot-rank" :class="{ top: index < 3 }">{{ index + 1 }}</text>
            <text class="hot-text" :style="{ fontSize: `calc(14px * ${fontScale})` }">{{ item }}</text>
          </view>
        </view>
      </view>

      <!-- 搜索历史 -->
      <view class="section-card" v-if="searchHistory.length">
        <view class="section-header">
          <text class="section-title" :style="{ fontSize: `calc(15px * ${fontScale})` }">搜索历史</text>
          <text class="clear-history" @click="clearHistory" :style="{ fontSize: `calc(13px * ${fontScale})` }">清空</text>
        </view>
        <view class="history-tags">
          <view 
            v-for="(item, index) in searchHistory" 
            :key="index" 
            class="history-tag"
            @click="keyword = item; doSearch()"
          >
            <text :style="{ fontSize: `calc(13px * ${fontScale})` }">{{ item }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 搜索结果 -->
    <scroll-view v-else scroll-y class="search-results" @scrolltolower="loadMore">
      <!-- 加载中 -->
      <view v-if="loading && results.length === 0" class="loading-state">
        <view class="loading-dots">
          <view class="dot"></view>
          <view class="dot"></view>
          <view class="dot"></view>
        </view>
        <text class="loading-text">搜索中...</text>
      </view>

      <!-- 空结果 -->
      <view v-else-if="searched && results.length === 0" class="empty-state">
        <view class="empty-icon">
          <image class="empty-icon-image" src="/static/icons/detail-poster.png" mode="aspectFit"></image>
        </view>
        <text class="empty-title">未找到相关结果</text>
        <text class="empty-desc">换个关键词试试吧</text>
      </view>

      <!-- 结果列表 -->
      <view v-else class="results-list">
        <view 
          v-for="item in results" 
          :key="item.id" 
          class="result-card"
          @click="goToDetail(item)"
        >
          <view class="result-header">
            <image 
              class="result-avatar" 
              :src="item.user?.avatarUrl || '/static/default-avatar.png'" 
              mode="aspectFill"
            ></image>
            <text class="result-author" :style="{ fontSize: `calc(13px * ${fontScale})` }">{{ item.user?.nickname || '系统' }}</text>
          </view>
          <text class="result-title" :style="{ fontSize: `calc(16px * ${fontScale})` }">{{ item.title || '无标题' }}</text>
          <text class="result-content" :style="{ fontSize: `calc(14px * ${fontScale})` }">{{ stripHtml(item.content) }}</text>
          <view class="result-footer">
            <text class="result-stat">赞 {{ item.likeCount || 0 }}</text>
            <text class="result-stat">评 {{ item.commentCount || 0 }}</text>
          </view>
        </view>

        <!-- 加载更多 -->
        <view v-if="loading" class="load-more">
          <text>加载中...</text>
        </view>
        <view v-else-if="noMore && results.length" class="load-more">
          <text>—— 没有更多了 ——</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useThemeStore } from '@/store/theme';
import { storeToRefs } from 'pinia';
import { postApi } from '@/api';

const themeStore = useThemeStore();
const { fontScale } = storeToRefs(themeStore);

const keyword = ref('');
const loading = ref(false);
const searched = ref(false);
const noMore = ref(false);
const page = ref(1);
const results = ref<any[]>([]);
const searchHistory = ref<string[]>([]);
const hotKeywords = ref([
  '高血压注意事项',
  '糖尿病饮食',
  '老年人运动',
  '保健养生',
  '睡眠质量',
  '记忆力提升',
]);

const stripHtml = (html: string) => {
  if (!html) return '';
  let text = html.replace(/<[^>]*>/g, '');
  text = text.replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length > 80 ? text.slice(0, 80) + '...' : text;
};

const loadHistory = () => {
  const saved = uni.getStorageSync('searchHistory');
  if (saved) searchHistory.value = saved;
};

const saveHistory = (word: string) => {
  const list = [word, ...searchHistory.value.filter(w => w !== word)].slice(0, 10);
  searchHistory.value = list;
  uni.setStorageSync('searchHistory', list);
};

const clearHistory = () => {
  uni.showModal({
    title: '提示',
    content: '确定清空搜索历史？',
    success: (res) => {
      if (res.confirm) {
        searchHistory.value = [];
        uni.removeStorageSync('searchHistory');
      }
    }
  });
};

const doSearch = async () => {
  const normalized = keyword.value.trim();
  if (!normalized) return;
  keyword.value = normalized;
  saveHistory(normalized);
  searched.value = true;
  page.value = 1;
  noMore.value = false;
  results.value = [];
  await loadResults();
};

const loadResults = async () => {
  loading.value = true;
  try {
    const res = await postApi.search({ keyword: keyword.value, page: page.value, pageSize: 20 });
    const list = res.list || [];
    if (page.value === 1) {
      results.value = list;
    } else {
      results.value.push(...list);
    }
    noMore.value = list.length < 20;
  } catch (error) {
    console.error('搜索失败', error);
    uni.showToast({ title: '搜索失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
};

const loadMore = () => {
  if (loading.value || noMore.value) return;
  page.value++;
  loadResults();
};

const goToDetail = (item: any) => {
  const targetUrl = Number(item?.type) === 2
    ? `/pages/video/video?id=${item.id}`
    : `/pages/detail/detail?id=${item.id}`;
  uni.navigateTo({ url: targetUrl });
};

const goBack = () => {
  const pages = getCurrentPages();
  if (pages.length > 1) {
    uni.navigateBack();
    return;
  }
  uni.switchTab({ url: '/pages/index/index' });
};

onMounted(() => loadHistory());

onLoad((options: any) => {
  const kw = options?.keyword ? decodeURIComponent(options.keyword) : '';
  if (!kw) return;
  keyword.value = kw;
  doSearch();
});
</script>

<style lang="scss" scoped>
.search-page {
  min-height: 100vh;
  background: #f5f6f8;
}

// 搜索头部
.search-header {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx 24rpx;
  padding-top: calc(16rpx + env(safe-area-inset-top));
  background: #fff;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.search-bar {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 16rpx;
  height: 76rpx;
  padding: 0 24rpx;
  background: #f5f5f5;
  border-radius: 38rpx;
}

.search-icon {
  width: 38rpx;
  height: 38rpx;
  border-radius: 10rpx;
  background: #eceff2;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-icon-image {
  width: 22rpx;
  height: 22rpx;
}

.search-input {
  flex: 1;
  background: transparent;
}

.clear-icon {
  width: 88rpx;
  height: 88rpx;
  margin-right: -14rpx;
  border-radius: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-icon-image {
  width: 24rpx;
  height: 24rpx;
}

.cancel-btn {
  color: #E17055;
  font-weight: 500;
}

// 历史区域
.history-section {
  padding: 24rpx;
}

.section-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.section-title {
  font-weight: 600;
  color: #1a1a1a;
}

.clear-history {
  color: #999;
}

// 热门搜索
.hot-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.hot-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 12rpx 0;
}

.hot-rank {
  width: 40rpx;
  height: 40rpx;
  border-radius: 8rpx;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  color: #999;
  font-weight: 600;
  
  &.top {
    background: linear-gradient(135deg, #E17055, #d45d43);
    color: #fff;
  }
}

.hot-text {
  color: #333;
}

// 搜索历史
.history-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.history-tag {
  background: #f5f5f5;
  padding: 12rpx 24rpx;
  border-radius: 24rpx;
  color: #666;
}

// 搜索结果
.search-results {
  height: calc(100vh - 120rpx - env(safe-area-inset-top));
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
  gap: 24rpx;
}

.loading-dots {
  display: flex;
  gap: 12rpx;
}

.dot {
  width: 16rpx;
  height: 16rpx;
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

.loading-text {
  color: #999;
  font-size: 28rpx;
}

// 空状态
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 0;
  gap: 16rpx;
}

.empty-icon {
  width: 88rpx;
  height: 88rpx;
  border-radius: 22rpx;
  background: #eef2f7;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-icon-image {
  width: 42rpx;
  height: 42rpx;
}

.empty-title {
  font-size: 32rpx;
  color: #333;
  font-weight: 500;
}

.empty-desc {
  font-size: 28rpx;
  color: #999;
}

// 结果列表
.results-list {
  padding: 24rpx;
}

.result-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.result-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 16rpx;
}

.result-avatar {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
}

.result-author {
  color: #999;
}

.result-title {
  display: block;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 12rpx;
  line-height: 1.4;
}

.result-content {
  display: block;
  color: #666;
  line-height: 1.6;
  margin-bottom: 16rpx;
}

.result-footer {
  display: flex;
  gap: 24rpx;
}

.result-stat {
  font-size: 24rpx;
  color: #999;
}

.load-more {
  text-align: center;
  padding: 32rpx;
  color: #999;
  font-size: 26rpx;
}
</style>
