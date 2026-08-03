import { Vector3 } from 'three'

export interface AIState {
  position: Vector3
  ballPosition: Vector3
  opponentPosition: Vector3
  teamPlayers: Vector3[]
  ballPossession: 1 | 2 | null
}

export class AIPlayer {
  private difficulty: 'easy' | 'medium' | 'hard'
  private team: 1 | 2
  private position: Vector3
  private targetPosition: Vector3

  constructor(difficulty: 'easy' | 'medium' | 'hard', team: 1 | 2) {
    this.difficulty = difficulty
    this.team = team
    this.position = new Vector3()
    this.targetPosition = new Vector3()
  }

  update(state: AIState): Vector3 {
    const ballPos = state.ballPosition
    const hasball = state.ballPossession === this.team

    if (hasball) {
      // Attacking strategy
      return this.getAttackingMove(state)
    } else {
      // Defensive strategy
      return this.getDefensiveMove(state)
    }
  }

  private getAttackingMove(state: AIState): Vector3 {
    const ballPos = state.ballPosition
    const moveDirection = new Vector3()

    // Move towards ball
    moveDirection.copy(ballPos).sub(this.position).normalize()

    // Apply difficulty modifier
    const speedMultiplier = this.getDifficultyMultiplier()
    moveDirection.multiplyScalar(20 * speedMultiplier) // 20 m/s * multiplier

    // Calculate shooting opportunity
    if (this.position.distanceTo(ballPos) < 3) {
      const goalPosition = this.team === 1 ? new Vector3(52.5, 1, 0) : new Vector3(-52.5, 1, 0)
      const shootDirection = new Vector3().copy(goalPosition).sub(ballPos).normalize()
      moveDirection.copy(shootDirection).multiplyScalar(25)
    }

    return moveDirection
  }

  private getDefensiveMove(state: AIState): Vector3 {
    const ballPos = state.ballPosition
    const opponentPos = state.opponentPosition
    const moveDirection = new Vector3()

    // Position between opponent and goal
    const goalPosition = this.team === 1 ? new Vector3(-52.5, 0, 0) : new Vector3(52.5, 0, 0)

    // If opponent has ball, move towards them
    if (state.ballPossession !== this.team) {
      const distanceToOpponent = opponentPos.distanceTo(this.position)

      if (distanceToOpponent < 15) {
        // Close marking
        moveDirection.copy(opponentPos).sub(this.position).normalize().multiplyScalar(18)
      } else {
        // Defensive positioning
        const defensivePos = new Vector3()
          .copy(goalPosition)
          .add(new Vector3().copy(opponentPos).sub(goalPosition).normalize().multiplyScalar(10))

        moveDirection.copy(defensivePos).sub(this.position).normalize().multiplyScalar(15)
      }
    } else {
      // Move to good position
      moveDirection.copy(ballPos).sub(this.position).normalize().multiplyScalar(12)
    }

    return moveDirection
  }

  private getDifficultyMultiplier(): number {
    switch (this.difficulty) {
      case 'easy':
        return 0.6 + Math.random() * 0.1
      case 'medium':
        return 0.8 + Math.random() * 0.1
      case 'hard':
        return 0.95 + Math.random() * 0.05
      default:
        return 0.8
    }
  }

  setPosition(pos: Vector3) {
    this.position.copy(pos)
  }

  getTargetPosition(): Vector3 {
    return this.targetPosition
  }
}

export class AITeam {
  private players: AIPlayer[]
  private difficulty: 'easy' | 'medium' | 'hard'
  private team: 1 | 2

  constructor(difficulty: 'easy' | 'medium' | 'hard', team: 1 | 2, playerCount: number) {
    this.difficulty = difficulty
    this.team = team
    this.players = Array.from({ length: playerCount }, () => new AIPlayer(difficulty, team))
  }

  updatePlayers(states: AIState[]): Vector3[] {
    return this.players.map((player, index) => player.update(states[index] || states[0]))
  }

  getPlayers(): AIPlayer[] {
    return this.players
  }
}
