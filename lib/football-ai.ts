import { Player, TacticalPreset } from './game-store'

// Standard soccer ball mass in Rapier simulation is 0.43 kg
const BALL_MASS = 0.43

/**
 * Evaluates official FIFA Law 11 (Offside).
 * An attacker is in an offside position if they are in the opponent's half,
 * nearer to the opponents' goal line than both the ball and the second-last opponent
 * at the exact instant the ball is played by a teammate.
 * 
 * @returns Defender X calibration line coordinate if offside occurred; otherwise null.
 */
export function checkOffsideRule(
  passerTeam: 1 | 2,
  receiverPos: [number, number, number],
  ballX: number,
  opponentPositions: [number, number, number][]
): number | null {
  const receiverX = receiverPos[0]

  if (passerTeam === 1) {
    // Team 1 attacks positive X (> 0 is opponent half)
    if (receiverX <= 0 || receiverX <= ballX) return null
    
    // Sort opponent X coordinates in descending order (closest to opponent goal line at X=52.5 first)
    const sortedOppX = opponentPositions.map(p => p[0]).sort((a, b) => b - a)
    const secondLastDefX = sortedOppX[1] ?? sortedOppX[0] ?? 52.5

    // If receiver is strictly ahead of the second-last defender (plus slight buffer for arm/head margin)
    if (receiverX > secondLastDefX + 0.3) {
      return secondLastDefX
    }
  } else {
    // Team 2 attacks negative X (< 0 is opponent half)
    if (receiverX >= 0 || receiverX >= ballX) return null
    
    // Sort opponent X coordinates in ascending order (closest to goal line at X=-52.5 first)
    const sortedOppX = opponentPositions.map(p => p[0]).sort((a, b) => a - b)
    const secondLastDefX = sortedOppX[1] ?? sortedOppX[0] ?? -52.5

    if (receiverX < secondLastDefX - 0.3) {
      return secondLastDefX
    }
  }

  return null
}

/**
 * Calculates a controlled, realistic impulse vector for short ground passes or through balls.
 */
export function calculatePassImpulse(
  currentPos: { x: number; y: number; z: number },
  targetPos: { x: number; y: number; z: number },
  isThroughBall: boolean = false,
  team: 1 | 2 = 1
): [number, number, number] {
  let targetX = targetPos.x
  let targetZ = targetPos.z

  if (isThroughBall) {
    const forwardOffset = team === 1 ? 7.5 : -7.5
    targetX += forwardOffset
  }

  const dx = targetX - currentPos.x
  const dz = targetZ - currentPos.z
  const distance = Math.hypot(dx, dz) || 1

  const normX = dx / distance
  const normZ = dz / distance

  const targetSpeed = isThroughBall
    ? 15 + Math.min(distance, 42) * 0.38
    : 12 + Math.min(distance, 35) * 0.32

  const impulseXZ = targetSpeed * BALL_MASS
  const impulseY = isThroughBall ? 0.25 * BALL_MASS : 0.16 * BALL_MASS

  return [normX * impulseXZ, impulseY, normZ * impulseXZ]
}

/**
 * Finds the best teammate to pass to, evaluating openness, tactical progression, and passing lanes.
 */
export function findBestPassTarget(
  currentPos: { x: number; y: number; z: number },
  currentId: string | undefined,
  team: 1 | 2,
  teammateIds: string[],
  playerPositions: Record<string, [number, number, number]>,
  isThroughBall: boolean = false
): [number, number, number] | null {
  let bestTarget: [number, number, number] | null = null
  let highestScore = -Infinity

  for (const id of teammateIds) {
    if (id === currentId) continue
    const pos = playerPositions[id]
    if (!pos) continue

    const dx = pos[0] - currentPos.x
    const dz = pos[2] - currentPos.z
    const dist = Math.hypot(dx, dz)

    if (dist < 3.5 || dist > 55) continue

    const forwardProgression = team === 1 ? dx : -dx

    let score = forwardProgression * 2.8
    if (dist >= 10 && dist <= 28) score += 18
    else if (dist > 28) score -= (dist - 28) * 0.9

    if (score > highestScore) {
      highestScore = score
      bestTarget = [pos[0], pos[1], pos[2]]
    }
  }

  if (!bestTarget) {
    const defaultForwardX = team === 1 ? currentPos.x + 16 : currentPos.x - 16
    bestTarget = [defaultForwardX, 0, currentPos.z]
  }

  return bestTarget
}

/**
 * Calculates a controlled, professional strike shot directed at opposite top/mid corners of the goal net.
 */
export function calculateShotImpulse(
  currentPos: { x: number; y: number; z: number },
  team: 1 | 2,
  fatigueErrorRatio: number = 0.0
): [number, number, number] {
  const targetGoalX = team === 1 ? 52.5 : -52.5
  const targetZ = currentPos.z > 0 ? -2.7 : 2.7

  let dx = targetGoalX - currentPos.x
  let dz = targetZ - currentPos.z

  // Inject dispersion error when player stamina is exhausted
  if (fatigueErrorRatio > 0) {
    dz += (Math.random() - 0.5) * fatigueErrorRatio * 4.5
  }

  const distance = Math.hypot(dx, dz) || 1
  const normX = dx / distance
  const normZ = dz / distance

  const strikeSpeed = 26.0 // approx 94 km/h high power shot
  const impulseXZ = strikeSpeed * BALL_MASS
  const impulseY = 1.22 * BALL_MASS

  return [normX * impulseXZ, impulseY, normZ * impulseXZ]
}

/**
 * Advanced Tactical Formation Engine: Adjusts player relational positioning
 * dynamically depending on active tactical instructions (Tiki-Taka, High Press, Counter Attack, Park the Bus).
 */
export function calculateTacticalAnchor(
  role: 'goalkeeper' | 'defender' | 'midfielder' | 'forward',
  defaultPos: [number, number, number],
  ballPos: [number, number, number],
  team: 1 | 2,
  hasPossession: boolean,
  tactics: TacticalPreset = 'tiki-taka'
): [number, number, number] {
  const startX = defaultPos[0]
  const startZ = defaultPos[2]

  // Sweeper-Keeper AI: If lone ball is past defenders, rush out up to penalty arc (X ~ ±35)
  if (role === 'goalkeeper') {
    const goalX = team === 1 ? -49.5 : 49.5
    let targetX = goalX
    if (!hasPossession && Math.abs(ballPos[0] - goalX) < 22) {
      targetX = team === 1 ? Math.min(-38, ballPos[0] - 2) : Math.max(38, ballPos[0] + 2)
    }
    return [targetX, 0.5, Math.min(3.6, Math.max(-3.6, ballPos[2] * 0.5))]
  }

  let targetX = startX
  let targetZ = startZ

  if (tactics === 'tiki-taka') {
    // Tight compact triangular support lanes
    if (role === 'midfielder') {
      targetX = startX + (ballPos[0] - startX) * 0.7
      targetZ = startZ + (ballPos[2] - startZ) * 0.65
    } else if (role === 'forward') {
      targetX = team === 1 ? Math.min(44, ballPos[0] + 12) : Math.max(-44, ballPos[0] - 12)
      targetZ = startZ * 0.75 + ballPos[2] * 0.25
    } else if (role === 'defender') {
      targetX = team === 1 ? Math.max(startX, ballPos[0] - 18) : Math.min(startX, ballPos[0] + 18)
      targetZ = startZ + ballPos[2] * 0.2
    }
  } else if (tactics === 'high-press') {
    // Ultra-aggressive line push into opponent territory
    if (!hasPossession) {
      targetX = startX + (ballPos[0] - startX) * 0.85
      targetZ = startZ + (ballPos[2] - startZ) * 0.7
    } else {
      targetX = team === 1 ? Math.min(48, startX + 15) : Math.max(-48, startX - 15)
    }
  } else if (tactics === 'counter-attack') {
    // Forwards stretch defensive high line; midfield transitions rapidly
    if (role === 'forward') {
      targetX = team === 1 ? Math.min(47, Math.max(10, ballPos[0] + 22)) : Math.max(-47, Math.min(-10, ballPos[0] - 22))
      targetZ = startZ * 0.9
    } else if (role === 'defender') {
      targetX = team === 1 ? Math.min(-25, startX) : Math.max(25, startX)
    }
  } else if (tactics === 'park-the-bus') {
    // Ultra-defensive low block inside defensive penalty third
    targetX = team === 1 ? Math.min(-20, startX * 1.2) : Math.max(20, startX * 1.2)
    targetZ = startZ * 0.6 + ballPos[2] * 0.3
  }

  // Clam pitch limits
  targetX = Math.min(49.2, Math.max(-49.2, targetX))
  targetZ = Math.min(32.5, Math.max(-32.5, targetZ))

  return [targetX, 0.5, targetZ]
}

/**
 * AI relational decision making tree when holding ball possession.
 */
export function evaluateAIBallCarrierAction(
  pos: { x: number; y: number; z: number },
  team: 1 | 2,
  distToBall: number,
  playerPositions: Record<string, [number, number, number]>,
  opponentIds: string[],
  tactics: TacticalPreset = 'tiki-taka'
): 'shoot' | 'pass' | 'dribble' {
  if (distToBall > 2.7) return 'dribble'

  const distToGoal = team === 1 ? Math.hypot(52.5 - pos.x, 0 - pos.z) : Math.hypot(-52.5 - pos.x, 0 - pos.z)

  if (distToGoal < 21.5) {
    return 'shoot'
  }

  let underPressure = false
  for (const id of opponentIds) {
    const oppPos = playerPositions[id]
    if (oppPos && Math.hypot(oppPos[0] - pos.x, oppPos[2] - pos.z) < 3.8) {
      underPressure = true
      break
    }
  }

  const passBias = tactics === 'tiki-taka' ? 0.9 : tactics === 'counter-attack' ? 0.6 : 0.8
  if ((underPressure || tactics === 'tiki-taka') && Math.random() < passBias) {
    return 'pass'
  }

  return 'dribble'
}
