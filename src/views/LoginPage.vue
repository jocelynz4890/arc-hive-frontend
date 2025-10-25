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
    let result
    if (activeTab.value === 'login') {
      result = await authStore.login(form.username, form.password)
    } else {
      result = await authStore.register(form.username, form.password)
    }
    
    if (result.success) {
      router.push('/')
    } else {
      error.value = result.error
    }
  } catch (err) {
    error.value = 'An unexpected error occurred'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.login-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 3rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  width: 100%;
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.app-title {
  font-size: 2.5rem;
  font-weight: bold;
  background: linear-gradient(45deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 0.5rem 0;
}

.subtitle {
  color: #666;
  margin: 0;
  font-size: 1rem;
}

.auth-tabs {
  display: flex;
  margin-bottom: 2rem;
  background: rgba(102, 126, 234, 0.15);
  border-radius: 12px;
  padding: 6px;
  border: 2px solid rgba(102, 126, 234, 0.2);
}

.tab-button {
  flex: 1;
  background: transparent;
  border: none;
  padding: 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 700;
  font-size: 1rem;
  color: #555;
  position: relative;
}

.tab-button:hover {
  background: rgba(255, 255, 255, 0.5);
  color: #333;
}

.tab-button.active {
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  transform: translateY(-1px);
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
  border: 2px solid rgba(102, 126, 234, 0.2);
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
  width: 100%;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
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
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  margin-top: 2rem;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-1px);
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
