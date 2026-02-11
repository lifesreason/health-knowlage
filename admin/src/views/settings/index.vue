<template>
  <div class="settings-container">
    <el-card>
      <template #header>
        <span>系统设置</span>
      </template>

      <el-form label-width="120px">
        <el-divider content-position="left">基础配置</el-divider>
        
        <el-form-item label="站点名称">
          <el-input v-model="settings.siteName" placeholder="银龄健康社区" style="max-width: 300px" />
        </el-form-item>

        <el-form-item label="站点描述">
          <el-input v-model="settings.siteDesc" type="textarea" :rows="2" placeholder="为老年人打造的健康知识分享平台" style="max-width: 500px" />
        </el-form-item>

        <el-divider content-position="left">内容审核</el-divider>

        <el-form-item label="自动审核">
          <el-switch v-model="settings.autoAudit" />
          <span style="margin-left: 12px; color: #999">开启后，内容将自动通过审核</span>
        </el-form-item>

        <el-form-item label="敏感词过滤">
          <el-switch v-model="settings.sensitiveFilter" />
        </el-form-item>

        <el-divider content-position="left">用户设置</el-divider>

        <el-form-item label="新用户注册">
          <el-switch v-model="settings.allowRegister" />
        </el-form-item>

        <el-form-item label="默认字体大小">
          <el-select v-model="settings.defaultFontScale" style="width: 120px">
            <el-option label="标准" :value="1" />
            <el-option label="中等" :value="1.2" />
            <el-option label="大号" :value="1.4" />
          </el-select>
        </el-form-item>

        <el-divider />

        <el-form-item>
          <el-button type="primary" @click="handleSave">保存设置</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card style="margin-top: 20px">
      <template #header>
        <span>系统信息</span>
      </template>

      <el-descriptions :column="2" border>
        <el-descriptions-item label="系统版本">1.0.0</el-descriptions-item>
        <el-descriptions-item label="后端版本">NestJS 10.x</el-descriptions-item>
        <el-descriptions-item label="数据库">MySQL 8.0</el-descriptions-item>
        <el-descriptions-item label="缓存">Redis 7.x</el-descriptions-item>
        <el-descriptions-item label="运行环境">Node.js 18+</el-descriptions-item>
        <el-descriptions-item label="服务器时间">{{ serverTime }}</el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';

const settings = reactive({
  siteName: '银龄健康社区',
  siteDesc: '为老年人打造的健康知识分享平台',
  autoAudit: false,
  sensitiveFilter: true,
  allowRegister: true,
  defaultFontScale: 1,
});

const serverTime = ref(new Date().toLocaleString('zh-CN'));

const handleSave = () => {
  ElMessage.success('设置已保存');
};

const handleReset = () => {
  settings.siteName = '银龄健康社区';
  settings.siteDesc = '为老年人打造的健康知识分享平台';
  settings.autoAudit = false;
  settings.sensitiveFilter = true;
  settings.allowRegister = true;
  settings.defaultFontScale = 1;
  ElMessage.info('已重置为默认设置');
};

onMounted(() => {
  setInterval(() => {
    serverTime.value = new Date().toLocaleString('zh-CN');
  }, 1000);
});
</script>

<style lang="scss" scoped>
.settings-container {
  max-width: 800px;
}
</style>
