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
                v-if="!currentAvatarFrame1 && !currentAvatarFrame2"
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
import { apiService, subscribeToEvents } from '../services/api'
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

// Synchronously preload avatar from cache/localStorage (before mount) to avoid flicker
try {
  const storedUser = localStorage.getItem('user')
  if (storedUser) {
    const parsed = JSON.parse(storedUser)
    const cacheKey = (parsed?.id || parsed?.username || String(parsed))
    if (cacheKey) {
      const cachedAvatarName = localStorage.getItem(`currentAvatarName_${cacheKey}`)
      if (cachedAvatarName) {
        const cached = enhanceAvatarWithImage(cachedAvatarName)
        currentAvatar.value = cached
        avatarLoaded.value = true
      }
    }
  }
} catch (e) {
  // ignore
}

const userArcs = ref<Arc[]>([])
const friends = ref<Friend[]>([])

// Computed
const user = computed(() => authStore.user)

// Methods
const goToArcs = () => { router.push('/arcs') }
const goToFriends = () => { router.push('/friends') }

import { ref as vueRef } from 'vue'
const selectedFriend = vueRef<Friend | null>(null)

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
      selectedFriend.value.username = userIdString
    }
  } catch (error) {
    console.error('Error loading friend stats:', error)
  }
}

const closeFriendModal = () => { selectedFriend.value = null }

// Normalize backend stats
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
    // Use username for stats (StatTracking is keyed by username via init and daily updates)
    const statsUserId = typeof user.value === 'string'
      ? user.value
      : ((user.value as any).username || (user.value as any).id || String(user.value))

    const statsResponse = await apiService.post('/StatTracking/getStats', { user: statsUserId })
    const statsData = statsResponse.data?.stats || statsResponse.data
    if (statsData) {
      const normalized = normalizeStatsShape(statsData)
      totalStats.value = normalized.totalStats
      completedStats.value = normalized.completedStats
    }

    // ArcTracking stores members as usernames; query with username for arcs
    const arcsUser = statsUserId
    const arcsResponse = await apiService.post('/ArcTracking/getArcs', { user: arcsUser })
    const arcsData = arcsResponse.data
    if (Array.isArray(arcsData)) {
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
            return { id: arcId, name: arcId, stat: '', streak: 0, members: [] }
          }
        })
      )
      userArcs.value = fullArcs
    } else {
      userArcs.value = []
    }

    // Refresh current avatar from backend so Home mirrors Rewards selection
    try {
      const currentResp = await apiService.post('/Rewarding/getCurrentAvatar', { user: statsUserId })
      const currentId = currentResp.data?.avatar || ''
      if (currentId && currentId !== '') {
        // Resolve definition to get the display name if ID != name
        try {
          const defResp = await apiService.post('/Rewarding/getAvatarsByIds', { ids: [currentId] })
          const defs = defResp.data?.avatars || []
          const displayName = defs.length > 0 && defs[0].name ? defs[0].name : currentId
          const enhanced = enhanceAvatarWithImage(displayName)
          currentAvatar.value = enhanced
          const userId = statsUserId
          if (userId) localStorage.setItem(`currentAvatarName_${userId}`, enhanced.name)
        } catch {
          // Fallback: map directly
          const enhanced = enhanceAvatarWithImage(currentId)
          currentAvatar.value = enhanced
        }
      }
    } catch {}

    await loadFriendsOnly()
  } catch (error) {
    console.error('Error loading user data:', error)
  }
}

const loadFriendsOnly = async () => {
  if (!user.value) return
  try {
    const username = typeof user.value === 'string' 
      ? user.value
      : ((user.value as any)?.username || (user.value as any)?.id || String(user.value))
    const friendsResponse = await apiService.post('/Friending/listFriends', { user: username })
    const data = friendsResponse.data
    let friendList: any[] = []
    if (Array.isArray(data)) friendList = data
    else if (data && Array.isArray(data.friends)) friendList = data.friends
    else if (data && Array.isArray(data.users)) friendList = data.users
    else friendList = []

    // Normalize to ensure each friend has a username field for display
    // Do NOT assign default avatar here to avoid a flash; leave empty until loaded
    friends.value = friendList.map((f: any) => {
      if (typeof f === 'string') return { username: f, id: f, avatar: '' }
      const username = f.username || f.id || f._id || String(f)
      return { username, id: f.id || f._id || username, avatar: '' }
    })

    // Load each friend's current avatar in the background
    friends.value.forEach(async (fr: any) => {
      const friendId = fr.username || fr.id
      if (!friendId) return
      try {
        const avatarResp = await apiService.post('/Rewarding/getCurrentAvatar', { user: friendId })
        const avatarId = avatarResp.data?.avatar || ''
        if (avatarId) {
          let url = getAvatarImage(avatarId, 1)
          if (!url) {
            try {
              const defResp = await apiService.post('/Rewarding/getAvatarsByIds', { ids: [avatarId] })
              const defs = defResp.data?.avatars || []
              if (defs.length > 0 && defs[0].name) {
                url = getAvatarImage(defs[0].name, 1)
              }
            } catch {}
          }
          const idx = friends.value.findIndex((x: any) => (x.username || x.id) === friendId)
          if (idx !== -1 && friends.value && friends.value[idx] && url) {
            friends.value[idx].avatar = url
          }
        }
      } catch {}
    })
  } catch (err) {
    console.error('Error loading friends (preview):', err)
    friends.value = []
  }
}

let unsubscribeEvents: (() => void) | null = null
onMounted(() => {
  loadUserData()
  // Subscribe to backend SSE to refresh when daily refresh completes
  unsubscribeEvents = subscribeToEvents(async (e) => {
    if (e.type === 'daily-refresh-complete') {
      await loadUserData()
      if (selectedFriend.value) {
        const id = selectedFriend.value.username || (selectedFriend.value as any).id
        if (id) {
          try {
            const statsResponse = await apiService.post('/StatTracking/getStats', { user: id })
            const stats = statsResponse.data?.stats ?? statsResponse.data
            if (stats) {
              const { totalStats: t, completedStats: c } = normalizeStatsShape(stats)
              selectedFriend.value.totalStats = t as any
              selectedFriend.value.completedStats = c as any
            }
          } catch {}
        }
      }
    }
  })
  // Listen for local avatar changes from Rewards page
  const onAvatarChanged = (e: Event) => {
    const detail = (e as CustomEvent).detail
    if (detail && detail.avatar && detail.avatar.name) {
      currentAvatar.value = detail.avatar
      const userId = user.value?.id || (user.value as any)?.username || String(user.value)
      if (userId) {
        localStorage.setItem(`currentAvatarName_${userId}`, detail.avatar.name)
      }
      // Update current user's entry in friends preview if present
      const me = (user.value as any)?.username || (user.value as any)?.id || String(user.value)
      const idx = friends.value.findIndex((f: any) => (f.username || f.id) === me)
      if (idx !== -1 && friends.value && friends.value[idx]) {
        friends.value[idx].avatar = getAvatarImage(detail.avatar.name, 1)
      }
    }
  }
  window.addEventListener('avatar-changed', onAvatarChanged as EventListener)
  // Remove on unmount
  onUnmounted(() => {
    window.removeEventListener('avatar-changed', onAvatarChanged as EventListener)
  })
})

onUnmounted(() => { if (unsubscribeEvents) unsubscribeEvents() })

// If auth store initializes later, reload data
watch(user, (u) => { if (u) loadUserData() })
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
  .home-page {
    padding: 1rem;
  }
  
  .page-container {
    gap: 1rem;
  }
  
  .stats-section {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .content-section {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .avatar-section, .stats-container, .arcs-preview, .friends-preview {
    padding: 1rem;
  }
  
  .avatar-container {
    gap: 1.5rem;
  }
  
  .animated-avatar {
    width: 200px;
    height: 200px;
  }
  
  .avatar-frame {
    width: 200px;
    height: 200px;
  }
  
  .avatar-info {
    margin-top: 0.5rem;
  }
  
  .avatar-info h3 {
    font-size: 1.1em;
    margin-bottom: 0.25rem;
  }
  
  .rarity {
    font-size: 0.8rem;
  }
  
  .stats-container {
    min-height: 600px;
    padding: 1rem;
  }
  
  .section-header h2 {
    font-size: 1.4em;
  }
  
  .add-button {
    font-size: 0.9rem;
    padding: 0.4rem 0.8rem;
  }
  
  .arc-preview-card h4, .friend-preview-card h4 {
    font-size: 1.1em;
  }
}
</style>
