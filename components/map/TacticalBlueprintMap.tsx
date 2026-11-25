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

  // Nodes position layout on the 840x480 blueprint canvas
  const scenePositions: Record<string, { x: number; y: number }> = {
    scene_1_approach: { x: 130, y: 350 },
    scene_2_interior: { x: 350, y: 340 },
    scene_2_social: { x: 350, y: 160 },
    scene_3_vault: { x: 590, y: 240 },
    scene_4_extraction: { x: 730, y: 130 }
  }

  return (
    <div className="relative w-full h-full min-h-[460px] sm:min-h-[540px] md:min-h-[620px] rounded-xl overflow-hidden border border-[#0ea5e9]/40 bg-[#040d1a] shadow-[0_0_50px_rgba(14,165,233,0.18)] select-none flex flex-col justify-between">
      {/* 1. Blueprint Grid Lines & Grid Numbers */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, #0ea5e9 1px, transparent 1px), linear-gradient(to bottom, #0ea5e9 1px, transparent 1px)',
          backgroundSize: '36px 36px'
        }}
      />

      {/* 2. Top Status HUD Bar */}
      <div className="relative top-0 inset-x-0 p-3 flex flex-wrap items-center justify-between text-[11px] sm:text-xs font-mono z-30 bg-[#081b33]/80 border-b border-[#0ea5e9]/30 gap-2">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#081b33] border border-[#0ea5e9]/50 text-[#38bdf8]">
          <span className="w-2 h-2 rounded-full bg-[#38bdf8] animate-ping" />
          <span className="font-bold uppercase tracking-wider text-xs sm:text-sm">
            CAD BLUEPRINT // {blueprint.city.toUpperCase()}, {blueprint.country.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/60 border border-stone-800 text-[10px] text-stone-300">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>RADAR: ACTIVE SWEEP</span>
          </div>
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded border text-[10px] sm:text-xs font-bold ${
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
      <div className="relative flex-1 w-full flex items-center justify-center p-2 z-20">
        <svg
          viewBox="0 0 840 480"
          className="w-full h-full max-h-[75vh]"
          preserveAspectRatio="xMidYMid meet"
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
            x="40"
            y="40"
            width="760"
            height="400"
            rx="14"
            fill="#06182e"
            fillOpacity="0.75"
            stroke="#0ea5e9"
            strokeWidth="2"
            strokeDasharray="8 4"
          />

          {/* Sector Compartments */}
          {/* Sector A: Entry Corridors */}
          <rect x="65" y="270" width="230" height="150" fill="#0b2342" fillOpacity="0.6" stroke="#0ea5e9" strokeWidth="1.2" />
          <text x="75" y="295" fill="#38bdf8" fontSize="11" fontWeight="bold" fontFamily="monospace" opacity="0.85">SECTOR A: ALLEYWAY & SERVICE DECK</text>

          {/* Sector B1: Maintenance Sub-Level */}
          <rect x="320" y="270" width="230" height="150" fill="#0b2342" fillOpacity="0.6" stroke="#0ea5e9" strokeWidth="1.2" />
          <text x="330" y="295" fill="#38bdf8" fontSize="11" fontWeight="bold" fontFamily="monospace" opacity="0.85">SECTOR B-1: STEAM GALLERY</text>

          {/* Sector B2: VIP Reception */}
          <rect x="320" y="60" width="230" height="190" fill="#0b2342" fillOpacity="0.6" stroke="#0ea5e9" strokeWidth="1.2" />
          <text x="330" y="85" fill="#38bdf8" fontSize="11" fontWeight="bold" fontFamily="monospace" opacity="0.85">SECTOR B-2: MEZZANINE SALON</text>

          {/* Sector C: Vault & Archive */}
          <rect x="570" y="160" width="210" height="180" fill="#0b2342" fillOpacity="0.6" stroke="#0ea5e9" strokeWidth="1.2" />
          <text x="580" y="185" fill="#38bdf8" fontSize="11" fontWeight="bold" fontFamily="monospace" opacity="0.85">SECTOR C: REINFORCED VAULT</text>

          {/* Sector D: Rooftop Extraction */}
          <rect x="570" y="60" width="210" height="85" fill="#08281a" fillOpacity="0.6" stroke="#10b981" strokeWidth="1.2" />
          <text x="580" y="85" fill="#34d399" fontSize="11" fontWeight="bold" fontFamily="monospace" opacity="0.9">SECTOR D: ROOFTOP HELIPAD</text>

          {/* Sweeping Laser Tripwire */}
          <line x1="320" y1="260" x2="550" y2="260" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 2" opacity="0.85">
            <animate attributeName="opacity" values="0.2;1;0.2" dur="2s" repeatCount="indefinite" />
          </line>

          {/* Security Camera Conical Vision Cones */}
          <path d="M 65 60 L 160 140 L 220 70 Z" fill="#ef4444" fillOpacity="0.12" stroke="#ef4444" strokeWidth="0.8">
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="-15 65 60; 25 65 60; -15 65 60"
              dur="6s"
              repeatCount="indefinite"
            />
          </path>
          <circle cx="65" cy="60" r="5" fill="#ef4444" />

          {/* Scene Connection Paths */}
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
                    strokeWidth={isUnlocked ? 2.5 : 1.2}
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
                    r="28"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2"
                    className="animate-ping opacity-75"
                  />
                )}

                {/* Node Base Circle */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="22"
                  fill={isCurrent ? '#0284c7' : isExtraction ? '#15803d' : isClimax ? '#b91c1c' : '#0f172a'}
                  stroke={isCurrent ? '#7dd3fc' : isAccessible ? '#38bdf8' : '#334155'}
                  strokeWidth={isCurrent ? 3 : 2}
                  filter={isCurrent ? 'url(#cyanGlow)' : undefined}
                />

                {/* Node Icon */}
                <text
                  x={pos.x}
                  y={pos.y + 5}
                  textAnchor="middle"
                  fontSize="13"
                  fill="#ffffff"
                  fontWeight="bold"
                  fontFamily="monospace"
                  pointerEvents="none"
                >
                  {scene.type === 'approach' ? '01' : scene.type === 'climax' ? 'OBJ' : isExtraction ? 'EXT' : '02'}
                </text>

                {/* Label Pill Below Node */}
                <rect
                  x={pos.x - 75}
                  y={pos.y + 26}
                  width="150"
                  height="20"
                  rx="4"
                  fill="#030712"
                  fillOpacity="0.9"
                  stroke={isCurrent ? '#38bdf8' : '#1e293b'}
                  strokeWidth="1.2"
                />
                <text
                  x={pos.x}
                  y={pos.y + 40}
                  textAnchor="middle"
                  fill={isCurrent ? '#f8fafc' : '#cbd5e1'}
                  fontSize="10"
                  fontWeight="bold"
                  fontFamily="monospace"
                  pointerEvents="none"
                >
                  {scene.type.toUpperCase()}: {scene.venueName.substring(0, 16)}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* 5. Bottom Interactive Node Inspector Drawer */}
      <div className="relative bottom-0 inset-x-0 p-3 flex flex-wrap items-center justify-between bg-[#071322]/95 border-t border-[#0ea5e9]/40 text-xs sm:text-sm font-mono z-30 gap-2">
        <div>
          <span className="text-stone-400">CURRENT POSITION: </span>
          <strong className="text-[#38bdf8] text-sm">{currentScene?.venueName || 'Outer Perimeter'}</strong>
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
                className="px-4 py-2 rounded-lg bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs sm:text-sm font-bold tracking-wider active:scale-95 transition-all shadow-lg cursor-pointer"
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
