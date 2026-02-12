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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { User, Document, ChatDotRound, Clock, DocumentChecked } from '@element-plus/icons-vue';
import { getAuditStats } from '@/api/audit';
import { getOverviewStats } from '@/api/content';

const stats = reactive({
  users: 0,
  posts: 0,
  circles: 0,
  pending: 0,
});

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

onMounted(() => {
  loadStats();
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
}
</style>
