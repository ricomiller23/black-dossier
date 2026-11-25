'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useGameStore } from '@/lib/store'
import { HitLocation } from '@/lib/schemas'
import { STANDARD_WEAPONS } from '@/lib/engine/combat'
import { Crosshair, Shield, Zap, RefreshCw, AlertOctagon } from 'lucide-react'

export const BallisticCombatView: React.FC = () => {
  const agent = useGameStore((s) => s.agent)
  const applyDamage = useGameStore((s) => s.applyDamage)
  const healAgent = useGameStore((s) => s.healAgent)
  const submitAction = useGameStore((s) => s.submitAction)
  const diceResult = useGameStore((s) => s.diceResult)
  const isRollingDice = useGameStore((s) => s.isRollingDice)
  const useEdgePoint = useGameStore((s) => s.useEdgePoint)

  const [selectedWeapon, setSelectedWeapon] = useState(STANDARD_WEAPONS[1])
  const [targetLocation, setTargetLocation] = useState<HitLocation>('chest')

  if (!agent) return null

  const handleShoot = () => {
    submitAction(`Engage hostile with ${selectedWeapon.name} aiming for the ${targetLocation}`)
  }

  return (
    <div className="relative w-full h-[480px] sm:h-[540px] md:h-[600px] rounded-2xl overflow-hidden border border-rose-900/50 bg-[#090b10] shadow-[0_0_50px_rgba(225,29,72,0.15)] p-4 flex flex-col justify-between select-none">
      {/* 1. Combat Header HUD */}
      <div className="relative z-20 flex items-center justify-between pb-3 border-b border-rose-900/40">
        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 rounded bg-rose-950/80 border border-rose-600 text-rose-300 font-mono text-xs font-black tracking-widest uppercase flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            BALLISTIC ENGAGEMENT // KINETIC COMBAT
          </div>
          <span className="text-xs font-mono text-stone-400">
            WOUND STATE:{' '}
            <strong
              className={
                agent.woundState === 'Fine'
                  ? 'text-emerald-400'
                  : agent.woundState === 'Grazed'
                  ? 'text-yellow-400'
                  : 'text-rose-500 font-black animate-pulse'
              }
            >
              {agent.woundState.toUpperCase()}
            </strong>
          </span>
        </div>

        {/* Edge Point Reroll Button */}
        <button
          type="button"
          disabled={agent.edgePoints <= 0}
          onClick={() => useEdgePoint()}
          className={`px-3 py-1 rounded border text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
            agent.edgePoints > 0
              ? 'bg-amber-950/60 border-amber-500 text-amber-300 hover:bg-amber-900 active:scale-95 cursor-pointer shadow-md'
              : 'bg-stone-900 border-stone-800 text-stone-600 cursor-not-allowed'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>SPEND EDGE POINT ({agent.edgePoints} REMAINING)</span>
        </button>
      </div>

      {/* 2. Main Center Arena: 3D Dice Tray & Anatomical Silhouette */}
      <div className="relative flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 items-center justify-center my-2">
        {/* Left: Holographic Wireframe Anatomical Hit Location Target */}
        <div className="relative h-full flex flex-col items-center justify-center p-2 rounded-xl bg-black/60 border border-stone-800">
          <span className="text-[10px] font-mono text-stone-400 mb-1 uppercase tracking-wider">
            ANATOMICAL TARGET MATRIX // SELECT HIT LOCATION
          </span>

          <div className="relative w-48 h-64 flex items-center justify-center">
            {/* SVG Wireframe Mannequin */}
            <svg viewBox="0 0 160 220" className="w-full h-full drop-shadow-md">
              {/* Head */}
              <motion.circle
                cx="80"
                cy="30"
                r="18"
                className="cursor-pointer"
                fill={targetLocation === 'head' ? '#e11d48' : '#1e293b'}
                stroke={targetLocation === 'head' ? '#fda4af' : '#64748b'}
                strokeWidth="2"
                whileHover={{ scale: 1.08 }}
                onClick={() => setTargetLocation('head')}
              />
              <text x="80" y="34" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold" pointerEvents="none">
                HEAD (2.0x)
              </text>

              {/* Chest */}
              <motion.path
                d="M55 52 L105 52 L98 95 L62 95 Z"
                className="cursor-pointer"
                fill={targetLocation === 'chest' ? '#e11d48' : '#1e293b'}
                stroke={targetLocation === 'chest' ? '#fda4af' : '#64748b'}
                strokeWidth="2"
                whileHover={{ scale: 1.05 }}
                onClick={() => setTargetLocation('chest')}
              />
              <text x="80" y="75" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold" pointerEvents="none">
                CHEST (1.2x)
              </text>

              {/* Abdomen */}
              <motion.path
                d="M62 98 L98 98 L92 135 L68 135 Z"
                className="cursor-pointer"
                fill={targetLocation === 'abdomen' ? '#e11d48' : '#1e293b'}
                stroke={targetLocation === 'abdomen' ? '#fda4af' : '#64748b'}
                strokeWidth="2"
                whileHover={{ scale: 1.05 }}
                onClick={() => setTargetLocation('abdomen')}
              />
              <text x="80" y="118" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold" pointerEvents="none">
                ABDOMEN
              </text>

              {/* Arms */}
              <motion.path
                d="M50 56 L30 115 L40 120 L55 68 Z"
                className="cursor-pointer"
                fill={targetLocation === 'arms' ? '#e11d48' : '#1e293b'}
                stroke={targetLocation === 'arms' ? '#fda4af' : '#64748b'}
                strokeWidth="2"
                onClick={() => setTargetLocation('arms')}
              />
              <motion.path
                d="M110 56 L130 115 L120 120 L105 68 Z"
                className="cursor-pointer"
                fill={targetLocation === 'arms' ? '#e11d48' : '#1e293b'}
                stroke={targetLocation === 'arms' ? '#fda4af' : '#64748b'}
                strokeWidth="2"
                onClick={() => setTargetLocation('arms')}
              />

              {/* Legs */}
              <motion.path
                d="M66 138 L60 210 L74 210 L78 138 Z"
                className="cursor-pointer"
                fill={targetLocation === 'legs' ? '#e11d48' : '#1e293b'}
                stroke={targetLocation === 'legs' ? '#fda4af' : '#64748b'}
                strokeWidth="2"
                onClick={() => setTargetLocation('legs')}
              />
              <motion.path
                d="M94 138 L100 210 L86 210 L82 138 Z"
                className="cursor-pointer"
                fill={targetLocation === 'legs' ? '#e11d48' : '#1e293b'}
                stroke={targetLocation === 'legs' ? '#fda4af' : '#64748b'}
                strokeWidth="2"
                onClick={() => setTargetLocation('legs')}
              />
            </svg>
          </div>

          <div className="mt-2 text-[11px] font-mono text-[#F2D06B]">
            TARGETING: <strong className="uppercase">{targetLocation}</strong>
          </div>
        </div>

        {/* Right: 3D Rolling Dice Tray & Outcome Display */}
        <div className="relative h-full flex flex-col items-center justify-between p-4 rounded-xl bg-[#0f172a]/90 border border-cyan-900/60 shadow-inner">
          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">
            FELT BALLISTIC DICE TRAY // d100 TEST
          </span>

          {/* Animated 3D Dice Display */}
          <div className="relative w-40 h-40 rounded-2xl bg-[#031526] border-2 border-cyan-500/40 shadow-[inset_0_0_20px_rgba(14,165,233,0.3)] flex flex-col items-center justify-center overflow-hidden">
            <AnimatePresence mode="wait">
              {isRollingDice ? (
                <motion.div
                  key="rolling"
                  animate={{
                    rotate: [0, 90, 180, 270, 360],
                    scale: [0.9, 1.1, 0.9]
                  }}
                  transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }}
                  className="flex flex-col items-center justify-center text-cyan-400 font-mono"
                >
                  <RefreshCw className="w-10 h-10 animate-spin mb-2" />
                  <span className="text-xs font-bold tracking-widest">TUMBLING...</span>
                </motion.div>
              ) : diceResult ? (
                <motion.div
                  key="result"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 20 }}
                  className="flex flex-col items-center justify-center"
                >
                  <span className="font-serif font-black text-4xl text-white drop-shadow">
                    {diceResult.roll}
                  </span>
                  <span className="text-[10px] font-mono text-stone-400">
                    TARGET: ≤ {diceResult.target}
                  </span>

                  {/* Stamp Badge */}
                  <div
                    className={`mt-2 px-2.5 py-0.5 rounded text-[10px] font-mono font-black uppercase tracking-wider border shadow-md ${
                      diceResult.outcome === 'CRITICAL'
                        ? 'bg-amber-400 text-black border-amber-200'
                        : diceResult.outcome === 'SUCCESS'
                        ? 'bg-emerald-600 text-white border-emerald-400'
                        : diceResult.outcome === 'FUMBLE'
                        ? 'bg-red-900 text-white border-red-500 animate-pulse'
                        : 'bg-stone-800 text-stone-300 border-stone-600'
                    }`}
                  >
                    {diceResult.outcome} ({diceResult.margin > 0 ? `+${diceResult.margin}` : diceResult.margin})
                  </div>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center text-stone-500 font-mono text-xs">
                  <Crosshair className="w-8 h-8 mb-1 opacity-40" />
                  <span>AWAITING ROLL</span>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Weapon Selector */}
          <div className="w-full flex items-center justify-between gap-1 text-[10px] font-mono mt-2">
            {STANDARD_WEAPONS.slice(0, 3).map((wep) => (
              <button
                key={wep.id}
                type="button"
                onClick={() => setSelectedWeapon(wep)}
                className={`flex-1 py-1 px-1.5 rounded border text-center transition-all ${
                  selectedWeapon.id === wep.id
                    ? 'border-rose-500 bg-rose-950/80 text-rose-300 font-bold'
                    : 'border-stone-800 bg-black/40 text-stone-400 hover:text-white'
                }`}
              >
                {wep.name.split(' ')[0]} ({wep.baseDamage} dmg)
              </button>
            ))}
          </div>

          {/* Fire Action Button */}
          <button
            type="button"
            onClick={handleShoot}
            className="w-full mt-2 min-h-[44px] py-2.5 px-4 rounded-xl font-mono font-black text-xs text-white bg-gradient-to-r from-rose-700 via-rose-600 to-red-800 hover:brightness-110 active:scale-95 transition-all shadow-lg cursor-pointer uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <Crosshair className="w-4 h-4" />
            <span>DISCHARGE {selectedWeapon.name.toUpperCase()}</span>
          </button>
        </div>
      </div>

      {/* 3. Bottom Health & Vitality Gauge */}
      <div className="relative z-20 pt-2 border-t border-rose-900/40 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="text-stone-400">OPERATIVE INTEGRITY:</span>
          <div className="w-36 h-2.5 rounded-full bg-stone-900 overflow-hidden border border-stone-700">
            <div
              className={`h-full transition-all duration-300 ${
                agent.currentWP > agent.maxWP * 0.5
                  ? 'bg-emerald-500'
                  : agent.currentWP > agent.maxWP * 0.25
                  ? 'bg-yellow-500'
                  : 'bg-rose-600 animate-pulse'
              }`}
              style={{ width: `${Math.max(0, (agent.currentWP / agent.maxWP) * 100)}%` }}
            />
          </div>
          <strong className="text-white">
            {agent.currentWP} / {agent.maxWP} WP
          </strong>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => healAgent(4)}
            className="px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 text-[10px] cursor-pointer"
          >
            APPLY FIRST AID (+4 WP)
          </button>
        </div>
      </div>
    </div>
  )
}
