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
        <button @click="copyCode" class="copy-button">📋</button>
        <span class="copy-feedback" v-if="copySuccess" role="status" aria-live="polite">Copied!</span>
          </div>
        </div>
      </div>
      
      <!-- Friends List -->
      <div class="friends-section">
        <h3>Your Friends ({{ friends.length }})</h3>
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
                🗑️
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
import { ref, onMounted, computed, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import { apiService } from '../services/api'
import type { Friend } from '../types'
import defaultAvatar from '../assets/default.png'
import FriendStatsModal from '../components/FriendStatsModal.vue'
import { enhanceAvatarWithImage, getAvatarImage } from '../utils/avatarUtils'

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
    const response = await apiService.post('/Friending/listFriends', {
      user: user.value
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
    
    // Load each friend's current avatar
    const friendsWithAvatars = await Promise.all(
      friendList.map(async (friend: Friend) => {
        const friendId = typeof friend === 'string' ? friend : (friend as any).username || (friend as any).id || String(friend)
        
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
              return {
                ...friend,
                avatar: getAvatarImage(avatar.name, 1) // Use frame 1 for profile picture
              }
            }
          }
        } catch (error: any) {
          console.warn(`Could not load avatar for friend ${friendId}:`, error.message || error)
        }
        
        // Fallback: no avatar or error loading
        return {
          ...friend,
          avatar: defaultAvatar
        }
      })
    )
    
    friends.value = friendsWithAvatars
    // Normalize friend entries: backend may return simple username strings.
    friends.value = friends.value.map((f: any) => {
      if (typeof f === 'string') return { username: f }
      return f
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
    // Generate friend code if it doesn't exist on the backend
    try {
      const generateResponse = await apiService.post('/Friending/generateFriendCode', {
        user: user.value
      })
  const raw2 = generateResponse.data?.friendCode ?? generateResponse.data?.friendcode ?? ''
  userFriendCode.value = formatFriendCode(raw2)
    } catch (generateError) {
      console.error('Error generating friend code:', generateError)
      // As a fallback, use any friendCode on the client-side user object
      if ((user.value as any).friendCode) {
        userFriendCode.value = formatFriendCode((user.value as any).friendCode)
      }
    }
  }
}

const addFriend = async () => {
  if (!friendCodeInput.value.trim()) return
  
  loading.value = true
  error.value = ''
  
  try {
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
    
    if (friendUser.username === user.value.username) {
      error.value = "You can't add yourself as a friend!"
      return
    }
    
    // Check if already friends
    const areFriendsResponse = await apiService.post('/Friending/areFriends', {
      userA: user.value,
      userB: friendUser
    })
    
    if (areFriendsResponse.data.areFriends) {
      error.value = 'You are already friends with this user!'
      return
    }
    
    // Add friend
    await apiService.post('/Friending/addFriend', {
      from: user.value!,
      to: friendUser
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
  if (!confirm(`Are you sure you want to remove ${friend.username} from your friends?`)) {
    return
  }
  
  try {
    await apiService.post('/Friending/removeFriend', {
      from: user.value!,
      to: friend
    })
    
    await loadFriends()
  } catch (error) {
    console.error('Error removing friend:', error)
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

    // If username is missing on the friend object, try to fetch friend details by id/username
    if (selectedFriend.value && !selectedFriend.value.username) {
      try {
        const userResp = await apiService.post('/Friending/getUserById', { id: userIdString })
        const u = userResp.data?.user ?? userResp.data
        if (u && selectedFriend.value) selectedFriend.value.username = u.username || u.name || userIdString
      } catch (ue) {
        // ignore: optional enrichment
        console.debug('Could not fetch friend details:', ue)
      }
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
  background: rgba(220, 53, 69, 0.1);
  border: 1px solid rgba(220, 53, 69, 0.3);
  border-radius: 5px;
  padding: 0.5rem;
  cursor: pointer;
  font-size: 1rem;
}

.remove-button:hover {
  background: rgba(220, 53, 69, 0.2);
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
  .friend-code-section {
    grid-template-columns: 1fr;
  }
  
  .friends-grid {
    grid-template-columns: 1fr;
  }
}
</style>
