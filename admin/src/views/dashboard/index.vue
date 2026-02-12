<template>
  <div class="dashboard-container">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon user">
              <el-icon><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.users }}</div>
              <div class="stat-label">总用户数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon post">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.posts }}</div>
              <div class="stat-label">总帖子数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon circle">
              <el-icon><ChatDotRound /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.circles }}</div>
              <div class="stat-label">圈子数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon pending">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.pending }}</div>
              <div class="stat-label">待审核</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>系统信息</span>
            </div>
          </template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="系统版本">v1.0.0</el-descriptions-item>
            <el-descriptions-item label="部署环境">开发环境</el-descriptions-item>
            <el-descriptions-item label="后端框架">NestJS</el-descriptions-item>
            <el-descriptions-item label="前端框架">Vue 3 + Element Plus</el-descriptions-item>
            <el-descriptions-item label="数据库">MySQL 8.0</el-descriptions-item>
            <el-descriptions-item label="缓存">Redis 6.0</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>快捷操作</span>
            </div>
          </template>
          <div class="quick-actions">
            <el-button type="primary" @click="$router.push('/audit')">
              <el-icon><DocumentChecked /></el-icon>
              内容审核
            </el-button>
            <el-button type="success" @click="$router.push('/user')">
              <el-icon><User /></el-icon>
              用户管理
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>推荐缓存命中监控</span>
              <div class="cache-actions">
                <el-select v-model="cacheWindowMinutes" size="small" style="width: 120px">
                  <el-option :value="5" label="近5分钟" />
                  <el-option :value="10" label="近10分钟" />
                  <el-option :value="30" label="近30分钟" />
                  <el-option :value="60" label="近60分钟" />
                </el-select>
                <el-button size="small" @click="loadCacheStats">刷新</el-button>
              </div>
            </div>
          </template>

          <el-row :gutter="16">
            <el-col :span="4"><div class="cache-kpi">请求数: {{ cacheStats.total.requests }}</div></el-col>
            <el-col :span="4"><div class="cache-kpi">命中率: {{ percent(cacheStats.total.hitRate) }}</div></el-col>
            <el-col :span="4"><div class="cache-kpi">命中数: {{ cacheStats.total.hitCount }}</div></el-col>
            <el-col :span="4"><div class="cache-kpi">未命中: {{ cacheStats.total.missCount }}</div></el-col>
            <el-col :span="4"><div class="cache-kpi">Redis命中: {{ cacheStats.total.redisHits }}</div></el-col>
            <el-col :span="4"><div class="cache-kpi">内存命中: {{ cacheStats.total.memoryHits }}</div></el-col>
          </el-row>

          <el-divider />

          <el-table :data="cacheStats.window.series" size="small" stripe>
            <el-table-column prop="minute" label="分钟(UTC)" min-width="170" />
            <el-table-column prop="requests" label="请求" width="90" />
            <el-table-column label="命中率" width="110">
              <template #default="{ row }">
                {{ percent(row.requests ? (row.redisHits + row.memoryHits) / row.requests : 0) }}
              </template>
            </el-table-column>
            <el-table-column prop="redisHits" label="Redis命中" width="100" />
            <el-table-column prop="memoryHits" label="内存命中" width="100" />
            <el-table-column prop="misses" label="未命中" width="90" />
            <el-table-column prop="setRequests" label="写入" width="90" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { User, Document, ChatDotRound, Clock, DocumentChecked } from '@element-plus/icons-vue';
import { getAuditStats } from '@/api/audit';
import { getFeedCacheStats, getOverviewStats } from '@/api/content';

const stats = reactive({
  users: 0,
  posts: 0,
  circles: 0,
  pending: 0,
});

const cacheWindowMinutes = ref(10);
const cacheStats = reactive({
  total: {
    requests: 0,
    hitRate: 0,
    hitCount: 0,
    missCount: 0,
    redisHits: 0,
    memoryHits: 0,
  },
  window: {
    series: [] as Array<{
      minute: string;
      requests: number;
      redisHits: number;
      memoryHits: number;
      misses: number;
      setRequests: number;
    }>,
  },
});
let cacheTimer: number | null = null;

// 加载统计数据
const loadStats = async () => {
  try {
    const [auditStats, overview] = await Promise.all([
      getAuditStats(),
      getOverviewStats(),
    ]);
    stats.pending = auditStats.pending ?? overview.pendingAudit ?? 0;
    stats.users = overview.userCount || 0;
    stats.posts = overview.postCount || 0;
    stats.circles = overview.circleCount || 0;
  } catch (error) {
    console.error('加载统计失败', error);
  }
};

const loadCacheStats = async () => {
  try {
    const res = await getFeedCacheStats({ windowMinutes: cacheWindowMinutes.value });
    cacheStats.total = res.total || cacheStats.total;
    cacheStats.window = res.window || cacheStats.window;
  } catch (error) {
    console.error('加载缓存统计失败', error);
  }
};

const percent = (value: number) => `${(value * 100).toFixed(1)}%`;

watch(cacheWindowMinutes, () => {
  loadCacheStats();
});

onMounted(() => {
  loadStats();
  loadCacheStats();
  cacheTimer = window.setInterval(() => {
    loadCacheStats();
  }, 15000);
});

onBeforeUnmount(() => {
  if (cacheTimer !== null) {
    window.clearInterval(cacheTimer);
  }
});
</script>

<style lang="scss" scoped>
.dashboard-container {
  .stat-card {
    .stat-content {
      display: flex;
      align-items: center;
      gap: 20px;

      .stat-icon {
        width: 60px;
        height: 60px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
        color: #fff;

        &.user {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        &.post {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }

        &.circle {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }

        &.pending {
          background: linear-gradient(135deg, #f6d365 0%, #fda085 100%);
        }
      }

      .stat-info {
        .stat-value {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 14px;
          color: #999;
        }
      }
    }
  }

  .quick-actions {
    display: flex;
    flex-direction: column;
    gap: 16px;

    .el-button {
      width: 100%;
      height: 60px;
      font-size: 16px;
    }
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .cache-actions {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .cache-kpi {
    padding: 8px 10px;
    background: #f8f9fb;
    border-radius: 8px;
    font-size: 13px;
    color: #303133;
  }
}
</style>
