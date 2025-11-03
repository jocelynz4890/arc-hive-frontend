<template>
  <div class="home-page">
    <div class="page-container">
      <!-- Stats and Avatar Section -->
      <div class="stats-section">
        <div class="avatar-section">
          <div class="avatar-container">
            <div class="animated-avatar">
              <img 
                v-if="currentAvatarFrame1"
                :src="currentAvatarFrame1" 
                :alt="currentAvatar?.name || 'Default Avatar'"
                class="avatar-frame frame1"
                @load="avatarLoaded = true"
              />
              <img 
                v-if="currentAvatarFrame2"
                :src="currentAvatarFrame2" 
                :alt="currentAvatar?.name || 'Default Avatar'"
                class="avatar-frame frame2"
                @load="avatarLoaded = true"
              />
              <img 
                v-show="!avatarLoaded"
                :src="defaultAvatar" 
                alt="Default Avatar"
                class="avatar-frame default-avatar"
              />
            </div>
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
import { enhanceAvatarWithImage, getAvatarImage } from '../utils/avatarUtils'

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

const currentAvatar = ref<Avatar | null>(null)
const avatarLoaded = ref(false)
const currentAvatarFrame1 = computed(() => 
  currentAvatar.value?.name ? getAvatarImage(currentAvatar.value.name, 1) : null
)
const currentAvatarFrame2 = computed(() => 
  currentAvatar.value?.name ? getAvatarImage(currentAvatar.value.name, 2) : null
)

// Preload avatar from cache/localStorage if available (user-specific)
onMounted(() => {
  const userId = user.value?.id || user.value?.username || String(user.value)
  const cachedAvatarName = localStorage.getItem(`currentAvatarName_${userId}`)
  if (cachedAvatarName && userId) {
    try {
      const cached = enhanceAvatarWithImage(cachedAvatarName)
      currentAvatar.value = cached
      avatarLoaded.value = true
    } catch (e) {
      console.warn('Could not load cached avatar:', e)
    }
  }
})

const userArcs = ref<Arc[]>([])
const friends = ref<Friend[]>([])

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

    // Username should already be available from listFriends
    // If missing, it's already the userIdString, so use that
    if (selectedFriend.value && !selectedFriend.value.username) {
      selectedFriend.value.username = userIdString
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
    
    // Handle different response structures
    const statsData = statsResponse.data?.stats || statsResponse.data
    
    if (statsData) {
      // Backend automatically initializes stats on registration, so just normalize data
      const normalized = normalizeStatsShape(statsData)
      totalStats.value = normalized.totalStats
      completedStats.value = normalized.completedStats
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
    
    // Load current avatar from backend (not just first avatar)
    try {
      const currentResponse = await apiService.post('/Rewarding/getCurrentAvatar', {
        user: userId
      })
      const currentAvatarId = currentResponse.data?.avatar || ''
      
      if (currentAvatarId && currentAvatarId !== '') {
        // Get avatar definition to get the name
        const defResponse = await apiService.post('/Rewarding/getAvatarsByIds', {
          ids: [currentAvatarId]
        })
        const avatarDefs = defResponse.data?.avatars || []
        if (avatarDefs.length > 0 && avatarDefs[0].name) {
          const enhanced = enhanceAvatarWithImage(avatarDefs[0].name)
          console.log('HomePage: Loaded current avatar from backend:', enhanced.name)
          currentAvatar.value = enhanced
          // Cache the avatar name for faster loading next time (user-specific)
          localStorage.setItem(`currentAvatarName_${userId}`, avatarDefs[0].name)
        } else {
          throw new Error('Avatar definition not found')
        }
      } else {
        // No current avatar set - show default avatar for new users
        console.log('HomePage: No current avatar set, showing default avatar')
        currentAvatar.value = null
        avatarLoaded.value = false
        // Clear any cached avatar for this user
        localStorage.removeItem(`currentAvatarName_${userId}`)
      }
    } catch (error: any) {
      console.warn('HomePage: Could not load current avatar:', error.message || error)
      // No avatar available - show default
      currentAvatar.value = null
      avatarLoaded.value = false
      // Clear any cached avatar for this user
      localStorage.removeItem(`currentAvatarName_${userId}`)
    }
    
    // Mark avatar as loaded once we have set it
    if (currentAvatar.value) {
      avatarLoaded.value = true
    }
    
  } catch (error) {
    console.error('Error loading user data:', error)
  }
}

const loadFriendsOnly = async () => {
  if (!user.value) return
  try {
    // Extract username string for backend - Friending expects username string, not object
    const username = typeof user.value === 'string' 
      ? user.value
      : ((user.value as any)?.username || (user.value as any)?.id || String(user.value))
    
    const friendsResponse = await apiService.post('/Friending/listFriends', {
      user: username
    })
    const data = friendsResponse.data
    let friendList: Friend[] = []
    if (Array.isArray(data)) {
      friendList = data
    } else if (data && Array.isArray(data.friends)) {
      friendList = data.friends
    } else if (data && Array.isArray(data.users)) {
      friendList = data.users
    } else {
      friendList = []
    }
    
    // Deduplicate friends by ID/username before processing
    const seen = new Set<string>()
    friendList = friendList.filter((friend: any) => {
      const friendId = typeof friend === 'string' ? friend : (friend?.username || friend?.id || friend?._id || String(friend))
      if (seen.has(friendId)) {
        return false
      }
      seen.add(friendId)
      return true
    })
    
    // First, normalize all friends and show them with default avatars immediately
    const normalizedFriends = friendList.map((friend: any) => {
      // Extract friend ID - backend returns user IDs (which are usernames in this system)
      const friendId = typeof friend === 'string' ? friend : (friend?.username || friend?.id || friend?._id || String(friend))
      
      // Normalize friend object to ensure it has username
      const normalizedFriend: Friend = typeof friend === 'string' 
        ? { username: friend, id: friend }
        : {
            username: friend.username || friend.id || friend._id || friendId || String(friend),
            id: friend.id || friend._id || friendId,
            ...friend
          }
      
      return {
        ...normalizedFriend,
        avatar: defaultAvatar
      }
    })
    
    // Create a new array reference to ensure Vue reactivity and deduplicate again (in case normalization created duplicates)
    const uniqueFriends = new Map<string, Friend>()
    normalizedFriends.forEach((friend: Friend) => {
      const friendId = (friend as any).id || friend.username || (friend as any)._id || String(friend)
      if (!uniqueFriends.has(friendId)) {
        uniqueFriends.set(friendId, friend)
      }
    })
    
    // Show friends immediately with default avatars
    friends.value = [...uniqueFriends.values()]
    
    // Then load avatars in the background without blocking the UI
    friendList.forEach(async (friend: any) => {
      const friendId = typeof friend === 'string' ? friend : (friend?.username || friend?.id || friend?._id || String(friend))
      
      try {
        // Get friend's current avatar
        const avatarResponse = await apiService.post('/Rewarding/getCurrentAvatar', {
          user: friendId
        })
        const avatarId = avatarResponse.data?.avatar || ''
        
        if (avatarId && avatarId !== '') {
          // Get avatar definition to get the name
          const defResponse = await apiService.post('/Rewarding/getAvatarsByIds', {
            ids: [avatarId]
          })
          const avatarDefs = defResponse.data?.avatars || []
          if (avatarDefs.length > 0 && avatarDefs[0].name) {
            const avatar = enhanceAvatarWithImage(avatarDefs[0].name)
            const avatarUrl = getAvatarImage(avatar.name, 1)
            
            // Update the friend's avatar in the reactive array
            const friendToUpdate = friends.value.find(f => 
              (f as any).id === friendId || f.username === friendId || (f as any)._id === friendId
            )
            if (friendToUpdate) {
              friendToUpdate.avatar = avatarUrl
            }
          }
        }
      } catch (error: any) {
        console.warn(`Could not load avatar for friend ${friendId}:`, error.message || error)
      }
    })
  } catch (err) {
    console.error('Error loading friends (preview):', err)
    friends.value = []
  }
}

onMounted(() => {
  loadUserData()
  
  // Listen for avatar changes from other pages
  const onAvatarChanged = (event: CustomEvent) => {
    console.log('HomePage: Avatar changed event received:', event.detail)
    if (event.detail?.avatar) {
      const userId = user.value?.id || user.value?.username || String(user.value)
      currentAvatar.value = event.detail.avatar
      // Cache the new avatar name (user-specific)
      if (event.detail.avatar.name && userId) {
        localStorage.setItem(`currentAvatarName_${userId}`, event.detail.avatar.name)
      }
      avatarLoaded.value = true
    }
  }
  window.addEventListener('avatar-changed', onAvatarChanged as EventListener)
  
  // Resync when friends change elsewhere in the app
  const onFriendsUpdated = () => {
    loadFriendsOnly()
  }
  window.addEventListener('friends-updated', onFriendsUpdated)

  // Clean up listeners when component unmounts
  onUnmounted(() => {
    window.removeEventListener('avatar-changed', onAvatarChanged as EventListener)
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
  background: #bde0fe;
  border-radius: 0;
  padding: 1.5rem;
  border: 4px solid;
  border-color: #a2d2ff #cdb4db #cdb4db #a2d2ff;
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.2);
}

.avatar-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.animated-avatar {
  position: relative;
  width: 300px;
  height: 300px;
}

.avatar-frame {
  width: 300px;
  height: 300px;
  object-fit: contain;
  position: absolute;
  top: 0;
  left: 0;
  animation: avatarPulse 2s ease-in-out infinite;
}

.avatar-frame.default-avatar {
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
}

.avatar-frame.default-avatar:not([style*="display: none"]) {
  opacity: 1;
}

.avatar-frame.frame1 {
  animation: avatarFrame1 1s steps(2) infinite;
  opacity: 0;
}

.avatar-frame.frame2 {
  animation: avatarFrame2 1s steps(2) infinite;
  opacity: 1;
}

@keyframes avatarFrame1 {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}

@keyframes avatarFrame2 {
  0%, 49% { opacity: 0; }
  50%, 100% { opacity: 1; }
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
  background: #bde0fe;
  border-radius: 0;
  padding: 2rem 1.5rem;
  min-height: 900px;
  border: 4px solid;
  border-color: #a2d2ff #cdb4db #cdb4db #a2d2ff;
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.2);
}

.content-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.arcs-preview, .friends-preview {
  background: #bde0fe;
  border-radius: 0;
  padding: 1.5rem;
  border: 4px solid;
  border-color: #a2d2ff #cdb4db #cdb4db #a2d2ff;
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.2);
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
  background: #ffc8dd;
  color: #333;
  border: 3px solid;
  border-color: #ffafcc #cdb4db #cdb4db #ffafcc;
  border-radius: 0;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.1s ease;
  box-shadow: inset -2px -2px 0 rgba(0, 0, 0, 0.2);
}

.add-button:hover {
  background: #ffafcc;
  border-color: #cdb4db #ffafcc #ffafcc #cdb4db;
  transform: translate(2px, 2px);
  box-shadow: inset 2px 2px 0 rgba(0, 0, 0, 0.1);
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
  background: #ffffff;
  border-radius: 0;
  padding: 1rem;
  border: 3px solid;
  border-color: #e0e0e0 #a0a0a0 #a0a0a0 #e0e0e0;
  box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.15);
}

.friend-preview-card {
  cursor: pointer;
  transition: all 0.2s ease;
}

.friend-preview-card:hover {
  background: #f5f5f5;
  transform: translate(2px, 2px);
  box-shadow: 1px 1px 0 rgba(0, 0, 0, 0.15);
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
  background: #a2d2ff;
  color: #333;
  padding: 0.25rem 0.5rem;
  border-radius: 0;
  font-size: 0.8rem;
  font-weight: 600;
  display: inline-block;
  margin-top: 0.5rem;
  border: 2px solid #bde0fe;
  box-shadow: 1px 1px 0 rgba(0, 0, 0, 0.1);
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
