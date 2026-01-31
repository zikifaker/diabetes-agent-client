import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'

export const useBloodGlucoseStore = defineStore('bloodGlucose', () => {
  const records = ref([])

  async function fetchRecords(start, end) {
    const response = await api.get('/blood-glucose/records', {
      params: { start, end }
    })
    const bloodGlucoseRecords = response.data.data || []
    records.value = bloodGlucoseRecords.map(record => ({
      value: record.value,
      measuredAt: record.measured_at,
      diningStatus: record.dining_status
    }))
  }

  async function addRecord(record) {
    await api.post('/blood-glucose/record', {
      value: record.value,
      measured_at: record.measuredAt,
      dining_status: record.diningStatus
    })
  }

  return {
    records,
    fetchRecords,
    addRecord
  }
})
