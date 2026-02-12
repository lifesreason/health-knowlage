<template>
  <view class="settings-page" :style="{ '--font-scale': fontScale }">
    <view class="tab-header" v-if="currentTab !== 'default'">
      <view class="back-btn" @click="goDefault">
        <text class="back-arrow">‹</text>
      </view>
      <text class="tab-title" :style="{ fontSize: `calc(16px * ${fontScale})` }">{{ currentTabTitle }}</text>
      <view class="header-spacer"></view>
    </view>

    <scroll-view
      class="content-scroll"
      scroll-y
      @scrolltolower="loadMore"
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="refreshCurrent"
    >
      <template v-if="currentTab === 'default'">
        <view class="section">
          <view class="section-title-wrap">
            <view class="icon-badge icon-font">A</view>
            <text class="section-title" :style="{ fontSize: `calc(15px * ${fontScale})` }">字体设置</text>
          </view>
          <view class="font-scale-wrap">
            <view
              v-for="item in fontScales"
              :key="item.value"
              class="font-option"
              :class="{ active: fontScale === item.value }"
              @click="setFontScale(item.value)"
            >
              <text :style="{ fontSize: `${14 * item.value}px` }">{{ item.label }}</text>
            </view>
          </view>
        </view>

        <view class="section">
          <view class="section-title-wrap">
            <view class="icon-badge icon-user">U</view>
            <text class="section-title" :style="{ fontSize: `calc(15px * ${fontScale})` }">我的内容</text>
          </view>
          <view class="menu-item" @click="openTab('posts')">
            <text class="menu-label">我的发布</text>
            <text class="menu-arrow">›</text>
          </view>
          <view class="menu-item" @click="openTab('collections')">
            <text class="menu-label">我的收藏</text>
            <text class="menu-arrow">›</text>
          </view>
          <view class="menu-item" @click="openTab('history')">
            <text class="menu-label">浏览历史</text>
            <text class="menu-arrow">›</text>
          </view>
          <view class="menu-item" @click="openTab('circles')">
            <text class="menu-label">我的圈子</text>
            <text class="menu-arrow">›</text>
          </view>
          <view class="menu-item" @click="openTab('following')">
            <text class="menu-label">我的关注</text>
            <text class="menu-arrow">›</text>
          </view>
          <view class="menu-item" @click="openTab('followers')">
            <text class="menu-label">我的粉丝</text>
            <text class="menu-arrow">›</text>
          </view>
        </view>

        <view class="section">
          <view class="section-title-wrap">
            <view class="icon-badge icon-setting">S</view>
            <text class="section-title" :style="{ fontSize: `calc(15px * ${fontScale})` }">账号与隐私</text>
          </view>
          <view class="menu-item" @click="openTab('profile')">
            <text class="menu-label">个人资料</text>
            <text class="menu-arrow">›</text>
          </view>
          <view class="menu-item" @click="openTab('privacy')">
            <text class="menu-label">隐私设置</text>
            <text class="menu-arrow">›</text>
          </view>
          <view class="menu-item" @click="clearCache">
            <text class="menu-label">清除缓存</text>
            <text class="menu-value">{{ cacheSize }}</text>
          </view>
        </view>

        <view class="section">
          <view class="section-title-wrap">
            <view class="icon-badge icon-doc">i</view>
            <text class="section-title" :style="{ fontSize: `calc(15px * ${fontScale})` }">关于与协议</text>
          </view>
          <view class="menu-item" @click="openTab('about')">
            <text class="menu-label">关于我们</text>
            <text class="menu-value">v1.0.0</text>
          </view>
          <view class="menu-item" @click="openTab('agreement')">
            <text class="menu-label">用户协议</text>
            <text class="menu-arrow">›</text>
          </view>
          <view class="menu-item" @click="openTab('policy')">
            <text class="menu-label">隐私政策</text>
            <text class="menu-arrow">›</text>
          </view>
        </view>
      </template>

      <template v-else-if="currentTab === 'font'">
        <view class="section">
          <view class="font-scale-wrap">
            <view
              v-for="item in fontScales"
              :key="item.value"
              class="font-option"
              :class="{ active: fontScale === item.value }"
              @click="setFontScale(item.value)"
            >
              <text :style="{ fontSize: `${14 * item.value}px` }">{{ item.label }}</text>
            </view>
          </view>
          <view class="font-preview">
            <text class="preview-label">预览效果</text>
            <text class="preview-text" :style="{ fontSize: `calc(16px * ${fontScale})` }">
              这是一段预览文字，用于展示当前字体大小效果。
            </text>
          </view>
        </view>
      </template>

      <template v-else-if="currentTab === 'profile'">
        <view class="section">
          <view class="profile-avatar-wrap" @click="pickAvatar">
            <image class="profile-avatar" :src="profileForm.avatarUrl || '/static/default-avatar.png'" mode="aspectFill"></image>
            <text class="profile-avatar-tip">点击更换头像</text>
          </view>
          <view class="form-item">
            <text class="form-label">昵称</text>
            <input
              v-model="profileForm.nickname"
              class="form-input"
              maxlength="20"
              placeholder="请输入昵称"
            />
          </view>
          <button class="primary-btn" @click="saveProfile" :disabled="profileSaving">
            {{ profileSaving ? '保存中...' : '保存资料' }}
          </button>
        </view>
      </template>

      <template v-else-if="currentTab === 'privacy'">
        <view class="section">
          <view class="switch-item">
            <text class="switch-label">允许被搜索到</text>
            <switch :checked="privacySettings.showInSearch" @change="onPrivacyChange('showInSearch', $event)" color="#e17055" />
          </view>
          <view class="switch-item">
            <text class="switch-label">允许他人关注</text>
            <switch :checked="privacySettings.allowFollow" @change="onPrivacyChange('allowFollow', $event)" color="#e17055" />
          </view>
          <view class="switch-item">
            <text class="switch-label">接收系统通知</text>
            <switch :checked="privacySettings.receiveMessage" @change="onPrivacyChange('receiveMessage', $event)" color="#e17055" />
          </view>
        </view>
      </template>

      <template v-else-if="currentTab === 'about'">
        <view class="section doc-section">
          <text class="doc-title">银龄健康社区</text>
          <text class="doc-text">银龄健康是面向中老年用户的健康知识分享社区，提供图文、视频、圈子与互动服务。</text>
          <text class="doc-text">版本：1.0.0</text>
          <text class="doc-text">联系邮箱：support@silverhealth.local</text>
        </view>
      </template>

      <template v-else-if="currentTab === 'agreement'">
        <view class="section doc-section">
          <text class="doc-title">用户协议</text>
          <text class="doc-text">1. 请遵守法律法规，禁止发布违法违规内容。</text>
          <text class="doc-text">2. 发布内容需保证真实、客观，不构成医疗建议替代。</text>
          <text class="doc-text">3. 平台有权对违规内容进行删除、下架与封禁处理。</text>
        </view>
      </template>

      <template v-else-if="currentTab === 'policy'">
        <view class="section doc-section">
          <text class="doc-title">隐私政策</text>
          <text class="doc-text">我们仅在必要范围内收集和使用信息，用于登录、内容互动与服务优化。</text>
          <text class="doc-text">未经用户授权，不会将个人信息用于与本服务无关的用途。</text>
          <text class="doc-text">如需删除账号或数据，请联系平台客服处理。</text>
        </view>
      </template>

      <template v-else-if="currentTab === 'likes'">
        <view class="section">
          <view class="stats-grid">
            <view class="stat-box">
              <text class="stat-num">{{ likesStats.likesReceived || 0 }}</text>
              <text class="stat-label">获赞</text>
            </view>
            <view class="stat-box">
              <text class="stat-num">{{ likesStats.collectsReceived || 0 }}</text>
              <text class="stat-label">获收藏</text>
            </view>
            <view class="stat-box">
              <text class="stat-num">{{ likesStats.receivedLikesAndCollects || 0 }}</text>
              <text class="stat-label">总互动</text>
            </view>
          </view>
        </view>
      </template>

      <template v-else>
        <view class="section" v-if="currentTab === 'posts'">
          <view class="post-filter">
            <view class="filter-pill" :class="{ active: postStatus === 'published' }" @click="switchPostStatus('published')">已发布</view>
            <view class="filter-pill" :class="{ active: postStatus === 'audit' }" @click="switchPostStatus('audit')">审核中</view>
          </view>
        </view>

        <view class="list-wrap">
          <view v-if="currentState.loading && currentState.list.length === 0" class="skeleton-list">
            <view class="skeleton-card" v-for="i in 4" :key="`skeleton-${i}`">
              <view class="skeleton-line line-lg"></view>
              <view class="skeleton-line line-sm"></view>
            </view>
          </view>
          <view v-else-if="currentState.error && currentState.list.length === 0" class="error-state">
            <text class="error-text">{{ currentState.error }}</text>
            <button class="retry-btn" @click.stop="retryCurrentTab">重试</button>
          </view>
          <view class="empty-state" v-else-if="!currentState.loading && currentState.list.length === 0">暂无数据</view>

          <view class="list-card" v-for="item in currentState.list" :key="item.id || item.user?.id" @click="openItem(item)">
            <template v-if="currentTab === 'circles'">
              <text class="list-title">{{ item.name }}</text>
              <text class="list-desc">{{ item.description || '暂无圈子简介' }}</text>
            </template>

            <template v-else-if="currentTab === 'following' || currentTab === 'followers'">
              <view class="user-row">
                <image class="user-avatar" :src="item.user?.avatarUrl || '/static/default-avatar.png'" mode="aspectFill"></image>
                <view class="user-meta">
                  <text class="list-title">{{ item.user?.nickname || '用户' }}</text>
                  <text class="list-sub">{{ item.followedAt ? formatTime(item.followedAt) : '' }}</text>
                </view>
                <button
                  class="mini-btn"
                  @click.stop="toggleFollow(item)"
                >{{ currentTab === 'following' ? '取消关注' : (item.user?.isFollowed ? '取消关注' : '关注') }}</button>
              </view>
            </template>

            <template v-else>
              <text class="list-title">{{ item.title || '无标题' }}</text>
              <text class="list-desc">{{ stripHtml(item.content || '') }}</text>
              <view class="list-footer">
                <text class="list-sub">{{ formatTime(item.createdAt || item.lastViewedAt || item.collectedAt) }}</text>
                <view class="card-actions">
                  <button
                    v-if="currentTab === 'collections'"
                    class="mini-btn"
                    @click.stop="cancelCollection(item)"
                  >取消收藏</button>
                  <button
                    v-if="currentTab === 'posts'"
                    class="mini-btn danger"
                    @click.stop="deleteMyPost(item)"
                  >删除</button>
                </view>
              </view>
            </template>
          </view>

          <view class="loading-more" v-if="currentState.loading && currentState.list.length > 0">加载中...</view>
          <view class="loading-more" v-else-if="currentState.noMore && currentState.list.length > 0">没有更多了</view>
        </view>
      </template>

      <view class="safe-bottom"></view>
    </scroll-view>

    <view v-if="userStore.isLoggedIn" class="logout-section" @click="handleLogout">
      <text class="logout-text" :style="{ fontSize: `calc(15px * ${fontScale})` }">退出登录</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { useThemeStore, FONT_SCALES } from '@/store/theme';
import { useUserStore } from '@/store/user';
import { storeToRefs } from 'pinia';
import { circleApi, interactionApi, postApi, userApi } from '@/api';
import { formatRelativeTime } from '@/common/utils';

const themeStore = useThemeStore();
const userStore = useUserStore();
const { fontScale } = storeToRefs(themeStore);

const tabTitleMap: Record<string, string> = {
  default: '设置',
  font: '字体设置',
  posts: '我的发布',
  collections: '我的收藏',
  history: '浏览历史',
  circles: '我的圈子',
  following: '我的关注',
  followers: '我的粉丝',
  profile: '个人资料',
  privacy: '隐私设置',
  about: '关于我们',
  agreement: '用户协议',
  policy: '隐私政策',
  likes: '互动统计',
};

const listTabs = ['posts', 'collections', 'history', 'circles', 'following', 'followers'] as const;
type ListTab = typeof listTabs[number];
const listTabSet = new Set<string>(listTabs);

const currentTab = ref<string>('default');
const currentTabTitle = computed(() => tabTitleMap[currentTab.value] || '设置');
const refreshing = ref(false);

const fontScales = FONT_SCALES;
const cacheSize = ref('0MB');

const postStatus = ref<'published' | 'audit'>('published');
const likesStats = ref<any>({});

const profileSaving = ref(false);
const profileForm = ref({
  nickname: '',
  avatarUrl: '',
});

const privacySettings = reactive({
  showInSearch: true,
  allowFollow: true,
  receiveMessage: true,
});

const tabStates = reactive<Record<ListTab, {
  list: any[];
  page: number;
  noMore: boolean;
  loading: boolean;
  initialized: boolean;
  error: string;
}>>({
  posts: { list: [], page: 1, noMore: false, loading: false, initialized: false, error: '' },
  collections: { list: [], page: 1, noMore: false, loading: false, initialized: false, error: '' },
  history: { list: [], page: 1, noMore: false, loading: false, initialized: false, error: '' },
  circles: { list: [], page: 1, noMore: false, loading: false, initialized: false, error: '' },
  following: { list: [], page: 1, noMore: false, loading: false, initialized: false, error: '' },
  followers: { list: [], page: 1, noMore: false, loading: false, initialized: false, error: '' },
});

const currentState = computed(() => {
  if (!listTabSet.has(currentTab.value)) {
    return {
      list: [],
      page: 1,
      noMore: true,
      loading: false,
      initialized: true,
      error: '',
    };
  }
  return tabStates[currentTab.value as ListTab];
});

const formatTime = (value: string) => formatRelativeTime(value);

const parseMediaUrls = (value: any): string[] => {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return value ? [value] : [];
  }
};

const stripHtml = (html: string) => {
  if (!html) return '';
  let text = html.replace(/<[^>]*>/g, '');
  text = text.replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length > 80 ? `${text.slice(0, 80)}...` : text;
};

const normalizeTab = (tab?: string) => {
  if (!tab) return 'default';
  if (tabTitleMap[tab]) return tab;
  return 'default';
};

const checkLoginForTab = (tab: string) => {
  const needLoginTabs = new Set([
    'posts',
    'collections',
    'history',
    'circles',
    'following',
    'followers',
    'profile',
    'likes',
  ]);
  if (!needLoginTabs.has(tab)) return true;
  return userStore.requireLogin();
};

const loadProfile = async () => {
  if (!userStore.isLoggedIn) return;
  try {
    const profile = await userApi.getProfile();
    profileForm.value.nickname = profile.nickname || userStore.userInfo?.nickname || '';
    profileForm.value.avatarUrl = profile.avatarUrl || userStore.userInfo?.avatarUrl || '';
  } catch {
    profileForm.value.nickname = userStore.userInfo?.nickname || '';
    profileForm.value.avatarUrl = userStore.userInfo?.avatarUrl || '';
  }
};

const loadLikesStats = async () => {
  if (!userStore.isLoggedIn) return;
  likesStats.value = await userApi.getStats();
};

const resetTabState = (tab: ListTab) => {
  tabStates[tab].page = 1;
  tabStates[tab].noMore = false;
  tabStates[tab].list = [];
  tabStates[tab].error = '';
};

const loadTabData = async (tab: ListTab, refresh = false) => {
  const state = tabStates[tab];
  if (state.loading) return;
  if (!refresh && state.noMore) return;

  state.loading = true;
  state.error = '';
  try {
    if (refresh) {
      resetTabState(tab);
    }

    const page = state.page;
    const pageSize = 10;
    let list: any[] = [];

    if (tab === 'posts') {
      const res = await userApi.getMyPosts({ status: postStatus.value, page, pageSize });
      list = (res.list || []).map((item: any) => ({
        ...item,
        mediaUrls: parseMediaUrls(item.mediaUrls),
      }));
      state.noMore = list.length < pageSize;
    }

    if (tab === 'collections') {
      const res = await userApi.getCollections({ page, pageSize });
      list = (res.list || []).map((item: any) => ({
        ...item,
        mediaUrls: parseMediaUrls(item.mediaUrls),
      }));
      state.noMore = list.length < pageSize;
    }

    if (tab === 'history') {
      const res = await userApi.getHistory({ page, pageSize });
      list = (res.list || []).map((item: any) => ({
        ...item,
        mediaUrls: parseMediaUrls(item.mediaUrls),
      }));
      state.noMore = list.length < pageSize;
    }

    if (tab === 'circles') {
      const res = await circleApi.getMyCircles();
      list = Array.isArray(res) ? res : (res.list || []);
      state.noMore = true;
    }

    if (tab === 'following') {
      const res = await interactionApi.getFollowing({ page, pageSize });
      list = res.list || [];
      state.noMore = list.length < pageSize;
    }

    if (tab === 'followers') {
      const res = await interactionApi.getFollowers({ page, pageSize });
      list = res.list || [];
      state.noMore = list.length < pageSize;
    }

    if (refresh) {
      state.list = list;
    } else {
      state.list.push(...list);
    }

    if (!state.noMore) {
      state.page += 1;
    }

    state.initialized = true;
  } catch (error) {
    state.error = '加载失败，请重试';
    console.error('加载列表失败', error);
  } finally {
    state.loading = false;
  }
};

const ensureTabLoaded = async (tab: string, refresh = false) => {
  if (!listTabSet.has(tab)) {
    if (tab === 'profile') await loadProfile();
    if (tab === 'likes') await loadLikesStats();
    return;
  }

  const key = tab as ListTab;
  if (!tabStates[key].initialized || refresh) {
    await loadTabData(key, true);
  }
};

const openTab = async (tab: string) => {
  const normalized = normalizeTab(tab);
  if (!checkLoginForTab(normalized)) return;

  currentTab.value = normalized;
  await ensureTabLoaded(normalized);
};

const goDefault = () => {
  currentTab.value = 'default';
};

const loadMore = async () => {
  if (!listTabSet.has(currentTab.value)) return;
  await loadTabData(currentTab.value as ListTab, false);
};

const retryCurrentTab = async () => {
  if (!listTabSet.has(currentTab.value)) return;
  await loadTabData(currentTab.value as ListTab, true);
};

const refreshCurrent = async () => {
  refreshing.value = true;
  if (listTabSet.has(currentTab.value)) {
    await loadTabData(currentTab.value as ListTab, true);
  } else if (currentTab.value === 'profile') {
    await loadProfile();
  } else if (currentTab.value === 'likes') {
    await loadLikesStats();
  }
  refreshing.value = false;
};

const getCacheSize = () => {
  try {
    const info = uni.getStorageInfoSync();
    cacheSize.value = `${(info.currentSize / 1024).toFixed(2)}MB`;
  } catch {
    cacheSize.value = '0MB';
  }
};

const clearCache = () => {
  const token = userStore.token;
  const refreshToken = uni.getStorageSync('refreshToken');
  const userInfo = userStore.userInfo;
  uni.showModal({
    title: '提示',
    content: '确定清除缓存吗？',
    success: (res) => {
      if (!res.confirm) return;
      uni.clearStorageSync();
      themeStore.initFontScale();
      if (token) {
        uni.setStorageSync('token', token);
      }
      if (refreshToken) {
        uni.setStorageSync('refreshToken', refreshToken);
      }
      if (userInfo) {
        uni.setStorageSync('userInfo', userInfo);
      }
      getCacheSize();
      uni.showToast({ title: '缓存已清理', icon: 'success' });
    },
  });
};

const setFontScale = (value: number) => {
  themeStore.setFontScale(value);
};

const pickAvatar = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    success: (res) => {
      const filePath = res.tempFilePaths?.[0];
      if (filePath) {
        profileForm.value.avatarUrl = filePath;
      }
    },
  });
};

const saveProfile = async () => {
  if (!userStore.isLoggedIn) return;
  if (!profileForm.value.nickname.trim()) {
    uni.showToast({ title: '昵称不能为空', icon: 'none' });
    return;
  }
  profileSaving.value = true;
  try {
    const updated = await userApi.updateProfile({
      nickname: profileForm.value.nickname.trim(),
      avatarUrl: profileForm.value.avatarUrl,
      fontScale: fontScale.value,
    });

    userStore.setUserInfo({
      ...(userStore.userInfo || { id: updated.id, role: updated.role || 0 }),
      ...updated,
    });

    uni.showToast({ title: '保存成功', icon: 'success' });
  } catch (error) {
    console.error('保存资料失败', error);
    uni.showToast({ title: '保存失败', icon: 'none' });
  } finally {
    profileSaving.value = false;
  }
};

const onPrivacyChange = (key: keyof typeof privacySettings, e: any) => {
  privacySettings[key] = !!e?.detail?.value;
  uni.setStorageSync('privacySettings', privacySettings);
};

const switchPostStatus = async (status: 'published' | 'audit') => {
  if (postStatus.value === status) return;
  postStatus.value = status;
  await loadTabData('posts', true);
};

const openItem = (item: any) => {
  if (currentTab.value === 'circles') {
    uni.navigateTo({ url: `/sub_pkg_A/circle-detail/circle-detail?id=${item.id}` });
    return;
  }
  if (currentTab.value === 'following' || currentTab.value === 'followers') {
    return;
  }

  const postId = item.id;
  if (postId) {
    uni.navigateTo({ url: `/pages/detail/detail?id=${postId}` });
  }
};

const cancelCollection = async (item: any) => {
  try {
    await interactionApi.uncollect({ targetId: item.id, targetType: 'post' });
    const state = tabStates.collections;
    state.list = state.list.filter((v) => v.id !== item.id);
    uni.showToast({ title: '已取消收藏', icon: 'none' });
  } catch {
    uni.showToast({ title: '操作失败', icon: 'none' });
  }
};

const deleteMyPost = async (item: any) => {
  uni.showModal({
    title: '确认删除',
    content: '删除后不可恢复，是否继续？',
    success: async (res) => {
      if (!res.confirm) return;
      try {
        await postApi.delete(item.id);
        const state = tabStates.posts;
        state.list = state.list.filter((v) => v.id !== item.id);
        uni.showToast({ title: '删除成功', icon: 'success' });
      } catch {
        uni.showToast({ title: '删除失败', icon: 'none' });
      }
    },
  });
};

const toggleFollow = async (item: any) => {
  const userId = item?.user?.id;
  if (!userId) return;
  try {
    const res = await interactionApi.follow({ userId });
    if (currentTab.value === 'following' && res.followed === false) {
      tabStates.following.list = tabStates.following.list.filter((v) => v.user?.id !== userId);
      uni.showToast({ title: '已取消关注', icon: 'none' });
      return;
    }

    if (currentTab.value === 'followers') {
      item.user = {
        ...(item.user || {}),
        isFollowed: !!res.followed,
      };
      uni.showToast({ title: res.followed ? '已关注' : '已取消关注', icon: 'none' });
    }
  } catch {
    uni.showToast({ title: '操作失败', icon: 'none' });
  }
};

const handleLogout = () => {
  uni.showModal({
    title: '提示',
    content: '确定退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        userStore.logout();
        uni.showToast({ title: '已退出', icon: 'none' });
        uni.switchTab({ url: '/pages/index/index' });
      }
    },
  });
};

onLoad(async (options: any) => {
  const tab = normalizeTab(options?.tab);

  const savedPrivacy = uni.getStorageSync('privacySettings');
  if (savedPrivacy) {
    privacySettings.showInSearch = savedPrivacy.showInSearch ?? true;
    privacySettings.allowFollow = savedPrivacy.allowFollow ?? true;
    privacySettings.receiveMessage = savedPrivacy.receiveMessage ?? true;
  }

  getCacheSize();

  if (tab !== 'default') {
    if (!checkLoginForTab(tab)) {
      currentTab.value = 'default';
      return;
    }
    currentTab.value = tab;
    await ensureTabLoaded(tab);
  }
});

onShow(async () => {
  getCacheSize();
  if (currentTab.value === 'default') return;
  if (!checkLoginForTab(currentTab.value)) return;
  await ensureTabLoaded(currentTab.value, true);
});
</script>

<style lang="scss" scoped>
.settings-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #fff8f4 0%, #f5f6f8 220rpx);
  display: flex;
  flex-direction: column;
}

.tab-header {
  height: 96rpx;
  padding: calc(env(safe-area-inset-top) + 12rpx) 24rpx 12rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1rpx solid #f0ece8;
}

.back-btn {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: #f7f1ee;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-arrow {
  font-size: 40rpx;
  color: #704c3f;
}

.tab-title {
  font-weight: 700;
  color: #2a211d;
}

.header-spacer {
  width: 64rpx;
}

.content-scroll {
  flex: 1;
  padding: 20rpx 24rpx;
}

.section {
  background: #fff;
  border-radius: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 6rpx 22rpx rgba(23, 16, 12, 0.04);
  overflow: hidden;
}

.section-title-wrap {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 24rpx;
}

.icon-badge {
  width: 42rpx;
  height: 42rpx;
  border-radius: 10rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 22rpx;
  font-weight: 700;
}

.icon-font { background: linear-gradient(145deg, #ff9a6b, #e17055); }
.icon-user { background: linear-gradient(145deg, #6db8ff, #3779ff); }
.icon-setting { background: linear-gradient(145deg, #77d4ad, #2fb88a); }
.icon-doc { background: linear-gradient(145deg, #b9a6ff, #8570f0); }

.section-title {
  color: #2b1f1a;
  font-weight: 700;
}

.menu-item {
  height: 92rpx;
  padding: 0 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1rpx solid #f6f3f1;
}

.menu-label {
  font-size: calc(15px * var(--font-scale));
  color: #2f2b29;
}

.menu-value {
  font-size: calc(14px * var(--font-scale));
  color: #8b837d;
}

.menu-arrow {
  font-size: 32rpx;
  color: #c6beb9;
}

.font-scale-wrap {
  display: flex;
  gap: 14rpx;
  padding: 0 24rpx 24rpx;
}

.font-option {
  flex: 1;
  height: 72rpx;
  border-radius: 14rpx;
  background: #f4f1ef;
  color: #6b615b;
  display: flex;
  align-items: center;
  justify-content: center;

  &.active {
    background: linear-gradient(145deg, #e17055, #cc5f45);
    color: #fff;
  }
}

.font-preview {
  margin: 0 24rpx 24rpx;
  padding: 18rpx;
  border-radius: 14rpx;
  background: #fbf8f6;
}

.preview-label {
  display: block;
  color: #8f8882;
  font-size: calc(12px * var(--font-scale));
  margin-bottom: 8rpx;
}

.preview-text {
  color: #2f2b29;
  line-height: 1.7;
}

.profile-avatar-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 28rpx 24rpx 10rpx;
}

.profile-avatar {
  width: 132rpx;
  height: 132rpx;
  border-radius: 50%;
}

.profile-avatar-tip {
  margin-top: 12rpx;
  color: #8f8882;
  font-size: 24rpx;
}

.form-item {
  padding: 10rpx 24rpx 24rpx;
}

.form-label {
  display: block;
  color: #5c544f;
  font-size: 26rpx;
  margin-bottom: 10rpx;
}

.form-input {
  width: 100%;
  height: 84rpx;
  background: #f7f4f2;
  border-radius: 12rpx;
  padding: 0 22rpx;
  font-size: 30rpx;
}

.primary-btn {
  margin: 0 24rpx 24rpx;
  height: 84rpx;
  border: none;
  border-radius: 42rpx;
  color: #fff;
  background: linear-gradient(145deg, #e17055, #cb5f46);
}

.primary-btn[disabled] {
  opacity: 0.7;
}

.switch-item {
  height: 96rpx;
  padding: 0 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1rpx solid #f5f1ef;
}

.switch-item:first-child {
  border-top: none;
}

.switch-label {
  color: #2f2b29;
  font-size: calc(15px * var(--font-scale));
}

.doc-section {
  padding: 26rpx 24rpx;
}

.doc-title {
  display: block;
  font-size: calc(16px * var(--font-scale));
  color: #2a211d;
  font-weight: 700;
  margin-bottom: 14rpx;
}

.doc-text {
  display: block;
  font-size: calc(14px * var(--font-scale));
  color: #4f4742;
  line-height: 1.75;
  margin-bottom: 10rpx;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12rpx;
  padding: 20rpx;
}

.stat-box {
  border-radius: 14rpx;
  background: #faf6f3;
  padding: 22rpx 12rpx;
  text-align: center;
}

.stat-num {
  display: block;
  font-size: calc(20px * var(--font-scale));
  color: #e17055;
  font-weight: 700;
}

.stat-label {
  display: block;
  margin-top: 6rpx;
  font-size: calc(12px * var(--font-scale));
  color: #7f746d;
}

.list-wrap {
  min-height: 300rpx;
}

.post-filter {
  display: flex;
  gap: 12rpx;
  padding: 16rpx 20rpx 20rpx;
}

.filter-pill {
  height: 56rpx;
  padding: 0 24rpx;
  border-radius: 28rpx;
  background: #f3efed;
  color: #6f6661;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: calc(13px * var(--font-scale));

  &.active {
    background: #fbe9e2;
    color: #c95f46;
  }
}

.list-card {
  background: #fff;
  border-radius: 18rpx;
  padding: 22rpx;
  margin-bottom: 14rpx;
  box-shadow: 0 6rpx 20rpx rgba(27, 20, 16, 0.04);
}

.list-title {
  display: block;
  font-size: calc(15px * var(--font-scale));
  color: #2f2a27;
  font-weight: 700;
}

.list-desc {
  display: block;
  margin-top: 8rpx;
  font-size: calc(13px * var(--font-scale));
  color: #7d746e;
  line-height: 1.6;
}

.list-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 14rpx;
}

.list-sub {
  font-size: calc(12px * var(--font-scale));
  color: #a0958f;
}

.card-actions {
  display: flex;
  gap: 10rpx;
}

.user-row {
  display: flex;
  align-items: center;
}

.user-avatar {
  width: 74rpx;
  height: 74rpx;
  border-radius: 50%;
  margin-right: 16rpx;
}

.user-meta {
  flex: 1;
}

.mini-btn {
  height: 56rpx;
  padding: 0 18rpx;
  border: none;
  border-radius: 28rpx;
  color: #fff;
  background: #e17055;
  font-size: 24rpx;
}

.mini-btn.danger {
  background: #dd5b5b;
}

.loading-state,
.empty-state,
.loading-more {
  text-align: center;
  color: #8e8681;
  padding: 30rpx;
  font-size: calc(13px * var(--font-scale));
}

.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.skeleton-card {
  background: #fff;
  border-radius: 18rpx;
  padding: 22rpx;
  box-shadow: 0 6rpx 20rpx rgba(27, 20, 16, 0.04);
}

.skeleton-line {
  height: 24rpx;
  border-radius: 12rpx;
  background: linear-gradient(90deg, #f3efec 25%, #ebe6e2 50%, #f3efec 75%);
  background-size: 200% 100%;
  animation: skeleton-move 1.4s ease infinite;
}

.skeleton-line.line-lg {
  width: 68%;
}

.skeleton-line.line-sm {
  width: 42%;
  margin-top: 14rpx;
}

@keyframes skeleton-move {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.error-state {
  background: #fff;
  border-radius: 18rpx;
  padding: 28rpx;
  text-align: center;
}

.error-text {
  display: block;
  color: #9a5c52;
  font-size: calc(13px * var(--font-scale));
}

.retry-btn {
  margin-top: 16rpx;
  height: 64rpx;
  line-height: 64rpx;
  border-radius: 32rpx;
  border: none;
  background: #e17055;
  color: #fff;
  font-size: calc(13px * var(--font-scale));

  &::after {
    border: none;
  }
}

.logout-section {
  margin: 0 24rpx 24rpx;
  height: 84rpx;
  border-radius: 18rpx;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logout-text {
  color: #d35952;
}

.safe-bottom {
  height: calc(130rpx + env(safe-area-inset-bottom));
}
</style>
