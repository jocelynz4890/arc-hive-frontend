// Types for the ArcHive application
export interface User {
  username: string
  id?: string
}

export interface StatData {
  HP: number
  Stamina: number
  Strength: number
  Agility: number
  Intelligence: number
}

export interface Avatar {
  name: string
  rarity: string
  image?: string
  statAffinity?: Array<{
    stat: string
    number: number
  }>
}

export interface Arc {
  id: string
  name: string
  stat: string
  members: User[]
  streak: number
  progress?: Array<{
    user: User
    dailyProgress: boolean
  }>
}

export interface Friend extends User {
  avatar?: string
  totalStats?: StatData
  completedStats?: StatData
}

export interface Progress {
  user: User
  dailyProgress: boolean
}
