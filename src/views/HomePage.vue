<template>
  <div class="home-page">
    <div class="page-container">
      <!-- Stats and Avatar Section -->
      <div class="stats-section">
        <div class="avatar-section">
          <div class="avatar-container">
            <img 
              :src="currentAvatar?.image || '/default-avatar.png'" 
              :alt="currentAvatar?.name || 'Default Avatar'"
              class="avatar-image"
            />
            <div class="avatar-info">
              <h3>{{ currentAvatar?.name || 'Default Avatar' }}</h3>
              <p class="rarity">{{ currentAvatar?.rarity || 'common' }}</p>
            </div>
          </div>
        </div>
        
        <div class="stats-container">
          <StatsCard 
            :total-stats="totalStats" 
            :completed-stats="completedStats" 
          />
        </div>
      </div>
      
      <!-- Arcs and Friends Section -->
      <div class="content-section">
        <div class="arcs-preview">
          <div class="section-header">
            <h2>Your Arcs</h2>
            <button @click="goToArcs" class="add-button">
              ➕ Add Arc
            </button>
          </div>
          <div class="preview-content">
            <div v-if="userArcs.length === 0" class="empty-state">
              <p>No arcs yet. Create your first arc to start tracking habits!</p>
            </div>
            <div v-else class="arcs-list">
              <div 
                v-for="arc in userArcs.slice(0, 3)" 
                :key="arc.id" 
                class="arc-preview-card"
              >
                <h4>{{ arc.name }}</h4>
                <p>Streak: {{ arc.streak }} days</p>
                <div class="arc-stat">{{ arc.stat }}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="friends-preview">
          <div class="section-header">
            <h2>Your Hive</h2>
            <button @click="goToFriends" class="add-button">
              ➕ Add Friend
            </button>
          </div>
          <div class="preview-content">
            <div v-if="friends.length === 0" class="empty-state">
              <p>No friends yet. Add friends to collaborate on arcs!</p>
            </div>
            <div v-else class="friends-list">
              <div 
                v-for="friend in friends.slice(0, 3)" 
                :key="friend.username" 
                class="friend-preview-card"
                @click="viewFriend(friend)"
              >
                <div class="friend-avatar">
                  <img 
                    :src="friend.avatar || '/default-avatar.png'" 
                    :alt="friend.username"
                    class="friend-avatar-img"
                  />
                </div>
                <div class="friend-info">
                  <h4>{{ friend.username }}</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { apiService } from '../services/api'
import StatsCard from '../components/StatsCard.vue'
import type { StatData, Arc, Friend, Avatar } from '../types'

const router = useRouter()
const authStore = useAuthStore()

// Data
const totalStats = ref<StatData>({
  HP: 0,
  Stamina: 0,
  Strength: 0,
  Agility: 0,
  Intelligence: 0
})

const completedStats = ref<StatData>({
  HP: 0,
  Stamina: 0,
  Strength: 0,
  Agility: 0,
  Intelligence: 0
})

const userArcs = ref<Arc[]>([])
const friends = ref<Friend[]>([])
const currentAvatar = ref<Avatar | null>(null)

// Computed
const user = computed(() => authStore.user)

// Methods
const goToArcs = () => {
  router.push('/arcs')
}

const goToFriends = () => {
  router.push('/friends')
}

const viewFriend = (friend: Friend) => {
  // TODO: Implement friend view modal
  console.log('View friend:', friend)
}

const loadUserData = async () => {
  if (!user.value) return
  
  try {
    // Load stats
    const statsResponse = await apiService.post('/api/StatTracking/getStats', {
      user: user.value
    })
    
    if (statsResponse.data.stats) {
      // Initialize stats if they don't exist
      if (!statsResponse.data.stats.HP) {
        await apiService.post('/api/StatTracking/initializeStats', {
          user: user.value
        })
      }
    }
    
    // Load arcs
    const arcsResponse = await apiService.post('/api/ArcTracking/getArcs', {
      user: user.value
    })
    userArcs.value = arcsResponse.data || []
    
    // Load friends
    const friendsResponse = await apiService.post('/api/Friending/listFriends', {
      user: user.value
    })
    friends.value = friendsResponse.data || []
    
    // Load rewards
    const rewardsResponse = await apiService.post('/api/Rewarding/listAvatars', {
      user: user.value
    })
    const avatars = rewardsResponse.data || []
    if (avatars.length > 0) {
      currentAvatar.value = avatars[0] // Use first avatar as default
    }
    
  } catch (error) {
    console.error('Error loading user data:', error)
  }
}

onMounted(() => {
  loadUserData()
})
</script>

<style scoped>
.home-page {
  min-height: calc(100vh - 80px);
  padding: 2rem;
}

.page-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.stats-section {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 2rem;
  align-items: start;
}

.avatar-section {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 1.5rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.avatar-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.avatar-image {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid rgba(102, 126, 234, 0.3);
}

.avatar-info h3 {
  margin: 0;
  color: #333;
  text-align: center;
}

.rarity {
  margin: 0;
  color: #666;
  text-align: center;
  font-size: 0.9rem;
  text-transform: capitalize;
}

.stats-container {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 1.5rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.content-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.arcs-preview, .friends-preview {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 1.5rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-header h2 {
  margin: 0;
  color: #333;
}

.add-button {
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: transform 0.2s ease;
}

.add-button:hover {
  transform: translateY(-1px);
}

.preview-content {
  min-height: 200px;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #666;
  text-align: center;
}

.arcs-list, .friends-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.arc-preview-card, .friend-preview-card {
  background: rgba(102, 126, 234, 0.1);
  border-radius: 10px;
  padding: 1rem;
  border: 1px solid rgba(102, 126, 234, 0.2);
}

.friend-preview-card {
  cursor: pointer;
  transition: all 0.2s ease;
}

.friend-preview-card:hover {
  background: rgba(102, 126, 234, 0.2);
  transform: translateY(-1px);
}

.arc-preview-card h4, .friend-preview-card h4 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.arc-stat {
  background: rgba(118, 75, 162, 0.2);
  color: #764ba2;
  padding: 0.25rem 0.5rem;
  border-radius: 5px;
  font-size: 0.8rem;
  font-weight: 600;
  display: inline-block;
  margin-top: 0.5rem;
}

.friend-preview-card {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.friend-avatar {
  width: 40px;
  height: 40px;
}

.friend-avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

@media (max-width: 768px) {
  .stats-section {
    grid-template-columns: 1fr;
  }
  
  .content-section {
    grid-template-columns: 1fr;
  }
}
</style>
