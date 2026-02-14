<template>
  <div class="system-message-container">
    <div class="header">
      <h4 class="page-title">消息中心</h4>
    </div>

    <div class="main-layout">
      <aside class="side-nav">
        <div class="nav-item" :class="{ active: currentTab === 'all' }">
          全部消息
        </div>
      </aside>

      <div class="content">
        <div v-if="messages.length === 0" class="empty-state">
          <p class="empty-state-text">暂无消息通知</p>
        </div>

        <div v-else class="message-list-wrapper">
          <div class="message-list">
            <div v-for="msg in messages" :key="msg.id" class="message-item" @click="handleMessageClick(msg)">

              <div class="dot-wrapper">
                <div class="message-dot" v-if="!msg.isRead"></div>
              </div>

              <div class="message-content-wrapper">
                <div class="message-header">
                  <span class="message-title">{{ msg.title }}</span>
                  <span class="message-time">{{ formatTime(msg.createdAt) }}</span>
                </div>
                <div class="message-body">{{ msg.content }}</div>
              </div>

              <button class="delete-btn" @click="handleDeleteMessage(msg.id)">
                <TrashIcon />
              </button>
            </div>
          </div>

          <div class="pagination">
            <button class="page-btn" :disabled="currentPage === 1" @click="changePage(currentPage - 1)">
              &lt;
            </button>
            <div class="page-numbers">
              <span v-for="p in totalPages" :key="p" class="page-num" :class="{ active: currentPage === p }"
                @click="changePage(p)">
                {{ p }}
              </span>
            </div>
            <button class="page-btn" :disabled="currentPage === totalPages" @click="changePage(currentPage + 1)">
              &gt;
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="toast.show" class="toast" :class="`toast-${toast.type}`">
      {{ toast.message }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useSystemMessageStore } from '@/stores/system_message'
import { storeToRefs } from 'pinia'
import { TrashIcon } from '@/assets/icons/common'
import dayjs from 'dayjs'

const messageStore = useSystemMessageStore()
const { messages, totalPages } = storeToRefs(messageStore)

const currentPage = ref(1)
const currentTab = ref('all')

const toast = ref({
  show: false,
  message: '',
  type: 'success'
})

async function fetchMessages(page = 1) {
  try {
    await messageStore.fetchMessages(page)
    currentPage.value = page
  } catch (error) {
    console.error("Failed to fetch system messages:", error)
  }
}

async function handleMessageClick(msg) {
  if (!msg.isRead) {
    try {
      await messageStore.markAsRead(msg.id)
    } catch (error) {
      console.error("Failed to mark message as read:", error)
    }
  }
}

function formatTime(time) {
  return dayjs(time).format('MM-DD HH:mm')
}

async function handleDeleteMessage(id) {
  try {
    await messageStore.deleteMessage(id)
    showToast('消息删除成功')
    if (messages.value.length === 0 && currentPage.value > 1) {
      fetchMessages(currentPage.value - 1)
    }
  } catch (error) {
    showToast('消息删除失败', 'error')
  }
}

function showToast(message, type = 'success') {
  toast.value = {
    show: true,
    message,
    type
  }
  setTimeout(() => { toast.value.show = false }, 2000)
}

function changePage(page) {
  if (page < 1 || page > totalPages.value || page === currentPage.value) return
  fetchMessages(page)
}

onMounted(() => {
  fetchMessages(1)
})
</script>

<style scoped>
.system-message-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
}

.header {
  padding: 16px 32px;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.main-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.side-nav {
  width: 200px;
  background: #fff;
  border-right: 1px solid #e2e8f0;
}

.nav-item {
  padding: 12px 24px;
  cursor: pointer;
  color: #64748b;
  font-size: 14px;
  transition: all 0.2s;
}

.nav-item:hover {
  background: #f1f5f9;
}

.nav-item.active {
  color: var(--primary-color);
  background: #eff6ff;
  border-right: 3px solid var(--primary-color);
  font-weight: 600;
}

.content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.empty-state {
  position: relative;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 2rem;
  text-align: center;
}

.empty-state-text {
  font-size: 1rem;
  color: #6B7280;
  margin-bottom: 1.5rem;
}

.message-list-wrapper {
  max-width: 900px;
  margin: 0 auto;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.message-item {
  position: relative;
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.message-item:hover {
  border-color: #cbd5e1;
  transform: translateY(-1px);
}

.dot-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  margin-right: 8px;
  flex-shrink: 0;
}

.message-dot {
  width: 8px;
  height: 8px;
  background: #ff4d4f;
  border-radius: 50%;
  box-shadow: 0 0 0 2px #fff, 0 0 4px rgba(255, 77, 79, 0.4);
  position: relative;
}

.message-dot::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: inherit;
  animation: pulse 2s infinite;
  opacity: 0.4;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 0.4;
  }

  70% {
    transform: scale(2.5);
    opacity: 0;
  }

  100% {
    transform: scale(1);
    opacity: 0;
  }
}

.message-content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.message-title {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.message-time {
  font-size: 12px;
  color: #94a3b8;
}

.message-body {
  font-size: 13px;
  color: #64748b;
  overflow: auto;
}

.delete-btn {
  margin-left: 12px;
  opacity: 0;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
}

.delete-btn:hover {
  color: #ef4444;
}

.message-item:hover .delete-btn {
  opacity: 1;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 24px;
}

.page-numbers {
  display: flex;
  gap: 4px;
}

.page-num {
  padding: 4px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.page-num.active {
  background: var(--primary-color);
  color: #fff;
}

.page-btn {
  border: 1px solid #e2e8f0;
  background: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
}

.page-btn:disabled {
  color: #cbd5e1;
  cursor: not-allowed;
}

.toast {
  position: fixed;
  bottom: 30px;
  right: 30px;
  padding: 10px 18px;
  border-radius: 10px;
  backdrop-filter: blur(8px);
  z-index: 1000;
  animation: slideIn 0.3s ease-out;
}

.toast-success {
  background: rgba(236, 253, 245, 0.9);
  border: 1px solid #10b981;
  color: #065f46;
}

.toast-error {
  background: rgba(254, 242, 242, 0.9);
  border: 1px solid #ef4444;
  color: #991b1b;
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
