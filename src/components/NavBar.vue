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
  background: #ffc8dd;
  border-bottom: 4px solid #ffafcc;
  padding: 0.5rem 0;
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: 0 4px 0 #ffafcc, 0 8px 0 rgba(0, 0, 0, 0.1);
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
  font-family: 'Silkscreen', monospace !important;
  color: #bde0fe;
  text-shadow: 2px 2px 0 #a2d2ff;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
  letter-spacing: 0.05em;
  transform: scale(0.98);
  transform-origin: center;
}

.user-info {
  display: flex;
  align-items: center;
}

.username {
  font-family: 'Pixelify Sans', sans-serif;
  font-weight: 600;
  color: #333;
  margin-right: 0.5rem;
  font-size: 1rem;
}

.nav-icons {
  display: flex;
  gap: 0.5rem;
}

.nav-button, .nav-icon {
  background: #bde0fe;
  border: 3px solid;
  border-color: #a2d2ff #cdb4db #cdb4db #a2d2ff;
  border-radius: 0;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: all 0.1s ease;
  font-size: 1rem;
  box-shadow: inset -2px -2px 0 rgba(0, 0, 0, 0.2);
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
  background: #a2d2ff;
  border-color: #cdb4db #a2d2ff #a2d2ff #cdb4db;
  transform: translate(2px, 2px);
  box-shadow: inset 2px 2px 0 rgba(0, 0, 0, 0.1);
}

.logout-button:hover {
  background: #ffafcc;
  border-color: #ffc8dd #ffafcc #ffafcc #ffc8dd;
}

.home-button {
  font-weight: 600;
}
</style>
