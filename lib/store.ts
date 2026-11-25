import { create } from 'zustand'
import {
  Agent,
  GamePhase,
  MissionBlueprint,
  SceneNode,
  TestResult,
  LogEntry,
  SkillName,
  HitLocation,
  AIPersona
} from './schemas'
import { generateMissionBlueprint } from './missions/generator'
import { resolveTest } from './engine/tests'
import { determineHitLocation, calculateCombatDamage, updateWoundState } from './engine/combat'
import { adjustAlertLevel, adjustChaseProgress, downgradeWound } from './engine/minisystems'
import { calculateMissionRewards } from './engine/advancement'
import { SeededRNG } from './engine/rng'
import { sound } from './audio'

interface GameState {
  phase: GamePhase
  theme: 'manila' | 'crt_green' | 'crt_amber' | 'night_ops'
  crtEffect: boolean
  filmGrain: boolean
  soundMuted: boolean

  // Player & Mission
  agent: Agent | null
  blueprint: MissionBlueprint | null
  currentScene: SceneNode | null
  alertLevel: number
  chaseProgress: number
  coverIntegrity: number
  revealedClues: string[]
  logs: LogEntry[]
  suggestedActions: string[]
  diceResult: TestResult | null
  isRollingDice: boolean
  allies: AIPersona[]
  rivals: AIPersona[]
  missionMode: 'solo' | 'ally' | 'rival' | 'mole'

  // Debrief stats
  lastRewards: { merit: number; funds: number; clearanceAdvance: boolean } | null

  // Methods
  boot: () => void
  setPhase: (phase: GamePhase) => void
  setTheme: (theme: 'manila' | 'crt_green' | 'crt_amber' | 'night_ops') => void
  toggleCRT: () => void
  toggleGrain: () => void
  toggleSound: () => void

  startNewAgent: () => void
  saveAgent: (agent: Agent) => void
  launchMission: (seed?: string, era?: '1980s Cold War' | 'Modern Day', mode?: 'solo' | 'ally' | 'rival' | 'mole') => void
  moveToScene: (sceneId: string) => void
  submitAction: (actionText: string) => void
  executeSkillCheck: (skill: SkillName, modifier?: number, reason?: string) => TestResult
  useEdgePoint: () => boolean
  applyDamage: (damage: number, location?: HitLocation) => void
  healAgent: (amount: number) => void
  setAlert: (delta: number) => void
  setChase: (delta: number) => void
  finishMission: (outcome: 'success' | 'partial' | 'failure') => void
  exportSaveDossier: () => string
  importSaveDossier: (json: string) => boolean
}

export const useGameStore = create<GameState>((set, get) => ({
  phase: 'TITLE',
  theme: 'manila',
  crtEffect: true,
  filmGrain: true,
  soundMuted: false,

  agent: null,
  blueprint: null,
  currentScene: null,
  alertLevel: 0,
  chaseProgress: 5,
  coverIntegrity: 100,
  revealedClues: [],
  logs: [],
  suggestedActions: [],
  diceResult: null,
  isRollingDice: false,
  allies: [],
  rivals: [],
  missionMode: 'solo',
  lastRewards: null,

  boot: () => {
    if (typeof window === 'undefined') return
    const savedAgent = localStorage.getItem('black_dossier_agent')
    const savedMuted = localStorage.getItem('black_dossier_muted') === 'true'
    if (savedAgent) {
      try {
        set({ agent: JSON.parse(savedAgent), soundMuted: savedMuted })
      } catch (e) {
        console.error('Failed to parse saved agent', e)
      }
    }
  },

  setPhase: (phase) => set({ phase }),
  setTheme: (theme) => set({ theme }),
  toggleCRT: () => set((s) => ({ crtEffect: !s.crtEffect })),
  toggleGrain: () => set((s) => ({ filmGrain: !s.filmGrain })),
  toggleSound: () => {
    const isMuted = sound.toggleMute()
    set({ soundMuted: isMuted })
  },

  startNewAgent: () => {
    sound.playTypewriter()
    set({ phase: 'CREATION' })
  },

  saveAgent: (agent) => {
    sound.playStamp()
    if (typeof window !== 'undefined') {
      localStorage.setItem('black_dossier_agent', JSON.stringify(agent))
    }
    set({ agent, phase: 'TITLE' })
  },

  launchMission: (seed, era = '1980s Cold War', mode = 'solo') => {
    const s = seed || Math.random().toString(36).substring(2, 9)
    const agent = get().agent
    const clearance = agent?.clearanceLevel || 1
    const blueprint = generateMissionBlueprint({
      seed: s,
      clearance,
      era,
      mode
    })

    const startScene = blueprint.scenes.find((sc) => sc.id === blueprint.startSceneId) || blueprint.scenes[0]

    sound.playStamp()

    const initialLog: LogEntry = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      speaker: 'HANDLER',
      text: blueprint.briefingText,
      type: 'narrative'
    }

    set({
      blueprint,
      currentScene: startScene,
      phase: 'BRIEFING',
      alertLevel: 0,
      chaseProgress: 5,
      coverIntegrity: 100,
      revealedClues: [],
      logs: [initialLog],
      missionMode: mode,
      suggestedActions: [
        'Inspect outer security perimeter with night optics',
        'Attempt to compromise service entrance lock',
        'Radio inside informant for distraction'
      ]
    })
  },

  moveToScene: (sceneId) => {
    const { blueprint, logs } = get()
    if (!blueprint) return
    const next = blueprint.scenes.find((s) => s.id === sceneId)
    if (!next) return

    sound.playRadarPing()

    const sceneLog: LogEntry = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      speaker: 'HANDLER',
      text: `TRANSITION TO ${next.title.toUpperCase()}\n${next.description}`,
      type: 'narrative'
    }

    const suggestions = next.type === 'extraction'
      ? ['Signal extraction vehicle', 'Lay suppressive fire against pursuers', 'Deploy smoke grenade canister']
      : next.type === 'climax'
      ? ['Confront primary target directly', 'Override central security console', 'Rig timed explosive charge']
      : ['Search for surveillance clues', 'Conceal behind cover', 'Initiate quiet radio relay']

    set({
      currentScene: next,
      logs: [...logs, sceneLog],
      suggestedActions: suggestions
    })
  },

  submitAction: (actionText) => {
    const { logs, currentScene, agent } = get()
    sound.playTypewriter()

    const playerLog: LogEntry = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      speaker: agent?.codename || 'AGENT',
      text: actionText,
      type: 'action'
    }

    // Determine heuristic skill
    let skillToCheck: SkillName = 'Search'
    const lower = actionText.toLowerCase()
    if (lower.includes('shoot') || lower.includes('fire') || lower.includes('aim') || lower.includes('draw weapon')) {
      skillToCheck = 'Firearms'
    } else if (lower.includes('sneak') || lower.includes('hide') || lower.includes('shadow') || lower.includes('quiet')) {
      skillToCheck = 'Stealth'
    } else if (lower.includes('lock') || lower.includes('pick') || lower.includes('bypass') || lower.includes('door')) {
      skillToCheck = 'Lockpicking'
    } else if (lower.includes('hack') || lower.includes('terminal') || lower.includes('code') || lower.includes('data')) {
      skillToCheck = 'Computers'
    } else if (lower.includes('talk') || lower.includes('convince') || lower.includes('bribe') || lower.includes('persuade')) {
      skillToCheck = 'Persuasion'
    } else if (lower.includes('fight') || lower.includes('knife') || lower.includes('strike') || lower.includes('melee')) {
      skillToCheck = 'Melee'
    }

    // Execute test
    const result = get().executeSkillCheck(skillToCheck, 0, actionText)

    // Generate narrative response based on outcome
    let handlerResponse = ''
    if (result.outcome === 'CRITICAL') {
      sound.playStamp()
      handlerResponse = `CRITICAL EXECUTION: Your instincts are flawless. You execute "${actionText}" with clinical precision (+${result.margin} margin). Target defense dissolves instantly.`
    } else if (result.outcome === 'SUCCESS') {
      handlerResponse = `SUCCESS: The maneuver succeeds cleanly (+${result.margin} margin). You secure the tactical advantage without alerting the sector.`
    } else if (result.outcome === 'FUMBLE') {
      sound.playAlarm()
      get().setAlert(2)
      handlerResponse = `CATASTROPHIC FUMBLE: Critical blunder (${result.roll})! Equipment malfunction or security alert tripped! Sector alert level escalates immediately.`
    } else {
      handlerResponse = `FAILED ATTEMPT: The action fails to yield the intended outcome (${result.roll} vs ${result.target}). Local hostiles are suspicious.`
      get().setAlert(1)
    }

    const handlerLog: LogEntry = {
      id: `log_${Date.now() + 1}`,
      timestamp: new Date().toLocaleTimeString(),
      speaker: 'HANDLER',
      text: handlerResponse,
      type: 'narrative',
      testResult: result
    }

    // Check if new clues unlocked in current scene
    const currentClues = currentScene?.clues || []
    const newRevealed = [...get().revealedClues]
    if (result.outcome === 'SUCCESS' || result.outcome === 'CRITICAL') {
      for (const clue of currentClues) {
        if (!newRevealed.includes(clue)) {
          newRevealed.push(clue)
        }
      }
    }

    set({
      logs: [...logs, playerLog, handlerLog],
      revealedClues: newRevealed
    })
  },

  executeSkillCheck: (skill, modifier = 0, reason = 'Direct tactical action') => {
    const { agent } = get()
    sound.playDiceRoll()

    const rating = agent?.skills[skill] || 50
    const test = resolveTest({
      actor: agent?.codename || 'AGENT',
      skill,
      skillRating: rating,
      modifier,
      reason
    })

    set({ diceResult: test, isRollingDice: true })
    setTimeout(() => {
      set({ isRollingDice: false })
    }, 1200)

    return test
  },

  useEdgePoint: () => {
    const { agent, diceResult } = get()
    if (!agent || agent.edgePoints <= 0) return false

    sound.playStamp()
    const updatedAgent: Agent = {
      ...agent,
      edgePoints: agent.edgePoints - 1
    }

    if (diceResult && (diceResult.outcome === 'FAILURE' || diceResult.outcome === 'FUMBLE')) {
      // Reroll test
      const reTest = get().executeSkillCheck(diceResult.skill, diceResult.modifier, 'Edge Point Reroll')
      set({ agent: updatedAgent, diceResult: reTest })
      return true
    } else {
      // Downgrade wound state
      const downgraded = downgradeWound(agent.woundState)
      set({
        agent: {
          ...updatedAgent,
          woundState: downgraded
        }
      })
      return true
    }
  },

  applyDamage: (damage, location) => {
    const { agent } = get()
    if (!agent) return

    sound.playSilencedShot()
    const hitLoc = location || determineHitLocation()
    const calc = calculateCombatDamage({
      baseDamage: damage,
      margin: 10,
      isCritical: false,
      hitLocation: hitLoc
    })

    const newWP = agent.currentWP - calc.effectiveDamage
    const newWound = updateWoundState(newWP, agent.maxWP)

    const updatedAgent: Agent = {
      ...agent,
      currentWP: newWP,
      woundState: newWound
    }

    set({ agent: updatedAgent })

    if (newWound === 'Down' || newWound === 'Dead') {
      get().finishMission('failure')
    }
  },

  healAgent: (amount) => {
    const { agent } = get()
    if (!agent) return
    const newWP = Math.min(agent.maxWP, agent.currentWP + amount)
    const newWound = updateWoundState(newWP, agent.maxWP)
    set({
      agent: {
        ...agent,
        currentWP: newWP,
        woundState: newWound
      }
    })
  },

  setAlert: (delta) => {
    const current = get().alertLevel
    const updated = adjustAlertLevel(current, delta)
    if (updated >= 3 && current < 3) {
      sound.playAlarm()
    }
    set({ alertLevel: updated })
  },

  setChase: (delta) => {
    const current = get().chaseProgress
    const updated = adjustChaseProgress(current, delta)
    set({ chaseProgress: updated })
  },

  finishMission: (outcome) => {
    const { blueprint, alertLevel, agent } = get()
    const clearance = blueprint?.clearance || 1
    const rewards = calculateMissionRewards(clearance, outcome, alertLevel)

    sound.playStamp()

    let updatedAgent = agent
    if (agent) {
      updatedAgent = {
        ...agent,
        merit: agent.merit + rewards.merit,
        funds: agent.funds + rewards.funds,
        clearanceLevel: rewards.clearanceAdvance ? Math.min(5, agent.clearanceLevel + 1) : agent.clearanceLevel
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('black_dossier_agent', JSON.stringify(updatedAgent))
      }
    }

    set({
      agent: updatedAgent,
      phase: 'DEBRIEF',
      lastRewards: rewards
    })
  },

  exportSaveDossier: () => {
    const state = get()
    const data = {
      agent: state.agent,
      theme: state.theme,
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    }
    return JSON.stringify(data, null, 2)
  },

  importSaveDossier: (json) => {
    try {
      const parsed = JSON.parse(json)
      if (parsed.agent) {
        sound.playStamp()
        set({ agent: parsed.agent })
        if (typeof window !== 'undefined') {
          localStorage.setItem('black_dossier_agent', JSON.stringify(parsed.agent))
        }
        return true
      }
    } catch (e) {
      console.error('Invalid save dossier', e)
    }
    return false
  }
}))
