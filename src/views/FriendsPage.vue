<template>
  <div class="friends-page">
    <div class="page-container">
      <div class="page-header">
        <h1>Your Hive</h1>
        <p>Connect with friends to build habits together</p>
      </div>
      
      <!-- Friend Code Section -->
      <div class="friend-code-section">
        <div class="code-input-section">
          <h3>Add Friend</h3>
          <div class="input-group">
            <input
              v-model="friendCodeInput"
              type="text"
              placeholder="Enter friend code"
              class="code-input"
              @keyup.enter="addFriend"
            />
            <button @click="addFriend" :disabled="loading" class="add-friend-button">
              {{ loading ? 'Adding...' : 'Add Friend' }}
            </button>
          </div>
          <div v-if="error" class="error-message">
            {{ error }}
          </div>
        </div>
        
        <div class="your-code-section">
          <h3>Your Friend Code</h3>
          <div class="code-display">
        <span class="code-text">{{ userFriendCode || 'Generating...' }}</span>
        <button @click="copyCode" class="copy-button">
          <img :src="clipboardIcon" alt="Copy" class="icon-img" />
        </button>
        <span class="copy-feedback" v-if="copySuccess" role="status" aria-live="polite">Copied!</span>
          </div>
        </div>
      </div>
      
      <!-- Friends List -->
      <div class="friends-section">
        <h3>Your Hive ({{ friends.length }})</h3>
        <div v-if="friends.length === 0" class="empty-state">
          <p>No friends yet. Share your friend code to start building your hive!</p>
        </div>
        <div v-else class="friends-grid">
          <div 
            v-for="friend in friends" 
            :key="friend.id || friend.username" 
            class="friend-card"
            @click="viewFriend(friend)"
          >
            <div class="friend-avatar">
            <img 
              :src="friend.avatar || defaultAvatar" 
              :alt="friend.username || 'friend avatar'"
              class="friend-avatar-img"
            />
            </div>
            <div class="friend-info">
              <h4>{{ friend.username || 'Unknown' }}</h4>
            </div>
            <div class="friend-actions">
              <button @click.stop="removeFriend(friend)" class="remove-button">
                <img :src="trashbinIcon" alt="Remove" class="icon-img" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Friend Stats Modal (use reusable component) -->
    <FriendStatsModal :friend="selectedFriend" @close="closeFriendModal" v-if="selectedFriend" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import { apiService } from '../services/api'
import type { Friend } from '../types'
import trashbinIcon from '../assets/trashbin.png'
import clipboardIcon from '../assets/clipboard.png'
import FriendStatsModal from '../components/FriendStatsModal.vue'
import { getAvatarImage, enhanceAvatarWithImage } from '../utils/avatarUtils'
import defaultAvatar from '../assets/default.png'

const authStore = useAuthStore()

// Data
const friends = ref<Friend[]>([])
const userFriendCode = ref('')
const friendCodeInput = ref('')
const loading = ref(false)
const error = ref('')
  const copySuccess = ref(false)
const selectedFriend = ref<Friend | null>(null)



// Computed
const user = computed(() => authStore.user)

// Methods
const formatFriendCode = (code: string | undefined | null) => {
  if (!code) return ''
  const raw = String(code).toUpperCase().replace(/[^A-Z0-9]/g, '')
  // If code is 6 chars like ABC123, format as ABC-123 for readability
  if (raw.length === 6) return `${raw.slice(0,3)}-${raw.slice(3)}`
  // If code already has groups, just return uppercase original trimmed
  return String(code).toUpperCase()
}

const loadFriends = async () => {
  if (!user.value) return

  try {
    // Extract username string for backend - Friending expects username string, not object
    const username = typeof user.value === 'string' 
      ? user.value
      : ((user.value as any)?.username || (user.value as any)?.id || String(user.value))
    
    const response = await apiService.post('/Friending/listFriends', {
      user: username
    })
    const data = response.data
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
    
    // First, normalize all friends without forcing default avatars to avoid flicker
    const normalizedFriends = friendList.map((friend: any) => {
      // Extract friend ID - backend returns user IDs (which are usernames in this system)
      const friendId = typeof friend === 'string' ? friend : (friend?.username || friend?.id || friend?._id || String(friend))
      
      // Normalize friend object to ensure it has username
      // Backend returns usernames as strings or objects with username/id
      // For Friending, the user ID IS the username, so if only an id is present, use it as username
      const normalizedFriend: Friend = typeof friend === 'string' 
        ? { username: friend, id: friend }
        : {
            // Spread friend first to get all properties
            ...friend,
            // Then ensure username is set: prioritize explicit username, then use id/_id/friendId (which is the username in Friending)
            username: friend.username || friendId || friend.id || friend._id || String(friend),
            // Set id to the same value for consistency
            id: friend.id || friend._id || friendId || friend.username || String(friend)
          }
      
      return {
        ...normalizedFriend,
        avatar: ''
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
    // Notify other parts of the app that the friend list changed (so previews can resync)
    try { window.dispatchEvent(new Event('friends-updated')) } catch (e) { /* ignore */ }
  } catch (error) {
    console.error('Error loading friends:', error)
    friends.value = []
  }
}

const loadFriendCode = async () => {
  if (!user.value) return
  // If the auth store already has a friendCode (generated on register/login), use it first
  if ((user.value as any).friendCode) {
    userFriendCode.value = (user.value as any).friendCode
    return
  }
  try {
    const response = await apiService.post('/Friending/getFriendCodeByUsername', {
      username: user.value.username
    })
  // tolerate different response shapes
  const raw = response.data?.friendcode ?? response.data?.friendCode ?? ''
  userFriendCode.value = formatFriendCode(raw)
  } catch (error) {
    console.error('Error loading friend code:', error)
    // Friend code should be automatically generated by backend on registration
    // Just use any client-side friendCode if available
    if ((user.value as any).friendCode) {
      userFriendCode.value = formatFriendCode((user.value as any).friendCode)
    }
  }
}

const addFriend = async () => {
  if (!friendCodeInput.value.trim()) return
  
  loading.value = true
  error.value = ''
  
  try {
    // Check if user is trying to add their own friend code (before making API call)
    const cleanedInput = friendCodeInput.value.trim().replace(/[^A-Za-z0-9]/g, '').toUpperCase()
    const userCode = (userFriendCode.value || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase()
    
    if (cleanedInput && userCode && cleanedInput === userCode) {
      error.value = 'You cannot add your own friend code!'
      loading.value = false
      return
    }
    
    // Get user by friend code. Try as-entered first, then try a cleaned fallback (no dashes) if not found.
    let userResponse: any = null
    const tryCodes = [friendCodeInput.value.trim(), friendCodeInput.value.replace(/[^A-Za-z0-9]/g, '')]
    let friendUser: any = null
    let gotUser = false
    for (const code of tryCodes) {
      if (!code) continue
      try {
        userResponse = await apiService.post('/Friending/getUserByFriendCode', { friendCode: code })
        friendUser = userResponse.data.user
        gotUser = true
        break
      } catch (e: any) {
        const serverErr = e.response?.data?.error || e.response?.data
        if (serverErr && typeof serverErr === 'string' && serverErr.toLowerCase().includes('friend code not found')) {
          // try next code
          continue
        } else {
          // rethrow other errors
          throw e
        }
      }
    }

    if (!gotUser) {
      throw new Error('Friend code not found')
    }
    
    // Extract username strings for backend - Friending expects username strings, not objects
    const username = typeof user.value === 'string' 
      ? user.value
      : ((user.value as any)?.username || (user.value as any)?.id || String(user.value))
    // getUserByFriendCode returns a username string
    const friendUsername = typeof friendUser === 'string'
      ? friendUser
      : (friendUser?.username || friendUser?.id || String(friendUser))
    
    if (username === friendUsername) {
      error.value = "You can't add yourself as a friend!"
      return
    }
    
    // Check if already friends (using username strings)
    const areFriendsResponse = await apiService.post('/Friending/areFriends', {
      userA: username,
      userB: friendUsername
    })
    
    if (areFriendsResponse.data.areFriends) {
      error.value = 'You are already friends with this user!'
      return
    }
    
    // Add friend (using username strings)
    await apiService.post('/Friending/addFriend', {
      from: username,
      to: friendUsername
    })
    
    // Reload friends list
    await loadFriends()
    friendCodeInput.value = ''
    
  } catch (error: any) {
    // Prefer structured server error, otherwise try to parse common messages
    const serverErr = error.response?.data?.error || error.response?.data
    if (serverErr && typeof serverErr === 'string' && serverErr.toLowerCase().includes('friend code not found')) {
      error.value = 'Friend code not found. Double-check the code and try again.'
    } else if (serverErr && typeof serverErr === 'object' && serverErr.error) {
      error.value = String(serverErr.error)
    } else {
      error.value = error.message || 'Failed to add friend'
    }
  } finally {
    loading.value = false
  }
}

const removeFriend = async (friend: Friend) => {
  if (!confirm(`Are you sure you want to remove ${friend.username || 'this friend'} from your friends?`)) {
    return
  }
  
  try {
    // Extract username strings for backend - Friending expects username strings, not objects
    const username = typeof user.value === 'string' 
      ? user.value
      : ((user.value as any)?.username || (user.value as any)?.id || String(user.value))
    const friendUsername = friend.username || (friend as any).id || String(friend)
    
    await apiService.post('/Friending/removeFriend', {
      from: username,
      to: friendUsername
    })
    
    // Update filter to use username for comparison
    const friendId = friendUsername
    
    // Immediately remove from local array for instant feedback
    friends.value = friends.value.filter((f: Friend) => {
      const fId = (f as any).id || f.username || (f as any)._id || String(f)
      return fId !== friendId
    })
    
    // Then reload from backend to ensure consistency
    await loadFriends()
  } catch (error: any) {
    console.error('Error removing friend:', error)
    const errorMsg = error.response?.data?.error || error.message || 'Failed to remove friend'
    alert(`Failed to remove friend: ${errorMsg}. Please try again.`)
    // Reload to ensure UI is in sync with backend
    await loadFriends()
  }
}

const viewFriend = async (friend: any) => {
  // copy friend object so we can safely mutate
  selectedFriend.value = { ...(typeof friend === 'string' ? { username: friend } : friend) }

  // Determine the user identifier string to request stats for.
  // Backend stat APIs expect a string user id (in this app that's typically the username or id string).
  const userIdString = (typeof friend === 'string')
    ? friend
    : (friend.id ?? friend._id ?? friend.username ?? String(friend))

  try {
  const statsResponse = await apiService.post('/StatTracking/getStats', { user: userIdString })
    const stats = statsResponse.data?.stats ?? statsResponse.data
    if (stats && selectedFriend.value) {
      // Normalize backend stats (which may include _id and user) into simple
      // { hp, stamina, strength, agility, intelligence } shapes for total and completed.
      const { totalStats: t, completedStats: c } = normalizeStatsShape(stats)
      const sf = selectedFriend.value
      // Cast to any to avoid strict type mismatches with StatData shape
      sf.totalStats = t as any
      sf.completedStats = c as any
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

// Convert backend stats shape into frontend-friendly objects and strip metadata.
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

const closeFriendModal = () => {
  selectedFriend.value = null
}

const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(userFriendCode.value)
    // show a small transient confirmation
    copySuccess.value = true
    setTimeout(() => { copySuccess.value = false }, 2000)
  } catch (error) {
    console.error('Failed to copy code:', error)
  }
}

onMounted(() => {
  if (user.value) {
    loadFriends()
    loadFriendCode()
  }

  // If the auth store initializes after mount, react to it
  watch(user, (u) => {
    if (u) {
      loadFriends()
      loadFriendCode()
    }
  })

  // If the current user changes their avatar, update their entry in the friends list if present
  const onAvatarChanged = (e: Event) => {
    const detail = (e as CustomEvent).detail
    if (!detail || !detail.avatar || !detail.avatar.name) return
    const currentUsername = typeof user.value === 'string'
      ? user.value
      : ((user.value as any)?.username || (user.value as any)?.id || String(user.value))
    friends.value = friends.value.map((f) => {
      const name = f.username || (f as any).id || String(f)
      if (name === currentUsername) {
        return { ...f, avatar: getAvatarImage(detail.avatar.name, 1) }
      }
      return f
    })
  }
  window.addEventListener('avatar-changed', onAvatarChanged as EventListener)
  onBeforeUnmount(() => {
    window.removeEventListener('avatar-changed', onAvatarChanged as EventListener)
  })
})
</script>

<style scoped>
.friends-page {
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

.page-header {
  text-align: center;
}

.page-header h1 {
  margin: 0 0 0.5rem 0;
  color: white;
  font-size: 2.5rem;
}

.page-header p {
  margin: 0;
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.1rem;
}

.friend-code-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.code-input-section, .your-code-section {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 1.5rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.code-input-section h3, .your-code-section h3 {
  margin: 0 0 1rem 0;
  color: #333;
}

.input-group {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.code-input {
  flex: 1;
  padding: 0.75rem;
  border: 3px solid;
  border-color: #cdb4db #a2d2ff #a2d2ff #cdb4db;
  border-radius: 0;
  font-size: 1rem;
  color: #333;
  background: #ffc8dd;
  box-shadow: inset 2px 2px 0 rgba(0, 0, 0, 0.1);
}

.code-input:focus {
  outline: none;
  border-color: #ffafcc #bde0fe #bde0fe #ffafcc;
  background: #ffafcc;
}

.add-friend-button {
  background: #ffc8dd;
  color: #333;
  border: 3px solid;
  border-color: #ffafcc #cdb4db #cdb4db #ffafcc;
  border-radius: 0;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  font-weight: 600;
  white-space: nowrap;
  box-shadow: inset -2px -2px 0 rgba(0, 0, 0, 0.2);
  transition: all 0.1s ease;
}

.add-friend-button:hover:not(:disabled) {
  background: #ffafcc;
  border-color: #cdb4db #ffafcc #ffafcc #cdb4db;
  transform: translate(2px, 2px);
  box-shadow: inset 2px 2px 0 rgba(0, 0, 0, 0.1);
}

.add-friend-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.code-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #bde0fe;
  padding: 0.75rem;
  border-radius: 0;
  border: 3px solid;
  border-color: #a2d2ff #cdb4db #cdb4db #a2d2ff;
  box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.1);
}

.code-text {
  flex: 1;
  font-family: monospace;
  font-weight: 600;
  color: #333;
}

.copy-button {
  background: #ffc8dd;
  border: 2px solid;
  border-color: #ffafcc #cdb4db #cdb4db #ffafcc;
  border-radius: 0;
  padding: 0.5rem;
  cursor: pointer;
  font-size: 1.2rem;
  box-shadow: inset -1px -1px 0 rgba(0, 0, 0, 0.15);
  transition: all 0.1s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-img {
  width: 20px;
  height: 20px;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
  flex-shrink: 0;
}

.copy-button:hover {
  background: #ffafcc;
  border-color: #cdb4db #ffafcc #ffafcc #cdb4db;
  transform: translate(1px, 1px);
  box-shadow: inset 1px 1px 0 rgba(0, 0, 0, 0.1);
}

.copy-feedback {
  margin-left: 0.5rem;
  color: #2d9a3a;
  font-weight: 600;
  font-size: 0.95rem;
  background: rgba(45, 154, 58, 0.08);
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  border: 1px solid rgba(45,154,58,0.12);
}

.friends-section {
  background: #bde0fe;
  border-radius: 0;
  padding: 1.5rem;
  border: 4px solid;
  border-color: #a2d2ff #cdb4db #cdb4db #a2d2ff;
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.2);
}

.friends-section h3 {
  margin: 0 0 1rem 0;
  color: #333;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.friends-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.friend-card {
  background: #ffc8dd;
  border-radius: 0;
  padding: 1rem;
  border: 3px solid;
  border-color: #ffafcc #cdb4db #cdb4db #ffafcc;
  cursor: pointer;
  transition: all 0.1s ease;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.15);
}

.friend-card:hover {
  background: #ffafcc;
  transform: translate(2px, 2px);
  box-shadow: 1px 1px 0 rgba(0, 0, 0, 0.15);
}

.friend-avatar {
  width: 50px;
  height: 50px;
}

.friend-avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.friend-info {
  flex: 1;
}

.friend-info h4 {
  margin: 0 0 0.25rem 0;
  color: #333;
}

.friend-status {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

.friend-actions {
  display: flex;
  gap: 0.5rem;
}

.remove-button {
  background: #ffc8dd;
  color: #333;
  border: 2px solid;
  border-color: #ffafcc #cdb4db #cdb4db #ffafcc;
  border-radius: 0;
  padding: 0.5rem;
  cursor: pointer;
  font-size: 1rem;
  box-shadow: inset -1px -1px 0 rgba(0, 0, 0, 0.15);
  transition: all 0.1s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-button:hover {
  background: #ffafcc;
  border-color: #cdb4db #ffafcc #ffafcc #cdb4db;
  transform: translate(1px, 1px);
  box-shadow: inset 1px 1px 0 rgba(0, 0, 0, 0.1);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 15px;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
}

.modal-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.friend-avatar-large {
  width: 100px;
  height: 100px;
}

.friend-avatar-large-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.error-message {
  background: rgba(220, 53, 69, 0.1);
  color: #dc3545;
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid rgba(220, 53, 69, 0.3);
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .friends-page {
    padding: 1rem;
  }
  
  .page-container {
    gap: 1rem;
  }
  
  .page-header h1 {
    font-size: 2em;
  }
  
  .page-header p {
    font-size: 1rem;
  }
  
  .friend-code-section {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 1rem;
  }
  
  .code-input-section h3, .your-code-section h3 {
    font-size: 1.2em;
  }
  
  .input-group {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .code-input {
    font-size: 0.9rem;
  }
  
  .add-friend-button {
    font-size: 0.9rem;
    padding: 0.6rem 1.2rem;
  }
  
  .friends-section {
    padding: 1rem;
  }
  
  .friends-section h3 {
    font-size: 1.4em;
  }
  
  .friends-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .friend-card {
    padding: 1rem;
  }
  
  .friend-name {
    font-size: 1.1em;
  }
}
</style>
