import type { Avatar } from '../types'

// Import avatar images
import Voltaris1 from '../assets/Avatars/Voltaris1.png'
import Voltaris2 from '../assets/Avatars/Voltaris2.png'
import Vulpyx1 from '../assets/Avatars/Vulpyx1.png'
import Vulpyx2 from '../assets/Avatars/Vulpyx2.png'
import Kael1 from '../assets/Avatars/Kael1.png'
import Kael2 from '../assets/Avatars/Kael2.png'
import Juniper1 from '../assets/Avatars/Juniper1.png'
import Juniper2 from '../assets/Avatars/Juniper2.png'
import Thalassa1 from '../assets/Avatars/Thalassa1.png'
import Thalassa2 from '../assets/Avatars/Thalassa2.png'
import Yuki1 from '../assets/Avatars/Yuki1.png'
import Yuki2 from '../assets/Avatars/Yuki2.png'
import Apollo1 from '../assets/Avatars/Apollo1.png'
import Apollo2 from '../assets/Avatars/Apollo2.png'
import Aphrodite1 from '../assets/Avatars/Aphrodite1.png'
import Aphrodite2 from '../assets/Avatars/Aphrodite2.png'
import Athena1 from '../assets/Avatars/Athena1.png'
import Athena2 from '../assets/Avatars/Athena2.png'

// Map avatar names to their image paths
const avatarImageMap: Record<string, string> = {
  'Voltaris': Voltaris1,
  'Vulpyx': Vulpyx1,
  'Kael': Kael1,
  'Juniper': Juniper1,
  'Thalassa': Thalassa1,
  'Yuki': Yuki1,
  'Apollo': Apollo1,
  'Aphrodite': Aphrodite1,
  'Athena': Athena1,
}

// Map avatar names to their frame 2 images for animation
const avatarImageMapFrame2: Record<string, string> = {
  'Voltaris': Voltaris2,
  'Vulpyx': Vulpyx2,
  'Kael': Kael2,
  'Juniper': Juniper2,
  'Thalassa': Thalassa2,
  'Yuki': Yuki2,
  'Apollo': Apollo2,
  'Aphrodite': Aphrodite2,
  'Athena': Athena2,
}

// Map avatar names to their rarities
const avatarRarityMap: Record<string, 'common' | 'rare' | 'epic' | 'legendary'> = {
  'Voltaris': 'common',
  'Vulpyx': 'common',
  'Kael': 'rare',
  'Juniper': 'rare',
  'Thalassa': 'epic',
  'Yuki': 'epic',
  'Apollo': 'legendary',
  'Aphrodite': 'legendary',
  'Athena': 'legendary',
}

// Map avatar names to their stat affinities
const avatarStatAffinityMap: Record<string, Array<{ stat: string; number: number }>> = {
  'Voltaris': [
    { stat: 'Intelligence', number: 4 },
    { stat: 'Strength', number: 2 },
  ],
  'Vulpyx': [
    { stat: 'Strength', number: 1 },
    { stat: 'Agility', number: 1 },
  ],
  'Kael': [
    { stat: 'Strength', number: 6 },
    { stat: 'HP', number: 6 },
  ],
  'Juniper': [
    { stat: 'Agility', number: 8 },
    { stat: 'Intelligence', number: 7 },
  ],
  'Thalassa': [
    { stat: 'Agility', number: 10 },
    { stat: 'Strength', number: 10 },
    { stat: 'HP', number: 10 },
    { stat: 'Stamina', number: 10 },
    { stat: 'Intelligence', number: 10 },
  ],
  'Yuki': [
    { stat: 'Agility', number: 15 },
    { stat: 'Strength', number: 15 },
    { stat: 'HP', number: 15 },
    { stat: 'Stamina', number: 15 },
    { stat: 'Intelligence', number: 15 },
  ],
  'Apollo': [
    { stat: 'Strength', number: 20 },
    { stat: 'HP', number: 30 },
    { stat: 'Intelligence', number: 15 },
  ],
  'Aphrodite': [
    { stat: 'HP', number: 20 },
    { stat: 'Agility', number: 15 },
    { stat: 'Stamina', number: 30 },
  ],
  'Athena': [
    { stat: 'Agility', number: 15 },
    { stat: 'Intelligence', number: 30 },
    { stat: 'Strength', number: 20 },
  ],
}

/**
 * Get the image path for an avatar by name
 */
export function getAvatarImage(avatarName: string, frame: 1 | 2 = 1): string {
  const map = frame === 1 ? avatarImageMap : avatarImageMapFrame2
  return map[avatarName] || ''
}

/**
 * Enhance an avatar object with its image path, rarity, and stat affinity
 */
export function enhanceAvatarWithImage(avatar: Avatar | string): Avatar {
  const avatarName = typeof avatar === 'string' ? avatar : avatar.name
  const rarity = avatarRarityMap[avatarName] || 'common'
  const statAffinity = avatarStatAffinityMap[avatarName] || []
  
  const baseAvatar: Avatar = typeof avatar === 'string' 
    ? { 
        name: avatarName, 
        rarity: rarity,
        image: getAvatarImage(avatarName),
        statAffinity: statAffinity
      }
    : { 
        ...avatar, 
        rarity: avatar.rarity || rarity,
        image: avatar.image || getAvatarImage(avatarName),
        statAffinity: avatar.statAffinity || statAffinity
      }
  return baseAvatar
}

/**
 * Enhance avatar IDs from backend with full avatar data
 * This function should fetch avatar definitions from backend when that endpoint exists
 */
export async function enhanceAvatarIds(avatarIds: string[]): Promise<Avatar[]> {
  // For now, create avatar objects from IDs (assuming ID is the name)
  // When backend provides avatar definition endpoint, fetch full data
  return avatarIds.map(id => enhanceAvatarWithImage(id))
}

