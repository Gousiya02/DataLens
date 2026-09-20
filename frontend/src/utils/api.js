import axios from 'axios'
import { getAuthToken } from './auth'

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || '/api' })

api.interceptors.request.use((config) => {
  const token = getAuthToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, (error) => {
  return Promise.reject(error)
})

export const loginUser = (email, password) => api.post('/auth/login', { email, password })
export const registerUser = (name, email, password) => api.post('/auth/register', { name, email, password })
export const getMe = () => api.get('/auth/me')

export const getProjects = () => api.get('/projects')
export const getProject = (id) => api.get(`/projects/${id}`)
export const deleteProject = (id) => api.delete(`/projects/${id}`)

export const uploadFile = (file, projectName = '') => {
  const form = new FormData()
  form.append('file', file)
  if (projectName) {
    form.append('project_name', projectName)
  }
  return api.post('/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })
}

export const getCharts = () => api.get('/charts')
export const getAnomalies = () => api.get('/anomalies')
export const getSummary = () => api.get('/summary')
export const queryData = (question) => api.post('/query', { question })
export const downloadDataset = () => api.get('/download', { responseType: 'blob' })
export const downloadProjectDataset = (id) => api.get(`/projects/${id}/download`, { responseType: 'blob' })
export const syncCharts = (charts) => api.post('/charts/sync', { charts })

export default api
