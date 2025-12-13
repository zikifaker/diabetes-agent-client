<template>
  <div class="knowledge-base-container">
    <div class="header">
      <h4 class="page-title">我的知识库</h4>
      <div class="header-actions">
        <button class="action-btn search-btn" @click="showSearchModal = true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          搜索文件
        </button>
        <button class="action-btn upload-btn" @click="triggerFileUpload" :disabled="uploading"
          title="支持单次上传不超过10个文件，每个文件不超过100MB">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          {{ uploading ? '上传中...' : '上传文件' }}
        </button>
        <input ref="fileInput" type="file" @change="handleFileUpload" accept=".pdf,.md,.txt" style="display: none"
          multiple />
      </div>
    </div>

    <div class="content">
      <div v-if="loading && knowledgeFiles.length === 0" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>

      <div v-else-if="knowledgeFiles.length === 0" class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"
          opacity="0.3">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="12" y1="18" x2="12" y2="12"></line>
          <line x1="9" y1="15" x2="15" y2="15"></line>
        </svg>
        <p>暂无文件，请上传文件开始使用</p>
      </div>

      <div v-else class="files-grid">
        <div v-for="file in knowledgeFiles" :key="file.fileName" class="file-card">
          <div class="card-actions">
            <button @click.stop="handleDeleteClick(file.fileName)" class="delete-button">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2m-6 5v6m4-6v6"
                  stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>
          <div>
            <div v-if="file.fileType === 'pdf'" class="file-thumbnail pdf-thumbnail">
              <span class="file-extension">PDF</span>
            </div>
            <div v-else-if="file.fileType === 'md'" class="file-thumbnail md-thumbnail">
              <span class="file-extension">MD</span>
            </div>
            <div v-else class="file-thumbnail default-thumbnail">
              <span class="file-extension">{{ getFileExtension(file.fileName) }}</span>
            </div>
          </div>
          <div class="file-info">
            <div class="file-name">{{ file.fileName }}</div>
            <div class="file-meta">{{ formatFileSize(file.fileSize) }}</div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showSearchModal" class="modal-overlay" @click="showSearchModal = false">
      <!-- TODO: 文件搜索 -->
    </div>

    <Teleport to="body">
      <div v-if="showDeleteModal" class="modal-overlay" @click.self="cancelDelete">
        <div class="modal-content">
          <div class="modal-header">
            <h3>确认删除文件吗？</h3>
            <button @click="cancelDelete" class="close-button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                  stroke-linejoin="round" />
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <p>删除后文件将无法恢复，请谨慎操作</p>
          </div>
          <div class="modal-footer">
            <button @click="cancelDelete" class="btn btn-cancel">取消</button>
            <button @click="confirmDelete" class="btn btn-delete-confirm">删除</button>
          </div>
        </div>
      </div>
    </Teleport>

    <div v-if="toast.show" class="toast"
      :class="{ 'toast-success': toast.type === 'success', 'toast-error': toast.type === 'error' }">
      {{ toast.message }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useKnowledgeBaseStore } from '@/stores/knowledge_base'
import { storeToRefs } from 'pinia'

const knowledgeBaseStore = useKnowledgeBaseStore()
const { knowledgeFiles, loading, uploading } = storeToRefs(knowledgeBaseStore)

const fileInput = ref(null)
const showDeleteModal = ref(false)
const fileToDelete = ref(null)
const showSearchModal = ref(false)
const toast = ref({
  show: false,
  message: '',
  type: 'success'
})

function showToast(message, type = 'success') {
  toast.value = {
    show: true,
    message,
    type
  }
  setTimeout(() => {
    toast.value.show = false
  }, 1000)
}

onMounted(async () => {
  try {
    await knowledgeBaseStore.fetchFiles()
  } catch (error) {
    console.error('Failed to fetch knowledge metadata:', error)
  }
})

function triggerFileUpload() {
  fileInput.value?.click()
}

async function handleFileUpload(event) {
  const files = Array.from(event.target.files)
  if (files.length === 0) return

  if (files.length > 10) {
    showToast('单次至多上传10个文件', 'error')
    event.target.value = ''
    return
  }

  // 上传的单个文件大小上限为 100 MB
  const maxSize = 100 * 1024 * 1024
  const oversizedFiles = files.filter(file => file.size > maxSize)
  if (oversizedFiles.length > 0) {
    showToast(`单个文件不能超过100MB`, 'error')
    event.target.value = ''
    return
  }

  const uploadPromises = files.map(async (file) => {
    if (!knowledgeBaseStore.validateFileType(file)) {
      showToast(`文件 ${file.name} 格式不支持，仅支持上传.pdf/.md/.txt格式的文件`, 'error')
      return { success: false }
    }

    try {
      return await knowledgeBaseStore.uploadFile(file)
    } catch (error) {
      console.error(`Failed to upload file ${file.name}:`, error)
      return { success: false, message: `文件 ${file.name} 上传失败` }
    }
  })

  try {
    const results = await Promise.all(uploadPromises)
    const successCount = results.filter(r => r?.success).length

    if (successCount > 0) {
      showToast(`成功上传 ${successCount} 个文件`, 'success')
    }

    results.forEach((result) => {
      if (!result?.success && result?.message) {
        showToast(result.message, 'error')
      }
    })
  } catch (error) {
    console.error('Error uploading multiple files:', error)
  } finally {
    event.target.value = ''
  }
}

function getFileExtension(filename) {
  return filename.split('.').pop().toUpperCase();
}

function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function handleDeleteClick(fileName) {
  fileToDelete.value = fileName
  showDeleteModal.value = true
}

async function confirmDelete() {
  if (fileToDelete.value) {
    try {
      await knowledgeBaseStore.deleteFile(fileToDelete.value)
      showToast('文件删除成功', 'success')
    } catch (error) {
      console.error('Failed to delete file:', error)
      showToast('删除文件失败', 'error')
    }
    showDeleteModal.value = false
    fileToDelete.value = null
  }
}

function cancelDelete() {
  showDeleteModal.value = false
  fileToDelete.value = null
}
</script>

<style scoped>
.knowledge-base-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--white);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  border-bottom: 1px solid var(--border-color);
}

.page-title {
  font-size: 24px;
  font-weight: 400;
  color: var(--text-primary);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  background: var(--white);
  color: var(--text-primary);
  font-size: 14px;
  transition: var(--transition);
  cursor: pointer;
}

.action-btn:hover:not(:disabled) {
  background: var(--hover-bg);
  border-color: var(--primary-color);
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.upload-btn:hover:not(:disabled) {
  background: var(--primary-color);
  color: var(--white);
  border-color: var(--primary-color);
}

.content {
  flex: 1;
  padding: 32px;
  overflow-y: auto;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: var(--text-secondary);
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border-color);
  border-top: 3px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.empty-state h3 {
  margin: 16px 0 8px 0;
  font-size: 18px;
  font-weight: 400;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}

.files-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
  padding: 12px;
}

.file-card {
  position: relative;
  width: 140px;
  display: flex;
  flex-direction: column;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
  background: white;
  cursor: pointer;
}

.card-actions {
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: 10;
  opacity: 0;
}

.file-card:hover .card-actions {
  opacity: 1;
}

.delete-button {
  background: none;
  border: none;
  color: #000000;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.file-thumbnail {
  position: relative;
  width: 100%;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 14px;
}

.file-extension {
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 8px;
  border-radius: 4px;
  backdrop-filter: blur(4px);
}

.pdf-thumbnail {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.md-thumbnail {
  background: linear-gradient(135deg, #10b981, #059669);
}

.default-thumbnail {
  background: linear-gradient(135deg, #9ca3af, #6b7280);
}

.file-info {
  padding: 8px;
  border-top: 1px solid #f3f4f6;
}

.file-name {
  font-weight: 500;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #111827;
  margin-bottom: 4px;
}

.file-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: #6b7280;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #ffffff;
  border-radius: 8px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--text-primary);
}

.close-button {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-button:hover {
  color: var(--text-primary);
  background-color: var(--bg-hover);
}

.modal-body {
  padding: 20px;
  color: var(--text-secondary);
  font-size: 0.95rem;
  line-height: 1.5;
}

.modal-footer {
  padding: 12px 20px;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.btn-cancel {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  border-color: var(--border-color);
}

.btn-cancel:hover {
  background-color: var(--bg-hover);
}

.btn-delete-confirm {
  background-color: #ef4444;
  color: white;
}

.btn-delete-confirm:hover {
  background-color: #dc2626;
}

.search-btn:hover:not(:disabled) {
  background: var(--primary-color);
  color: var(--white);
  border-color: var(--primary-color);
}

.toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 12px 20px;
  border-radius: 6px;
  color: white;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  animation: slideIn 0.3s ease-out;
  transition: all 0.3s ease;
}

.toast-success {
  background-color: #10b981;
}

.toast-error {
  background-color: #ef4444;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }

  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>