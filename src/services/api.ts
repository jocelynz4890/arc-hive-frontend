import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || '/api'

// Create axios with a base URL that respects deployment configuration.
// In development, Vite proxy can map '/api' → backend; in production on Render,
// set VITE_API_BASE to 'https://<backend>.onrender.com' so requests hit the backend origin.
export const apiService = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
})

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

// --- SSE client for server-sent events ---
export function subscribeToEvents(onMessage: (event: MessageEvent<any>) => void): () => void {
  // API_BASE is either '/api' or 'https://arc-hive-backend.onrender.com'
  // We need '/api/events' in both cases
  const url = API_BASE === '/api' ? '/api/events' : `${API_BASE}/api/events`
  console.log('[SSE] Connecting to:', url)
  const es = new EventSource(url)
  const handler = (e: MessageEvent) => {
    console.log('[SSE] Received event:', e.type, e.data)
    onMessage(e)
  }
  es.addEventListener('daily-refresh-complete', handler as EventListener)
  // generic messages (optional)
  es.onmessage = handler
  es.onerror = (e) => {
    // Let browser auto-reconnect based on retry sent by server.
    console.warn('[SSE] Connection error:', e)
  }
  es.onopen = () => {
    console.log('[SSE] Connection opened')
  }
  return () => {
    console.log('[SSE] Closing connection')
    try { es.close() } catch {}
  }
}
