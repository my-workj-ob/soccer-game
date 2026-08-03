'use client'

import { useState, useEffect } from 'react'
import { useGameStore } from '@/lib/game-store'

export function PowerBar() {
  const [power, setPower] = useState(0)
  const [isCharging, setIsCharging] = useState(false)
  const [spinAngle, setSpinAngle] = useState(0)
  const { setBallVelocity } = useGameStore()

  useEffect(() => {
    if (!isCharging) return

    const interval = setInterval(() => {
      setPower((p) => {
        if (p >= 100) {
          setIsCharging(false)
          return 0
        }
        return p + 2
      })
    }, 20)

    return () => clearInterval(interval)
  }, [isCharging])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        if (!isCharging) {
          setIsCharging(true)
          setPower(0)
          setSpinAngle(0)
        }
      }

      // Left/Right arrow for spin
      if (isCharging) {
        if (e.code === 'ArrowLeft') {
          setSpinAngle((s) => Math.max(-30, s - 5))
        }
        if (e.code === 'ArrowRight') {
          setSpinAngle((s) => Math.min(30, s + 5))
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && isCharging) {
        e.preventDefault()
        setIsCharging(false)

        // Calculate shot velocity based on power
        const velocity = (power / 100) * 50
        const spinMultiplier = 1 + spinAngle / 30

        setBallVelocity([
          (spinAngle / 30) * 5,
          velocity * 0.8,
          velocity * spinMultiplier,
        ] as [number, number, number])

        setPower(0)
        setSpinAngle(0)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [isCharging, power, spinAngle, setBallVelocity])

  if (!isCharging && power === 0) return null

  const powerPercentage = Math.min(power, 100)
  const powerColor =
    powerPercentage < 33
      ? 'bg-green-500'
      : powerPercentage < 66
        ? 'bg-yellow-500'
        : 'bg-red-500'

  return (
    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-black/80 rounded-lg p-4 z-40 min-w-80">
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-white">Shot Power</span>
            <span className="text-white font-bold">{Math.round(powerPercentage)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded h-4 overflow-hidden">
            <div
              className={`h-full transition-all ${powerColor}`}
              style={{ width: `${powerPercentage}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-white">Spin</span>
            <span className="text-white font-bold">{spinAngle > 0 ? '+' : ''}{spinAngle}°</span>
          </div>
          <div className="relative w-full bg-gray-700 rounded h-3 overflow-hidden">
            <div className="absolute left-1/2 w-1 h-3 bg-white -translate-x-1/2" />
            <div
              className="absolute top-0 h-3 w-2 bg-blue-500 -translate-x-1/2 transition-all"
              style={{ left: `calc(50% + ${(spinAngle / 30) * 50}%)` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>Left ←</span>
            <span>Right →</span>
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center">
          SPACE: Charge | ← →: Spin | SPACE release: Shoot
        </p>
      </div>
    </div>
  )
}
