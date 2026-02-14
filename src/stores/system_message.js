import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'

export const useSystemMessageStore = defineStore('systemMessage', () => {
  const messages = ref([])
  const unreadCount = ref(0)
  const totalMessages = ref(0)
  const pageSize = 10

  const totalPages = computed(() => Math.ceil(totalMessages.value / pageSize))

  async function fetchMessages(page = 1) {
    try {
      const response = await api.get('/system-messages', {
        params: { page }
      })
      const responseData = response.data.data
      messages.value = responseData.messages.map(message => ({
        id: message.id,
        createdAt: message.created_at,
        title: message.title,
        content: message.content,
        isRead: message.is_read,
      }))
      totalMessages.value = responseData.total
    } catch (error) {
      throw error
    }
  }

  async function markAsRead(id) {
    try {
      await api.put(`/system-message/${id}/read`)
      const message = messages.value.find(m => m.id === id)
      if (message && !message.isRead) {
        message.isRead = true
        unreadCount.value = Math.max(0, unreadCount.value - 1)
      }
    } catch (error) {
      throw error
    }
  }

  async function deleteMessage(id) {
    try {
      await api.delete(`/system-message/${id}`)
      const index = messages.value.findIndex(m => m.id === id)
      if (index !== -1) {
        const message = messages.value[index]
        if (!message.isRead) {
          unreadCount.value = Math.max(0, unreadCount.value - 1)
        }
        messages.value.splice(index, 1)
        totalMessages.value--
      }
    } catch (error) {
      throw error
    }
  }

  async function fetchUnreadCount() {
    try {
      const response = await api.get('/system-messages/unread/count')
      unreadCount.value = response.data.data.count
    } catch (error) {
      throw error
    }
  }

  return {
    messages,
    unreadCount,
    totalMessages,
    pageSize,
    totalPages,
    fetchMessages,
    markAsRead,
    deleteMessage,
    fetchUnreadCount
  }
})