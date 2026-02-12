<template>
  <view class="comment-modal" @click="$emit('close')">
    <view class="modal-content" @click.stop>
      <view class="modal-header">
        <text class="modal-title">评论 ({{ comments.length }})</text>
        <text class="close-btn" @click="$emit('close')">✕</text>
      </view>
      
      <scroll-view scroll-y class="comment-list" @scrolltolower="loadMore">
        <view v-if="loading && comments.length === 0" class="loading">加载中...</view>
        <view v-else-if="comments.length === 0" class="empty">暂无评论，快来抢沙发</view>
        <view v-else>
          <view v-for="item in comments" :key="item.id" class="comment-item">
            <image class="avatar" :src="item.user?.avatarUrl || item.author?.avatar || '/static/default-avatar.png'" mode="aspectFill"></image>
            <view class="comment-content">
              <text class="author-name">{{ item.user?.nickname || item.author?.nickname || '用户' }}</text>
              <text class="comment-text">{{ item.content }}</text>
              <view class="comment-meta">
                <text class="time">{{ formatTime(item.createdAt) }}</text>
                <text class="like-btn" @click="handleLike(item)">{{ item.isLiked ? '❤️' : '🤍' }} {{ item.likeCount }}</text>
              </view>
            </view>
          </view>
        </view>
        <view v-if="noMore && comments.length > 0" class="no-more">没有更多了</view>
      </scroll-view>

      <view class="input-bar">
        <input v-model="inputText" placeholder="说点什么..." class="input-field" @confirm="submitComment" />
        <button class="send-btn" :disabled="!inputText.trim()" @click="submitComment">发送</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { formatRelativeTime } from '@/common/utils';
import { useUserStore } from '@/store/user';
import { commentApi } from '@/api';

const props = defineProps<{ postId: number }>();
const emit = defineEmits(['close']);

const userStore = useUserStore();
const comments = ref<any[]>([]);
const loading = ref(false);
const noMore = ref(false);
const page = ref(1);
const inputText = ref('');

const formatTime = (t: string) => formatRelativeTime(t);

const loadComments = async () => {
  if (loading.value || noMore.value) return;
  loading.value = true;
  try {
    const res = await commentApi.getList({ postId: props.postId, page: page.value, pageSize: 10 });
    const data = (res.list || []).map((item: any) => ({
      ...item,
      isLiked: !!item.isLiked,
      user: item.user || item.author || {},
    }));
    if (page.value === 1) comments.value = data;
    else comments.value.push(...data);
    if (data.length < 10) noMore.value = true;
    page.value++;
  } catch (error) {
    console.error('加载评论失败', error);
  } finally {
    loading.value = false;
  }
};

const loadMore = () => loadComments();

const handleLike = async (item: any) => {
  if (!userStore.requireLogin()) return;
  item.isLiked = !item.isLiked;
  item.likeCount += item.isLiked ? 1 : -1;
  try {
    if (item.isLiked) {
      await commentApi.like(item.id);
    } else {
      await commentApi.deleteLike(item.id);
    }
  } catch {
    item.isLiked = !item.isLiked;
    item.likeCount += item.isLiked ? 1 : -1;
  }
};

const submitComment = async () => {
  if (!inputText.value.trim()) return;
  if (!userStore.requireLogin()) return;

  try {
    const res = await commentApi.create({
      postId: props.postId,
      content: inputText.value,
    });
    comments.value.unshift({
      id: res.id,
      content: inputText.value,
      createdAt: res.createdAt || new Date().toISOString(),
      likeCount: 0,
      isLiked: false,
      user: {
        avatarUrl: userStore.userInfo?.avatarUrl || '/static/default-avatar.png',
        nickname: userStore.userInfo?.nickname || '我',
      },
    });
    inputText.value = '';
    uni.showToast({ title: '评论成功', icon: 'success' });
  } catch {
    uni.showToast({ title: '评论失败', icon: 'none' });
  }
};

onMounted(() => loadComments());
</script>

<style lang="scss" scoped>
.comment-modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: flex-end; }
.modal-content { width: 100%; max-height: 70vh; background: #fff; border-radius: 24rpx 24rpx 0 0; display: flex; flex-direction: column; }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 32rpx; border-bottom: 1rpx solid #f0f0f0; }
.modal-title { font-size: 32rpx; font-weight: bold; color: #333; }
.close-btn { font-size: 36rpx; color: #999; }
.comment-list { flex: 1; padding: 0 32rpx; overflow-y: auto; }
.loading, .empty, .no-more { text-align: center; padding: 48rpx; color: #999; font-size: 28rpx; }
.comment-item { display: flex; gap: 16rpx; padding: 24rpx 0; border-bottom: 1rpx solid #f5f5f5; }
.avatar { width: 64rpx; height: 64rpx; border-radius: 32rpx; flex-shrink: 0; }
.comment-content { flex: 1; }
.author-name { display: block; font-size: 26rpx; color: #999; margin-bottom: 8rpx; }
.comment-text { display: block; font-size: 28rpx; color: #333; line-height: 1.5; }
.comment-meta { display: flex; gap: 24rpx; margin-top: 12rpx; font-size: 24rpx; color: #999; }
.like-btn { color: #999; }
.input-bar { display: flex; gap: 16rpx; padding: 24rpx 32rpx; border-top: 1rpx solid #f0f0f0; background: #fff; }
.input-field { flex: 1; height: 72rpx; background: #f5f5f5; border-radius: 36rpx; padding: 0 24rpx; font-size: 28rpx; }
.send-btn { width: 120rpx; height: 72rpx; background: #6C5CE7; color: #fff; border-radius: 36rpx; font-size: 28rpx; border: none; }
.send-btn:disabled { background: #ccc; }
</style>
