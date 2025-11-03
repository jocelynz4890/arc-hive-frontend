import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiService } from '../services/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<any>(null)
  const token = ref(localStorage.getItem('token'))

  const isAuthenticated = computed(() => !!user.value && !!token.value)

  // Get the friend code for a user from the backend
  const getFriendCodeFromServer = async (u: any) => {
    try {
      // Extract username string for backend - Friending expects username string, not object
      const username = typeof u === 'string' 
        ? u
        : (u?.username || u?.id || String(u))
      const resp = await apiService.post('/Friending/getFriendCodeByUsername', { username })
      return resp.data?.friendCode ?? resp.data?.friendcode ?? null
    } catch (e) {
      console.debug('Could not get friend code from server:', e)
      return null
    }
  }

  const login = async (username: string, password: string) => {
    try {
      // 1. Authenticate user
      const response = await apiService.post('/Authentication/authenticate', {
        username,
        password
      })
      console.debug('Login response data:', response.data)
      if (response.data && (response.data as any).error) {
        return { success: false, error: String((response.data as any).error) }
      }
      
      // 2. Normalize user value
      const respData = response.data
      let userId: string
      if (respData && typeof (respData as any).user === 'string') {
        userId = (respData as any).user
        user.value = { id: userId, username }
      } else {
        userId = respData.user
        user.value = respData.user ?? respData
      }
      
      // 3. Create session for authenticated user
      const sessionResponse = await apiService.post('/Authentication/createSession', {
        user: userId
      })
      if (sessionResponse.data && (sessionResponse.data as any).error) {
        return { success: false, error: String((sessionResponse.data as any).error) }
      }
      const sessionToken = sessionResponse.data?.token
      if (!sessionToken) {
        return { success: false, error: 'Failed to create session' }
      }
      
      // 4. Store session token and user FIRST so subsequent API calls can use it
      token.value = sessionToken
      localStorage.setItem('token', sessionToken)
      localStorage.setItem('user', JSON.stringify(user.value))
      
      // 5. Get friend code from the server if not already present
      if (user.value && !(user.value as any).friendCode) {
        const fc = await getFriendCodeFromServer(user.value)
        if (fc) {
          ;(user.value as any).friendCode = fc
          localStorage.setItem('user', JSON.stringify(user.value))
        }
      }
      
      return { success: true }
    } catch (error: any) {
      console.error('Login error:', error)
      const errMsg = error.response?.data?.error || error.response?.data || error.message || 'Login failed'
      return { success: false, error: String(errMsg) }
    }
  }

  const register = async (username: string, password: string) => {
    try {
      // 1. Register user
      const response = await apiService.post('/Authentication/register', {
        username,
        password
      })
      console.debug('Register response data:', response.data)
      if (response.data && (response.data as any).error) {
        return { success: false, error: String((response.data as any).error) }
      }
      
      // 2. Normalize user value
      const regData = response.data
      let userId: string
      if (regData && typeof (regData as any).user === 'string') {
        userId = (regData as any).user
        user.value = { id: userId, username }
      } else {
        userId = regData.user
        user.value = regData.user ?? regData
      }
      
      // 3. Create session for registered user
      const sessionResponse = await apiService.post('/Authentication/createSession', {
        user: userId
      })
      if (sessionResponse.data && (sessionResponse.data as any).error) {
        return { success: false, error: String((sessionResponse.data as any).error) }
      }
      const sessionToken = sessionResponse.data?.token
      if (!sessionToken) {
        return { success: false, error: 'Failed to create session' }
      }
      
      // 4. Store session token and user FIRST so subsequent API calls can use it
      token.value = sessionToken
      localStorage.setItem('token', sessionToken)
      localStorage.setItem('user', JSON.stringify(user.value))
      
      // 5. Backend sync automatically initializes friend code, stats, and rewards
      // Wait a bit for sync to complete, then fetch friend code if needed
      setTimeout(async () => {
        if (user.value && !(user.value as any).friendCode) {
          try {
            const fc = await getFriendCodeFromServer(username)
            if (fc) {
              ;(user.value as any).friendCode = fc
              localStorage.setItem('user', JSON.stringify(user.value))
            }
          } catch (e) {
            console.debug('Could not get friend code:', e)
          }
        }
      }, 500)
      
      return { success: true }
    } catch (error: any) {
      console.error('Registration error:', error)
      const errMsg = error.response?.data?.error || error.response?.data || error.message || 'Registration failed'
      return { success: false, error: String(errMsg) }
    }
  }

  const logout = async () => {
    // Invalidate session on backend if we have a token
    if (token.value) {
      try {
        await apiService.post('/Authentication/invalidateSession', {
          token: token.value
        })
      } catch (error) {
        console.error('Error invalidating session:', error)
        // Continue with logout even if invalidation fails
      }
    }
    
    // Clear local state
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
