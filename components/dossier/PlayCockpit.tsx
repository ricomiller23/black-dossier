'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useGameStore } from '@/lib/store'
import { TacticalBlueprintMap } from '../map/TacticalBlueprintMap'
import { EvidenceCorkboard } from './EvidenceCorkboard'
import { BallisticCombatView } from '../combat/BallisticCombatView'
import { ChaseTrackView } from '../chase/ChaseTrackView'
import { AgentPortrait } from './AgentPortrait'
import {
  Shield,
  Eye,
  AlertTriangle,
  Send,
  Zap,
  MapPin,
  FolderOpen,
  Crosshair,
  Volume2,
  VolumeX,
  Tv,
  LogOut,
  Flag,
  FileText,
  Maximize2,
  Minimize2,
  Expand
} from 'lucide-react'

export const PlayCockpit: React.FC = () => {
  const agent = useGameStore((s) => s.agent)
  const blueprint = useGameStore((s) => s.blueprint)
  const currentScene = useGameStore((s) => s.currentScene)
  const alertLevel = useGameStore((s) => s.alertLevel)
  const coverIntegrity = useGameStore((s) => s.coverIntegrity)
  const logs = useGameStore((s) => s.logs)
  const suggestedActions = useGameStore((s) => s.suggestedActions)
  const submitAction = useGameStore((s) => s.submitAction)
  const setPhase = useGameStore((s) => s.setPhase)
  const soundMuted = useGameStore((s) => s.soundMuted)
  const toggleSound = useGameStore((s) => s.toggleSound)
  const toggleCRT = useGameStore((s) => s.toggleCRT)
  const finishMission = useGameStore((s) => s.finishMission)

  const [activeTab, setActiveTab] = useState<'map' | 'corkboard' | 'combat' | 'chase'>('map')
  const [customAction, setCustomAction] = useState('')
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [isDeckExpanded, setIsDeckExpanded] = useState(false)
  const [isTheaterOpen, setIsTheaterOpen] = useState(false)

  // Listen for Escape key to close theater / collapse deck
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isTheaterOpen) setIsTheaterOpen(false)
        else if (isDeckExpanded) setIsDeckExpanded(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isTheaterOpen, isDeckExpanded])

  if (!blueprint || !agent) return null

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customAction.trim()) return
    submitAction(customAction.trim())
    setCustomAction('')
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'map':
        return <TacticalBlueprintMap />
      case 'corkboard':
        return <EvidenceCorkboard />
      case 'combat':
        return <BallisticCombatView />
      case 'chase':
        return <ChaseTrackView />
    }
  }

  return (
    <div className="relative min-h-screen h-[100dvh] max-h-[100dvh] w-full bg-[#07090D] text-[#EDE5D8] flex flex-col justify-between overflow-hidden select-none">
      {/* 1. TOP COMMAND HEADER */}
      <header className="h-12 border-b border-[#C9A227]/30 bg-[#0F131A] px-3 sm:px-6 flex items-center justify-between text-xs font-mono z-30 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-red-950/80 border border-red-600 text-red-400 font-black tracking-widest text-[10px]">
            BLACK DOSSIER
          </div>
          <span className="hidden sm:inline-block text-stone-400">
            OPERATION: <strong className="text-[#F2D06B]">{blueprint.codeName}</strong>
          </span>
          <span className="text-[10px] text-stone-500 font-bold hidden md:inline-block">
            [{blueprint.city.toUpperCase()}]
          </span>
        </div>

        {/* Global Controls & Metrics */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="text-stone-400">ALERT:</span>
            <span
              className={`px-1.5 py-0.2 rounded font-bold ${
                alertLevel >= 3 ? 'bg-red-900 text-white animate-pulse' : 'bg-stone-800 text-stone-200'
              }`}
            >
              LVL {alertLevel}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="text-stone-400">COVER:</span>
            <span className="font-bold text-cyan-400">{coverIntegrity}%</span>
          </div>

          <div className="h-4 w-[1px] bg-stone-700 mx-1 hidden sm:block" />

          {/* Expand View Quick Toggle */}
          <button
            type="button"
            onClick={() => setIsDeckExpanded(!isDeckExpanded)}
            title={isDeckExpanded ? 'Reset Column Width' : 'Expand Visual Deck Width'}
            className={`px-2.5 py-1 rounded text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer hidden lg:flex ${
              isDeckExpanded
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'bg-stone-900 hover:bg-stone-800 text-amber-300 border border-amber-600/40'
            }`}
          >
            {isDeckExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{isDeckExpanded ? 'SHRINK DECK' : 'EXPAND DECK'}</span>
          </button>

          {/* CRT & Audio Toggles */}
          <button
            type="button"
            onClick={toggleCRT}
            title="Toggle CRT Screen Scanlines"
            className="p-1.5 rounded hover:bg-stone-800 text-stone-400 hover:text-white cursor-pointer"
          >
            <Tv className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={toggleSound}
            title="Toggle Audio Synthesizer"
            className="p-1.5 rounded hover:bg-stone-800 text-stone-400 hover:text-white cursor-pointer"
          >
            {soundMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
          <button
            type="button"
            onClick={() => finishMission('success')}
            className="px-2.5 py-1 rounded bg-emerald-950/60 border border-emerald-600 text-emerald-300 text-[10px] font-bold tracking-wider hover:bg-emerald-900 cursor-pointer hidden sm:block"
          >
            EXFILTRATE
          </button>
        </div>
      </header>

      {/* 2. MAIN 3-ZONE COCKPIT (Zone 3 expands dynamically) */}
      <div
        className={`flex-1 grid grid-cols-1 transition-all duration-300 ease-in-out gap-3 p-2 sm:p-4 overflow-hidden h-[calc(100dvh-100px)] ${
          isDeckExpanded
            ? 'lg:grid-cols-[0px_340px_1fr]'
            : 'lg:grid-cols-[240px_1fr_minmax(560px,1.35fr)] xl:grid-cols-[260px_1fr_minmax(660px,1.45fr)] 2xl:grid-cols-[280px_1fr_minmax(780px,1.6fr)]'
        }`}
      >
        {/* =====================================================================
            ZONE 1 (LEFT): OPERATIVE STATUS DOSSIER (Collapses when expanded)
            ===================================================================== */}
        <aside
          className={`flex-col justify-between p-3.5 rounded-xl bg-[#0D1016] border border-[#C9A227]/30 shadow-xl overflow-y-auto transition-all duration-300 ${
            isDeckExpanded ? 'hidden' : 'hidden lg:flex'
          }`}
        >
          <div>
            <div className="flex items-center gap-3 pb-3 border-b border-stone-800 mb-3">
              <AgentPortrait portrait={agent.portrait} size="md" />
              <div>
                <div className="text-[10px] font-mono text-red-500 font-bold uppercase tracking-wider">
                  OPERATIVE ACTIVE
                </div>
                <div className="font-serif font-black text-lg text-[#F2D06B]">
                  {agent.codename}
                </div>
                <div className="text-[11px] font-mono text-stone-400">
                  {agent.division.split('—')[0]}
                </div>
              </div>
            </div>

            {/* Vitals */}
            <div className="flex flex-col gap-2 font-mono text-xs">
              <div>
                <div className="flex justify-between text-[11px] text-stone-400 mb-1">
                  <span>WOUND INTEGRITY</span>
                  <strong className="text-white">
                    {agent.currentWP} / {agent.maxWP} WP
                  </strong>
                </div>
                <div className="w-full h-2 rounded-full bg-stone-900 border border-stone-700 overflow-hidden">
                  <div
                    className={`h-full ${
                      agent.currentWP > agent.maxWP * 0.5 ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'
                    }`}
                    style={{ width: `${Math.max(0, (agent.currentWP / agent.maxWP) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="flex justify-between p-2 rounded bg-black/40 border border-stone-800 mt-1">
                <span className="text-stone-400">COMPOSURE:</span>
                <strong className="text-cyan-400">{agent.currentComposure} / {agent.maxComposure}</strong>
              </div>

              <div className="flex justify-between p-2 rounded bg-black/40 border border-stone-800">
                <span className="text-stone-400">EDGE POINTS:</span>
                <strong className="text-amber-400">{agent.edgePoints}</strong>
              </div>

              <div className="flex justify-between p-2 rounded bg-black/40 border border-stone-800">
                <span className="text-stone-400">CLEARANCE:</span>
                <strong className="text-[#F2D06B]">LEVEL {agent.clearanceLevel}</strong>
              </div>
            </div>

            {/* Inventory List */}
            <div className="mt-4 pt-3 border-t border-stone-800">
              <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest block mb-2">
                EQUIPPED HARDWARE
              </span>
              <div className="flex flex-col gap-1.5 font-mono text-xs">
                {agent.inventory.map((item) => (
                  <div
                    key={item.id}
                    className="p-2 rounded bg-black/50 border border-stone-800 flex justify-between items-center"
                  >
                    <span className="text-stone-300 font-bold">{item.name}</span>
                    <span className="text-[10px] text-stone-500">{item.concealability}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2 text-[10px] font-mono text-stone-500 border-t border-stone-800">
            DISAVOWAL PROTOCOL ENFORCED
          </div>
        </aside>

        {/* =====================================================================
            ZONE 2 (CENTER): NARRATIVE FEED & INTERACTIVE ACTION CONSOLE
            ===================================================================== */}
        <main className="flex flex-col justify-between h-full rounded-xl bg-[#0B0E14] border border-[#C9A227]/30 shadow-2xl p-3 sm:p-4 overflow-hidden">
          {/* Narrative Transcript Log */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 font-mono text-xs sm:text-sm leading-relaxed">
            {logs.map((log) => (
              <div
                key={log.id}
                className={`p-3 rounded-lg border ${
                  log.speaker === 'HANDLER'
                    ? 'bg-[#10141D] border-cyan-900/60 text-[#EDE5D8]'
                    : log.speaker === 'SYSTEM'
                    ? 'bg-amber-950/20 border-amber-800/40 text-amber-300'
                    : 'bg-black/60 border-stone-800 text-stone-300'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-stone-400 mb-1">
                  <span className="font-bold text-[#F2D06B] tracking-wider uppercase">
                    [{log.speaker}]
                  </span>
                  <span>{log.timestamp}</span>
                </div>
                <p className="whitespace-pre-line">{log.text}</p>
              </div>
            ))}
          </div>

          {/* Action Selector & Quick Tactical Buttons */}
          <div className="mt-3 pt-3 border-t border-stone-800 flex flex-col gap-2 shrink-0">
            {/* 3 Suggested Action Chips */}
            <div className="flex flex-col sm:flex-row gap-1.5">
              {suggestedActions.map((action, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => submitAction(action)}
                  className="flex-1 py-1.5 px-2.5 rounded-lg bg-[#141923] hover:bg-[#1E2535] border border-cyan-800/40 text-left text-[11px] font-mono text-cyan-200 transition-all active:scale-95 cursor-pointer line-clamp-1 shadow"
                >
                  › {action}
                </button>
              ))}
            </div>

            {/* Free-Text Prompt Input Form */}
            <form onSubmit={handleCustomSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter tactical directive (e.g. 'Search desk for cipher key', 'Draw suppressed pistol')..."
                value={customAction}
                onChange={(e) => setCustomAction(e.target.value)}
                className="flex-1 px-3 py-2.5 rounded-xl bg-black/60 border border-stone-700 text-white font-mono text-xs sm:text-sm focus:outline-none focus:border-[#F2D06B]"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#F2D06B] via-[#FFE28A] to-[#C9A227] text-black font-mono font-black text-xs uppercase tracking-wider flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-md"
              >
                <span>TRANSMIT</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </main>

        {/* =====================================================================
            ZONE 3 (RIGHT): EXPANDABLE INTERACTIVE DECK (Blueprint, Corkboard, Ballistic, Chase)
            ===================================================================== */}
        <section className="hidden lg:flex flex-col justify-between h-full rounded-xl bg-[#0B0E14] border border-[#C9A227]/40 shadow-2xl p-3 overflow-hidden">
          {/* Deck Tab Bar & Expand Controls */}
          <div className="flex items-center justify-between pb-2.5 border-b border-stone-800 mb-2 font-mono text-xs">
            <div className="flex gap-1.5">
              {[
                { id: 'map', label: 'BLUEPRINT' },
                { id: 'corkboard', label: 'EVIDENCE' },
                { id: 'combat', label: 'COMBAT' },
                { id: 'chase', label: 'CHASE' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3.5 py-1.5 rounded-lg font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-[#F2D06B] text-black shadow-md scale-105'
                      : 'bg-stone-900 text-stone-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Click-to-Expand / Theater Controls */}
            <div className="flex items-center gap-1.5">
              {/* Theater Fullscreen Modal Button */}
              <button
                type="button"
                onClick={() => setIsTheaterOpen(true)}
                title="Open Ultra-Large Theater View"
                className="px-2.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-amber-600/40 text-[#F2D06B] text-xs font-bold font-mono flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow"
              >
                <Expand className="w-3.5 h-3.5" />
                <span>FULL THEATER</span>
              </button>

              {/* Grid Width Expansion Toggle */}
              <button
                type="button"
                onClick={() => setIsDeckExpanded(!isDeckExpanded)}
                title={isDeckExpanded ? 'Shrink Deck Column' : 'Expand Deck Column'}
                className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 hover:text-white transition-all cursor-pointer"
              >
                {isDeckExpanded ? <Minimize2 className="w-4 h-4 text-amber-400" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Active Viewport (Takes full available height) */}
          <div className="flex-1 overflow-y-auto rounded-lg">
            {renderActiveView()}
          </div>
        </section>
      </div>

      {/* 3. MOBILE BOTTOM NAVIGATION DOCK (Viewport < 1024px) */}
      <footer className="flex lg:hidden items-center justify-around h-14 border-t border-[#C9A227]/30 bg-[#0F131A] px-2 z-30 shrink-0 font-mono text-[10px]">
        <button
          type="button"
          onClick={() => {
            setActiveTab('map')
            setIsTheaterOpen(true)
          }}
          className={`flex flex-col items-center gap-1 ${activeTab === 'map' ? 'text-[#F2D06B]' : 'text-stone-400'}`}
        >
          <MapPin className="w-4 h-4" />
          <span>MAP ↗</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('corkboard')
            setIsTheaterOpen(true)
          }}
          className={`flex flex-col items-center gap-1 ${activeTab === 'corkboard' ? 'text-[#F2D06B]' : 'text-stone-400'}`}
        >
          <FolderOpen className="w-4 h-4" />
          <span>EVIDENCE ↗</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('combat')
            setIsTheaterOpen(true)
          }}
          className={`flex flex-col items-center gap-1 ${activeTab === 'combat' ? 'text-rose-400' : 'text-stone-400'}`}
        >
          <Crosshair className="w-4 h-4" />
          <span>COMBAT ↗</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('chase')
            setIsTheaterOpen(true)
          }}
          className={`flex flex-col items-center gap-1 ${activeTab === 'chase' ? 'text-amber-400' : 'text-stone-400'}`}
        >
          <Zap className="w-4 h-4" />
          <span>CHASE ↗</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
          className="flex flex-col items-center gap-1 text-cyan-400"
        >
          <Shield className="w-4 h-4" />
          <span>STATUS</span>
        </button>
      </footer>

      {/* 4. FULL THEATER OVERLAY MODAL (When user clicks EXPAND / FULL THEATER) */}
      <AnimatePresence>
        {isTheaterOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full h-full max-w-7xl max-h-[96vh] rounded-2xl bg-[#080B10] border-2 border-[#C9A227] shadow-[0_0_120px_rgba(0,0,0,0.95)] flex flex-col p-3 sm:p-5 overflow-hidden"
            >
              {/* Theater Header with Big Navigation Tabs & Close */}
              <div className="flex items-center justify-between pb-3 border-b border-stone-800 mb-3 shrink-0 font-mono">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="px-2.5 py-1 rounded bg-[#C9A227]/20 border border-[#C9A227] text-[#F2D06B] font-bold text-xs uppercase tracking-widest hidden sm:block">
                    MAXIMIZED THEATER
                  </div>
                  {/* Big Tabs */}
                  <div className="flex gap-1 sm:gap-2">
                    {[
                      { id: 'map', label: 'BLUEPRINT' },
                      { id: 'corkboard', label: 'EVIDENCE' },
                      { id: 'combat', label: 'COMBAT' },
                      { id: 'chase', label: 'CHASE' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-3 sm:px-4 py-1.5 rounded-lg font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                          activeTab === tab.id
                            ? 'bg-[#F2D06B] text-black shadow-lg scale-105'
                            : 'bg-stone-900 text-stone-400 hover:text-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Close Theater Button */}
                <button
                  type="button"
                  onClick={() => setIsTheaterOpen(false)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-600 text-red-300 font-mono text-xs sm:text-sm font-bold tracking-wider transition-all active:scale-95 cursor-pointer shadow"
                >
                  <Minimize2 className="w-4 h-4" />
                  <span>CLOSE [ESC]</span>
                </button>
              </div>

              {/* Theater Viewport (Full Screen Size) */}
              <div className="flex-1 overflow-y-auto rounded-xl">
                {renderActiveView()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. Mobile Drawer for Operative Status */}
      <AnimatePresence>
        {mobileDrawerOpen && (
          <div className="fixed inset-0 z-50 flex items-end bg-black/80 backdrop-blur-sm lg:hidden">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="w-full max-h-[80vh] p-5 rounded-t-2xl bg-[#0D1016] border-t-2 border-[#C9A227] flex flex-col gap-4 font-mono text-xs overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-2 border-b border-stone-800">
                <span className="font-serif font-black text-lg text-[#F2D06B]">OPERATIVE STATUS</span>
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1 rounded text-stone-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="flex items-center gap-3">
                <AgentPortrait portrait={agent.portrait} size="sm" />
                <div>
                  <div className="font-bold text-white text-base">{agent.codename}</div>
                  <div className="text-stone-400">{agent.division}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2 rounded bg-black/50 border border-stone-800">
                  <div className="text-stone-400 text-[10px]">VITALITY</div>
                  <strong className="text-emerald-400">{agent.currentWP} / {agent.maxWP} WP</strong>
                </div>
                <div className="p-2 rounded bg-black/50 border border-stone-800">
                  <div className="text-stone-400 text-[10px]">COMPOSURE</div>
                  <strong className="text-cyan-400">{agent.currentComposure}</strong>
                </div>
                <div className="p-2 rounded bg-black/50 border border-stone-800">
                  <div className="text-stone-400 text-[10px]">EDGE POINTS</div>
                  <strong className="text-amber-400">{agent.edgePoints}</strong>
                </div>
                <div className="p-2 rounded bg-black/50 border border-stone-800">
                  <div className="text-stone-400 text-[10px]">CLEARANCE</div>
                  <strong className="text-[#F2D06B]">LEVEL {agent.clearanceLevel}</strong>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="w-full py-2.5 rounded bg-stone-900 text-stone-300 font-bold"
              >
                CLOSE [ESC]
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
