import api from '@/services/api'

export const NAMESPACE = {
  // 知识库文件前缀
  KNOWLEDGE_BASE: 'knowledge-base',

  // 聊天文件前缀
  UPLOAD: 'upload',

  // 健康周报文件前缀
  HEALTH_WEEKLY_REPORT: 'health-weekly-report'
}

// 获取文件上传凭证
export async function getUploadPolicyToken(fileName, namespace, sessionId = null) {
  const response = await api.get('/oss/policy-token', {
    params: {
      'file-name': fileName,
      namespace,
      'session-id': sessionId
    }
  })
  return response.data.data
}

// 上传文件到 OSS
export async function uploadToOSS(file, policyToken) {
  const formData = new FormData()
  formData.append('success_action_status', '200')
  formData.append('policy', policyToken.policy)
  formData.append('x-oss-signature', policyToken.signature)
  formData.append('x-oss-signature-version', 'OSS4-HMAC-SHA256')
  formData.append('x-oss-credential', policyToken.x_oss_credential)
  formData.append('x-oss-date', policyToken.x_oss_date)
  formData.append('key', policyToken.key)
  formData.append('x-oss-security-token', policyToken.security_token)
  formData.append('file', file)

  return fetch(policyToken.host, {
    method: 'POST',
    body: formData
  })
}

// 获取文件的预签名 URL
export async function getPresignedURL(fileName, namespace, options = {}) {
  const {
    sessionId = null,
    useCustomDomain = false
  } = options

  const params = {
    'file-name': fileName,
    namespace,
    'session-id': sessionId,
    'use-custom-domain': useCustomDomain
  }

  Object.keys(params).forEach(key => {
    if (params[key] == null) {
      delete params[key]
    }
  })

  const response = await api.get('/oss/presigned-url', { params })
  return response.data.data.url
}