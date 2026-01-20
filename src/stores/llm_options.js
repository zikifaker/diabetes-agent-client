import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useLLMOptionsStore = defineStore('llmOptions', () => {
  const llmOptions = ref([
    {
      id: 'qwen3-max',
      name: 'Qwen3 Max',
      description: '千问系列最强大模型'
    },
    {
      id: 'glm-4.7',
      name: 'GLM-4.7',
      description: '智谱 AI 最新旗舰模型'
    }
  ])

  const selectedLLM = ref(llmOptions.value[0])

  return {
    llmOptions,
    selectedLLM
  }
})