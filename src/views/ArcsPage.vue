<template>
  <div class="arcs-page">
    <div class="page-container">
      <div class="page-header">
        <h1>Your Arcs</h1>
        <p>Track habits and build streaks with your friends</p>
        <button @click="showCreateArcModal = true" class="create-arc-button">
          ➕ Create New Arc
        </button>
      </div>
      
      <!-- Arcs List -->
      <div class="arcs-section">
        <div v-if="userArcs.length === 0" class="empty-state">
          <h3>No arcs yet</h3>
          <p>Create your first arc to start tracking habits!</p>
        </div>
        <div v-else class="arcs-grid">
          <div 
            v-for="arc in paginatedArcs" 
            :key="arc.id" 
            class="arc-card"
            :class="{ 'completed-today': isCompletedToday(arc) }"
            @click="toggleProgress(arc)"
          >
            <div class="arc-header">
              <h3>{{ arc.name }}</h3>
              <div class="arc-streak">{{ arc.streak }} days</div>
            </div>
            
            <div class="arc-stat">
              <span class="stat-label">{{ arc.stat }}</span>
            </div>
            
            <div class="arc-members">
              <h4>Members ({{ arc.members.length }})</h4>
              <div class="members-list">
                <div 
                  v-for="member in arc.members" 
                  :key="member.username"
                  class="member-item"
                >
                  <img 
                    :src="(member as Friend).avatar || defaultAvatar" 
                    :alt="member.username"
                    class="member-avatar"
                  />
                  <span class="member-name">{{ member.username }}</span>
                </div>
              </div>
            </div>
            
            <div class="progress-section">
              <h4>Today's Progress</h4>
              <div class="progress-lists">
                <div class="completed-list">
                  <h5>✅ Completed</h5>
                  <div v-if="getCompletedMembers(arc).length === 0" class="no-members">
                    No one yet
                  </div>
                  <div v-else>
                    <div 
                      v-for="member in getCompletedMembers(arc)" 
                      :key="member.user.username"
                      class="member-progress completed"
                    >
                      {{ member.user.username }}
                    </div>
                  </div>
                </div>
                
                <div class="incomplete-list">
                  <h5>⏳ Incomplete</h5>
                  <div v-if="getIncompleteMembers(arc).length === 0" class="no-members">
                    Everyone done!
                  </div>
                  <div v-else>
                    <div 
                      v-for="member in getIncompleteMembers(arc)" 
                      :key="member.username"
                      class="member-progress incomplete"
                    >
                      {{ member.username }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="arc-actions">
              <button @click.stop="editArc(arc)" class="edit-button">
                ✏️ Edit Members
              </button>
            </div>
          </div>
        </div>
        
        <!-- Pagination -->
        <div v-if="totalPages > 1" class="pagination">
          <button 
            @click="currentPage--" 
            :disabled="currentPage === 1"
            class="page-button"
          >
            ← Previous
          </button>
          <span class="page-info">
            Page {{ currentPage }} of {{ totalPages }}
          </span>
          <button 
            @click="currentPage++" 
            :disabled="currentPage === totalPages"
            class="page-button"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
    
    <!-- Create Arc Modal -->
    <div v-if="showCreateArcModal" class="modal-overlay" @click="closeCreateArcModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Create New Arc</h3>
          <button @click="closeCreateArcModal" class="close-button">✕</button>
        </div>
        <form @submit.prevent="createArc" class="modal-body">
          <div class="form-group">
            <label for="arc-name">Arc Name</label>
            <input
              id="arc-name"
              v-model="newArc.name"
              type="text"
              required
              placeholder="Enter arc name"
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label for="arc-stat">Stat Type</label>
            <select id="arc-stat" v-model="newArc.stat" required class="form-input">
              <option value="">Select a stat</option>
              <option value="HP">HP</option>
              <option value="Stamina">Stamina</option>
              <option value="Strength">Strength</option>
              <option value="Agility">Agility</option>
              <option value="Intelligence">Intelligence</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>Add Members</label>
            <div class="members-selection">
              <div 
                v-for="friend in friends" 
                :key="friend.username"
                class="member-option"
              >
                <input
                  :id="`member-${friend.username}`"
                  v-model="newArc.members"
                  :value="friend"
                  type="checkbox"
                  class="member-checkbox"
                />
                <label :for="`member-${friend.username}`" class="member-label">
                  <img 
                    :src="friend.avatar || defaultAvatar" 
                    :alt="friend.username"
                    class="member-avatar-small"
                  />
                  {{ friend.username }}
                </label>
              </div>
            </div>
          </div>
          
          <div class="form-actions">
            <button type="button" @click="closeCreateArcModal" class="cancel-button">
              Cancel
            </button>
            <button type="submit" :disabled="loading" class="submit-button">
              {{ loading ? 'Creating...' : 'Create Arc' }}
            </button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- Edit Arc Modal -->
    <div v-if="showEditArcModal" class="modal-overlay" @click="closeEditArcModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Edit Arc Members</h3>
          <button @click="closeEditArcModal" class="close-button">✕</button>
        </div>
        <form @submit.prevent="updateArcMembers" class="modal-body">
          <div class="form-group">
            <label>Add Members</label>
            <div class="members-selection">
              <div 
                v-for="friend in friends" 
                :key="friend.username"
                class="member-option"
              >
                <input
                  :id="`edit-member-${friend.username}`"
                  v-model="editingArcMembers"
                  :value="friend"
                  type="checkbox"
                  class="member-checkbox"
                />
                <label :for="`edit-member-${friend.username}`" class="member-label">
                  <img 
                      :src="friend.avatar || defaultAvatar" 
                      :alt="friend.username"
                      class="member-avatar-small"
                    />
                  {{ friend.username }}
                </label>
              </div>
            </div>
          </div>
          
          <div class="form-actions">
            <button type="button" @click="closeEditArcModal" class="cancel-button">
              Cancel
            </button>
            <button type="submit" :disabled="loading" class="submit-button">
              {{ loading ? 'Updating...' : 'Update Members' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import { apiService } from '../services/api'
import type { Arc, Friend, User } from '../types'
import defaultAvatar from '../assets/default.png'
import { enhanceAvatarWithImage, getAvatarImage } from '../utils/avatarUtils'

const authStore = useAuthStore()

// Data
const userArcs = ref<Arc[]>([])
const friends = ref<Friend[]>([])
const showCreateArcModal = ref(false)
const showEditArcModal = ref(false)
const loading = ref(false)
const currentPage = ref(1)
const itemsPerPage = 10
const editingArc = ref<Arc | null>(null)
const editingArcMembers = ref<Friend[]>([])

const newArc = ref({
  name: '',
  stat: '',
  members: [] as Friend[]
})

// Computed
const user = computed(() => authStore.user)

const paginatedArcs = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return userArcs.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(userArcs.value.length / itemsPerPage)
})

// Methods
const loadArcs = async () => {
  if (!user.value) {
    console.log('No user available, cannot load arcs')
    return
  }
  
  try {
    console.log('Loading arcs for user:', user.value)
    // Backend expects user as a string identifier
    const userId = typeof user.value === 'string' 
      ? user.value 
      : (user.value as any)?.username || (user.value as any)?.id || String(user.value)
    
    console.log('Sending user ID to backend:', userId)
    const response = await apiService.post('/ArcTracking/getArcs', {
      user: userId
    })
    const arcsData = response.data
    console.log('Raw arcs data from API:', arcsData)
    
    // Normalize returned arcs into a consistent shape so the UI always has
    // { id, name, stat, members: [{username, avatar}], streak, progress: [{ user: { username }, dailyProgress }] }
    if (Array.isArray(arcsData)) {
      console.log('Arcs data is array, fetching full details...')
      // If it's an array, fetch full details for each arc
      const fullArcs = await Promise.all(
        arcsData.map(async (arc: any) => {
          const arcDetails = await apiService.post('/ArcTracking/getArc', { arc: arc.id || arc })
          return normalizeArc(arcDetails.data?.arc || arcDetails.data || arc)
        })
      )
      // Load avatars for all members in all arcs
      const arcsWithAvatars = await Promise.all(
        fullArcs.map(async (arc: any) => {
          const membersWithAvatars = await Promise.all(
            arc.members.map(async (member: any) => {
              if (!member.username) return member
              
              try {
                // Get member's current avatar
                const avatarResponse = await apiService.post('/Rewarding/getCurrentAvatar', {
                  user: member.username
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
                      ...member,
                      avatar: getAvatarImage(avatar.name, 1) // Use frame 1 for profile picture
                    }
                  }
                }
              } catch (error: any) {
                console.warn(`Could not load avatar for member ${member.username}:`, error.message || error)
              }
              
              // Fallback: no avatar or error loading
              return {
                ...member,
                avatar: defaultAvatar
              }
            })
          )
          return {
            ...arc,
            members: membersWithAvatars
          }
        })
      )
      // Force reactivity by creating a new array reference
      userArcs.value = [...arcsWithAvatars]
    } else if (arcsData && Array.isArray(arcsData.arcs)) {
      console.log('Arcs data has arcs property, fetching full details...', arcsData.arcs)
      // Backend returns { arcs: [id1, id2, ...] }, fetch full details for each arc ID
      const fullArcs = await Promise.all(
        arcsData.arcs.map(async (arcId: string) => {
          try {
            console.log('Fetching details for arc:', arcId)
            const arcResponse = await apiService.post('/ArcTracking/getArc', { arc: arcId })
            console.log('Arc response:', arcResponse.data)
            const arcData = arcResponse.data?.arc || arcResponse.data
            console.log('Normalizing arc data:', arcData)
            const normalized = normalizeArc(arcData)
            console.log('Normalized arc:', normalized)
            return normalized
          } catch (error) {
            console.error(`Error fetching arc ${arcId}:`, error)
            // Return null so we can filter out failed fetches
            return null
          }
        })
      )
      // Filter out any null results from failed fetches
      const validArcs = fullArcs.filter((arc: any) => arc !== null)
      
      // Load avatars for all members in all arcs
      const arcsWithAvatars = await Promise.all(
        validArcs.map(async (arc: any) => {
          const membersWithAvatars = await Promise.all(
            arc.members.map(async (member: any) => {
              if (!member.username) return member
              
              try {
                // Get member's current avatar
                const avatarResponse = await apiService.post('/Rewarding/getCurrentAvatar', {
                  user: member.username
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
                      ...member,
                      avatar: getAvatarImage(avatar.name, 1) // Use frame 1 for profile picture
                    }
                  }
                }
              } catch (error: any) {
                console.warn(`Could not load avatar for member ${member.username}:`, error.message || error)
              }
              
              // Fallback: no avatar or error loading
              return {
                ...member,
                avatar: defaultAvatar
              }
            })
          )
          return {
            ...arc,
            members: membersWithAvatars
          }
        })
      )
      
      // Force reactivity by creating a new array reference
      userArcs.value = [...arcsWithAvatars]
      console.log('Final arcs array:', userArcs.value)
      console.log('Arc progress details:', userArcs.value.map(a => ({
        name: a.name,
        streak: a.streak,
        progress: a.progress
      })))
    } else {
      console.log('No arcs found or unexpected format, arcsData:', arcsData)
      userArcs.value = []
    }
    console.log('Normalized arcs:', userArcs.value)
  } catch (error) {
    console.error('Error loading arcs:', error)
  }
}

// Normalize an arc object from the server into a predictable shape
const normalizeArc = (raw: any) => {
  if (!raw) return { id: '', name: '', stat: '', members: [], streak: 0, progress: [] }

  // Preserve _id from MongoDB since that's what the backend uses for lookups
  const id = raw._id ?? raw.id ?? raw.name ?? ''
  const name = raw.name ?? raw.title ?? raw.id ?? raw._id ?? id
  const stat = raw.stat ?? ''
  const streak = Number(raw.streak || 0)

  // Normalize members: may be array of strings or user objects or nested objects
  const membersRaw = Array.isArray(raw.members) ? raw.members : (Array.isArray(raw.Members) ? raw.Members : [])
  const members = membersRaw.map((m: any) => {
    if (!m) return { username: '', avatar: '' }
    if (typeof m === 'string') return { username: m, avatar: '' }
    // might be { user: { username } } or user-like
    const username = m.username ?? m.user?.username ?? m.name ?? String(m)
    const avatar = m.avatar ?? m.user?.avatar ?? ''
    return { username, avatar }
  })
  
  // Note: Avatar will be loaded separately for each member after normalization

  // Normalize progress entries to { user: { username }, dailyProgress }
  const progressRaw = Array.isArray(raw.progress) ? raw.progress : (Array.isArray(raw.Progress) ? raw.Progress : [])
  const progress = progressRaw.map((p: any) => {
    if (!p) return { user: { username: '' }, dailyProgress: false }
    const userObj = p.user ?? p.member ?? p.userId ?? p
    let username = ''
    let avatar = ''
    if (typeof userObj === 'string') username = userObj
    else if (userObj) {
      username = userObj.username ?? userObj.name ?? userObj.user?.username ?? ''
      avatar = userObj.avatar ?? userObj.user?.avatar ?? ''
    }
    const daily = Boolean(p.dailyProgress ?? p.daily ?? p.completed ?? false)
    return { user: { username, avatar }, dailyProgress: daily }
  })

  return { id, name, stat, members, streak, progress }
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
    
    // Normalize simple username strings into objects for consistent rendering
    friends.value = friendsWithAvatars.map((f: any) => (typeof f === 'string' ? { username: f, avatar: defaultAvatar } : f))
  } catch (error) {
    console.error('Error loading friends:', error)
  }
}

const createArc = async () => {
  if (!newArc.value.name || !newArc.value.stat) return

  loading.value = true

  try {
    // Ensure members are normalized user strings (not objects). Backend expects User[] which is string[].
    const selected = (newArc.value.members || []).map((m: any) => {
      if (!m) return null
      // Extract just the username string
      return typeof m === 'string' ? m : m.username
    }).filter(Boolean)

    // Include current user as first member (avoid duplicate)
    const currentUsername = (user.value as any)?.username || String(user.value)
    const members = [currentUsername, ...selected.filter((m: string) => m !== currentUsername)]

    const resp = await apiService.post('/ArcTracking/createArc', {
      name: newArc.value.name,
      stat: newArc.value.stat,
      members: members
    })

    // If server returned the created arc object, use it to update UI immediately.
    const created = resp.data?.arc ?? resp.data
    console.log('Created arc response:', created)
    
    if (created) {
      // If server returned only an id string, synthesize a minimal arc object so the UI shows the name.
      let arcObj: any
      if (typeof created === 'string') {
        arcObj = {
          id: created,
          name: newArc.value.name,
          stat: newArc.value.stat,
          members: members,
          streak: 0,
          progress: []
        }
      } else {
        arcObj = created
        // Ensure name is present (server might return id-only or partial object)
        if (!arcObj.name) arcObj.name = newArc.value.name
        if (!arcObj.members) arcObj.members = members
      }

      console.log('Normalizing created arc before adding:', arcObj)
      const normalizedArc = normalizeArc(arcObj)
      console.log('Normalized arc:', normalizedArc)
      
      // Prepend the new arc so it's visible at the top.
      userArcs.value.unshift(normalizedArc)
    } else {
      // Fallback: reload arcs from server
      await loadArcs()
    }

    closeCreateArcModal()

    // Reset form
    newArc.value = {
      name: '',
      stat: '',
      members: []
    }
  } catch (error) {
    console.error('Error creating arc:', error)
  } finally {
    loading.value = false
  }
}

const editArc = (arc: Arc) => {
  editingArc.value = arc
  editingArcMembers.value = [...arc.members.filter((m: User) => m.username !== user.value?.username) as Friend[]]
  showEditArcModal.value = true
}

const updateArcMembers = async () => {
  if (!editingArc.value) return
  
  loading.value = true
  
  try {
    // Add new members to the arc
    for (const member of editingArcMembers.value) {
      if (!editingArc.value.members.some((m: User) => m.username === member.username)) {
        // Backend expects user as a string and arc as a string
        const memberUsername = typeof member === 'string' 
          ? member 
          : (member as any).username || String(member)
        
        await apiService.post('/ArcTracking/addMemberToArc', {
          user: memberUsername,
          arc: editingArc.value.id
        })
      }
    }
    
    await loadArcs()
    closeEditArcModal()
  } catch (error) {
    console.error('Error updating arc members:', error)
  } finally {
    loading.value = false
  }
}

const toggleProgress = async (arc: Arc) => {
  if (!user.value) return
  
  try {
    // Backend expects user as a string identifier, not an object
    const userId = typeof user.value === 'string' 
      ? user.value 
      : (user.value as any).username || (user.value as any).id || String(user.value)
    
    console.log('Toggle progress - userId:', userId, 'arc.id:', arc.id)
    console.log('Current completion status:', isCompletedToday(arc))
    
    if (isCompletedToday(arc)) {
      console.log('Marking as NOT completed')
      await apiService.post('/ArcTracking/markNoProgress', {
        user: userId,
        arc: arc.id
      })
    } else {
      console.log('Marking as completed')
      await apiService.post('/ArcTracking/markProgress', {
        user: userId,
        arc: arc.id
      })
    }
    
    await loadArcs()
  } catch (error) {
    console.error('Error toggling progress:', error)
  }
}

const isCompletedToday = (arc: Arc) => {
  if (!arc.progress || !user.value) return false
  
  // Get the current user's username for comparison
  const currentUsername = typeof user.value === 'string' 
    ? user.value 
    : (user.value as any).username || (user.value as any).id || String(user.value)
  
  // Check if the current user has completed their daily progress
  const userCompleted = arc.progress.some((p) => {
    const progressUser = typeof p.user === 'string' 
      ? p.user 
      : (p.user?.username || p.user?.id || String(p.user))
    return progressUser === currentUsername && p.dailyProgress
  })
  
  console.log('isCompletedToday (current user):', userCompleted, 'for arc:', arc.name, 'user:', currentUsername)
  return userCompleted
}

const getCompletedMembers = (arc: Arc) => {
  if (!arc.progress) return []
  return arc.progress.filter((p) => p.dailyProgress)
}

const getIncompleteMembers = (arc: Arc) => {
  if (!arc.progress || arc.progress.length === 0) {
    // No progress yet, all members are incomplete
    return arc.members
  }
  
  // Find which members have completed progress
  const completedUsernames = new Set(
    arc.progress
      .filter((p) => p.dailyProgress)
      .map((p) => p.user.username)
  )
  
  // Return members who don't have completed progress
  return arc.members.filter((m) => !completedUsernames.has(m.username))
}

const closeCreateArcModal = () => {
  showCreateArcModal.value = false
  newArc.value = {
    name: '',
    stat: '',
    members: []
  }
}

const closeEditArcModal = () => {
  showEditArcModal.value = false
  editingArc.value = null
  editingArcMembers.value = []
}

onMounted(() => {
  // Ensure auth is initialized before trying to load data
  authStore.initializeAuth()
  
  console.log('ArcsPage mounted, user:', user.value)
  
  // Wait a bit for auth to settle
  setTimeout(() => {
    if (user.value) {
      loadArcs()
      loadFriends()
    }
  }, 100)
  
  // Listen for daily refresh to reload arcs
  const onDailyRefresh = async () => {
    console.log('Daily refresh completed, reloading arcs...')
    // Add a small delay to ensure backend operations are fully committed
    await new Promise(resolve => setTimeout(resolve, 100))
    await loadArcs()
    console.log('Arcs reloaded after daily refresh')
  }
  window.addEventListener('daily-refresh-completed', onDailyRefresh)
  
  // Clean up listener when component unmounts
  onUnmounted(() => {
    window.removeEventListener('daily-refresh-completed', onDailyRefresh)
  })
})

// If the auth store initializes after mount, reload data when user becomes available
watch(user, (u) => {
  console.log('User changed, loading arcs and friends')
  if (u) {
    loadFriends()
    loadArcs()
  }
}, { immediate: true })
</script>

<style scoped>
.arcs-page {
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
  margin: 0 0 1rem 0;
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.1rem;
}

.create-arc-button {
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
}

.create-arc-button:hover {
  background: #ffafcc;
  border-color: #cdb4db #ffafcc #ffafcc #cdb4db;
  transform: translate(2px, 2px);
  box-shadow: inset 2px 2px 0 rgba(0, 0, 0, 0.1);
}

.arcs-section {
  background: #bde0fe;
  border-radius: 0;
  padding: 1.5rem;
  border: 4px solid;
  border-color: #a2d2ff #cdb4db #cdb4db #a2d2ff;
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.2);
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.empty-state h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.arcs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.arc-card {
  background: #ffc8dd;
  border-radius: 0;
  padding: 1.5rem;
  border: 3px solid;
  border-color: #ffafcc #cdb4db #cdb4db #ffafcc;
  cursor: pointer;
  transition: all 0.1s ease;
  box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.15);
}

.arc-card:hover {
  background: #ffafcc;
  transform: translate(2px, 2px);
  box-shadow: 1px 1px 0 rgba(0, 0, 0, 0.15);
}

.arc-card.completed-today {
  border-color: #28a745 #20c952 #20c952 #28a745;
  background: #d4edda;
  box-shadow: 3px 3px 0 #28a745;
}

.arc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.arc-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.2rem;
}

.arc-streak {
  background: #bde0fe;
  color: #333;
  padding: 0.25rem 0.75rem;
  border-radius: 0;
  font-size: 0.9rem;
  font-weight: 600;
  border: 2px solid #a2d2ff;
  box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.1);
}

.arc-stat {
  margin-bottom: 1rem;
}

.stat-label {
  background: #a2d2ff;
  color: #333;
  padding: 0.25rem 0.75rem;
  border-radius: 0;
  font-size: 0.9rem;
  font-weight: 600;
  border: 2px solid #bde0fe;
  box-shadow: 1px 1px 0 rgba(0, 0, 0, 0.1);
}

.arc-members {
  margin-bottom: 1rem;
}

.arc-members h4 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1rem;
}

.members-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.7);
  padding: 0.25rem 0.5rem;
  border-radius: 15px;
  font-size: 0.8rem;
}

.member-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
}

.member-name {
  color: #333;
}

.progress-section {
  margin-bottom: 1rem;
}

.progress-section h4 {
  margin: 0 0 0.75rem 0;
  color: #333;
  font-size: 1rem;
}

.progress-lists {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.completed-list h5, .incomplete-list h5 {
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
}

.completed-list h5 {
  color: #28a745;
}

.incomplete-list h5 {
  color: #dc3545;
}

.no-members {
  font-size: 0.8rem;
  color: #666;
  font-style: italic;
}

.member-progress {
  font-size: 0.8rem;
  padding: 0.25rem 0.5rem;
  border-radius: 5px;
  margin-bottom: 0.25rem;
}

.member-progress.completed {
  background: rgba(40, 167, 69, 0.2);
  color: #28a745;
}

.member-progress.incomplete {
  background: rgba(220, 53, 69, 0.2);
  color: #dc3545;
}

.arc-actions {
  display: flex;
  justify-content: flex-end;
}

.edit-button {
  background: #bde0fe;
  border: 2px solid;
  border-color: #a2d2ff #cdb4db #cdb4db #a2d2ff;
  border-radius: 0;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.1s ease;
  box-shadow: inset -1px -1px 0 rgba(0, 0, 0, 0.15);
}

.edit-button:hover {
  background: #a2d2ff;
  border-color: #cdb4db #a2d2ff #a2d2ff #cdb4db;
  transform: translate(1px, 1px);
  box-shadow: inset 1px 1px 0 rgba(0, 0, 0, 0.1);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
}

.page-button {
  background: #bde0fe;
  border: 2px solid;
  border-color: #a2d2ff #cdb4db #cdb4db #a2d2ff;
  border-radius: 0;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: all 0.1s ease;
  box-shadow: inset -1px -1px 0 rgba(0, 0, 0, 0.15);
}

.page-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #cdb4db;
}

.page-button:hover:not(:disabled) {
  background: #a2d2ff;
  border-color: #cdb4db #a2d2ff #a2d2ff #cdb4db;
  transform: translate(1px, 1px);
  box-shadow: inset 1px 1px 0 rgba(0, 0, 0, 0.1);
}

.page-info {
  color: #666;
  font-weight: 600;
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
  max-width: 500px;
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
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 3px solid;
  border-color: #cdb4db #a2d2ff #a2d2ff #cdb4db;
  border-radius: 0;
  font-size: 1rem;
  background: #ffc8dd;
  box-shadow: inset 2px 2px 0 rgba(0, 0, 0, 0.1);
}

.form-input:focus {
  outline: none;
  border-color: #ffafcc #bde0fe #bde0fe #ffafcc;
  background: #ffafcc;
}

.members-selection {
  max-height: 200px;
  overflow-y: auto;
  border: 3px solid;
  border-color: #cdb4db #a2d2ff #a2d2ff #cdb4db;
  border-radius: 0;
  padding: 0.5rem;
  background: #ffc8dd;
  box-shadow: inset 2px 2px 0 rgba(0, 0, 0, 0.1);
}

.member-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 0;
  transition: background 0.1s ease;
}

.member-option:hover {
  background: #ffafcc;
}

.member-checkbox {
  margin: 0;
}

.member-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  flex: 1;
}

.member-avatar-small {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.cancel-button {
  background: rgba(108, 117, 125, 0.2);
  border: 1px solid rgba(108, 117, 125, 0.3);
  border-radius: 5px;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  font-weight: 600;
}

.submit-button {
  background: #ffc8dd;
  color: #333;
  border: 3px solid;
  border-color: #ffafcc #cdb4db #cdb4db #ffafcc;
  border-radius: 0;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  font-weight: 600;
  box-shadow: inset -2px -2px 0 rgba(0, 0, 0, 0.2);
  transition: all 0.1s ease;
}

.submit-button:hover {
  background: #ffafcc;
  border-color: #cdb4db #ffafcc #ffafcc #cdb4db;
  transform: translate(2px, 2px);
  box-shadow: inset 2px 2px 0 rgba(0, 0, 0, 0.1);
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .arcs-grid {
    grid-template-columns: 1fr;
  }
  
  .progress-lists {
    grid-template-columns: 1fr;
  }
}
</style>
