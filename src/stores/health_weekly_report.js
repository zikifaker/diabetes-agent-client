import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'

export const useHealthWeeklyReportStore = defineStore('healthWeeklyReport', () => {
  const reports = ref([])
  const loading = ref(false)

  async function fetchReports() {
    loading.value = true
    try {
      const response = await api.get('/health-weekly-reports')
      const reportsData = response.data.data || []
      reports.value = reportsData.map(report => ({
        startAt: report.start_at,
        endAt: report.end_at,
        fileName: report.file_name
      }))
    } catch (err) {
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    reports,
    loading,
    fetchReports
  }
})