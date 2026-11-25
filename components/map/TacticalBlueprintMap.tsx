'use client'

import React, { useState } from 'react'
import { motion } from 'motion/react'
import { useGameStore } from '@/lib/store'
import { Shield, Eye, AlertTriangle, Key, Terminal, Radio } from 'lucide-react'

export const TacticalBlueprintMap: React.FC = () => {
  const blueprint = useGameStore((s) => s.blueprint)
  const currentScene = useGameStore((s) => s.currentScene)
  const moveToScene = useGameStore((s) => s.moveToScene)
  const alertLevel = useGameStore((s) => s.alertLevel)
  const revealedClues = useGameStore((s) => s.revealedClues)

  const [hoveredNode, setHoveredNode] = useState<string | null>(null)

  if (!blueprint) return null

  // Nodes position layout on the 800x480 blueprint canvas
  const scenePositions: Record<string, { x: number; y: number }> = {
    scene_1_approach: { x: 120, y: 360 },
    scene_2_interior: { x: 340, y: 340 },
    scene_2_social: { x: 340, y: 160 },
    scene_3_vault: { x: 580, y: 240 },
    scene_4_extraction: { x: 720, y: 120 }
  }

  return (
    <div className="relative w-full h-[360px] sm:h-[440px] md:h-[480px] rounded-xl overflow-hidden border border-[#0ea5e9]/40 bg-[#040d1a] shadow-[0_0_40px_rgba(14,165,233,0.15)] select-none">
      {/* 1. Blueprint Grid Lines & Grid Numbers */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, #0ea5e9 1px, transparent 1px), linear-gradient(to bottom, #0ea5e9 1px, transparent 1px)',
          backgroundSize: '32px 32px'
        }}
      />

      {/* 2. Top Status HUD Bar */}
      <div className="absolute top-2 inset-x-3 flex items-center justify-between text-[11px] font-mono z-30 pointer-events-none">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#081b33]/90 border border-[#0ea5e9]/40 text-[#38bdf8]">
          <span className="w-2 h-2 rounded-full bg-[#38bdf8] animate-ping" />
          <span className="font-bold uppercase tracking-wider">
            TACTICAL BLUEPRINT // {blueprint.city.toUpperCase()}, {blueprint.country.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/60 border border-stone-800 text-[10px] text-stone-300">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>RADAR: ACTIVE</span>
          </div>
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-bold ${
            alertLevel >= 3
              ? 'border-red-500/80 bg-red-950/80 text-red-300 animate-pulse'
              : 'border-cyan-500/40 bg-cyan-950/40 text-cyan-300'
          }`}>
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>SECTOR ALERT: LVL {alertLevel}</span>
          </div>
        </div>
      </div>

      {/* 3. Sweeping Radar Beam Animation */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] origin-center pointer-events-none"
          style={{
            background:
              'conic-gradient(from 0deg at 50% 50%, rgba(14, 165, 233, 0.25) 0deg, rgba(14, 165, 233, 0) 50deg, transparent 360deg)'
          }}
        />
      </div>

      {/* 4. Interactive SVG Architectural Floorplan */}
      <svg
        viewBox="0 0 840 480"
        className="relative w-full h-full z-20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Glowing Filter */}
          <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer Venue Perimeter Walls */}
        <rect
          x="50"
          y="60"
          width="740"
          height="370"
          rx="12"
          fill="#06182e"
          fillOpacity="0.6"
          stroke="#0ea5e9"
          strokeWidth="1.5"
          strokeDasharray="8 4"
        />

        {/* Sector Compartments */}
        {/* Sector A: Entry Corridors */}
        <rect x="70" y="280" width="220" height="130" fill="#0b2342" fillOpacity="0.5" stroke="#0ea5e9" strokeWidth="1" />
        <text x="80" y="300" fill="#38bdf8" fontSize="10" fontFamily="monospace" opacity="0.7">SECTOR A: ALLEYWAY &amp; SERVICE DECK</text>

        {/* Sector B1: Maintenance Sub-Level */}
        <rect x="310" y="270" width="220" height="140" fill="#0b2342" fillOpacity="0.5" stroke="#0ea5e9" strokeWidth="1" />
        <text x="320" y="290" fill="#38bdf8" fontSize="10" fontFamily="monospace" opacity="0.7">SECTOR B-1: STEAM GALLERY</text>

        {/* Sector B2: VIP Reception */}
        <rect x="310" y="80" width="220" height="170" fill="#0b2342" fillOpacity="0.5" stroke="#0ea5e9" strokeWidth="1" />
        <text x="320" y="100" fill="#38bdf8" fontSize="10" fontFamily="monospace" opacity="0.7">SECTOR B-2: MEZZANINE SALON</text>

        {/* Sector C: Inner Vault Core */}
        <rect x="550" y="150" width="220" height="170" fill="#1e1b4b" fillOpacity="0.6" stroke="#818cf8" strokeWidth="1.5" />
        <text x="560" y="170" fill="#a5b4fc" fontSize="10" fontFamily="monospace" opacity="0.8">SECTOR C: INNER VAULT CORE [RESTRICTED]</text>

        {/* Laser Tripwire Animation in Sector C */}
        <motion.line
          x1="550"
          y1="220"
          x2="770"
          y2="220"
          stroke="#ef4444"
          strokeWidth="1.5"
          animate={{ opacity: [0.3, 0.9, 0.3], y1: [190, 260, 190], y2: [190, 260, 190] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Surveillance Cameras with Sweeping Cones */}
        <g transform="translate(300, 75)">
          <circle cx="0" cy="0" r="4" fill="#ef4444" />
          <motion.path
            d="M0 0 L-40 60 L40 60 Z"
            fill="#ef4444"
            fillOpacity="0.12"
            animate={{ rotate: [-25, 35, -25] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            style={{ originX: 0, originY: 0 }}
          />
        </g>

        <g transform="translate(540, 290)">
          <circle cx="0" cy="0" r="4" fill="#ef4444" />
          <motion.path
            d="M0 0 L-50 70 L30 70 Z"
            fill="#ef4444"
            fillOpacity="0.12"
            animate={{ rotate: [30, -30, 30] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ originX: 0, originY: 0 }}
          />
        </g>

        {/* Connecting Corridors / Data Paths */}
        {blueprint.scenes.map((scene) => {
          const start = scenePositions[scene.id]
          if (!start) return null

          return scene.nextScenes.map((targetId) => {
            const end = scenePositions[targetId]
            if (!end) return null
            const isUnlocked = currentScene?.id === scene.id || currentScene?.id === targetId

            return (
              <g key={`path-${scene.id}-${targetId}`}>
                <line
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  stroke={isUnlocked ? '#38bdf8' : '#1e3a5f'}
                  strokeWidth={isUnlocked ? 2 : 1}
                  strokeDasharray={isUnlocked ? '6 4' : '2 4'}
                />
              </g>
            )
          })
        })}

        {/* Interactive Tactical Nodes */}
        {blueprint.scenes.map((scene) => {
          const pos = scenePositions[scene.id]
          if (!pos) return null

          const isCurrent = currentScene?.id === scene.id
          const isAccessible = currentScene?.nextScenes.includes(scene.id)
          const isExtraction = scene.type === 'extraction'
          const isClimax = scene.type === 'climax'

          return (
            <g
              key={scene.id}
              className="cursor-pointer group"
              onClick={() => {
                if (isAccessible) moveToScene(scene.id)
              }}
              onMouseEnter={() => setHoveredNode(scene.id)}
              onMouseLeave={() => setHoveredNode(null)}
            >
              {/* Pulsing selection aura if current */}
              {isCurrent && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="24"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  className="animate-ping opacity-75"
                />
              )}

              {/* Node Base Circle */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r="18"
                fill={isCurrent ? '#0284c7' : isExtraction ? '#15803d' : isClimax ? '#b91c1c' : '#0f172a'}
                stroke={isCurrent ? '#7dd3fc' : isAccessible ? '#38bdf8' : '#334155'}
                strokeWidth={isCurrent ? 2.5 : 1.5}
                filter={isCurrent ? 'url(#cyanGlow)' : undefined}
              />

              {/* Node Icon */}
              <text
                x={pos.x}
                y={pos.y + 4}
                textAnchor="middle"
                fontSize="12"
                fill="#ffffff"
                fontWeight="bold"
                fontFamily="monospace"
                pointerEvents="none"
              >
                {scene.type === 'approach' ? '01' : scene.type === 'climax' ? 'OBJ' : isExtraction ? 'EXT' : '02'}
              </text>

              {/* Label Pill Below Node */}
              <rect
                x={pos.x - 70}
                y={pos.y + 22}
                width="140"
                height="18"
                rx="4"
                fill="#030712"
                fillOpacity="0.85"
                stroke={isCurrent ? '#38bdf8' : '#1e293b'}
                strokeWidth="1"
              />
              <text
                x={pos.x}
                y={pos.y + 34}
                textAnchor="middle"
                fill={isCurrent ? '#f8fafc' : '#94a3b8'}
                fontSize="9"
                fontWeight="bold"
                fontFamily="sans-serif"
                pointerEvents="none"
              >
                {scene.type.toUpperCase()}
              </text>
            </g>
          )
        })}
      </svg>

      {/* 5. Bottom Interactive Node Inspector Drawer */}
      <div className="absolute bottom-2 inset-x-3 flex items-center justify-between p-2 rounded-lg bg-[#071322]/95 border border-[#0ea5e9]/30 text-xs font-mono z-30">
        <div>
          <span className="text-stone-400">ACTIVE POSITION: </span>
          <strong className="text-[#38bdf8]">{currentScene?.venueName || 'Outer Perimeter'}</strong>
        </div>

        <div className="flex items-center gap-2">
          {currentScene?.nextScenes.map((targetId) => {
            const nextSc = blueprint.scenes.find((s) => s.id === targetId)
            if (!nextSc) return null

            return (
              <button
                key={targetId}
                type="button"
                onClick={() => moveToScene(targetId)}
                className="px-3 py-1 rounded bg-[#0284c7] hover:bg-[#0369a1] text-white text-[11px] font-bold tracking-wider active:scale-95 transition-all shadow-md cursor-pointer"
              >
                BREACH TO {nextSc.type.toUpperCase()} →
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
