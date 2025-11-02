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
          <div class="spend-button-wrapper">
            <button 
              @click="spendPoints" 
              :disabled="userPoints < 10 || loading"
              class="spend-button"
              :title="userPoints < 10 ? `You need ${10 - userPoints} more points to unlock an avatar!` : ''"
            >
              <img v-if="!loading" :src="diceIcon" alt="Dice" class="dice-icon" />
              {{ loading ? 'Spending...' : 'Spend 10 Points' }}
            </button>
            <span v-if="userPoints < 10" class="insufficient-points-tooltip">
              <img :src="importantIcon" alt="Info" class="tooltip-icon" />
              Need {{ 10 - userPoints }} more points
            </span>
          </div>
        </div>
      </div>
      
      <!-- Current Avatar Section -->
      <div class="current-avatar-section">
        <h3>Current Avatar</h3>
        <div class="avatar-display">
          <img 
            :src="currentAvatar?.image || defaultAvatar" 
            :alt="currentAvatar?.name || 'Default Avatar'"
            class="current-avatar-img"
          />
            <div class="avatar-info">
            <h4>{{ currentAvatar?.name || 'Default Avatar' }}</h4>
            <p class="rarity">{{ currentAvatar?.rarity || 'common' }}</p>
            <!-- Stat affinity not displayed for current avatar -->
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
              :src="avatar.image || defaultAvatar" 
              :alt="avatar.name"
              class="avatar-img"
            />
            <div class="avatar-details">
              <h4>{{ avatar.name }}</h4>
              <p class="rarity">{{ avatar.rarity }}</p>
              <!-- Stat affinity not displayed for owned avatars -->
            </div>
          </div>
        </div>
      </div>
      
      <!-- Available Avatars Section -->
      <div class="available-avatars-section">
        <h3>Available Avatars</h3>
        <div class="unlock-info">
          <p class="info-text">
            <img :src="lightbulbIcon" alt="Tip" class="info-icon" />
            As you gain stats by completing arcs, new avatars will unlock and become available to collect through the random draw!
          </p>
        </div>
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
            :class="{ 'owned': isAvatarOwned(avatar), 'unlocked': isAvatarUnlocked(avatar) }"
          >
            <img 
              :src="avatar.image || defaultAvatar" 
              :alt="avatar.name"
              class="avatar-img"
            />
            <div class="avatar-details">
              <h4>{{ avatar.name }}</h4>
              <p class="rarity">{{ avatar.rarity }}</p>
                  <div v-if="avatar.statAffinity && avatar.statAffinity.length > 0" class="stat-affinity-small">
                    <div 
                      v-for="affinity in avatar.statAffinity" 
                      :key="affinity.stat"
                      class="affinity-small"
                    >
                      {{ affinity.stat }}+{{ affinity.number }}
                    </div>
                  </div>
            </div>
            <div v-if="!isAvatarUnlocked(avatar)" class="locked-overlay">
              <span class="locked-text">
                <img :src="lockIcon" alt="Locked" class="lock-icon" />
                Locked
              </span>
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
              :src="gachaResult?.image || defaultAvatar" 
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
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { apiService } from '../services/api'
import type { Avatar, StatData } from '../types'
import defaultAvatar from '../assets/default.png'
import diceIcon from '../assets/dice.png'
import importantIcon from '../assets/important.png'
import lightbulbIcon from '../assets/lightbulb.png'
import lockIcon from '../assets/lock.png'
import { enhanceAvatarWithImage, getAvatarImage } from '../utils/avatarUtils'

const authStore = useAuthStore()

// Data
const userPoints = ref(0)
const ownedAvatars = ref<Avatar[]>([])
const availableAvatars = ref<Avatar[]>([])
const currentAvatar = ref<Avatar | null>(null)
const showGachaModal = ref(false)
const gachaResult = ref<Avatar | null>(null)
const loading = ref(false)
const completedStats = ref<StatData>({
  HP: 0,
  Stamina: 0,
  Strength: 0,
  Agility: 0,
  Intelligence: 0
})

// Computed
const user = computed(() => authStore.user)

// Methods
const loadRewards = async () => {
  if (!user.value) return
  
  // For Rewarding operations, _id is the username, so prioritize username
  const userId = typeof user.value === 'string' 
    ? user.value 
    : (user.value as any)?.username || (user.value as any)?.id || String(user.value)
  
  try {
    // Load owned avatars and points
    const ownedResponse = await apiService.post('/Rewarding/listAvatars', {
      user: userId
    })
    // Backend returns { avatars: Avatar[] } where Avatar is an ID string
    const avatarIds = ownedResponse.data?.avatars || ownedResponse.data || []
    console.log('Loaded avatar IDs from backend:', avatarIds)
    
    // Try to get avatar definitions from backend to map IDs to names
    let avatarDefinitions: any[] = []
    if (Array.isArray(avatarIds) && avatarIds.length > 0) {
      try {
        const defResponse = await apiService.post('/Rewarding/getAvatarsByIds', {
          ids: avatarIds
        })
        avatarDefinitions = defResponse.data?.avatars || []
        console.log('Got avatar definitions from backend:', avatarDefinitions)
      } catch (error: any) {
        console.warn('Could not get avatar definitions by IDs, will try to enhance directly:', error.message || error)
      }
    }
    
    // Convert avatar IDs to avatar objects with images
    ownedAvatars.value = Array.isArray(avatarIds)
      ? avatarIds.map((id: string) => {
          // First, try to find the avatar definition from backend
          const def = avatarDefinitions.find((a: any) => a._id === id)
          if (def) {
            // Use the name from the definition
            const enhanced = enhanceAvatarWithImage(def.name)
            console.log(`Enhanced avatar ID "${id}" using definition "${def.name}" to:`, enhanced)
            return enhanced
          } else {
            // Fallback: try to enhance directly (works if ID is already a name)
            const enhanced = enhanceAvatarWithImage(id)
            console.log(`Enhanced avatar ID "${id}" directly to:`, enhanced)
            return enhanced
          }
        })
      : []
    
    // Load current avatar from backend
    try {
      const currentResponse = await apiService.post('/Rewarding/getCurrentAvatar', {
        user: userId
      })
      const currentAvatarId = currentResponse.data?.avatar || ''
      
      if (currentAvatarId && currentAvatarId !== '') {
        // Get avatar definition to get the name
        try {
          const defResponse = await apiService.post('/Rewarding/getAvatarsByIds', {
            ids: [currentAvatarId]
          })
          const avatarDefs = defResponse.data?.avatars || []
          if (avatarDefs.length > 0 && avatarDefs[0].name) {
            currentAvatar.value = enhanceAvatarWithImage(avatarDefs[0].name)
            console.log('Loaded current avatar from backend:', currentAvatar.value.name)
          } else {
            throw new Error('Avatar definition not found')
          }
        } catch (error: any) {
          console.warn('Could not get current avatar definition, using first owned avatar:', error.message)
          // Fallback to first owned avatar
          if (ownedAvatars.value.length > 0) {
            currentAvatar.value = ownedAvatars.value[0]
          }
        }
      } else {
        // No current avatar set, use first owned avatar
        if (ownedAvatars.value.length > 0) {
          currentAvatar.value = ownedAvatars.value[0]
        }
      }
    } catch (error: any) {
      console.warn('Could not load current avatar from backend, using first owned avatar:', error.message)
      // Fallback to first owned avatar
      if (ownedAvatars.value.length > 0) {
        currentAvatar.value = ownedAvatars.value[0]
      }
    }
    
    // Load user's points
    try {
      const pointsResponse = await apiService.post('/Rewarding/getPoints', { user: userId })
      // Handle different response structures
      const pointsValue = pointsResponse.data?.points ?? pointsResponse.data?.Points ?? pointsResponse.data ?? 0
      const parsedPoints = typeof pointsValue === 'number' ? pointsValue : Number(pointsValue) || 0
      // Force reactivity by creating a new number reference
      userPoints.value = parsedPoints
      console.log('Loaded user points:', userPoints.value, 'from response:', pointsResponse.data)
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.warn('getPoints endpoint not found. Please restart your backend server to register the endpoint.')
      }
      console.error('Could not load points:', error)
      userPoints.value = 0
    }
    
    // Load user's stats to determine which avatars are unlocked
    try {
      const statsResponse = await apiService.post('/StatTracking/getStats', {
        user: userId
      })
      const statsData = statsResponse.data?.stats || statsResponse.data
      if (statsData) {
        // Normalize stats - handle different backend response formats
        const keys: Array<[string, keyof StatData]> = [
          ['hp', 'HP'],
          ['stamina', 'Stamina'],
          ['strength', 'Strength'],
          ['agility', 'Agility'],
          ['intelligence', 'Intelligence']
        ]
        
        keys.forEach(([low, out]) => {
          const entry = statsData[low] ?? statsData[out]
          if (entry && typeof entry === 'object') {
            completedStats.value[out] = Number(entry.completed || 0)
          } else if (typeof entry === 'number') {
            completedStats.value[out] = entry
          } else {
            completedStats.value[out] = 0
          }
        })
        console.log('Loaded completed stats for avatar unlocking:', completedStats.value)
      }
    } catch (error) {
      console.error('Could not load stats:', error)
    }
    
    // Generate available avatars from seeded avatar definitions
    // In the future, this should come from a backend endpoint
    const availableAvatarNames = [
      'Voltaris', 'Vulpyx', 'Kael', 'Juniper', 
      'Thalassa', 'Yuki', 'Apollo', 'Aphrodite', 'Athena'
    ]
    availableAvatars.value = availableAvatarNames.map(name => enhanceAvatarWithImage(name))
    
  } catch (error) {
    console.error('Error loading rewards:', error)
  }
}

const spendPoints = async () => {
  if (userPoints.value < 10) return
  
  // For Rewarding operations, _id is the username, so prioritize username
  const userId = typeof user.value === 'string' 
    ? user.value 
    : (user.value as any)?.username || (user.value as any)?.id || String(user.value)
  
  loading.value = true
  
  try {
    // First, spend the points
    await apiService.post('/Rewarding/spendPoints', { 
      user: userId,
      points: 10 
    })
    
    // Deduct points
    userPoints.value -= 10
    
    // Get unlocked avatars (based on user stats)
    const unlockedAvatars = availableAvatars.value.filter(avatar => isAvatarUnlocked(avatar))
    
    if (unlockedAvatars.length === 0) {
      console.error('No unlocked avatars available')
      alert('No avatars are currently unlocked. Complete more arcs to unlock avatars!')
      // Refund points
      userPoints.value += 10
      await apiService.post('/Rewarding/earnPoints', { user: userId, points: 10 })
      return
    }
    
    // Get avatar IDs from backend
    // Since the database might have ObjectId-based IDs or name-based IDs, we need to be flexible
    let avatarIdsToUse: string[] = []
    
    // Strategy 1: Try to get all avatar IDs from backend (works with any ID format)
    try {
      const availableResponse = await apiService.post('/Rewarding/getAvailableAvatarIds', {
        user: userId
      })
      const allAvatarIds = availableResponse.data?.avatarIds || []
      
      if (allAvatarIds.length > 0) {
        avatarIdsToUse = allAvatarIds
        console.log('✅ Got all avatar IDs from backend:', avatarIdsToUse.length, 'avatars')
      } else {
        throw new Error('No avatar IDs returned from getAvailableAvatarIds')
      }
    } catch (error: any) {
      // Backend endpoint doesn't exist yet or returned error
      console.warn('Could not get available avatars from backend:', error.message || error)
      
      // Strategy 2: Try to map unlocked avatar names to their IDs
      const unlockedAvatarNames = unlockedAvatars.map(a => a.name)
      try {
        const avatarDefResponse = await apiService.post('/Rewarding/getAvatarsByName', {
          names: unlockedAvatarNames
        })
        const avatarDefs = avatarDefResponse.data?.avatars || []
        
        if (avatarDefs.length > 0) {
          avatarIdsToUse = avatarDefs.map((a: any) => a._id)
          console.log('✅ Mapped avatar names to IDs:', avatarIdsToUse.length, 'avatars')
        } else {
          throw new Error('No avatars found by name')
        }
      } catch (error2: any) {
        console.warn('Could not get avatar definitions by name:', error2.message || error2)
        
        // Strategy 3: Last resort - use names as IDs (only works if database uses names as IDs)
        // This will fail if database has ObjectIds, but it's the best we can do without backend support
        avatarIdsToUse = unlockedAvatarNames
        console.warn('⚠️ Using avatar names as IDs (last resort). This will only work if database uses names as IDs.')
        console.warn('   Please restart your backend server and re-seed the database for proper support.')
      }
    }
    
    if (avatarIdsToUse.length === 0) {
      console.error('No unlocked avatars available')
      alert('No avatars are currently unlocked. Complete more arcs to unlock avatars!')
      // Refund points
      userPoints.value += 10
      await apiService.post('/Rewarding/earnPoints', { user: userId, points: 10 })
      return
    }
    
    // Call backend to pick a random avatar
    console.log('Calling pickRandomAvatar with IDs:', avatarIdsToUse)
    const avatarResponse = await apiService.post('/Rewarding/pickRandomAvatar', {
      availableAvatarIds: avatarIdsToUse
    })
    
    console.log('Avatar response:', avatarResponse.data)
    
    if (avatarResponse.data?.error) {
      console.error('Error from pickRandomAvatar:', avatarResponse.data.error)
      
      // Provide helpful error message based on the error
      if (avatarResponse.data.error.includes('None of the provided avatar IDs are valid')) {
        alert(
          '❌ Avatar ID mismatch detected!\n\n' +
          'The database has different avatar IDs than expected. Please:\n\n' +
          '1. Re-seed the database:\n' +
          '   cd arc-hive\n' +
          '   deno run --allow-read --allow-write --allow-env --allow-net scripts/seedAvatars.ts\n\n' +
          '2. Restart your backend server to register new endpoints.'
        )
      } else {
        alert(`Error: ${avatarResponse.data.error}`)
      }
      
      // Refund points
      userPoints.value += 10
      await apiService.post('/Rewarding/earnPoints', { user: userId, points: 10 })
      return
    }
    
    const newAvatarId = avatarResponse.data?.avatar
    console.log('New avatar ID:', newAvatarId)
    
    if (!newAvatarId || newAvatarId === '') {
      console.error('No avatar ID returned from backend')
      alert('Failed to get an avatar. Please try again.')
      // Refund points
      userPoints.value += 10
      await apiService.post('/Rewarding/earnPoints', { user: userId, points: 10 })
      return
    }
    
    // Add avatar to backend owned list
    await apiService.post('/Rewarding/addAvatar', {
      user: userId,
      avatar: newAvatarId
    })
    
    // Convert avatar ID to avatar object with image
    // First try to get the avatar definition from backend to get the name
    let newAvatar: Avatar
    try {
      const defResponse = await apiService.post('/Rewarding/getAvatarsByIds', {
        ids: [newAvatarId]
      })
      const avatarDefs = defResponse.data?.avatars || []
      if (avatarDefs.length > 0 && avatarDefs[0].name) {
        // Use the name from the backend definition
        console.log('Got avatar definition from backend:', avatarDefs[0])
        newAvatar = enhanceAvatarWithImage(avatarDefs[0].name)
        console.log('Enhanced avatar using definition name:', newAvatar)
      } else {
        throw new Error('No avatar definition found')
      }
    } catch (error: any) {
      console.warn('Could not get avatar definition, enhancing directly with ID:', error.message || error)
      // Fallback: try to enhance directly (works if ID is already a name)
      newAvatar = enhanceAvatarWithImage(newAvatarId)
      console.log('Enhanced avatar directly with ID:', newAvatar)
    }
    
    // Ensure the avatar has the correct name and image
    if (!newAvatar.name || newAvatar.name === '' || newAvatar.name === newAvatarId) {
      console.warn('Avatar name is missing or same as ID! ID was:', newAvatarId, 'Name was:', newAvatar.name)
    }
    if (!newAvatar.image || newAvatar.image === '') {
      console.warn('Avatar image is missing! Name was:', newAvatar.name)
    }
    
    // Ensure ownedAvatars is an array before pushing
    if (!Array.isArray(ownedAvatars.value)) {
      ownedAvatars.value = []
    }
    
    // Add to owned avatars locally (avoid duplicates)
    if (!ownedAvatars.value.some(a => a.name === newAvatar.name)) {
      ownedAvatars.value.push(newAvatar)
    }
    
    // Set as current avatar automatically
    currentAvatar.value = newAvatar
    
    // Show gacha result - ensure it has proper data
    gachaResult.value = {
      ...newAvatar,
      name: newAvatar.name || newAvatarId, // Fallback to ID if name is missing
      image: newAvatar.image || defaultAvatar // Fallback to default image
    }
    showGachaModal.value = true
    console.log('Gacha modal should show now')
    
    // Reload to ensure everything is synced
    await loadRewards()
    
  } catch (error: any) {
    console.error('Error spending points:', error)
    alert(`Error: ${error.response?.data?.error || error.message || 'Failed to spend points'}`)
    // Try to refund points on error
    try {
      userPoints.value += 10
      await apiService.post('/Rewarding/earnPoints', { user: userId, points: 10 })
    } catch (refundError) {
      console.error('Could not refund points:', refundError)
    }
  } finally {
    loading.value = false
  }
}

const selectAvatar = async (avatar: Avatar) => {
  if (!user.value) return
  
  // For Rewarding operations, _id is the username, so prioritize username
  const userId = typeof user.value === 'string' 
    ? user.value 
    : (user.value as any)?.username || (user.value as any)?.id || String(user.value)
  
  // Get the avatar ID - need to find the ID that corresponds to this avatar name
  // First, try to find it in ownedAvatars to get the original ID
  const ownedAvatar = ownedAvatars.value.find(a => a.name === avatar.name)
  
  // We need to send the avatar ID (which might be ObjectId or name) to backend
  // Try to get it from the backend by looking up the avatar definition
  try {
    const defResponse = await apiService.post('/Rewarding/getAvatarsByName', {
      names: [avatar.name]
    })
    const avatarDefs = defResponse.data?.avatars || []
    if (avatarDefs.length > 0) {
      const avatarId = avatarDefs[0]._id
      // Save current avatar to backend
      await apiService.post('/Rewarding/setCurrentAvatar', {
        user: userId,
        avatar: avatarId
      })
      console.log('Saved current avatar to backend:', avatar.name, 'ID:', avatarId)
    } else {
      // Fallback: use name as ID (if database uses names as IDs)
      await apiService.post('/Rewarding/setCurrentAvatar', {
        user: userId,
        avatar: avatar.name as any
      })
      console.log('Saved current avatar to backend using name as ID:', avatar.name)
    }
  } catch (error: any) {
    console.error('Could not save current avatar to backend:', error)
    // Still update locally even if backend save fails
  }
  
  currentAvatar.value = avatar
  console.log('Selected avatar:', avatar.name)
  
  // Dispatch event to notify other components
  window.dispatchEvent(new CustomEvent('avatar-changed', { detail: { avatar } }))
}

const isAvatarOwned = (avatar: Avatar): boolean => {
  return ownedAvatars.value.some(owned => owned.name === avatar.name)
}

const isAvatarUnlocked = (avatar: Avatar): boolean => {
  if (!avatar.statAffinity || avatar.statAffinity.length === 0) {
    return true // If no requirements, it's unlocked
  }
  
  // Check if user's completed stats meet all stat affinity requirements
  for (const affinity of avatar.statAffinity) {
    // Map stat names from affinity to StatData keys (case-insensitive)
    const statNameMap: Record<string, keyof StatData> = {
      'HP': 'HP',
      'Hp': 'HP',
      'hp': 'HP',
      'Stamina': 'Stamina',
      'stamina': 'Stamina',
      'Strength': 'Strength',
      'strength': 'Strength',
      'Agility': 'Agility',
      'agility': 'Agility',
      'Intelligence': 'Intelligence',
      'intelligence': 'Intelligence'
    }
    
    const statKey = statNameMap[affinity.stat] || affinity.stat as keyof StatData
    const requiredValue = affinity.number
    const userValue = completedStats.value[statKey] || 0
    
    if (userValue < requiredValue) {
      return false // User doesn't meet this requirement
    }
  }
  
  return true // All requirements met
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

const onDailyRefresh = async () => {
  console.log('Daily refresh completed, reloading rewards...')
  // Add a delay to ensure backend operations are fully committed
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // Force reload rewards to get updated points
  const userId = typeof user.value === 'string' 
    ? user.value 
    : (user.value as any)?.username || (user.value as any)?.id || String(user.value)
  
  try {
    // Wait a bit more to ensure backend has fully updated
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // Reload points specifically first
    const pointsResponse = await apiService.post('/Rewarding/getPoints', { user: userId })
    const pointsValue = pointsResponse.data?.points ?? pointsResponse.data?.Points ?? pointsResponse.data ?? 0
    const parsedPoints = typeof pointsValue === 'number' ? pointsValue : Number(pointsValue) || 0
    
    // Force reactivity by assigning to ensure Vue detects the change
    userPoints.value = parsedPoints
    console.log('Points reloaded after daily refresh:', userPoints.value, 'from response:', pointsResponse.data)
    
    // Also reload full rewards to ensure everything is synced
    // Note: loadRewards will also update userPoints, but we just set it above so it should be the same
    await loadRewards()
    
    // Ensure the points value is still correct after loadRewards (in case it didn't update)
    if (userPoints.value !== parsedPoints) {
      userPoints.value = parsedPoints
      console.log('Points corrected after loadRewards:', userPoints.value)
    }
  } catch (error: any) {
    console.error('Error reloading points after daily refresh:', error)
    // Still try to reload rewards
    await loadRewards()
  }
  
  console.log('Rewards reloaded after daily refresh, final points:', userPoints.value)
}

onMounted(() => {
  loadRewards()
  
  // Listen for daily refresh to update points
  window.addEventListener('daily-refresh-completed', onDailyRefresh)
})

onUnmounted(() => {
  window.removeEventListener('daily-refresh-completed', onDailyRefresh)
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
  color: #bde0fe;
  text-shadow: 3px 3px 0 #a2d2ff, 6px 6px 0 rgba(0, 0, 0, 0.2);
}

.spend-button {
  background: #ffc8dd;
  color: #333;
  border: 3px solid;
  border-color: #ffafcc #cdb4db #cdb4db #ffafcc;
  border-radius: 0;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.1s ease;
  box-shadow: inset -2px -2px 0 rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.dice-icon {
  width: 20px;
  height: 20px;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
  flex-shrink: 0;
}

.spend-button:hover:not(:disabled) {
  background: #ffafcc;
  border-color: #cdb4db #ffafcc #ffafcc #cdb4db;
  transform: translate(2px, 2px);
  box-shadow: inset 2px 2px 0 rgba(0, 0, 0, 0.1);
}

.spend-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spend-button-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.insufficient-points-tooltip {
  font-size: 0.75rem;
  color: #ff6b6b;
  font-weight: 600;
  text-align: center;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.tooltip-icon {
  width: auto;
  height: 14px;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
  flex-shrink: 0;
  object-fit: contain;
}

.current-avatar-section, .owned-avatars-section, .available-avatars-section {
  background: #bde0fe;
  border-radius: 0;
  padding: 1.5rem;
  border: 4px solid;
  border-color: #a2d2ff #cdb4db #cdb4db #a2d2ff;
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.2);
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
  border: 4px solid rgba(255, 200, 221, 0.5);
  background: #ffffff;
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
  background: rgba(205, 180, 219, 0.2);
  color: #cdb4db;
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
  background: #ffc8dd;
  border-radius: 0;
  padding: 1rem;
  border: 3px solid;
  border-color: #ffafcc #cdb4db #cdb4db #ffafcc;
  cursor: pointer;
  transition: all 0.1s ease;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.15);
  min-height: 280px;
  gap: 0.5rem;
}

.avatar-card:hover {
  background: #ffafcc;
  transform: translate(2px, 2px);
  box-shadow: 1px 1px 0 rgba(0, 0, 0, 0.15);
}

.avatar-card.selected {
  border-color: #bde0fe #a2d2ff #a2d2ff #bde0fe;
  background: #a2d2ff;
}

.avatar-card.available {
  opacity: 0.7;
}

.avatar-card.available.owned,
.avatar-card.available.unlocked {
  opacity: 1;
}

.avatar-img {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  display: block;
  align-self: center;
}

.avatar-details {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
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
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.2rem;
  margin-top: 0.25rem;
}

.affinity-small {
  background: #a2d2ff;
  color: #333;
  padding: 0.1rem 0.3rem;
  border-radius: 0;
  font-size: 0.65rem;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
  border: 1px solid #bde0fe;
  box-shadow: 1px 1px 0 rgba(0, 0, 0, 0.1);
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
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.lock-icon {
  width: auto;
  height: 16px;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
  flex-shrink: 0;
  object-fit: contain;
}

.unlock-info {
  background: #ffffff;
  border: 3px solid;
  border-color: #e0e0e0 #a0a0a0 #a0a0a0 #e0e0e0;
  border-left: 6px solid #a2d2ff;
  border-radius: 0;
  padding: 1rem;
  margin-bottom: 1rem;
  box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.1);
}

.info-text {
  margin: 0;
  color: #555;
  font-size: 0.95rem;
  line-height: 1.5;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.info-icon {
  width: auto;
  height: 24px;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
  flex-shrink: 0;
  margin-top: 0.1rem;
  object-fit: contain;
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
  border: 4px solid rgba(255, 200, 221, 0.5);
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
  background: #ffc8dd;
  color: #333;
  border: 3px solid;
  border-color: #ffafcc #cdb4db #cdb4db #ffafcc;
  border-radius: 0;
  padding: 0.75rem 2rem;
  cursor: pointer;
  font-weight: 600;
  box-shadow: inset -2px -2px 0 rgba(0, 0, 0, 0.2);
  transition: all 0.1s ease;
}

.continue-button:hover {
  background: #ffafcc;
  border-color: #cdb4db #ffafcc #ffafcc #cdb4db;
  transform: translate(2px, 2px);
  box-shadow: inset 2px 2px 0 rgba(0, 0, 0, 0.1);
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
