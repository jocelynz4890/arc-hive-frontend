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
            :key="friend.username" 
            class="friend-card"
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
              <p class="friend-status">Active</p>
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
    
    <!-- Friend Stats Modal -->
    <div v-if="selectedFriend" class="modal-overlay" @click="closeFriendModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ selectedFriend.username }}'s Stats</h3>
          <button @click="closeFriendModal" class="close-button">✕</button>
        </div>
        <div class="modal-body">
          <div class="friend-avatar-large">
            <img 
              :src="selectedFriend.avatar || '/default-avatar.png'" 
              :alt="selectedFriend.username"
              class="friend-avatar-large-img"
            />
          </div>
          <StatsCard 
            :total-stats="selectedFriend.totalStats || defaultStats" 
            :completed-stats="selectedFriend.completedStats || defaultStats" 
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { apiService } from '../services/api'
import StatsCard from '../components/StatsCard.vue'
import type { Friend, StatData } from '../types'

const authStore = useAuthStore()

// Data
const friends = ref<Friend[]>([])
const userFriendCode = ref('')
const friendCodeInput = ref('')
const loading = ref(false)
const error = ref('')
const selectedFriend = ref<Friend | null>(null)

const defaultStats: StatData = {
  HP: 0,
  Stamina: 0,
  Strength: 0,
  Agility: 0,
  Intelligence: 0
}

// Computed
const user = computed(() => authStore.user)

// Methods
const loadFriends = async () => {
  if (!user.value) return
  
  try {
    const response = await apiService.post('/api/Friending/listFriends', {
      user: user.value
    })
    friends.value = response.data || []
  } catch (error) {
    console.error('Error loading friends:', error)
  }
}

const loadFriendCode = async () => {
  if (!user.value) return
  
  try {
    const response = await apiService.post('/api/Friending/getFriendCodeByUsername', {
      username: user.value.username
    })
    userFriendCode.value = response.data.friendcode
  } catch (error) {
    // Generate friend code if it doesn't exist
    try {
      const generateResponse = await apiService.post('/api/Friending/generateFriendCode', {
        user: user.value
      })
      userFriendCode.value = generateResponse.data.friendCode
    } catch (generateError) {
      console.error('Error generating friend code:', generateError)
    }
  }
}

const addFriend = async () => {
  if (!friendCodeInput.value.trim()) return
  
  loading.value = true
  error.value = ''
  
  try {
    // Get user by friend code
    const userResponse = await apiService.post('/api/Friending/getUserByFriendCode', {
      friendCode: friendCodeInput.value.trim()
    })
    
    const friendUser = userResponse.data.user
    
    if (friendUser.username === user.value.username) {
      error.value = "You can't add yourself as a friend!"
      return
    }
    
    // Check if already friends
    const areFriendsResponse = await apiService.post('/api/Friending/areFriends', {
      userA: user.value,
      userB: friendUser
    })
    
    if (areFriendsResponse.data.areFriends) {
      error.value = 'You are already friends with this user!'
      return
    }
    
    // Add friend
    await apiService.post('/api/Friending/addFriend', {
      from: user.value!,
      to: friendUser
    })
    
    // Reload friends list
    await loadFriends()
    friendCodeInput.value = ''
    
  } catch (error: any) {
    error.value = error.response?.data?.error || 'Failed to add friend'
  } finally {
    loading.value = false
  }
}

const removeFriend = async (friend: Friend) => {
  if (!confirm(`Are you sure you want to remove ${friend.username} from your friends?`)) {
    return
  }
  
  try {
    await apiService.post('/api/Friending/removeFriend', {
      from: user.value!,
      to: friend
    })
    
    await loadFriends()
  } catch (error) {
    console.error('Error removing friend:', error)
  }
}

const viewFriend = async (friend: Friend) => {
  selectedFriend.value = friend
  
  // Load friend's stats
  try {
    const statsResponse = await apiService.post('/api/StatTracking/getStats', {
      user: friend
    })
    
    if (statsResponse.data.stats) {
      selectedFriend.value.totalStats = statsResponse.data.stats
      selectedFriend.value.completedStats = statsResponse.data.stats // Simplified for now
    }
  } catch (error) {
    console.error('Error loading friend stats:', error)
  }
}

const closeFriendModal = () => {
  selectedFriend.value = null
}

const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(userFriendCode.value)
    // Could add a toast notification here
  } catch (error) {
    console.error('Failed to copy code:', error)
  }
}

onMounted(() => {
  loadFriends()
  loadFriendCode()
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
  border: 2px solid rgba(102, 126, 234, 0.2);
  border-radius: 8px;
  font-size: 1rem;
}

.code-input:focus {
  outline: none;
  border-color: #667eea;
}

.add-friend-button {
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  white-space: nowrap;
}

.add-friend-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.code-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(102, 126, 234, 0.1);
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid rgba(102, 126, 234, 0.3);
}

.code-text {
  flex: 1;
  font-family: monospace;
  font-weight: 600;
  color: #333;
}

.copy-button {
  background: rgba(102, 126, 234, 0.2);
  border: none;
  padding: 0.5rem;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1.2rem;
}

.friends-section {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 1.5rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
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
  background: rgba(102, 126, 234, 0.1);
  border-radius: 10px;
  padding: 1rem;
  border: 1px solid rgba(102, 126, 234, 0.2);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.friend-card:hover {
  background: rgba(102, 126, 234, 0.2);
  transform: translateY(-2px);
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
