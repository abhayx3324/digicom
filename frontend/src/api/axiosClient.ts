import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

const axiosClient = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
})

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
    }
    return Promise.reject(error)
  },
)

export default axiosClient
