<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1 class="app-title">ArcHive</h1>
        <p class="subtitle">Level up your life, one arc at a time</p>
      </div>
      
      <div class="auth-tabs">
        <button 
          @click="activeTab = 'login'" 
          :class="{ active: activeTab === 'login' }"
          class="tab-button"
        >
          Login
        </button>
        <button 
          @click="activeTab = 'register'" 
          :class="{ active: activeTab === 'register' }"
          class="tab-button"
        >
          Sign Up
        </button>
      </div>
      
      <form @submit.prevent="handleSubmit" class="auth-form">
        <div class="form-group">
          <label for="username">Username</label>
          <input
            id="username"
            v-model="form.username"
            type="text"
            required
            placeholder="Enter your username"
            class="form-input"
          />
        </div>
        
        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            required
            placeholder="Enter your password"
            class="form-input"
          />
        </div>
        
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
        
        <button 
          type="submit" 
          :disabled="loading"
          class="submit-button"
        >
          {{ loading ? 'Loading...' : (activeTab === 'login' ? 'Login' : 'Sign Up') }}
        </button>
      </form>
      
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const activeTab = ref<'login' | 'register'>('login')
const loading = ref(false)
const error = ref('')

const form = reactive({
  username: '',
  password: ''
})

const handleSubmit = async () => {
  loading.value = true
  error.value = ''
  
  try {
    // Trim inputs to avoid accidental leading/trailing spaces
    const username = form.username.trim()
    const password = form.password.trim()

    // If registering, disallow any whitespace inside username or password
    if (activeTab.value === 'register') {
      const hasSpace = /\s/.test(username) || /\s/.test(password)
      if (hasSpace) {
        error.value = 'Username and password cannot contain spaces.'
        loading.value = false
        return
      }
    }

    let result
    if (activeTab.value === 'login') {
      result = await authStore.login(username, password)
    } else {
      result = await authStore.register(username, password)
    }
    
    if (result.success) {
      router.push('/')
    } else {
      error.value = result.error ?? 'An error occurred'
    }
  } catch (err) {
    error.value = 'An unexpected error occurred'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.validation-hint {
  font-size: 0.9rem;
  color: #555;
  margin-top: -0.5rem;
  margin-bottom: 0.5rem;
}
</style>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.login-card {
  background: #ffffff;
  border: 4px solid;
  border-color: #e0e0e0 #a0a0a0 #a0a0a0 #e0e0e0;
  border-radius: 0;
  padding: 3rem;
  box-shadow: 6px 6px 0 rgba(0, 0, 0, 0.2);
  width: 100%;
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.app-title {
  font-size: 2.5rem;
  font-weight: bold;
  font-family: 'Silkscreen', monospace !important;
  color: #333;
  text-shadow: 2px 2px 0 #ffc8dd;
  margin: 0 0 0.5rem 0;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
  letter-spacing: 0.05em;
  transform: scale(0.98);
  transform-origin: center;
}

.subtitle {
  color: #666;
  margin: 0;
  font-size: 1rem;
}

.auth-tabs {
  display: flex;
  margin-bottom: 2rem;
  background: #f5f5f5;
  border-radius: 0;
  padding: 6px;
  border: 3px solid;
  border-color: #e0e0e0 #a0a0a0 #a0a0a0 #e0e0e0;
  box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.15);
}

.tab-button {
  flex: 1;
  background: transparent;
  border: none;
  padding: 1rem;
  border-radius: 0;
  cursor: pointer;
  transition: all 0.1s ease;
  font-weight: 700;
  font-size: 1rem;
  color: #555;
  position: relative;
}

.tab-button:hover {
  background: #e0e0e0;
  color: #333;
}

.tab-button.active {
  background: #ffc8dd;
  color: #333;
  border: 2px solid;
  border-color: #ffafcc #cdb4db #cdb4db #ffafcc;
  box-shadow: inset -1px -1px 0 rgba(0, 0, 0, 0.15);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  text-align: left;
}

.form-group label {
  font-weight: 600;
  color: #333;
  text-align: left;
}

.form-input {
  padding: 0.875rem 1rem;
  border: 3px solid;
  border-color: #e0e0e0 #a0a0a0 #a0a0a0 #e0e0e0;
  border-radius: 0;
  font-size: 1rem;
  color: #333;
  transition: all 0.1s ease;
  width: 100%;
  background: #ffffff;
  box-shadow: inset 2px 2px 0 rgba(0, 0, 0, 0.1);
}

.form-input:focus {
  outline: none;
  border-color: #ffc8dd #ffafcc #ffafcc #ffc8dd;
  background: #fff5f9;
}

.error-message {
  background: rgba(220, 53, 69, 0.1);
  color: #dc3545;
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid rgba(220, 53, 69, 0.3);
  font-size: 0.9rem;
}

.submit-button {
  background: #ffc8dd;
  color: #333;
  border: 3px solid;
  border-color: #ffafcc #cdb4db #cdb4db #ffafcc;
  border-radius: 0;
  padding: 0.75rem;
  font-size: 1rem;
  box-shadow: inset -2px -2px 0 rgba(0, 0, 0, 0.2);
  transition: all 0.1s ease;
  font-weight: 600;
  margin-top: 2rem;
  cursor: pointer;
}

.submit-button:hover:not(:disabled) {
  background: #ffafcc;
  border-color: #cdb4db #ffafcc #ffafcc #cdb4db;
  transform: translate(2px, 2px);
  box-shadow: inset 2px 2px 0 rgba(0, 0, 0, 0.1);
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Responsive Design */
@media (max-width: 768px) {
  .login-container {
    padding: 1rem;
  }

  .login-card {
    padding: 2rem 1.5rem;
    max-width: 100%;
  }

  .app-title {
    font-size: 2rem;
  }
}

@media (max-width: 480px) {
  .login-card {
    padding: 1.5rem 1rem;
  }

  .app-title {
    font-size: 1.75rem;
  }

  .tab-button {
    padding: 0.75rem;
    font-size: 0.9rem;
  }
}

@media (min-width: 769px) {
  .login-card {
    max-width: 800px;
  }
}

@media (min-width: 1024px) {
  .login-card {
    max-width: 800px;
    padding: 4rem;
  }

  .form-input {
    padding: 1rem;
    font-size: 1.05rem;
  }

  .tab-button {
    padding: 1.25rem;
    font-size: 1.1rem;
  }
}

</style>
