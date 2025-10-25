<template>
  <div class="rewards-page">
    <div class="page-container">
      <div class="page-header">
        <h1>Rewards</h1>
        <p>Earn points and collect avatars</p>
      </div>
      
      <!-- Points Section -->
      <div class="points-section">
        <div class="points-display">
          <h3>Your Points</h3>
          <div class="points-value">{{ userPoints }}</div>
          <button 
            @click="spendPoints" 
            :disabled="userPoints < 10 || loading"
            class="spend-button"
          >
            {{ loading ? 'Spending...' : '🎲 Spend 10 Points' }}
          </button>
        </div>
      </div>
      
      <!-- Current Avatar Section -->
      <div class="current-avatar-section">
        <h3>Current Avatar</h3>
        <div class="avatar-display">
          <img 
            :src="currentAvatar?.image || '/default-avatar.png'" 
            :alt="currentAvatar?.name || 'Default Avatar'"
            class="current-avatar-img"
          />
          <div class="avatar-info">
            <h4>{{ currentAvatar?.name || 'Default Avatar' }}</h4>
            <p class="rarity">{{ currentAvatar?.rarity || 'common' }}</p>
            <div v-if="currentAvatar?.statAffinity" class="stat-affinity">
              <h5>Stat Affinity:</h5>
              <div class="affinity-list">
                <div 
                  v-for="affinity in currentAvatar.statAffinity" 
                  :key="affinity.stat"
                  class="affinity-item"
                >
                  {{ affinity.stat }}: +{{ affinity.number }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Owned Avatars Section -->
      <div class="owned-avatars-section">
        <h3>Your Avatars</h3>
        <div v-if="ownedAvatars.length === 0" class="empty-state">
          <p>No avatars yet. Complete arcs to earn points and get avatars!</p>
        </div>
        <div v-else class="avatars-grid">
          <div 
            v-for="avatar in ownedAvatars" 
            :key="avatar.name"
            class="avatar-card"
            :class="{ 'selected': avatar.name === currentAvatar?.name }"
            @click="selectAvatar(avatar)"
          >
            <img 
              :src="avatar.image || '/default-avatar.png'" 
              :alt="avatar.name"
              class="avatar-img"
            />
            <div class="avatar-details">
              <h4>{{ avatar.name }}</h4>
              <p class="rarity">{{ avatar.rarity }}</p>
              <div v-if="avatar.statAffinity" class="stat-affinity-small">
                <div 
                  v-for="affinity in avatar.statAffinity.slice(0, 2)" 
                  :key="affinity.stat"
                  class="affinity-small"
                >
                  {{ affinity.stat }}+{{ affinity.number }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Available Avatars Section -->
      <div class="available-avatars-section">
        <h3>Available Avatars</h3>
        <div class="rarity-info">
          <div class="rarity-item">
            <span class="rarity-color common">●</span>
            <span>Common (65%)</span>
          </div>
          <div class="rarity-item">
            <span class="rarity-color rare">●</span>
            <span>Rare (25%)</span>
          </div>
          <div class="rarity-item">
            <span class="rarity-color epic">●</span>
            <span>Epic (9.5%)</span>
          </div>
          <div class="rarity-item">
            <span class="rarity-color legendary">●</span>
            <span>Legendary (0.5%)</span>
          </div>
        </div>
        
        <div v-if="availableAvatars.length === 0" class="empty-state">
          <p>No available avatars. Complete more arcs to unlock new avatars!</p>
        </div>
        <div v-else class="avatars-grid">
          <div 
            v-for="avatar in availableAvatars" 
            :key="avatar.name"
            class="avatar-card available"
          >
            <img 
              :src="avatar.image || '/default-avatar.png'" 
              :alt="avatar.name"
              class="avatar-img"
            />
            <div class="avatar-details">
              <h4>{{ avatar.name }}</h4>
              <p class="rarity">{{ avatar.rarity }}</p>
              <div v-if="avatar.statAffinity" class="stat-affinity-small">
                <div 
                  v-for="affinity in avatar.statAffinity.slice(0, 2)" 
                  :key="affinity.stat"
                  class="affinity-small"
                >
                  {{ affinity.stat }}+{{ affinity.number }}
                </div>
              </div>
            </div>
            <div class="locked-overlay">
              <span class="locked-text">🔒 Locked</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Gacha Result Modal -->
    <div v-if="showGachaModal" class="modal-overlay" @click="closeGachaModal">
      <div class="modal-content gacha-modal" @click.stop>
        <div class="modal-header">
          <h3>🎉 New Avatar!</h3>
          <button @click="closeGachaModal" class="close-button">✕</button>
        </div>
        <div class="modal-body">
          <div class="gacha-result">
            <img 
              :src="gachaResult?.image || '/default-avatar.png'" 
              :alt="gachaResult?.name || 'New Avatar'"
              class="gacha-avatar-img"
            />
            <div class="gacha-info">
              <h4>{{ gachaResult?.name || 'New Avatar' }}</h4>
              <p class="rarity">{{ gachaResult?.rarity || 'common' }}</p>
              <div v-if="gachaResult?.statAffinity" class="stat-affinity">
                <h5>Stat Affinity:</h5>
                <div class="affinity-list">
                  <div 
                    v-for="affinity in gachaResult.statAffinity" 
                    :key="affinity.stat"
                    class="affinity-item"
                  >
                    {{ affinity.stat }}: +{{ affinity.number }}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="gacha-actions">
            <button @click="closeGachaModal" class="continue-button">
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { apiService } from '../services/api'
import type { Avatar } from '../types'

const authStore = useAuthStore()

// Data
const userPoints = ref(0)
const ownedAvatars = ref<Avatar[]>([])
const availableAvatars = ref<Avatar[]>([])
const currentAvatar = ref<Avatar | null>(null)
const showGachaModal = ref(false)
const gachaResult = ref<Avatar | null>(null)
const loading = ref(false)

// Computed
const user = computed(() => authStore.user)

// Methods
const loadRewards = async () => {
  if (!user.value) return
  
  try {
    // Load owned avatars
    const ownedResponse = await apiService.post('/api/Rewarding/listAvatars', {
      user: user.value
    })
    ownedAvatars.value = ownedResponse.data || []
    
    if (ownedAvatars.value.length > 0) {
      currentAvatar.value = ownedAvatars.value[0] // Use first avatar as default
    }
    
    // Load available avatars (this would need to be implemented in backend)
    // For now, we'll create some sample avatars
    availableAvatars.value = generateSampleAvatars()
    
  } catch (error) {
    console.error('Error loading rewards:', error)
  }
}

const spendPoints = async () => {
  if (userPoints.value < 10) return
  
  loading.value = true
  
  try {
    const randomAvatar = pickRandomAvatar(availableAvatars.value)
    if (randomAvatar) {
      // Add to owned avatars
      ownedAvatars.value.push(randomAvatar)
      
      // Deduct points (this would need backend implementation)
      userPoints.value -= 10
      
      // Show gacha result
      gachaResult.value = randomAvatar
      showGachaModal.value = true
    }
    
  } catch (error) {
    console.error('Error spending points:', error)
  } finally {
    loading.value = false
  }
}

const selectAvatar = (avatar: Avatar) => {
  currentAvatar.value = avatar
}

const pickRandomAvatar = (avatars: Avatar[]): Avatar | null => {
  if (avatars.length === 0) return null
  
  const randomIndex = Math.floor(Math.random() * avatars.length)
  return avatars[randomIndex] || null
}

const generateSampleAvatars = (): Avatar[] => {
  return [
    {
      name: 'Fire Warrior',
      rarity: 'rare',
      image: '/avatar-fire-warrior.png',
      statAffinity: [
        { stat: 'Strength', number: 5 },
        { stat: 'HP', number: 3 }
      ]
    },
    {
      name: 'Wind Mage',
      rarity: 'epic',
      image: '/avatar-wind-mage.png',
      statAffinity: [
        { stat: 'Intelligence', number: 7 },
        { stat: 'Agility', number: 4 }
      ]
    },
    {
      name: 'Earth Guardian',
      rarity: 'legendary',
      image: '/avatar-earth-guardian.png',
      statAffinity: [
        { stat: 'HP', number: 10 },
        { stat: 'Stamina', number: 8 },
        { stat: 'Strength', number: 6 }
      ]
    },
    {
      name: 'Water Healer',
      rarity: 'common',
      image: '/avatar-water-healer.png',
      statAffinity: [
        { stat: 'Stamina', number: 3 },
        { stat: 'Intelligence', number: 2 }
      ]
    }
  ]
}

const closeGachaModal = () => {
  showGachaModal.value = false
  gachaResult.value = null
}

onMounted(() => {
  loadRewards()
})
</script>

<style scoped>
.rewards-page {
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

.points-section {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 1.5rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.points-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.points-display h3 {
  margin: 0;
  color: #333;
}

.points-value {
  font-size: 2rem;
  font-weight: bold;
  background: linear-gradient(45deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.spend-button {
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  transition: transform 0.2s ease;
}

.spend-button:hover:not(:disabled) {
  transform: translateY(-1px);
}

.spend-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.current-avatar-section, .owned-avatars-section, .available-avatars-section {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 1.5rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.current-avatar-section h3, .owned-avatars-section h3, .available-avatars-section h3 {
  margin: 0 0 1rem 0;
  color: #333;
}

.avatar-display {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.current-avatar-img {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid rgba(102, 126, 234, 0.3);
}

.avatar-info h4 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.rarity {
  margin: 0 0 1rem 0;
  color: #666;
  text-transform: capitalize;
  font-weight: 600;
}

.stat-affinity h5 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 0.9rem;
}

.affinity-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.affinity-item {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  padding: 0.25rem 0.5rem;
  border-radius: 5px;
  font-size: 0.8rem;
  font-weight: 600;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.avatars-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.avatar-card {
  background: rgba(102, 126, 234, 0.1);
  border-radius: 10px;
  padding: 1rem;
  border: 2px solid rgba(102, 126, 234, 0.2);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.avatar-card:hover {
  background: rgba(102, 126, 234, 0.15);
  transform: translateY(-2px);
}

.avatar-card.selected {
  border-color: #28a745;
  background: rgba(40, 167, 69, 0.1);
}

.avatar-card.available {
  opacity: 0.7;
}

.avatar-img {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  margin: 0 auto 0.5rem auto;
  display: block;
}

.avatar-details {
  text-align: center;
}

.avatar-details h4 {
  margin: 0 0 0.25rem 0;
  color: #333;
  font-size: 0.9rem;
}

.avatar-details .rarity {
  margin: 0 0 0.5rem 0;
  font-size: 0.8rem;
}

.stat-affinity-small {
  display: flex;
  justify-content: center;
  gap: 0.25rem;
}

.affinity-small {
  background: rgba(118, 75, 162, 0.2);
  color: #764ba2;
  padding: 0.125rem 0.25rem;
  border-radius: 3px;
  font-size: 0.7rem;
  font-weight: 600;
}

.locked-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.locked-text {
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
}

.rarity-info {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.rarity-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #666;
}

.rarity-color {
  font-size: 1.2rem;
}

.rarity-color.common { color: #6c757d; }
.rarity-color.rare { color: #007bff; }
.rarity-color.epic { color: #6f42c1; }
.rarity-color.legendary { color: #fd7e14; }

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
  max-width: 500px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
}

.gacha-modal {
  max-width: 400px;
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
}

.gacha-result {
  text-align: center;
  margin-bottom: 1.5rem;
}

.gacha-avatar-img {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  margin: 0 auto 1rem auto;
  display: block;
  border: 4px solid rgba(102, 126, 234, 0.3);
}

.gacha-info h4 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.gacha-info .rarity {
  margin: 0 0 1rem 0;
  font-weight: 600;
}

.gacha-actions {
  display: flex;
  justify-content: center;
}

.continue-button {
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
}

@media (max-width: 768px) {
  .points-display {
    flex-direction: column;
    text-align: center;
  }
  
  .avatar-display {
    flex-direction: column;
    text-align: center;
  }
  
  .avatars-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
  
  .rarity-info {
    flex-direction: column;
    align-items: center;
  }
}
</style>
