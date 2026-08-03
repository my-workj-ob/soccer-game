/**
 * MODULAR FOOTBALL CLUB TEAMS & ROSTER DATABASE
 * 
 * Ushbu fayl orqali kelajakda istagancha Yangi Jamoalar (Masalan: FC Barcelona, Arsenal, Bayern Munich, FC Bunyodkor) 
 * hamda ularning yulduz o'yinchilarini qulay va ochiq-oydin kiritib chiqingishingiz mumkin! 
 * Hamma klublar bitta tayyotlangan standard tuzilmasida (schema) joylatshtirilgan!
 */

export interface RosterAthlete {
  name: string
  pos: 'goalkeeper' | 'defender' | 'midfielder' | 'forward'
  num: number
  country: string
  height: number // In meters (e.g. 1.85)
  rating: number
  pace: number
  shooting: number
  passing: number
  dribbling: number
  defense: number
  physical: number
  customAvatarUrl?: string
}

export interface ClubTeamProfile {
  id: string
  name: string
  shortName: string
  primaryColor: string
  secondaryColor: string
  crestIcon: string
  sprintStarlight: string
  roster: RosterAthlete[]
}

// ============================================================================
// 🏆 GLOBAL TEAMS DIRECTORY (Bu yerga istagancha klub yordamini qo'shayishingiz mumkin)
// ============================================================================

export const TEAMS_DATABASE: Record<string, ClubTeamProfile> = {
  REAL_MADRID: {
    id: 'RMA',
    name: 'Real Madrid Galacticos',
    shortName: 'RMA',
    primaryColor: '#f8fafc',
    secondaryColor: '#eab308',
    crestIcon: '⚪',
    sprintStarlight: '👑 Kings of Europe',
    roster: [
      { name: 'COURTOIS', pos: 'goalkeeper', num: 1, country: '🇧🇪 BEL', height: 2.00, rating: 91, pace: 52, shooting: 24, passing: 76, dribbling: 65, defense: 92, physical: 84 },
      { name: 'CARVAJAL', pos: 'defender', num: 2, country: '🇪🇸 ESP', height: 1.73, rating: 86, pace: 84, shooting: 58, passing: 81, dribbling: 82, defense: 85, physical: 82 },
      { name: 'RÜDIGER', pos: 'defender', num: 22, country: '🇩🇪 GER', height: 1.90, rating: 89, pace: 91, shooting: 55, passing: 73, dribbling: 72, defense: 89, physical: 91 },
      { name: 'MILITÃO', pos: 'defender', num: 3, country: '🇧🇷 BRA', height: 1.86, rating: 86, pace: 87, shooting: 50, passing: 74, dribbling: 73, defense: 87, physical: 85 },
      { name: 'MENDY', pos: 'defender', num: 23, country: '🇫🇷 FRA', height: 1.80, rating: 84, pace: 92, shooting: 64, passing: 77, dribbling: 80, defense: 83, physical: 85 },
      { name: 'VALVERDE', pos: 'midfielder', num: 8, country: '🇺🇾 URU', height: 1.82, rating: 89, pace: 91, shooting: 84, passing: 86, dribbling: 85, defense: 82, physical: 87 },
      { name: 'CAMAVINGA', pos: 'midfielder', num: 6, country: '🇫🇷 FRA', height: 1.82, rating: 86, pace: 83, shooting: 74, passing: 84, dribbling: 88, defense: 83, physical: 82 },
      { name: 'BELLINGHAM', pos: 'midfielder', num: 5, country: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 ENG', height: 1.86, rating: 91, pace: 84, shooting: 88, passing: 87, dribbling: 90, defense: 81, physical: 88 },
      { name: 'VINICIUS JR', pos: 'forward', num: 7, country: '🇧🇷 BRA', height: 1.76, rating: 92, pace: 97, shooting: 86, passing: 84, dribbling: 95, defense: 35, physical: 72 },
      { name: 'MBAPPÉ', pos: 'forward', num: 9, country: '🇫🇷 FRA', height: 1.78, rating: 92, pace: 97, shooting: 92, passing: 83, dribbling: 92, defense: 38, physical: 78 },
      { name: 'BAKHTIYOR', pos: 'forward', num: 10, country: '🇺🇿 UZB', height: 1.85, rating: 94, pace: 96, shooting: 95, passing: 92, dribbling: 96, defense: 52, physical: 86 }, // Star Striker & Captain
    ]
  },

  MANCHESTER_CITY: {
    id: 'MCI',
    name: 'Manchester City Champions',
    shortName: 'MCI',
    primaryColor: '#0284c7',
    secondaryColor: '#ffffff',
    crestIcon: '🔵',
    sprintStarlight: '🌊 Sky Blue Dominance',
    roster: [
      { name: 'EDERSON', pos: 'goalkeeper', num: 31, country: '🇧🇷 BRA', height: 1.88, rating: 89, pace: 64, shooting: 30, passing: 93, dribbling: 75, defense: 88, physical: 82 },
      { name: 'WALKER', pos: 'defender', num: 2, country: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 ENG', height: 1.83, rating: 85, pace: 95, shooting: 63, passing: 78, dribbling: 79, defense: 83, physical: 86 },
      { name: 'DIAS', pos: 'defender', num: 3, country: '🇵🇹 POR', height: 1.87, rating: 89, pace: 76, shooting: 39, passing: 73, dribbling: 71, defense: 91, physical: 88 },
      { name: 'STONES', pos: 'defender', num: 5, country: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 ENG', height: 1.88, rating: 87, pace: 73, shooting: 54, passing: 84, dribbling: 82, defense: 87, physical: 83 },
      { name: 'GVARDIOL', pos: 'defender', num: 24, country: '🇭🇷 CRO', height: 1.85, rating: 86, pace: 82, shooting: 64, passing: 79, dribbling: 81, defense: 86, physical: 85 },
      { name: 'RODRI', pos: 'midfielder', num: 16, country: '🇪🇸 ESP', height: 1.90, rating: 91, pace: 66, shooting: 84, passing: 88, dribbling: 86, defense: 88, physical: 89 },
      { name: 'DE BRUYNE', pos: 'midfielder', num: 17, country: '🇧🇪 BEL', height: 1.81, rating: 91, pace: 72, shooting: 88, passing: 95, dribbling: 87, defense: 65, physical: 77 },
      { name: 'FODEN', pos: 'midfielder', num: 47, country: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 ENG', height: 1.71, rating: 90, pace: 86, shooting: 87, passing: 86, dribbling: 92, defense: 58, physical: 65 },
      { name: 'B. SILVA', pos: 'midfielder', num: 20, country: '🇵🇹 POR', height: 1.73, rating: 88, pace: 78, shooting: 79, passing: 87, dribbling: 93, defense: 70, physical: 68 },
      { name: 'HAALAND', pos: 'forward', num: 9, country: '🇳🇴 NOR', height: 1.94, rating: 93, pace: 90, shooting: 95, passing: 71, dribbling: 81, defense: 46, physical: 91 },
      { name: 'DOKU', pos: 'forward', num: 11, country: '🇧🇪 BEL', height: 1.73, rating: 85, pace: 96, shooting: 76, passing: 78, dribbling: 91, defense: 36, physical: 65 },
    ]
  },

  // Example of adding a custom club easily in the future:
  FC_BARCELONA: {
    id: 'BAR',
    name: 'FC Barcelona Blaugrana',
    shortName: 'BAR',
    primaryColor: '#7f1d1d',
    secondaryColor: '#1e3a8a',
    crestIcon: '🔴🔵',
    sprintStarlight: '⚽ Mes que un club',
    roster: [
      { name: 'TER STEGEN', pos: 'goalkeeper', num: 1, country: '🇩🇪 GER', height: 1.87, rating: 89, pace: 50, shooting: 22, passing: 85, dribbling: 68, defense: 90, physical: 80 },
      { name: 'KOUNDE', pos: 'defender', num: 23, country: '🇫🇷 FRA', height: 1.80, rating: 85, pace: 84, shooting: 45, passing: 78, dribbling: 79, defense: 86, physical: 81 },
      { name: 'ARAUJO', pos: 'defender', num: 4, country: '🇺🇾 URU', height: 1.92, rating: 87, pace: 86, shooting: 52, passing: 68, dribbling: 69, defense: 88, physical: 89 },
      { name: 'CUBARSI', pos: 'defender', num: 2, country: '🇪🇸 ESP', height: 1.84, rating: 82, pace: 76, shooting: 40, passing: 79, dribbling: 74, defense: 83, physical: 77 },
      { name: 'BALDE', pos: 'defender', num: 3, country: '🇪🇸 ESP', height: 1.75, rating: 82, pace: 91, shooting: 58, passing: 75, dribbling: 81, defense: 78, physical: 72 },
      { name: 'PEDRI', pos: 'midfielder', num: 8, country: '🇪🇸 ESP', height: 1.74, rating: 88, pace: 79, shooting: 78, passing: 88, dribbling: 91, defense: 68, physical: 72 },
      { name: 'DE JONG', pos: 'midfielder', num: 21, country: '🇳🇱 NED', height: 1.81, rating: 87, pace: 82, shooting: 71, passing: 86, dribbling: 89, defense: 77, physical: 78 },
      { name: 'GAVI', pos: 'midfielder', num: 6, country: '🇪🇸 ESP', height: 1.73, rating: 85, pace: 79, shooting: 74, passing: 81, dribbling: 85, defense: 78, physical: 83 },
      { name: 'LAMINE YAMAL', pos: 'forward', num: 19, country: '🇪🇸 ESP', height: 1.80, rating: 87, pace: 91, shooting: 82, passing: 84, dribbling: 92, defense: 38, physical: 64 },
      { name: 'LEWANDOWSKI', pos: 'forward', num: 9, country: '🇵🇱 POL', height: 1.85, rating: 89, pace: 75, shooting: 92, passing: 78, dribbling: 83, defense: 44, physical: 82 },
      { name: 'RAPHINHA', pos: 'forward', num: 11, country: '🇧🇷 BRA', height: 1.76, rating: 86, pace: 91, shooting: 84, passing: 82, dribbling: 87, defense: 51, physical: 73 },
    ]
  }
}

/**
 * Retrieves full team profile from database by ID or Key
 */
export function getTeamProfile(key: keyof typeof TEAMS_DATABASE): ClubTeamProfile {
  return TEAMS_DATABASE[key] || TEAMS_DATABASE.REAL_MADRID
}

/**
 * Generates dynamic UI avatar portrait URL for player telemetry cards
 */
export function getPlayerAvatarUrl(name: string, bg = '0D0D0D', color = 'F59E0B'): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=${color}&size=128&bold=true`
}
