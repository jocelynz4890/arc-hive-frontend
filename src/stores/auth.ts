import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiService } from '../services/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<any>(null)
  const token = ref(localStorage.getItem('token'))

  const isAuthenticated = computed(() => !!user.value && !!token.value)

  // Ensure a friend code exists server-side and return it. This calls the backend to create/persist the code.
  const ensureFriendCodeOnServer = async (u: any) => {
    try {
      const resp = await apiService.post('/Friending/generateFriendCode', { user: u })
      return resp.data?.friendCode ?? resp.data?.friendcode ?? null
    } catch (e) {
      console.debug('Could not generate friend code on server:', e)
      return null
    }
  }

  const login = async (username: string, password: string) => {
    try {
      const response = await apiService.post('/Authentication/authenticate', {
        username,
        password
      })
      // Accept either { user: {...} } or the whole response body as the user
      console.debug('Login response data:', response.data)
      if (response.data && (response.data as any).error) {
        // Backend returned an error payload with a 200 status — treat as failure
        return { success: false, error: String((response.data as any).error) }
      }
      // Normalize user value: backend sometimes returns just an id string
      const respData = response.data
      if (respData && typeof (respData as any).user === 'string') {
        user.value = { id: (respData as any).user, username }
      } else {
        user.value = respData.user ?? respData
      }
      // Ensure friendCode exists on the server; prefer backend-generated code
      if (user.value && !(user.value as any).friendCode) {
        const fc = await ensureFriendCodeOnServer(user.value)
        if (fc) {
          ;(user.value as any).friendCode = fc
        }
      }
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
      const response = await apiService.post('/Authentication/register', {
        username,
        password
      })
      // Backend might return different shapes (user object, or success payload).
      console.debug('Register response data:', response.data)
      if (response.data && (response.data as any).error) {
        // Backend returned an error payload (for example: username exists)
        return { success: false, error: String((response.data as any).error) }
      }
      // Normalize user value: backend sometimes returns just an id string
      const regData = response.data
      if (regData && typeof (regData as any).user === 'string') {
        user.value = { id: (regData as any).user, username }
      } else {
        user.value = regData.user ?? regData
      }
      
      // Automatically initialize friend code, stats, and rewards for new user
      const userId = user.value?.id || user.value?.username || String(user.value)
      
      // Generate friend code
      try {
        const fc = await ensureFriendCodeOnServer(userId)
        if (fc) {
          ;(user.value as any).friendCode = fc
        }
      } catch (e) {
        console.error('Could not generate friend code:', e)
      }
      
      // Initialize stats
      try {
        await apiService.post('/StatTracking/initializeStats', { user: userId })
      } catch (e) {
        console.error('Could not initialize stats:', e)
      }
      
      // Initialize rewards
      try {
        await apiService.post('/Rewarding/initializeRewards', { user: userId })
      } catch (e) {
        console.error('Could not initialize rewards:', e)
      }
      
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
        const parsed = JSON.parse(storedUser)
        // If stored user is a plain id string (old behavior), normalize to an object
        if (typeof parsed === 'string') {
          user.value = { id: parsed, username: '' }
        } else {
          user.value = parsed
        }
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
