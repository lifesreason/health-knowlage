<template>
  <view class="comment-modal" @click="$emit('close')">
    <view class="modal-content" @click.stop>
      <view class="modal-header">
        <text class="modal-title">评论 ({{ comments.length }})</text>
        <view class="close-btn" @click="$emit('close')">
          <image class="close-btn-image" src="/static/icons/common-close-muted.png" mode="aspectFit"></image>
        </view>
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
                <text class="reply-btn" @click="setReplyTarget(item)">回复</text>
                <text class="like-btn" :class="{ active: item.isLiked }" @click="handleLike(item)">
                  {{ item.isLiked ? '已赞' : '点赞' }} {{ item.likeCount }}
                </text>
              </view>

              <view class="reply-toggle" @click="toggleReplies(item)">
                <text>{{ getReplyToggleText(item.id) }}</text>
              </view>

              <view v-if="replyMetas[item.id]?.visible" class="reply-list">
                <view v-if="replyMetas[item.id]?.loading && getReplies(item.id).length === 0" class="reply-loading">加载回复中...</view>
                <template v-else>
                  <view v-for="reply in getReplies(item.id)" :key="reply.id" class="reply-item">
                    <image class="reply-avatar" :src="reply.user?.avatarUrl || '/static/default-avatar.png'" mode="aspectFill"></image>
                    <view class="reply-content">
                      <text class="reply-author">
                        {{ reply.user?.nickname || '用户' }}
                        <text v-if="reply.replyToUser?.nickname" class="reply-to"> 回复 {{ reply.replyToUser.nickname }}</text>
                      </text>
                      <text class="reply-text">{{ reply.content }}</text>
                      <view class="reply-meta">
                        <text class="time">{{ formatTime(reply.createdAt) }}</text>
                        <text class="reply-btn" @click="setReplyTarget(item, reply)">回复</text>
                        <text class="like-btn" :class="{ active: reply.isLiked }" @click="handleLike(reply)">
                          {{ reply.isLiked ? '已赞' : '点赞' }} {{ reply.likeCount }}
                        </text>
                      </view>
                    </view>
                  </view>

                  <view
                    v-if="!replyMetas[item.id]?.noMore && getReplies(item.id).length > 0"
                    class="more-reply"
                    @click="loadMoreReplies(item.id)"
                  >查看更多回复</view>

                  <view
                    v-if="replyMetas[item.id]?.noMore && getReplies(item.id).length > 0"
                    class="more-reply no-more-reply"
                  >没有更多回复了</view>
                </template>
              </view>
            </view>
          </view>
        </view>

        <view v-if="noMore && comments.length > 0" class="no-more">没有更多了</view>
      </scroll-view>

      <view v-if="replyTarget" class="replying-tip">
        <text>回复 {{ replyTarget.nickname }}</text>
        <text class="cancel-reply" @click="clearReplyTarget">取消</text>
      </view>

      <view class="input-bar">
        <input
          v-model="inputText"
          :placeholder="replyTarget ? `回复 ${replyTarget.nickname}...` : '说点什么...'"
          class="input-field"
          @confirm="submitComment"
        />
        <button class="send-btn" :disabled="!inputText.trim()" @click="submitComment">发送</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { formatRelativeTime } from '@/common/utils';
import { useUserStore } from '@/store/user';
import { commentApi } from '@/api';

const props = defineProps<{ postId: number }>();
const emit = defineEmits(['close', 'submitted']);

const userStore = useUserStore();

interface ReplyMeta {
  page: number;
  noMore: boolean;
  loading: boolean;
  visible: boolean;
  total: number;
  initialized: boolean;
}

const comments = ref<any[]>([]);
const loading = ref(false);
const noMore = ref(false);
const page = ref(1);
const inputText = ref('');
const replyTarget = ref<{ rootId: number; replyToUserId?: number; nickname: string } | null>(null);
const replyLists = reactive<Record<number, any[]>>({});
const replyMetas = reactive<Record<number, ReplyMeta>>({});

const formatTime = (t: string) => formatRelativeTime(t);

const normalizeComment = (item: any) => ({
  ...item,
  isLiked: !!item.isLiked,
  user: item.user || item.author || {},
});

const ensureReplyMeta = (rootId: number) => {
  if (!replyMetas[rootId]) {
    replyMetas[rootId] = {
      page: 1,
      noMore: false,
      loading: false,
      visible: false,
      total: 0,
      initialized: false,
    };
  }
  if (!replyLists[rootId]) {
    replyLists[rootId] = [];
  }
  return replyMetas[rootId];
};

const getReplies = (rootId: number) => replyLists[rootId] || [];

const getReplyToggleText = (rootId: number) => {
  const meta = ensureReplyMeta(rootId);
  if (meta.visible) return '收起回复';
  return meta.total > 0 ? `查看回复 (${meta.total})` : '查看回复';
};

const loadComments = async () => {
  if (loading.value || noMore.value) return;
  loading.value = true;
  try {
    const res = await commentApi.getList({ postId: props.postId, page: page.value, pageSize: 10 });
    const data = (res.list || []).map(normalizeComment);

    if (page.value === 1) {
      comments.value = data;
    } else {
      comments.value.push(...data);
    }

    if (data.length < 10) noMore.value = true;
    page.value += 1;
  } catch (error) {
    console.error('加载评论失败', error);
  } finally {
    loading.value = false;
  }
};

const loadMore = () => {
  loadComments();
};

const loadReplies = async (rootId: number, refresh = false) => {
  const meta = ensureReplyMeta(rootId);
  if (meta.loading) return;
  if (!refresh && meta.noMore) return;

  if (refresh) {
    meta.page = 1;
    meta.noMore = false;
    replyLists[rootId] = [];
  }

  meta.loading = true;
  try {
    const res = await commentApi.getList({
      postId: props.postId,
      rootId,
      page: meta.page,
      pageSize: 5,
    });
    const data = (res.list || []).map(normalizeComment);
    meta.total = Number(res.total || meta.total || 0);

    if (refresh) {
      replyLists[rootId] = data;
    } else {
      replyLists[rootId].push(...data);
    }

    if (data.length < 5) {
      meta.noMore = true;
    }
    meta.page += 1;
    meta.initialized = true;
  } catch (error) {
    console.error('加载回复失败', error);
  } finally {
    meta.loading = false;
  }
};

const toggleReplies = async (root: any) => {
  const rootId = Number(root?.id || 0);
  if (!rootId) return;

  const meta = ensureReplyMeta(rootId);
  meta.visible = !meta.visible;

  if (!meta.visible) return;
  if (!meta.initialized) {
    await loadReplies(rootId, true);
  }
};

const loadMoreReplies = async (rootId: number) => {
  await loadReplies(rootId, false);
};

const clearReplyTarget = () => {
  replyTarget.value = null;
};

const setReplyTarget = (root: any, reply?: any) => {
  if (!userStore.requireLogin()) return;

  const rootId = Number(root?.id || 0);
  if (!rootId) return;

  if (reply) {
    replyTarget.value = {
      rootId,
      replyToUserId: Number(reply?.user?.id || 0) || undefined,
      nickname: reply?.user?.nickname || '用户',
    };
    return;
  }

  replyTarget.value = {
    rootId,
    replyToUserId: Number(root?.user?.id || 0) || undefined,
    nickname: root?.user?.nickname || '用户',
  };
};

const handleLike = async (item: any) => {
  if (!userStore.requireLogin()) return;

  const prev = !!item.isLiked;
  item.isLiked = !prev;
  item.likeCount = Math.max(0, Number(item.likeCount || 0) + (item.isLiked ? 1 : -1));

  try {
    if (item.isLiked) {
      await commentApi.like(item.id);
    } else {
      await commentApi.deleteLike(item.id);
    }
  } catch {
    item.isLiked = prev;
    item.likeCount = Math.max(0, Number(item.likeCount || 0) + (item.isLiked ? 1 : -1));
  }
};

const submitComment = async () => {
  const content = inputText.value.trim();
  if (!content) return;
  if (!userStore.requireLogin()) return;

  try {
    const payload: { postId: number; content: string; rootId?: number; replyToUserId?: number } = {
      postId: props.postId,
      content,
    };

    if (replyTarget.value?.rootId) {
      payload.rootId = replyTarget.value.rootId;
      if (replyTarget.value.replyToUserId) {
        payload.replyToUserId = replyTarget.value.replyToUserId;
      }
    }

    const res = await commentApi.create(payload);
    const auditStatus = Number(res?.auditStatus ?? 1);

    if (auditStatus === 1) {
      const newComment = {
        id: res.id,
        content,
        createdAt: res.createdAt || new Date().toISOString(),
        likeCount: 0,
        isLiked: false,
        user: {
          id: userStore.userInfo?.id,
          avatarUrl: userStore.userInfo?.avatarUrl || '/static/default-avatar.png',
          nickname: userStore.userInfo?.nickname || '我',
        },
        replyToUser: replyTarget.value?.nickname
          ? { nickname: replyTarget.value.nickname }
          : undefined,
      };

      if (replyTarget.value?.rootId) {
        const rootId = replyTarget.value.rootId;
        const meta = ensureReplyMeta(rootId);
        replyLists[rootId] = [newComment, ...getReplies(rootId)];
        meta.visible = true;
        meta.initialized = true;
        meta.total += 1;
      } else {
        comments.value.unshift(newComment);
      }

      emit('submitted', { postId: props.postId });
    }

    inputText.value = '';
    clearReplyTarget();
    uni.showToast({ title: res?.message || '评论已提交，审核后展示', icon: 'none' });
  } catch {
    uni.showToast({ title: '评论失败', icon: 'none' });
  }
};

onMounted(() => {
  loadComments();
});
</script>

<style lang="scss" scoped>
.comment-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
}

.modal-content {
  width: 100%;
  max-height: 70vh;
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.modal-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.close-btn {
  width: 88rpx;
  height: 88rpx;
  margin: -18rpx -18rpx -18rpx 0;
  border-radius: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn-image {
  width: 28rpx;
  height: 28rpx;
}

.comment-list {
  flex: 1;
  padding: 0 32rpx;
  overflow-y: auto;
}

.loading,
.empty,
.no-more {
  text-align: center;
  padding: 48rpx;
  color: #999;
  font-size: 28rpx;
}

.comment-item {
  display: flex;
  gap: 16rpx;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 32rpx;
  flex-shrink: 0;
}

.comment-content {
  flex: 1;
}

.author-name {
  display: block;
  font-size: 26rpx;
  color: #999;
  margin-bottom: 8rpx;
}

.comment-text {
  display: block;
  font-size: 28rpx;
  color: #333;
  line-height: 1.5;
}

.comment-meta,
.reply-meta {
  display: flex;
  gap: 24rpx;
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #999;
}

.like-btn,
.reply-btn {
  color: #999;
}

.like-btn.active {
  color: #e17055;
}

.reply-btn {
  color: #8b7f77;
}

.reply-toggle {
  margin-top: 10rpx;
  font-size: 24rpx;
  color: #b28a78;
}

.reply-list {
  margin-top: 14rpx;
  background: #faf7f5;
  border-radius: 16rpx;
  padding: 14rpx 16rpx;
}

.reply-loading {
  color: #999;
  font-size: 24rpx;
  padding: 8rpx 0;
}

.reply-item {
  display: flex;
  gap: 12rpx;
  padding: 12rpx 0;
  border-bottom: 1rpx solid #f1ece8;
}

.reply-item:last-child {
  border-bottom: none;
}

.reply-avatar {
  width: 44rpx;
  height: 44rpx;
  border-radius: 22rpx;
  flex-shrink: 0;
}

.reply-content {
  flex: 1;
}

.reply-author {
  font-size: 24rpx;
  color: #7f7670;
}

.reply-to {
  color: #a78e82;
}

.reply-text {
  display: block;
  margin-top: 6rpx;
  font-size: 26rpx;
  color: #2f2b29;
  line-height: 1.5;
}

.more-reply {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #b28a78;
}

.no-more-reply {
  color: #b8afa9;
}

.replying-tip {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12rpx 32rpx 0;
  color: #8d817a;
  font-size: 24rpx;
}

.cancel-reply {
  color: #d06a4f;
}

.input-bar {
  display: flex;
  gap: 16rpx;
  padding: 24rpx 32rpx;
  border-top: 1rpx solid #f0f0f0;
  background: #fff;
}

.input-field {
  flex: 1;
  height: 72rpx;
  background: #f5f5f5;
  border-radius: 36rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
}

.send-btn {
  width: 120rpx;
  height: 72rpx;
  background: #e17055;
  color: #fff;
  border-radius: 36rpx;
  font-size: 28rpx;
  border: none;
}

.send-btn:disabled {
  background: #ccc;
}
</style>
