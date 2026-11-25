'use client'

import React from 'react'
import { motion } from 'motion/react'
import { useGameStore } from '@/lib/store'
import { Shield, Zap, AlertTriangle, ArrowRight, Gauge, Radio } from 'lucide-react'

export const ChaseTrackView: React.FC = () => {
  const chaseProgress = useGameStore((s) => s.chaseProgress)
  const setChase = useGameStore((s) => s.setChase)
  const submitAction = useGameStore((s) => s.submitAction)
  const agent = useGameStore((s) => s.agent)

  const handleManeuver = (action: string, delta: number) => {
    setChase(delta)
    submitAction(`Execute tactical driving maneuver: ${action}`)
  }

  return (
    <div className="relative w-full h-[400px] sm:h-[460px] rounded-2xl overflow-hidden border border-amber-900/50 bg-[#0a0705] shadow-[0_0_40px_rgba(245,158,11,0.15)] p-4 flex flex-col justify-between select-none">
      {/* 1. Chase Header HUD */}
      <div className="relative z-20 flex items-center justify-between pb-3 border-b border-amber-900/40">
        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 rounded bg-amber-950/80 border border-amber-500 text-amber-300 font-mono text-xs font-black tracking-widest uppercase flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            HIGH-SPEED VEHICULAR PURSUIT // CHASE TRACK
          </div>
          <span className="text-xs font-mono text-stone-400">
            DISTANCE INDEX: <strong className="text-[#F2D06B]">{chaseProgress} / 10</strong>
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-stone-400">
          <Gauge className="w-4 h-4 text-amber-400 animate-spin" />
          <span>SPEED: 145 KM/H</span>
        </div>
      </div>

      {/* 2. Animated Highway / Asphalt Track Canvas */}
      <div className="relative flex-1 my-4 rounded-xl border border-stone-800 bg-[#120f0d] overflow-hidden flex flex-col justify-center px-6">
        {/* Animated Speed Lines Background */}
        <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-0.5 bg-amber-400"
              style={{
                top: `${(i + 1) * 11}%`,
                left: 0,
                width: '30%'
              }}
              animate={{ x: ['100vw', '-20vw'] }}
              transition={{
                duration: 0.8 + (i % 3) * 0.2,
                repeat: Infinity,
                ease: 'linear',
                delay: i * 0.15
              }}
            />
          ))}
        </div>

        {/* 10-Notch Horizontal Track Line */}
        <div className="relative w-full h-12 flex items-center justify-between z-10">
          {/* Continuous Highway Road Line */}
          <div className="absolute inset-x-0 h-1.5 bg-stone-800 rounded-full">
            <div
              className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${(chaseProgress / 10) * 100}%` }}
            />
          </div>

          {/* 11 Distance Waypoints (0 to 10) */}
          {Array.from({ length: 11 }).map((_, idx) => (
            <div key={idx} className="relative flex flex-col items-center">
              <div
                className={`w-4 h-4 rounded-full border-2 transition-all ${
                  idx === chaseProgress
                    ? 'w-6 h-6 bg-amber-400 border-white shadow-[0_0_15px_rgba(245,158,11,1)] z-20'
                    : idx < chaseProgress
                    ? 'bg-amber-700 border-amber-500'
                    : 'bg-stone-900 border-stone-700'
                }`}
              />
              <span
                className={`text-[10px] font-mono mt-2 font-bold ${
                  idx === chaseProgress ? 'text-amber-300 scale-110' : 'text-stone-600'
                }`}
              >
                {idx === 0 ? 'CORNERED' : idx === 10 ? 'ESCAPED' : idx}
              </span>
            </div>
          ))}

          {/* Player Escape Vehicle Marker */}
          <motion.div
            className="absolute -top-7 -translate-x-1/2 flex flex-col items-center z-30 pointer-events-none"
            animate={{ left: `${(chaseProgress / 10) * 100}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <div className="px-2 py-0.5 rounded bg-amber-500 text-black text-[9px] font-mono font-black tracking-wider uppercase shadow-lg">
              OPERATIVE [YOU]
            </div>
            <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-amber-500" />
          </motion.div>
        </div>

        {/* Pursuit Status Banner */}
        <div className="mt-8 text-center text-xs font-mono">
          {chaseProgress >= 10 ? (
            <span className="text-emerald-400 font-bold uppercase tracking-wider">
              PURSUIT EVADED: You have broken visual contact and merged into highway traffic.
            </span>
          ) : chaseProgress <= 0 ? (
            <span className="text-red-500 font-bold uppercase tracking-wider animate-pulse">
              HOSTILE INTERCEPTION: Pursuing syndicate vehicles have boxed you in!
            </span>
          ) : (
            <span className="text-stone-400">
              Hostile black sedans in pursuit. Distance margin: {chaseProgress * 10} meters.
            </span>
          )}
        </div>
      </div>

      {/* 3. Action Controls */}
      <div className="relative z-20 grid grid-cols-1 sm:grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => handleManeuver('Floor accelerator on open straightaway', 1)}
          className="min-h-[44px] px-3 py-2 rounded-xl bg-amber-950/60 border border-amber-600/80 hover:bg-amber-900 text-amber-200 text-xs font-mono font-bold transition-all active:scale-95 cursor-pointer shadow-md"
        >
          ACCELERATE (+1 DISTANCE)
        </button>

        <button
          type="button"
          onClick={() => handleManeuver('Hard handbrake J-turn into narrow alleyway', 2)}
          className="min-h-[44px] px-3 py-2 rounded-xl bg-cyan-950/60 border border-cyan-600/80 hover:bg-cyan-900 text-cyan-200 text-xs font-mono font-bold transition-all active:scale-95 cursor-pointer shadow-md"
        >
          ALLEYWAY J-TURN (+2 DISTANCE)
        </button>

        <button
          type="button"
          onClick={() => handleManeuver('Deploy road caltrops / suppressive fire', 1)}
          className="min-h-[44px] px-3 py-2 rounded-xl bg-rose-950/60 border border-rose-600/80 hover:bg-rose-900 text-rose-200 text-xs font-mono font-bold transition-all active:scale-95 cursor-pointer shadow-md"
        >
          TACTICAL CALTROPS (+1 DISTANCE)
        </button>
      </div>
    </div>
  )
}
