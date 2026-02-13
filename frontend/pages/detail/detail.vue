<template>
  <view class="detail-page" :style="{ '--font-scale': fontScale }">
    <!-- 加载状态 -->
    <view v-if="loading" class="loading-state">
      <view class="loading-spinner"></view>
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 文章内容 -->
    <scroll-view v-else-if="article" class="article-scroll" scroll-y>
      <!-- 顶部圈子标签 -->
      <view class="circle-header" v-if="article.circle">
        <view class="circle-tag">
          <text class="circle-icon">圈</text>
          <text class="circle-name">{{ article.circle.name }}</text>
        </view>
      </view>

      <!-- 文章标题 -->
      <view class="title-section">
        <text class="article-title">{{ article.title || '无标题' }}</text>
      </view>

      <!-- 作者信息 -->
      <view class="author-section">
        <image 
          class="author-avatar" 
          :src="article.user?.avatarUrl || '/static/default-avatar.png'" 
          mode="aspectFill"
        ></image>
        <view class="author-info">
          <text class="author-name">{{ article.user?.nickname || '系统管理员' }}</text>
          <view class="publish-meta">
            <text class="publish-time">{{ formatTime(article.createdAt) }}</text>
            <text class="view-count">· {{ article.viewCount || 0 }} 阅读</text>
          </view>
        </view>
        <view class="follow-btn" :class="{ followed: article.user?.isFollowed }" @click="handleFollow">
          <text>{{ article.user?.isFollowed ? '已关注' : '关注' }}</text>
        </view>
      </view>

      <!-- 分割线 -->
      <view class="divider"></view>

      <!-- 正文内容 -->
      <view class="content-section">
        <rich-text class="article-body" :nodes="article.content"></rich-text>
      </view>

      <!-- 图片列表 -->
      <view v-if="article.mediaUrls?.length" class="media-section">
        <view class="media-grid" :class="getGridClass(article.mediaUrls.length)">
          <image 
            v-for="(url, index) in article.mediaUrls" 
            :key="index"
            class="media-image"
            :src="url"
            mode="aspectFill"
            @click="previewImage(url, index)"
          ></image>
        </view>
      </view>

      <!-- 标签区域 -->
      <view class="tags-section" v-if="article.tags?.length">
        <view class="tag-item" v-for="tag in article.tags" :key="tag">
          <text>#{{ tag }}</text>
        </view>
      </view>

      <!-- 互动数据 -->
      <view class="stats-section">
        <view class="stat-item">
          <text class="stat-num">{{ article.likeCount || 0 }}</text>
          <text class="stat-label">点赞</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <text class="stat-num">{{ article.commentCount || 0 }}</text>
          <text class="stat-label">评论</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <text class="stat-num">{{ article.collectCount || 0 }}</text>
          <text class="stat-label">收藏</text>
        </view>
      </view>

      <!-- 底部占位 -->
      <view class="bottom-placeholder"></view>
    </scroll-view>

    <!-- 底部操作栏 -->
    <view class="footer-bar" v-if="article">
      <view class="input-area" @click="showComments = true">
        <text class="input-placeholder">说点什么...</text>
      </view>
      <view class="action-btns">
        <view class="action-btn" :class="{ active: article.isLiked }" @click="handleLike">
          <text class="action-icon">{{ article.isLiked ? '赞' : '赞' }}</text>
          <text class="action-num">{{ article.likeCount || '' }}</text>
        </view>
        <view class="action-btn" @click="showComments = true">
          <text class="action-icon">评</text>
          <text class="action-num">{{ article.commentCount || '' }}</text>
        </view>
        <view class="action-btn" :class="{ active: article.isCollected }" @click="handleCollect">
          <text class="action-icon">藏</text>
        </view>
        <button class="action-btn share-btn" open-type="share">
          <text class="action-icon">享</text>
        </button>
        <view class="action-btn" @click="handlePoster">
          <text class="action-icon">报</text>
        </view>
      </view>
    </view>

    <CommentModal
      v-if="showComments && article?.id"
      :post-id="article.id"
      @close="showComments = false"
      @submitted="handleCommentSubmitted"
    />
    <canvas canvas-id="detailPosterCanvas" class="poster-canvas"></canvas>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad, onShareAppMessage } from '@dcloudio/uni-app';
import { useThemeStore } from '@/store/theme';
import { useUserStore } from '@/store/user';
import { storeToRefs } from 'pinia';
import { formatRelativeTime } from '@/common/utils';
import { buildSharePoster, previewOrSavePoster } from '@/common/poster';
import CommentModal from '@/components/CommentModal.vue';
import { postApi, interactionApi, userApi } from '@/api';

const themeStore = useThemeStore();
const userStore = useUserStore();
const { fontScale } = storeToRefs(themeStore);

const articleId = ref(0);
const article = ref<any>(null);
const loading = ref(true);
const showComments = ref(false);
const followLoading = ref(false);
const posterLoading = ref(false);
const API_BASE_URL = 'http://localhost:3000/api/v1';

const formatTime = (time: string) => formatRelativeTime(time);

const appendClassForTag = (html: string, tag: string, className: string) => {
  const reg = new RegExp(`<${tag}(\\s[^>]*?)?>`, 'gi');
  return html.replace(reg, (match, attrs = '') => {
    if (/class\s*=/.test(match)) {
      return match.replace(
        /class\s*=\s*["']([^"']*)["']/i,
        (_m, cls) => `class="${`${cls} ${className}`.trim()}"`,
      );
    }
    return `<${tag}${attrs || ''} class="${className}">`;
  });
};

const normalizeRichTextHtml = (content: any) => {
  if (typeof content !== 'string' || !content.trim()) return content;
  let html = content;
  html = appendClassForTag(html, 'img', 'article-rich-img');
  html = appendClassForTag(html, 'p', 'article-rich-p');
  html = appendClassForTag(html, 'blockquote', 'article-rich-quote');
  html = appendClassForTag(html, 'h1', 'article-rich-title');
  html = appendClassForTag(html, 'h2', 'article-rich-title');
  html = appendClassForTag(html, 'h3', 'article-rich-title');
  return html;
};

const getGridClass = (count: number) => {
  if (count === 1) return 'grid-1';
  if (count === 2) return 'grid-2';
  if (count === 4) return 'grid-4';
  return 'grid-3';
};

const loadArticle = async () => {
  loading.value = true;
  try {
    const res = await postApi.getDetail(articleId.value);
    article.value = {
      ...res,
      likeCount: Number(res.likeCount || 0),
      commentCount: Number(res.commentCount || 0),
      collectCount: Number(res.collectCount || 0),
      content: normalizeRichTextHtml(res.content),
      user: {
        ...res.user,
        isFollowed: !!res.user?.isFollowed,
      },
      isLiked: !!res.isLiked,
      isCollected: !!res.isCollected,
    };

    if (userStore.isLoggedIn) {
      interactionApi
        .getPostStatus(articleId.value)
        .then((status) => {
          if (!article.value) return;
          article.value.isLiked = !!status.isLiked;
          article.value.isCollected = !!status.isCollected;
          article.value.user = {
            ...(article.value.user || {}),
            isFollowed: !!status.isFollowedAuthor,
          };
        })
        .catch(() => undefined);
      userApi.recordHistory({ postId: articleId.value }).catch(() => {});
    } else {
      article.value.isLiked = false;
      article.value.isCollected = false;
    }
  } catch (error) {
    console.error('加载文章失败', error);
    uni.showToast({ title: '加载失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
};

const handleFollow = async () => {
  if (!userStore.requireLogin() || !article.value?.user?.id || followLoading.value) return;
  followLoading.value = true;
  const prev = !!article.value.user.isFollowed;
  article.value.user.isFollowed = !prev;
  try {
    const res = await interactionApi.follow({ userId: article.value.user.id });
    article.value.user.isFollowed = !!res.followed;
  } catch {
    article.value.user.isFollowed = prev;
    uni.showToast({ title: '操作失败', icon: 'none' });
  } finally {
    followLoading.value = false;
  }
};

const handleLike = async () => {
  if (!userStore.requireLogin() || !article.value) return;
  const prev = !!article.value.isLiked;
  article.value.isLiked = !prev;
  article.value.likeCount = Math.max(0, Number(article.value.likeCount || 0) + (article.value.isLiked ? 1 : -1));
  try {
    if (article.value.isLiked) {
      await interactionApi.like({ targetId: article.value.id, targetType: 'post' });
    } else {
      await interactionApi.unlike({ targetId: article.value.id, targetType: 'post' });
    }
  } catch {
    article.value.isLiked = prev;
    article.value.likeCount = Math.max(0, Number(article.value.likeCount || 0) + (article.value.isLiked ? 1 : -1));
  }
};

const handleCollect = async () => {
  if (!userStore.requireLogin() || !article.value) return;
  const prev = !!article.value.isCollected;
  article.value.isCollected = !prev;
  article.value.collectCount = Math.max(0, Number(article.value.collectCount || 0) + (article.value.isCollected ? 1 : -1));
  try {
    if (article.value.isCollected) {
      await interactionApi.collect({ targetId: article.value.id, targetType: 'post' });
    } else {
      await interactionApi.uncollect({ targetId: article.value.id, targetType: 'post' });
    }
  } catch {
    article.value.isCollected = prev;
    article.value.collectCount = Math.max(0, Number(article.value.collectCount || 0) + (article.value.isCollected ? 1 : -1));
  }
};

const previewImage = (url: string, index: number) => {
  uni.previewImage({ current: index, urls: article.value?.mediaUrls || [url] });
};

const handleCommentSubmitted = () => {
  if (!article.value) return;
  article.value.commentCount = Number(article.value.commentCount || 0) + 1;
};

const handlePoster = async () => {
  if (!article.value || posterLoading.value) return;
  posterLoading.value = true;
  uni.showLoading({ title: '生成海报中...' });
  try {
    const qrcodeUrl =
      `${API_BASE_URL}/share/wxacode?scene=${encodeURIComponent(`id=${article.value.id}`)}` +
      `&page=${encodeURIComponent('pages/detail/detail')}&width=280`;
    const poster = await buildSharePoster({
      canvasId: 'detailPosterCanvas',
      title: article.value.title || '健康内容分享',
      subtitle: article.value.user?.nickname ? `作者：${article.value.user.nickname}` : '银龄健康社区',
      imageUrl: article.value.coverUrl || article.value.mediaUrls?.[0],
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

onShareAppMessage(() => ({
  title: article.value?.title || '银龄健康',
  path: `/pages/detail/detail?id=${articleId.value}`,
}));

onLoad((options: any) => {
  if (options.id) {
    articleId.value = +options.id;
    loadArticle();
  }
});
</script>

<style lang="scss" scoped>
.detail-page {
  min-height: 100vh;
  background: #f8f9fa;
}

// 加载状态
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  gap: 24rpx;
}

.loading-spinner {
  width: 64rpx;
  height: 64rpx;
  border: 4rpx solid #e8e8e8;
  border-top-color: #E17055;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: calc(14px * var(--font-scale));
  color: #999;
}

// 文章滚动区
.article-scroll {
  height: 100vh;
  background: #fff;
}

// 圈子标签
.circle-header {
  padding: 32rpx 32rpx 0;
}

.circle-tag {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  background: linear-gradient(135deg, #fff5f3 0%, #ffeee8 100%);
  padding: 12rpx 24rpx;
  border-radius: 32rpx;
  border: 1rpx solid #ffd4c4;
}

.circle-icon {
  width: 34rpx;
  height: 34rpx;
  border-radius: 8rpx;
  font-size: 20rpx;
  color: #fff;
  font-weight: 700;
  background: #e17055;
  display: flex;
  align-items: center;
  justify-content: center;
}

.circle-name {
  font-size: calc(12px * var(--font-scale));
  color: #E17055;
  font-weight: 500;
}

// 标题区
.title-section {
  padding: 32rpx;
  padding-bottom: 0;
}

.article-title {
  font-size: calc(22px * var(--font-scale));
  font-weight: 700;
  color: #1a1a1a;
  line-height: 1.4;
  letter-spacing: 0.5rpx;
}

// 作者区
.author-section {
  display: flex;
  align-items: center;
  padding: 32rpx;
  gap: 20rpx;
}

.author-avatar {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  border: 4rpx solid #fff;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
}

.author-info {
  flex: 1;
}

.author-name {
  font-size: calc(15px * var(--font-scale));
  font-weight: 600;
  color: #1a1a1a;
  display: block;
  margin-bottom: 8rpx;
}

.publish-meta {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.publish-time, .view-count {
  font-size: calc(12px * var(--font-scale));
  color: #999;
}

.follow-btn {
  background: linear-gradient(135deg, #E17055 0%, #d45d43 100%);
  color: #fff;
  padding: 16rpx 32rpx;
  border-radius: 32rpx;
  font-size: calc(13px * var(--font-scale));
  font-weight: 500;
  box-shadow: 0 8rpx 24rpx rgba(225, 112, 85, 0.3);

  &.followed {
    background: #f5f5f5;
    color: #666;
    box-shadow: none;
  }
}

// 分割线
.divider {
  height: 1rpx;
  background: linear-gradient(90deg, transparent, #eee 20%, #eee 80%, transparent);
  margin: 0 32rpx;
}

// 正文
.content-section {
  padding: 32rpx;
}

.article-body {
  font-size: calc(16px * var(--font-scale));
  line-height: 2;
  color: #333;
  letter-spacing: 0.5rpx;
}

// 深度选择器处理富文本内的样式
:deep(.article-body) {
  line-height: 2;
}

:deep(.article-body .article-rich-img) {
  max-width: 100%;
  border-radius: 16rpx;
  margin: 16rpx 0;
}

:deep(.article-body .article-rich-p) {
  margin-bottom: 24rpx;
}

:deep(.article-body .article-rich-title) {
  font-weight: 700;
  margin: 32rpx 0 16rpx;
  color: #1a1a1a;
}

:deep(.article-body .article-rich-quote) {
  border-left: 6rpx solid #E17055;
  padding-left: 24rpx;
  margin: 24rpx 0;
  color: #666;
  font-style: italic;
}

// 图片区
.media-section {
  padding: 0 32rpx;
  margin-bottom: 32rpx;
}

.media-grid {
  display: grid;
  gap: 12rpx;
  border-radius: 16rpx;
  overflow: hidden;
  
  &.grid-1 {
    grid-template-columns: 1fr;
    .media-image { height: 400rpx; }
  }
  
  &.grid-2 {
    grid-template-columns: 1fr 1fr;
    .media-image { height: 300rpx; }
  }
  
  &.grid-3 {
    grid-template-columns: 1fr 1fr 1fr;
    .media-image { height: 220rpx; }
  }
  
  &.grid-4 {
    grid-template-columns: 1fr 1fr;
    .media-image { height: 280rpx; }
  }
}

.media-image {
  width: 100%;
  object-fit: cover;
  background: #f5f5f5;
}

// 标签
.tags-section {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  padding: 0 32rpx 32rpx;
}

.tag-item {
  background: #f5f5f5;
  padding: 12rpx 24rpx;
  border-radius: 8rpx;
  font-size: calc(12px * var(--font-scale));
  color: #666;
}

// 数据统计
.stats-section {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40rpx 32rpx;
  background: #fafafa;
  margin: 0 32rpx;
  border-radius: 16rpx;
  gap: 48rpx;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.stat-num {
  font-size: calc(20px * var(--font-scale));
  font-weight: 700;
  color: #1a1a1a;
}

.stat-label {
  font-size: calc(12px * var(--font-scale));
  color: #999;
}

.stat-divider {
  width: 1rpx;
  height: 40rpx;
  background: #e0e0e0;
}

// 底部占位
.bottom-placeholder {
  height: 180rpx;
}

// 底部操作栏
.footer-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  padding: 16rpx 24rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);
  gap: 16rpx;
}

.input-area {
  flex: 1;
  background: #f5f5f5;
  border-radius: 36rpx;
  padding: 20rpx 32rpx;
}

.input-placeholder {
  font-size: calc(14px * var(--font-scale));
  color: #bbb;
}

.action-btns {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
  padding: 16rpx 20rpx;
  background: transparent;
  border: none;
  
  &::after {
    display: none;
  }
  
  &.active {
    background: #fff1ec;
    border-radius: 24rpx;
    .action-icon {
      transform: scale(1.1);
      color: #d26045;
    }
  }
}

.action-icon {
  width: 44rpx;
  height: 44rpx;
  border-radius: 12rpx;
  background: #f3f3f3;
  font-size: 24rpx;
  font-weight: 700;
  color: #555;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
}

.action-num {
  font-size: calc(12px * var(--font-scale));
  color: #666;
  min-width: 24rpx;
}

.share-btn {
  background: transparent;
  padding: 16rpx;
}

.poster-canvas {
  position: fixed;
  left: -9999px;
  top: -9999px;
  width: 540px;
  height: 960px;
}
</style>
