<template>
  <div class="circle-container">
    <!-- 操作栏 -->
    <el-card class="filter-card">
      <el-row :gutter="20" align="middle">
        <el-col :span="8">
          <el-input
            v-model="keyword"
            placeholder="搜索圈子名称"
            clearable
            @keyup.enter="loadList"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="16" style="text-align: right">
          <el-button type="primary" @click="handleCreate">
            <el-icon><Plus /></el-icon>
            新建圈子
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 圈子列表 -->
    <el-card class="list-card">
      <el-table :data="list" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="封面" width="100">
          <template #default="{ row }">
            <el-image
              v-if="row.coverUrl"
              :src="row.coverUrl"
              :preview-src-list="[row.coverUrl]"
              fit="cover"
              style="width: 60px; height: 60px; border-radius: 8px"
            />
            <div v-else class="no-cover">无</div>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="名称" min-width="150" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="memberCount" label="成员数" width="100" />
        <el-table-column prop="postCount" label="帖子数" width="100" />
        <el-table-column prop="sortOrder" label="排序" width="80" />
        <el-table-column label="推荐" width="80">
          <template #default="{ row }">
            <el-tag :type="row.isRecommend ? 'success' : 'info'" size="small">
              {{ row.isRecommend ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
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

    <!-- 创建/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑圈子' : '新建圈子'" width="500px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="名称" required>
          <el-input v-model="form.name" placeholder="请输入圈子名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item label="封面URL">
          <el-input v-model="form.coverUrl" placeholder="请输入封面图片URL" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sortOrder" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="推荐">
          <el-switch v-model="form.isRecommend" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Plus } from '@element-plus/icons-vue';
import { getCircleList, createCircle, updateCircle, deleteCircle } from '@/api/circle';

const loading = ref(false);
const keyword = ref('');
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);
const list = ref<any[]>([]);

const dialogVisible = ref(false);
const isEdit = ref(false);
const editId = ref(0);
const submitting = ref(false);
const form = reactive({
  name: '',
  description: '',
  coverUrl: '',
  sortOrder: 0,
  isRecommend: false,
});

const loadList = async () => {
  loading.value = true;
  try {
    const data = await getCircleList({
      page: page.value,
      pageSize: pageSize.value,
      keyword: keyword.value || undefined,
    });
    list.value = data.list || [];
    total.value = data.total || 0;
  } catch (error) {
    ElMessage.error('加载失败');
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  form.name = '';
  form.description = '';
  form.coverUrl = '';
  form.sortOrder = 0;
  form.isRecommend = false;
};

const handleCreate = () => {
  isEdit.value = false;
  resetForm();
  dialogVisible.value = true;
};

const handleEdit = (row: any) => {
  isEdit.value = true;
  editId.value = row.id;
  form.name = row.name;
  form.description = row.description || '';
  form.coverUrl = row.coverUrl || '';
  form.sortOrder = row.sortOrder || 0;
  form.isRecommend = row.isRecommend || false;
  dialogVisible.value = true;
};

const handleSubmit = async () => {
  if (!form.name.trim()) {
    ElMessage.warning('请输入圈子名称');
    return;
  }

  submitting.value = true;
  try {
    if (isEdit.value) {
      await updateCircle(editId.value, form);
      ElMessage.success('更新成功');
    } else {
      await createCircle(form);
      ElMessage.success('创建成功');
    }
    dialogVisible.value = false;
    loadList();
  } catch (error) {
    ElMessage.error('操作失败');
  } finally {
    submitting.value = false;
  }
};

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定删除圈子「${row.name}」吗？`, '提示', {
      type: 'warning',
    });
    await deleteCircle(row.id);
    ElMessage.success('删除成功');
    loadList();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败');
    }
  }
};

const formatTime = (time: string) => {
  return new Date(time).toLocaleString('zh-CN');
};

onMounted(() => {
  loadList();
});
</script>

<style lang="scss" scoped>
.circle-container {
  .filter-card {
    margin-bottom: 20px;
  }

  .list-card {
    .no-cover {
      width: 60px;
      height: 60px;
      border-radius: 8px;
      background: #f0f0f0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #999;
      font-size: 12px;
    }

    .pagination {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }
}
</style>
