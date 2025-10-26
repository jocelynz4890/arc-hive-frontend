<template>
  <nav class="navbar">
    <div class="navbar-content">
      <div class="navbar-left">
        <button @click="goHome" class="nav-button home-button">
          🏠 Home
        </button>
      </div>
      
      <div class="navbar-center">
        <h1 class="app-title">ArcHive</h1>
      </div>
      
      <div class="navbar-right">
        <div class="user-info">
          <span class="username">{{ (authStore.user as any)?.username }}</span>
        </div>
        
        <div class="nav-icons">
          <button @click="goToFriends" class="nav-icon" title="Friends">
            🐝
          </button>
          <button @click="goToArcs" class="nav-icon" title="Arcs">
            📋
          </button>
          <button @click="goToRewards" class="nav-icon" title="Rewards">
            🎁
          </button>
          <button @click="logout" class="nav-icon logout-button" title="Logout">
            🚪
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const goHome = () => {
  router.push('/')
}

const goToFriends = () => {
  router.push('/friends')
}

const goToArcs = () => {
  router.push('/arcs')
}

const goToRewards = () => {
  router.push('/rewards')
}

const logout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.navbar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding: 0.5rem 0;
  position: sticky;
  top: 0;
  z-index: 1000;
}

.navbar-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
}

.navbar-left {
  flex: 1;
}

.navbar-center {
  flex: 1;
  text-align: center;
}

.navbar-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
}

.app-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: bold;
  background: linear-gradient(45deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.user-info {
  display: flex;
  align-items: center;
}

.username {
  font-weight: 600;
  color: #333;
  margin-right: 0.5rem;
}

.nav-icons {
  display: flex;
  gap: 0.5rem;
}

.nav-button, .nav-icon {
  /* Lilac button backgrounds */
  background: linear-gradient(90deg, #f3e8ff 0%, #e0ccff 50%, #d6b8ff 100%);
  border: 1px solid rgba(180, 150, 210, 0.4);
  border-radius: 8px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1rem;
}

.nav-icon {
  padding: 0.5rem;
  min-width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-button:hover, .nav-icon:hover {
  background: linear-gradient(90deg, #e9d6ff 0%, #d6b8ff 100%);
  border-color: rgba(150, 120, 190, 0.75);
  transform: translateY(-1px);
}

.logout-button:hover {
  background: rgba(220, 53, 69, 0.12);
  border-color: rgba(220, 53, 69, 0.35);
}

.home-button {
  font-weight: 600;
}
</style>
