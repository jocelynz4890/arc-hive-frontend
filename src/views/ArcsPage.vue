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
                    :src="(member as Friend).avatar || '/default-avatar.png'" 
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
                      :key="'user' in member ? member.user.username : member.username"
                      class="member-progress incomplete"
                    >
                      {{ 'user' in member ? member.user.username : member.username }}
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
                    :src="friend.avatar || '/default-avatar.png'" 
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
                    :src="friend.avatar || '/default-avatar.png'" 
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
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { apiService } from '../services/api'
import type { Arc, Friend, User } from '../types'

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
  if (!user.value) return
  
  try {
    const response = await apiService.post('/api/ArcTracking/getArcs', {
      user: user.value
    })
    userArcs.value = response.data || []
  } catch (error) {
    console.error('Error loading arcs:', error)
  }
}

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

const createArc = async () => {
  if (!newArc.value.name || !newArc.value.stat) return
  
  loading.value = true
  
  try {
    const members = [user.value, ...newArc.value.members]
    await apiService.post('/api/ArcTracking/createArc', {
      name: newArc.value.name,
      stat: newArc.value.stat,
      members: members
    })
    
    await loadArcs()
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
        await apiService.post('/api/ArcTracking/addMemberToArc', {
          user: member,
          arc: editingArc.value
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
  try {
    if (isCompletedToday(arc)) {
      await apiService.post('/api/ArcTracking/markNoProgress', {
        user: user.value,
        arc: arc
      })
    } else {
      await apiService.post('/api/ArcTracking/markProgress', {
        user: user.value,
        arc: arc
      })
    }
    
    await loadArcs()
  } catch (error) {
    console.error('Error toggling progress:', error)
  }
}

const isCompletedToday = (arc: Arc) => {
  // This would need to be implemented based on your backend logic
  // For now, we'll use a simple check
  return arc.progress && arc.progress.some((p) => 
    p.user.username === user.value?.username && p.dailyProgress
  )
}

const getCompletedMembers = (arc: Arc) => {
  if (!arc.progress) return []
  return arc.progress.filter((p) => p.dailyProgress)
}

const getIncompleteMembers = (arc: Arc) => {
  if (!arc.progress) return arc.members
  return arc.progress.filter((p) => !p.dailyProgress)
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
  loadArcs()
  loadFriends()
})
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

.create-arc-button:hover {
  transform: translateY(-1px);
}

.arcs-section {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 1.5rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
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
  background: rgba(102, 126, 234, 0.1);
  border-radius: 15px;
  padding: 1.5rem;
  border: 2px solid rgba(102, 126, 234, 0.2);
  cursor: pointer;
  transition: all 0.2s ease;
}

.arc-card:hover {
  background: rgba(102, 126, 234, 0.15);
  transform: translateY(-2px);
}

.arc-card.completed-today {
  border-color: #28a745;
  background: rgba(40, 167, 69, 0.1);
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
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
}

.arc-stat {
  margin-bottom: 1rem;
}

.stat-label {
  background: rgba(118, 75, 162, 0.2);
  color: #764ba2;
  padding: 0.25rem 0.75rem;
  border-radius: 15px;
  font-size: 0.9rem;
  font-weight: 600;
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
  color: #ffc107;
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
  background: rgba(255, 193, 7, 0.2);
  color: #ffc107;
}

.arc-actions {
  display: flex;
  justify-content: flex-end;
}

.edit-button {
  background: rgba(102, 126, 234, 0.2);
  border: 1px solid rgba(102, 126, 234, 0.3);
  border-radius: 5px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.edit-button:hover {
  background: rgba(102, 126, 234, 0.3);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
}

.page-button {
  background: rgba(102, 126, 234, 0.2);
  border: 1px solid rgba(102, 126, 234, 0.3);
  border-radius: 5px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.page-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-button:hover:not(:disabled) {
  background: rgba(102, 126, 234, 0.3);
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
  border: 2px solid rgba(102, 126, 234, 0.2);
  border-radius: 8px;
  font-size: 1rem;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
}

.members-selection {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid rgba(102, 126, 234, 0.2);
  border-radius: 8px;
  padding: 0.5rem;
}

.member-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 5px;
  transition: background 0.2s ease;
}

.member-option:hover {
  background: rgba(102, 126, 234, 0.1);
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
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 5px;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  font-weight: 600;
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
