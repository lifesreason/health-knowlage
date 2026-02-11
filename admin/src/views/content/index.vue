<template>
  <div class="content-container">
    <!-- 筛选栏 -->
    <el-card class="filter-card">
      <el-row :gutter="20" align="middle">
        <el-col :span="6">
          <el-input
            v-model="keyword"
            placeholder="搜索标题/内容"
            clearable
            @keyup.enter="loadList"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="4">
          <el-select v-model="status" placeholder="状态" clearable @change="loadList">
            <el-option label="全部" :value="undefined" />
            <el-option label="待审核" :value="0" />
            <el-option label="已发布" :value="1" />
            <el-option label="已驳回" :value="2" />
          </el-select>
        </el-col>
        <el-col :span="14" style="text-align: right">
          <el-button type="primary" @click="handleCreate">
            <el-icon><Plus /></el-icon>
            发布内容
          </el-button>
          <el-button @click="loadList">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 内容列表 -->
    <el-card class="list-card">
      <el-table :data="list" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="作者" width="150">
          <template #default="{ row }">
            <div class="user-info">
              <el-avatar :size="32" :src="row.user?.avatarUrl" />
              <span>{{ row.user?.nickname || '系统' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="150" show-overflow-tooltip />
        <el-table-column prop="content" label="内容" min-width="200" show-overflow-tooltip />
        <el-table-column label="圈子" width="120">
          <template #default="{ row }">
            {{ row.circle?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="类型" width="80">
          <template #default="{ row }">
            <el-tag :type="row.type === 1 ? 'success' : 'warning'" size="small">
              {{ row.type === 1 ? '图文' : '视频' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.auditStatus)" size="small">
              {{ getStatusText(row.auditStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="viewCount" label="浏览" width="80" />
        <el-table-column prop="likeCount" label="点赞" width="80" />
        <el-table-column prop="commentCount" label="评论" width="80" />
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleView(row)">查看</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
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
    <el-dialog v-model="detailVisible" title="内容详情" width="700px">
      <div v-if="currentPost" class="detail-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="作者">{{ currentPost.user?.nickname }}</el-descriptions-item>
          <el-descriptions-item label="圈子">{{ currentPost.circle?.name }}</el-descriptions-item>
          <el-descriptions-item label="类型">
            <el-tag :type="currentPost.type === 1 ? 'success' : 'warning'">
              {{ currentPost.type === 1 ? '图文' : '视频' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(currentPost.auditStatus)">
              {{ getStatusText(currentPost.auditStatus) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="标题" :span="2">{{ currentPost.title || '-' }}</el-descriptions-item>
        </el-descriptions>
        <div class="content-preview">
          <h4>内容预览：</h4>
          <div class="phone-preview">
            <div class="phone-header">
              <span>📱 小程序预览</span>
            </div>
            <div class="phone-content" v-html="currentPost.content"></div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 发布内容弹窗 -->
    <el-dialog v-model="createVisible" title="发布内容" width="900px" :close-on-click-modal="false">
      <el-row :gutter="20">
        <!-- 左侧编辑区域 -->
        <el-col :span="14">
          <el-form :model="createForm" label-width="80px">
            <el-form-item label="选择圈子" required>
              <el-select v-model="createForm.circleId" placeholder="请选择圈子" style="width: 100%">
                <el-option
                  v-for="circle in circleList"
                  :key="circle.id"
                  :label="circle.name"
                  :value="circle.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="内容类型" required>
              <el-radio-group v-model="createForm.type">
                <el-radio :label="1">图文</el-radio>
                <el-radio :label="2">视频</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="标题">
              <el-input v-model="createForm.title" placeholder="请输入标题（可选）" />
            </el-form-item>
            <el-form-item label="封面图">
              <el-input v-model="createForm.coverUrl" placeholder="请输入封面图URL" clearable>
                <template #prepend>🖼️</template>
              </el-input>
              <div v-if="createForm.coverUrl" class="cover-preview-mini">
                <img :src="createForm.coverUrl" alt="封面预览" />
              </div>
              <div class="cover-tip">建议比例 16:9，尺寸不小于 750×422px</div>
            </el-form-item>
            <el-form-item v-if="createForm.type === 2" label="视频链接" required>
              <el-input v-model="createForm.videoUrl" placeholder="请输入视频URL" clearable>
                <template #prepend>🎬</template>
              </el-input>
              <div v-if="createForm.videoUrl" class="video-preview-mini">
                <video :src="createForm.videoUrl" controls style="width: 100%; max-height: 200px; border-radius: 8px; margin-top: 8px;"></video>
              </div>
              <div class="cover-tip">支持 mp4 格式，建议不超过 100MB</div>
            </el-form-item>
            <el-form-item label="内容" required>
              <!-- 图文使用富文本编辑器 -->
              <div v-if="createForm.type === 1" class="editor-container">
                <QuillEditor
                  v-model:content="createForm.content"
                  contentType="html"
                  :options="editorOptions"
                  style="min-height: 250px"
                />
              </div>
              <!-- 视频使用普通文本框 -->
              <el-input
                v-else
                v-model="createForm.content"
                type="textarea"
                :rows="10"
                placeholder="请输入视频描述"
              />
            </el-form-item>
          </el-form>
        </el-col>
        <!-- 右侧预览区域 -->
        <el-col :span="10">
          <div class="preview-panel">
            <div class="preview-title">📱 小程序预览</div>
            <div class="preview-frame">
              <div class="preview-header">
                <div class="preview-circle-tag">{{ getCircleName(createForm.circleId) || '未选择圈子' }}</div>
              </div>
              <div v-if="createForm.coverUrl" class="preview-cover">
                <img :src="createForm.coverUrl" alt="封面" />
              </div>
              <div class="preview-article-title" v-if="createForm.title">{{ createForm.title }}</div>
              <div 
                class="preview-body" 
                v-html="createForm.content || '<p style=&quot;color: #999&quot;>内容预览区域...</p>'"
              ></div>
            </div>
          </div>
        </el-col>
      </el-row>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">发布</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Refresh, Plus } from '@element-plus/icons-vue';
import { QuillEditor } from '@vueup/vue-quill';
import '@vueup/vue-quill/dist/vue-quill.snow.css';
import { getPostList, deletePost, createPost } from '@/api/content';
import { getCircleList } from '@/api/circle';

const loading = ref(false);
const keyword = ref('');
const status = ref<number | undefined>(undefined);
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);
const list = ref<any[]>([]);

const detailVisible = ref(false);
const currentPost = ref<any>(null);

const createVisible = ref(false);
const submitting = ref(false);
const circleList = ref<any[]>([]);
const createForm = reactive({
  circleId: 0,
  type: 1,
  title: '',
  coverUrl: '',
  videoUrl: '',
  content: '',
});

// 富文本编辑器配置
const editorOptions = {
  theme: 'snow',
  modules: {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote'],
      [{ 'header': 1 }, { 'header': 2 }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean'],
    ],
  },
  placeholder: '请输入图文内容...',
};

const getCircleName = (circleId: number) => {
  const circle = circleList.value.find(c => c.id === circleId);
  return circle?.name;
};

const loadList = async () => {
  loading.value = true;
  try {
    const data = await getPostList({
      page: page.value,
      pageSize: pageSize.value,
      keyword: keyword.value || undefined,
      status: status.value,
    });
    list.value = data.list || [];
    total.value = data.total || 0;
  } catch (error) {
    ElMessage.error('加载失败');
  } finally {
    loading.value = false;
  }
};

const loadCircles = async () => {
  try {
    const data = await getCircleList({ page: 1, pageSize: 100 });
    circleList.value = data.list || [];
  } catch (error) {
    console.error('加载圈子失败');
  }
};

const handleCreate = () => {
  createForm.circleId = 0;
  createForm.type = 1;
  createForm.title = '';
  createForm.coverUrl = '';
  createForm.videoUrl = '';
  createForm.content = '';
  createVisible.value = true;
};

const handleSubmit = async () => {
  if (!createForm.circleId) {
    ElMessage.warning('请选择圈子');
    return;
  }
  if (createForm.type === 2 && !createForm.videoUrl) {
    ElMessage.warning('请输入视频链接');
    return;
  }
  if (!createForm.content || createForm.content === '<p><br></p>') {
    ElMessage.warning('请输入内容');
    return;
  }

  submitting.value = true;
  try {
    await createPost({
      circleId: createForm.circleId,
      type: createForm.type,
      title: createForm.title || undefined,
      coverUrl: createForm.coverUrl || undefined,
      content: createForm.content,
      mediaUrls: createForm.type === 2 && createForm.videoUrl ? [createForm.videoUrl] : undefined,
    });
    ElMessage.success('发布成功');
    createVisible.value = false;
    loadList();
  } catch (error) {
    ElMessage.error('发布失败');
  } finally {
    submitting.value = false;
  }
};

const handleView = (row: any) => {
  currentPost.value = row;
  detailVisible.value = true;
};

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定删除这条内容吗？删除后不可恢复', '提示', {
      type: 'warning',
    });
    await deletePost(row.id);
    ElMessage.success('删除成功');
    loadList();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败');
    }
  }
};

const getStatusType = (status: number) => {
  const map: Record<number, any> = { 0: 'warning', 1: 'success', 2: 'danger' };
  return map[status];
};

const getStatusText = (status: number) => {
  const map: Record<number, string> = { 0: '待审核', 1: '已发布', 2: '已驳回' };
  return map[status];
};

const formatTime = (time: string) => {
  return new Date(time).toLocaleString('zh-CN');
};

onMounted(() => {
  loadList();
  loadCircles();
});
</script>

<style lang="scss" scoped>
.content-container {
  .filter-card {
    margin-bottom: 20px;
  }

  .list-card {
    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .pagination {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }

  .editor-container {
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    
    :deep(.ql-toolbar) {
      border: none;
      border-bottom: 1px solid #dcdfe6;
    }
    
    :deep(.ql-container) {
      border: none;
      min-height: 250px;
    }
  }

  .preview-panel {
    .preview-title {
      font-size: 14px;
      font-weight: bold;
      color: #333;
      margin-bottom: 12px;
    }

    .preview-frame {
      border: 8px solid #1a1a1a;
      border-radius: 24px;
      background: #fff;
      min-height: 400px;
      max-height: 500px;
      overflow-y: auto;
      padding: 16px;

      .preview-header {
        margin-bottom: 12px;
      }

      .preview-circle-tag {
        display: inline-block;
        background: #ecf5ff;
        color: #409eff;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
      }

      .preview-article-title {
        font-size: 18px;
        font-weight: bold;
        color: #333;
        margin-bottom: 12px;
        line-height: 1.4;
      }

      .preview-body {
        font-size: 14px;
        line-height: 1.8;
        color: #333;

        :deep(img) {
          max-width: 100%;
          border-radius: 8px;
        }

        :deep(p) {
          margin: 0 0 12px 0;
        }

        :deep(h1), :deep(h2), :deep(h3) {
          margin: 16px 0 8px 0;
        }
      }
    }
  }

  .content-preview {
    margin-top: 20px;

    h4 {
      margin: 0 0 12px 0;
      color: #606266;
    }

    .phone-preview {
      border: 8px solid #1a1a1a;
      border-radius: 24px;
      background: #fff;
      max-height: 400px;
      overflow-y: auto;

      .phone-header {
        background: #f5f7fa;
        padding: 8px 16px;
        font-size: 12px;
        color: #999;
        border-radius: 16px 16px 0 0;
      }

      .phone-content {
        padding: 16px;
        font-size: 14px;
        line-height: 1.8;

        :deep(img) {
          max-width: 100%;
        }
      }
    }
  }
  .cover-preview-mini {
    margin-top: 8px;
    
    img {
      max-width: 100%;
      max-height: 120px;
      border-radius: 8px;
      border: 1px solid #eee;
      object-fit: cover;
    }
  }

  .cover-tip {
    font-size: 12px;
    color: #999;
    margin-top: 4px;
  }

  .preview-cover {
    margin-bottom: 12px;
    
    img {
      width: 100%;
      border-radius: 8px;
      object-fit: cover;
    }
  }
}
</style>
