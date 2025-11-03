import axios from 'axios'

// Use a relative base URL in development so Vite's dev-server proxy can forward requests
// to the actual backend. This avoids CORS issues in the browser during local development.
export const apiService = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

const API_BASE = import.meta.env.VITE_API_BASE || '/api'

// Add request interceptor to include auth token and sessionToken in requests
apiService.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
    // Also add sessionToken to request body for authenticated requests
    // Skip this for authentication and session routes to avoid circular dependency
    const skipRoutes = ['/Authentication/authenticate', '/Authentication/createSession', '/Authentication/register']
    const isAuthRoute = skipRoutes.some(route => config.url?.includes(route))
    if (!isAuthRoute && config.data && typeof config.data === 'object') {
      config.data.sessionToken = token
    }
  }
  return config
})

// Add response interceptor for error handling
apiService.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
