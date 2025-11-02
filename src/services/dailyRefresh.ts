import { apiService } from './api'
import { useAuthStore } from '../stores/auth'

/**
 * Daily refresh service that runs at midnight to:
 * 1. Update arc streaks based on completion
 * 2. Award/update stats based on completion
 * 3. Award points if streaks extended
 */
export class DailyRefreshService {
  private checkInterval: number | null = null
  private lastCheckDate: string | null = null

  start() {
    console.log('Starting daily refresh service...')
    
    // Load last check date from localStorage
    const stored = localStorage.getItem('lastDailyRefresh')
    if (stored) {
      this.lastCheckDate = stored
    }
    
    // Check immediately on startup - important if user opens browser after midnight
    // Wait a bit for auth to initialize
    setTimeout(() => {
      this.checkAndRefreshIfNeeded()
    }, 2000)
    
    // Check every minute
    this.checkInterval = setInterval(() => {
      this.checkAndRefreshIfNeeded()
    }, 60000) // Check every 60 seconds
  }

  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  private async checkAndRefreshIfNeeded() {
    const now = new Date()
    const currentDate = now.toDateString()
    
    // Don't run if we already checked today, DISABLED for testing
    if (this.lastCheckDate === currentDate) {
      return
    }

    // Check if it's a new day (not the same as last check date)
    if (this.lastCheckDate && this.lastCheckDate !== currentDate) {
      console.log('New day detected, running daily refresh...')
      await this.runDailyRefresh()
      this.lastCheckDate = currentDate
      localStorage.setItem('lastDailyRefresh', currentDate)
    } 
    // Also check if it's exactly midnight and we haven't run today
    else if (!this.lastCheckDate || this.lastCheckDate !== currentDate) {
      const hours = now.getHours()
      const minutes = now.getMinutes()
      
      if (hours === 0 && minutes < 1) {
        console.log('Midnight detected, running daily refresh...')
        await this.runDailyRefresh()
        this.lastCheckDate = currentDate
        localStorage.setItem('lastDailyRefresh', currentDate)
      }
    }
  }

  private async runDailyRefresh() {
    const authStore = useAuthStore()
    const user = authStore.user
    
    if (!user) {
      console.log('No user logged in, skipping daily refresh')
      return
    }

    // For Rewarding operations, _id is the username, so prioritize username
    const userId = typeof user === 'string' 
      ? user 
      : (user as any)?.username || (user as any)?.id || String(user)

    try {
      console.log('Starting daily refresh for user:', userId)
      
      // 1. Get all arcs the user is a member of
      const arcsResponse = await apiService.post('/ArcTracking/getArcs', { user: userId })
      const arcsData = arcsResponse.data
      
      if (!arcsData || !Array.isArray(arcsData.arcs)) {
        console.log('No arcs found for user')
        return
      }

      console.log(`Found ${arcsData.arcs.length} arcs for user`)
      
      // 2. For each arc, fetch full details and process
      for (const arcId of arcsData.arcs) {
        try {
          const arcResponse = await apiService.post('/ArcTracking/getArc', { arc: arcId })
          const arc = arcResponse.data?.arc
          
          if (!arc) {
            console.log('Could not fetch arc details for:', arcId)
            continue
          }

          console.log(`Processing arc: ${arc.name} (${arcId})`)
          const oldStreak = arc.streak || 0
          
          // 3. Get current progress status BEFORE updating streak
          const statusResponse = await apiService.post('/ArcTracking/getArcStatus', { arc: arcId })
          const progress = statusResponse.data?.status || []
          
          // 4. Check if this user completed their task
          const userProgress = progress.find((p: any) => p.user === userId)
          const completed = userProgress?.dailyProgress || false
          
          console.log(`User completed: ${completed}, Old streak: ${oldStreak}`)
          
          // 5. Update the arc streak (this also resets daily progress)
          const streakResponse = await apiService.post('/ArcTracking/updateArcStreak', { arc: arcId })
          const newStreak = streakResponse.data?.newStreak || 0
          
          const streakExtended = newStreak > oldStreak
          
          console.log(`Arc ${arc.name} streak: ${oldStreak} -> ${newStreak} (extended: ${streakExtended})`)
          
          // 6. Update stats based on completion (this updates based on the arc's stat type)
          const statType = arc.stat || 'HP'
          
          if (completed) {
            await apiService.post('/StatTracking/updateStatWithCompletedTask', {
              user: userId,
              stat: statType,
              delta: 1
            })
            console.log(`Updated ${statType} with completed task for user`)
          } else {
            await apiService.post('/StatTracking/updateStatWithIncompleteTask', {
              user: userId,
              stat: statType,
              delta: 1
            })
            console.log(`Updated ${statType} with incomplete task for user`)
          }
          
          // 7. If streak extended (all members completed), award points
          if (streakExtended) {
            await apiService.post('/Rewarding/earnPoints', {
              user: userId,
              points: 1
            })
            console.log(`Awarded 1 point to user for extended streak`)
          }
          
        } catch (error) {
          console.error(`Error processing arc ${arcId}:`, error)
        }
      }
      
      console.log('Daily refresh completed successfully')
      
      // Emit event to notify components
      window.dispatchEvent(new CustomEvent('daily-refresh-completed'))
      
    } catch (error) {
      console.error('Error during daily refresh:', error)
    }
  }

  // Force a refresh (useful for testing)
  async forceRefresh() {
    console.log('Forcing daily refresh...')
    this.lastCheckDate = null
    await this.runDailyRefresh()
  }
}

export const dailyRefreshService = new DailyRefreshService()

// Expose to window for testing
declare global {
  interface Window {
    dailyRefreshService: DailyRefreshService
  }
}

if (typeof window !== 'undefined') {
  window.dailyRefreshService = dailyRefreshService
  console.log('Daily refresh service available at window.dailyRefreshService')
  console.log('You can force a refresh with: window.dailyRefreshService.forceRefresh()')
}
