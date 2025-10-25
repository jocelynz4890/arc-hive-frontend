import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiService } from '../services/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token'))

  const isAuthenticated = computed(() => !!user.value && !!token.value)

  const login = async (username: string, password: string) => {
    try {
      const response = await apiService.post('/api/Authentication/authenticate', {
        username,
        password
      })
      // Accept either { user: {...} } or the whole response body as the user
      console.debug('Login response data:', response.data)
      if (response.data && (response.data as any).error) {
        // Backend returned an error payload with a 200 status — treat as failure
        return { success: false, error: String((response.data as any).error) }
      }
      user.value = response.data.user ?? response.data
      token.value = 'authenticated' // Simple token for demo
      localStorage.setItem('token', token.value)
      localStorage.setItem('user', JSON.stringify(user.value))
      
      return { success: true }
    } catch (error: any) {
      console.error('Login error:', error)
      const errMsg = error.response?.data?.error || error.response?.data || error.message || 'Login failed'
      return { success: false, error: String(errMsg) }
    }
  }

  const register = async (username: string, password: string) => {
    try {
      const response = await apiService.post('/api/Authentication/register', {
        username,
        password
      })
      // Backend might return different shapes (user object, or success payload).
      console.debug('Register response data:', response.data)
      if (response.data && (response.data as any).error) {
        // Backend returned an error payload (for example: username exists)
        return { success: false, error: String((response.data as any).error) }
      }
      user.value = response.data.user ?? response.data
      token.value = 'authenticated'
      localStorage.setItem('token', token.value)
      localStorage.setItem('user', JSON.stringify(user.value))
      
      return { success: true }
    } catch (error: any) {
      console.error('Registration error:', error)
      const errMsg = error.response?.data?.error || error.response?.data || error.message || 'Registration failed'
      return { success: false, error: String(errMsg) }
    }
  }

  const logout = () => {
    user.value = null
    token.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const initializeAuth = () => {
    const storedUser = localStorage.getItem('user')
    const storedToken = localStorage.getItem('token')
    
    if (storedUser && storedToken) {
      try {
        user.value = JSON.parse(storedUser)
        token.value = storedToken
      } catch (error) {
        console.error('Error parsing stored user:', error)
        // Clear invalid data
        localStorage.removeItem('user')
        localStorage.removeItem('token')
        user.value = null
        token.value = null
      }
    } else {
      // Clear any partial data
      user.value = null
      token.value = null
    }
  }

  return {
    user,
    token,
    isAuthenticated,
    login,
    register,
    logout,
    initializeAuth
  }
})
