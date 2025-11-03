<template>
  <nav class="navbar">
    <div class="navbar-content">
      <div class="navbar-left">
        <h1 class="app-title">ArcHive</h1>
      </div>
      
      <div class="navbar-right">
        <div class="user-info">
          <span class="username">{{ (authStore.user as any)?.username }}</span>
        </div>
        
        <div class="nav-icons">
          <button @click="goHome" class="nav-button home-button">
            <img :src="homeIcon" alt="Home" class="nav-icon-img" />
            Home
          </button>
          <button @click="goToFriends" class="nav-button" title="Hive">
            <img :src="hiveIcon" alt="Hive" class="nav-icon-img" />
            Hive
          </button>
          <button @click="goToArcs" class="nav-button" title="Arcs">
            <img :src="arcsIcon" alt="Arcs" class="nav-icon-img" />
            Arcs
          </button>
          <button @click="goToRewards" class="nav-button" title="Rewards">
            <img :src="rewardsIcon" alt="Rewards" class="nav-icon-img" />
            Rewards
          </button>
          <button @click="logout" class="nav-button logout-button" title="Logout">
            <img :src="logoutIcon" alt="Logout" class="nav-icon-img" />
            Logout
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import homeIcon from '../assets/home.png'
import arcsIcon from '../assets/arcs.png'
import rewardsIcon from '../assets/rewards.png'
import logoutIcon from '../assets/logout.png'
import hiveIcon from '../assets/hive.png'

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

const logout = async () => {
  await authStore.logout()
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
  flex-wrap: wrap;
  gap: 1rem;
  padding: 0 1rem;
}

.navbar-left {
  flex: 0 0 auto;
}

.navbar-right {
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 1rem;
  min-width: 0;
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
  background: rgba(255, 255, 255, 0.9);
  padding: 0.25rem 0.5rem;
  border: 2px solid #ffffff;
  box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.1);
  display: inline-block;
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
  flex-wrap: wrap;
  gap: 0.5rem;
}

.nav-button {
  background: #bde0fe;
  border: 3px solid;
  border-color: #a2d2ff #cdb4db #cdb4db #a2d2ff;
  border-radius: 0;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: all 0.1s ease;
  font-size: 1rem;
  box-shadow: inset -2px -2px 0 rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .navbar {
    padding: 0.25rem 0;
  }
  
  .navbar-content {
    padding: 0 0.5rem;
    gap: 0.5rem;
  }
  
  .app-title {
    font-size: 1.2rem;
    padding: 0.15rem 0.35rem;
  }
  
  .user-info {
    order: 3;
    width: 100%;
    justify-content: center;
    margin-top: 0.5rem;
  }
  
  .username {
    font-size: 0.9rem;
    margin-right: 0;
  }
  
  .nav-icons {
    gap: 0.25rem;
    width: 100%;
    justify-content: center;
  }
  
  .nav-button {
    font-size: 0.9rem;
    padding: 0.4rem 0.8rem;
    gap: 0.4rem;
  }
  
  .nav-icon-img {
    width: 16px;
    height: 16px;
  }
  
  .navbar-right {
    flex-direction: column;
    align-items: center;
  }
}

.nav-icon-img {
  width: 20px;
  height: 20px;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
  flex-shrink: 0;
}

.nav-button:hover {
  background: #a2d2ff;
  border-color: #cdb4db #a2d2ff #a2d2ff #cdb4db;
  transform: translate(2px, 2px);
  box-shadow: inset 2px 2px 0 rgba(0, 0, 0, 0.1);
}

.logout-button:hover {
  background: #ffafcc;
  border-color: #ffc8dd #ffafcc #ffafcc #ffc8dd;
}

</style>
