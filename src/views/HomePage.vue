<template>
  <div class="home-page">
    <div class="page-container">
      <!-- Stats and Avatar Section -->
      <div class="stats-section">
        <div class="avatar-section">
          <div class="avatar-container">
            <img 
              :src="currentAvatar?.image || defaultAvatar" 
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
                    :src="friend.avatar || defaultAvatar" 
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
    
  <!-- Friend Stats Modal (same behaviour as Friends page) -->
  <FriendStatsModal :friend="selectedFriend" @close="closeFriendModal" v-if="selectedFriend" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { apiService } from '../services/api'
import StatsCard from '../components/StatsCard.vue'
import FriendStatsModal from '../components/FriendStatsModal.vue'
import type { StatData, Arc, Friend, Avatar } from '../types'
import defaultAvatar from '../assets/default.png'

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

import { ref as vueRef } from 'vue'

const selectedFriend = vueRef<Friend | null>(null)

// defaultStats removed — friend modal uses its own normalization and current user stats are in totalStats/completedStats

const viewFriend = async (friend: any) => {
  // Normalize and copy friend
  selectedFriend.value = { ...(typeof friend === 'string' ? { username: friend } : friend) }

  const userIdString = (typeof friend === 'string')
    ? friend
    : (friend.id ?? friend._id ?? friend.username ?? String(friend))

  try {
    const statsResponse = await apiService.post('/StatTracking/getStats', { user: userIdString })
    const stats = statsResponse.data?.stats ?? statsResponse.data
    if (stats && selectedFriend.value) {
      const { totalStats: t, completedStats: c } = normalizeStatsShape(stats)
      selectedFriend.value.totalStats = t as any
      selectedFriend.value.completedStats = c as any
    }

    if (selectedFriend.value && !selectedFriend.value.username) {
      try {
        const userResp = await apiService.post('/Friending/getUserById', { id: userIdString })
        const u = userResp.data?.user ?? userResp.data
        if (u && selectedFriend.value) selectedFriend.value.username = u.username || u.name || userIdString
      } catch (ue) {
        console.debug('Could not fetch friend details:', ue)
      }
    }
  } catch (error) {
    console.error('Error loading friend stats:', error)
  }
}

const closeFriendModal = () => {
  selectedFriend.value = null
}

// Normalize backend stats into frontend-friendly shapes (strip _id/user and compute totals)
const normalizeStatsShape = (raw: any) => {
  const keys: Array<[string, string]> = [
    ['hp', 'HP'],
    ['stamina', 'Stamina'],
    ['strength', 'Strength'],
    ['agility', 'Agility'],
    ['intelligence', 'Intelligence']
  ]

  const totalStats: any = {}
  const completedStats: any = {}

  for (const [low, out] of keys) {
    const entry = raw[low] ?? raw[out]
    if (entry && typeof entry === 'object') {
      const completed = Number(entry.completed || 0)
      const incompleted = Number(entry.incompleted || 0)
      totalStats[out] = completed + incompleted
      completedStats[out] = completed
    } else if (typeof entry === 'number') {
      totalStats[out] = entry
      completedStats[out] = 0
    } else {
      totalStats[out] = 0
      completedStats[out] = 0
    }
  }

  return { totalStats, completedStats }
}

const loadUserData = async () => {
  if (!user.value) return
  
  try {
    // Backend expects user as a string identifier, extract it
    const userId = typeof user.value === 'string' 
      ? user.value 
      : (user.value as any).username || (user.value as any).id || String(user.value)
    
    // Load stats
    const statsResponse = await apiService.post('/StatTracking/getStats', {
      user: userId
    })
    
    if (statsResponse.data.stats) {
      // Initialize stats if they don't exist
      if (!statsResponse.data.stats.HP) {
        await apiService.post('/StatTracking/initializeStats', {
          user: userId
        })
      }
    }
    
    // Load arcs - backend returns { arcs: [id1, id2, ...] }, fetch full details
    const arcsResponse = await apiService.post('/ArcTracking/getArcs', {
      user: userId
    })
    const arcsData = arcsResponse.data
    
    if (Array.isArray(arcsData)) {
      // If it's an array, fetch full details for each arc
      const fullArcs = await Promise.all(
        arcsData.map(async (arc: any) => {
          try {
            const arcResponse = await apiService.post('/ArcTracking/getArc', { arc: arc.id || arc })
            return arcResponse.data?.arc || arcResponse.data || arc
          } catch (error) {
            console.error('Error fetching arc:', error)
            return arc
          }
        })
      )
      userArcs.value = fullArcs.map((arc: any) => ({
        id: arc._id ?? arc.id ?? '',
        name: arc.name ?? '',
        stat: arc.stat ?? '',
        streak: arc.streak ?? 0,
        members: Array.isArray(arc.members) ? arc.members : []
      }))
    } else if (arcsData && Array.isArray(arcsData.arcs)) {
      // Backend returns { arcs: [id1, id2, ...] }, fetch full details for each arc ID
      const fullArcs = await Promise.all(
        arcsData.arcs.map(async (arcId: string) => {
          try {
            const arcResponse = await apiService.post('/ArcTracking/getArc', { arc: arcId })
            const arcData = arcResponse.data?.arc || arcResponse.data
            return {
              id: arcData._id ?? arcData.id ?? arcId,
              name: arcData.name ?? arcId,
              stat: arcData.stat ?? '',
              streak: arcData.streak ?? 0,
              members: Array.isArray(arcData.members) ? arcData.members : []
            }
          } catch (error) {
            console.error(`Error fetching arc ${arcId}:`, error)
            // Return a minimal placeholder
            return {
              id: arcId,
              name: arcId,
              stat: '',
              streak: 0,
              members: []
            }
          }
        })
      )
      userArcs.value = fullArcs
    } else {
      userArcs.value = []
    }
    
    // Load friends (normalize different response shapes)
    await loadFriendsOnly()
    
    // Load rewards
    const rewardsResponse = await apiService.post('/Rewarding/listAvatars', {
      user: userId
    })
    const avatars = rewardsResponse.data || []
    if (avatars.length > 0) {
      currentAvatar.value = avatars[0] // Use first avatar as default
    }
    
  } catch (error) {
    console.error('Error loading user data:', error)
  }
}

const loadFriendsOnly = async () => {
  if (!user.value) return
  try {
    const friendsResponse = await apiService.post('/Friending/listFriends', {
      user: user.value
    })
    const data = friendsResponse.data
    if (Array.isArray(data)) {
      friends.value = data
    } else if (data && Array.isArray(data.friends)) {
      friends.value = data.friends
    } else if (data && Array.isArray(data.users)) {
      friends.value = data.users
    } else {
      friends.value = []
    }
    // Normalize simple username strings into objects for consistent rendering
    friends.value = friends.value.map((f: any) => (typeof f === 'string' ? { username: f, avatar: '' } : f))
  } catch (err) {
    console.error('Error loading friends (preview):', err)
    friends.value = []
  }
}

onMounted(() => {
  loadUserData()
  // Resync when friends change elsewhere in the app
  const onFriendsUpdated = () => {
    loadFriendsOnly()
  }
  window.addEventListener('friends-updated', onFriendsUpdated)

  // Clean up listener when component unmounts
  onUnmounted(() => {
    window.removeEventListener('friends-updated', onFriendsUpdated)
  })
})

// If auth store initializes later, reload data
watch(user, (u) => {
  if (u) loadUserData()
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

.arc-preview-card p {
  color: #666;
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
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
