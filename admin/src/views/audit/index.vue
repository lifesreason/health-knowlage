<template>
  <div class="audit-container">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
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
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon approved">
              <el-icon><Select /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.approved }}</div>
              <div class="stat-label">已通过</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon rejected">
              <el-icon><Close /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.rejected }}</div>
              <div class="stat-label">已驳回</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon total">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.total }}</div>
              <div class="stat-label">总计</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 筛选和操作栏 -->
    <el-card class="filter-card">
      <el-row :gutter="20" align="middle">
        <el-col :span="12">
          <el-radio-group v-model="status" @change="handleStatusChange">
            <el-radio-button :label="0">待审核</el-radio-button>
            <el-radio-button :label="1">已通过</el-radio-button>
            <el-radio-button :label="2">已驳回</el-radio-button>
          </el-radio-group>
        </el-col>
        <el-col :span="12" style="text-align: right">
          <el-button type="primary" @click="batchApprove" :disabled="selectedIds.length === 0">
            批量通过
          </el-button>
          <el-button type="danger" @click="batchReject" :disabled="selectedIds.length === 0">
            批量驳回
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 审核列表 -->
    <el-card class="list-card">
      <el-table
        :data="list"
        v-loading="loading"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="作者" width="150">
          <template #default="{ row }">
            <div class="user-info">
              <el-avatar :size="32" :src="row.user?.avatarUrl" />
              <span>{{ row.user?.nickname }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="200" />
        <el-table-column prop="content" label="内容" min-width="300" show-overflow-tooltip />
        <el-table-column label="圈子" width="120">
          <template #default="{ row }">
            {{ row.circle?.name }}
          </template>
        </el-table-column>
        <el-table-column label="类型" width="80">
          <template #default="{ row }">
            <el-tag :type="row.type === 1 ? 'success' : 'warning'">
              {{ row.type === 1 ? '图文' : '视频' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.auditStatus)">
              {{ getStatusText(row.auditStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleView(row)">查看</el-button>
            <el-button
              v-if="row.auditStatus === 0"
              type="success"
              link
              @click="handleApprove(row.id)"
            >
              通过
            </el-button>
            <el-button
              v-if="row.auditStatus === 0"
              type="danger"
              link
              @click="handleReject(row)"
            >
              驳回
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadList"
          @current-change="loadList"
        />
      </div>
    </el-card>

    <!-- 查看详情弹窗 -->
    <el-dialog v-model="detailVisible" title="内容详情" width="600px">
      <div v-if="currentPost" class="detail-content">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="作者">{{ currentPost.user?.nickname }}</el-descriptions-item>
          <el-descriptions-item label="圈子">{{ currentPost.circle?.name }}</el-descriptions-item>
          <el-descriptions-item label="类型">
            <el-tag :type="currentPost.type === 1 ? 'success' : 'warning'">
              {{ currentPost.type === 1 ? '图文' : '视频' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="标题">{{ currentPost.title }}</el-descriptions-item>
          <el-descriptions-item label="内容">{{ currentPost.content }}</el-descriptions-item>
          <el-descriptions-item v-if="currentPost.mediaUrls" label="媒体">
            <div class="media-preview">
              <image
                v-for="(url, index) in currentPost.mediaUrls"
                :key="index"
                :src="url"
                class="preview-image"
              />
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatTime(currentPost.createdAt) }}</el-descriptions-item>
          <el-descriptions-item v-if="currentPost.rejectReason" label="驳回原因">
            <span style="color: red">{{ currentPost.rejectReason }}</span>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 驳回弹窗 -->
    <el-dialog v-model="rejectVisible" title="驳回理由" width="500px">
      <el-input
        v-model="rejectReason"
        type="textarea"
        :rows="4"
        placeholder="请输入驳回理由"
      />
      <template #footer>
        <el-button @click="rejectVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmReject">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Clock, Select, Close, Document } from '@element-plus/icons-vue';
import { getPendingList, getAuditStats, approvePost, rejectPost, batchAudit } from '@/api/audit';

const loading = ref(false);
const status = ref(0);
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);
const list = ref<any[]>([]);
const selectedIds = ref<number[]>([]);

const stats = reactive({
  pending: 0,
  approved: 0,
  rejected: 0,
  total: 0,
});

const detailVisible = ref(false);
const currentPost = ref<any>(null);

const rejectVisible = ref(false);
const rejectReason = ref('');
const rejectPostId = ref(0);

// 加载统计
const loadStats = async () => {
  try {
    const data = await getAuditStats();
    Object.assign(stats, data);
  } catch (error) {
    console.error('加载统计失败', error);
  }
};

// 加载列表
const loadList = async () => {
  loading.value = true;
  try {
    const data = await getPendingList({
      page: page.value,
      pageSize: pageSize.value,
      status: status.value,
    });
    list.value = data.list || [];
    total.value = data.total || 0;
  } catch (error) {
    ElMessage.error('加载列表失败');
  } finally {
    loading.value = false;
  }
};

// 状态切换
const handleStatusChange = () => {
  page.value = 1;
  loadList();
};

// 选择变化
const handleSelectionChange = (selection: any[]) => {
  selectedIds.value = selection.map((item) => item.id);
};

// 查看
const handleView = (row: any) => {
  currentPost.value = row;
  detailVisible.value = true;
};

// 通过
const handleApprove = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定通过这条内容吗？', '提示', {
      type: 'warning',
    });
    await approvePost(id);
    ElMessage.success('审核通过');
    loadList();
    loadStats();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败');
    }
  }
};

// 驳回
const handleReject = (row: any) => {
  rejectPostId.value = row.id;
  rejectReason.value = '';
  rejectVisible.value = true;
};

// 确认驳回
const confirmReject = async () => {
  if (!rejectReason.value.trim()) {
    ElMessage.warning('请输入驳回理由');
    return;
  }

  try {
    await rejectPost(rejectPostId.value, rejectReason.value);
    ElMessage.success('审核驳回');
    rejectVisible.value = false;
    loadList();
    loadStats();
  } catch (error) {
    ElMessage.error('操作失败');
  }
};

// 批量通过
const batchApprove = async () => {
  try {
    await ElMessageBox.confirm(`确定通过选中的 ${selectedIds.value.length} 条内容吗？`, '提示', {
      type: 'warning',
    });
    await batchAudit({ postIds: selectedIds.value, action: 'approve' });
    ElMessage.success('批量审核通过');
    loadList();
    loadStats();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败');
    }
  }
};

// 批量驳回
const batchReject = async () => {
  try {
    const { value } = await ElMessageBox.prompt('请输入驳回理由', '批量驳回', {
      inputType: 'textarea',
      inputPlaceholder: '请输入驳回理由',
    });
    if (!value) {
      ElMessage.warning('请输入驳回理由');
      return;
    }
    await batchAudit({ postIds: selectedIds.value, action: 'reject', rejectReason: value });
    ElMessage.success('批量审核驳回');
    loadList();
    loadStats();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败');
    }
  }
};

// 获取状态类型
const getStatusType = (status: number) => {
  const map: Record<number, any> = {
    0: 'warning',
    1: 'success',
    2: 'danger',
  };
  return map[status];
};

// 获取状态文本
const getStatusText = (status: number) => {
  const map: Record<number, string> = {
    0: '待审核',
    1: '已通过',
    2: '已驳回',
  };
  return map[status];
};

// 格式化时间
const formatTime = (time: string) => {
  return new Date(time).toLocaleString('zh-CN');
};

onMounted(() => {
  loadStats();
  loadList();
});
</script>

<style lang="scss" scoped>
.audit-container {
  .stats-row {
    margin-bottom: 20px;
  }

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

        &.pending {
          background: linear-gradient(135deg, #f6d365 0%, #fda085 100%);
        }

        &.approved {
          background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
        }

        &.rejected {
          background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
        }

        &.total {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

  .filter-card {
    margin-bottom: 20px;
  }

  .list-card {
    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .media-preview {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;

      .preview-image {
        width: 100px;
        height: 100px;
        object-fit: cover;
        border-radius: 4px;
      }
    }

    .pagination {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }
}
</style>