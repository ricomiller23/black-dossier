'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useGameStore } from '@/lib/store'
import { AgentPortrait } from './AgentPortrait'
import { Pin, FileText, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react'

export const EvidenceCorkboard: React.FC = () => {
  const blueprint = useGameStore((s) => s.blueprint)
  const revealedClues = useGameStore((s) => s.revealedClues)
  const currentScene = useGameStore((s) => s.currentScene)

  const [inspectedDoc, setInspectedDoc] = useState<string | null>(null)

  if (!blueprint) return null

  // Collect all clues across mission
  const allClues = blueprint.scenes.flatMap((s) => s.clues)

  return (
    <div className="relative w-full h-[480px] sm:h-[540px] md:h-[600px] rounded-2xl overflow-hidden border-4 border-[#3D2918] bg-[#1E140C] shadow-2xl select-none p-4 flex flex-col justify-between">
      {/* 1. Realistic Corkboard Texture */}
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#4A3525 1.5px, transparent 1.5px), radial-gradient(#291C12 1.5px, #1E140C 1.5px)`,
          backgroundSize: '24px 24px',
          backgroundPosition: '0 0, 12px 12px'
        }}
      />

      {/* 2. Top Header Tape */}
      <div className="relative z-20 flex items-center justify-between pb-3 border-b border-[#C9A227]/25">
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 bg-[#D97706]/20 border border-[#D97706] rounded text-[#F59E0B] font-mono text-xs font-black uppercase tracking-widest shadow-sm">
            EVIDENCE CORKBOARD // REDACTED CLASSIFIED ATLAS
          </div>
          <span className="text-[11px] font-mono text-stone-400">
            DISCLOSED: {revealedClues.length} / {allClues.length} INTEL PACKETS
          </span>
        </div>

        <div className="text-[10px] font-mono text-stone-400 bg-black/50 px-2.5 py-1 rounded border border-stone-800">
          OPERATIONAL TARGET: <strong className="text-[#F2D06B]">{blueprint.faction}</strong>
        </div>
      </div>

      {/* 3. Main Corkboard Canvas with Pinned Items & Red Strings */}
      <div className="relative flex-1 w-full my-2 overflow-hidden">
        {/* SVG Animated Red String Lines */}
        <svg
          viewBox="0 0 800 420"
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        >
          {/* Main Red String Connecting Target to Clues */}
          <motion.path
            d="M 400 90 Q 250 160 160 260"
            fill="none"
            stroke="#DC2626"
            strokeWidth="2.5"
            strokeDasharray="6 3"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
          <motion.path
            d="M 400 90 Q 550 180 640 260"
            fill="none"
            stroke="#DC2626"
            strokeWidth="2.5"
            strokeDasharray="6 3"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.8, ease: 'easeOut' }}
          />
          <motion.path
            d="M 400 90 L 400 240"
            fill="none"
            stroke="#B91C1C"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </svg>

        {/* Center: Primary Target Mugshot & Dossier Card */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
          {/* Pushpin */}
          <div className="w-4 h-4 rounded-full bg-red-600 border-2 border-white shadow-lg -mb-2 z-30" />

          <motion.div
            whileHover={{ scale: 1.03, rotate: 1 }}
            className="w-56 p-3 rounded-lg bg-[#FAF5EB] text-[#1C1917] shadow-2xl border border-stone-300 transform -rotate-1"
          >
            <div className="flex items-center gap-2 mb-2">
              <AgentPortrait
                size="sm"
                portrait={{
                  faceShape: 1,
                  skinTone: '#C68642',
                  hairStyle: 0,
                  hairColor: '#4A5568',
                  glasses: true,
                  sunglasses: false,
                  scar: true,
                  facialHair: 1,
                  clothingStyle: 'Trench Coat',
                  clothingColor: '#2D3748'
                }}
              />
              <div className="leading-tight">
                <div className="text-[9px] font-mono text-red-700 font-bold uppercase tracking-wider">
                  HIGH VALUE TARGET
                </div>
                <div className="font-serif font-black text-sm text-stone-900">
                  {blueprint.scenes[3]?.npcs[0]?.name || 'Target Operative'}
                </div>
                <div className="text-[9px] text-stone-600 font-mono">
                  {blueprint.scenes[3]?.npcs[0]?.role || 'Chief Commander'}
                </div>
              </div>
            </div>

            {/* Secret Redaction Bar */}
            <div className="p-1.5 rounded bg-stone-200 text-[10px] font-mono">
              <span className="font-bold text-stone-700">DOSSIER CIPHER:</span>
              <div className="relative mt-1 text-[9px] text-stone-800">
                {revealedClues.length >= 2 ? (
                  <span className="text-emerald-700 font-bold">
                    {blueprint.scenes[3]?.npcs[0]?.secret}
                  </span>
                ) : (
                  <div className="h-4 bg-stone-900 rounded flex items-center px-2 text-white font-mono text-[8px] tracking-widest uppercase">
                    ████ TOP SECRET ████
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Left Pinned Dossier: Clue File 1 */}
        <div className="absolute bottom-4 left-6 z-20">
          <div className="w-4 h-4 rounded-full bg-yellow-400 border-2 border-white shadow-lg -mb-2 ml-4 z-30" />
          <motion.div
            whileHover={{ scale: 1.04, rotate: -2 }}
            onClick={() => setInspectedDoc(allClues[0] || 'Intel File')}
            className="w-56 sm:w-64 p-3 rounded-lg bg-[#FAF5EB] text-[#1C1917] shadow-xl border border-stone-300 transform -rotate-3 cursor-pointer"
          >
            <div className="flex items-center justify-between pb-1 border-b border-stone-300 mb-2">
              <span className="text-[9px] font-mono font-bold text-stone-600">INTERCEPT #01</span>
              {revealedClues.includes(allClues[0]) ? (
                <span className="text-[9px] font-mono text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> DECLASSIFIED
                </span>
              ) : (
                <span className="text-[9px] font-mono text-red-600 font-bold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> ENCRYPTED
                </span>
              )}
            </div>

            <p className="text-xs font-serif leading-relaxed text-stone-800">
              {revealedClues.includes(allClues[0]) ? (
                allClues[0]
              ) : (
                <span className="inline-block w-full">
                  <span className="bg-black text-black select-none px-1">SECURITY LOG CONTAINS</span>{' '}
                  <span className="bg-black text-black select-none px-2">SCHEDULED CHANGEOVER</span>{' '}
                  <span className="text-stone-400 font-mono text-[10px] block mt-1">
                    [Execute Search or Computers check to declassify]
                  </span>
                </span>
              )}
            </p>
          </motion.div>
        </div>

        {/* Center-Bottom Pinned Dossier: Twist & Operation Complication */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
          <div className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-lg -mb-2 ml-6 z-30" />
          <motion.div
            whileHover={{ scale: 1.04 }}
            className="w-60 p-3 rounded-lg bg-[#FFFBEB] text-[#78350F] shadow-xl border border-amber-300 transform rotate-1"
          >
            <div className="text-[9px] font-mono font-black text-amber-800 uppercase tracking-wider mb-1">
              FIELD COMPLICATION INTEL
            </div>
            <p className="text-xs font-mono text-stone-800 leading-snug">
              {blueprint.twist}
            </p>
          </motion.div>
        </div>

        {/* Right Pinned Dossier: Clue File 2 */}
        <div className="absolute bottom-4 right-6 z-20">
          <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg -mb-2 ml-4 z-30" />
          <motion.div
            whileHover={{ scale: 1.04, rotate: 2 }}
            onClick={() => setInspectedDoc(allClues[1] || 'Intel File')}
            className="w-56 sm:w-64 p-3 rounded-lg bg-[#FAF5EB] text-[#1C1917] shadow-xl border border-stone-300 transform rotate-3 cursor-pointer"
          >
            <div className="flex items-center justify-between pb-1 border-b border-stone-300 mb-2">
              <span className="text-[9px] font-mono font-bold text-stone-600">INTERCEPT #02</span>
              {revealedClues.includes(allClues[1]) ? (
                <span className="text-[9px] font-mono text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> DECLASSIFIED
                </span>
              ) : (
                <span className="text-[9px] font-mono text-red-600 font-bold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> ENCRYPTED
                </span>
              )}
            </div>

            <p className="text-xs font-serif leading-relaxed text-stone-800">
              {revealedClues.includes(allClues[1]) ? (
                allClues[1]
              ) : (
                <span className="inline-block w-full">
                  <span className="bg-black text-black select-none px-2">CIRCUIT PANEL CAN BE</span>{' '}
                  <span className="bg-black text-black select-none px-1">BRIDGED WITH ELECTRONICS</span>{' '}
                  <span className="text-stone-400 font-mono text-[10px] block mt-1">
                    [Execute Electronics or Lockpicking check]
                  </span>
                </span>
              )}
            </p>
          </motion.div>
        </div>
      </div>

      {/* 4. Bottom Footer Note */}
      <div className="relative z-20 pt-2 border-t border-[#C9A227]/25 flex items-center justify-between text-[11px] font-mono text-stone-400">
        <span>Click any document to inspect full declassified dispatch</span>
        <span className="text-[#F2D06B]">CASE FILE: {blueprint.codeName}</span>
      </div>

      {/* 5. Document Magnifier Inspection Modal */}
      <AnimatePresence>
        {inspectedDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-lg p-6 rounded-xl bg-[#FAF5EB] text-[#1C1917] shadow-2xl border-4 border-stone-400"
            >
              <div className="flex items-center justify-between pb-2 border-b-2 border-stone-800 mb-4">
                <span className="font-mono font-black text-xs uppercase tracking-widest text-red-800">
                  CONFIDENTIAL INTELLIGENCE DISPATCH
                </span>
                <button
                  type="button"
                  onClick={() => setInspectedDoc(null)}
                  className="p-1 rounded font-bold text-stone-600 hover:text-black cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 bg-stone-100 rounded border border-stone-300 font-mono text-sm leading-relaxed mb-4">
                {inspectedDoc}
              </div>

              <button
                type="button"
                onClick={() => setInspectedDoc(null)}
                className="w-full py-2.5 rounded bg-stone-900 text-white font-mono text-xs font-bold uppercase tracking-wider hover:bg-stone-800 cursor-pointer"
              >
                RETURN TO DOSSIER [ESC]
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
