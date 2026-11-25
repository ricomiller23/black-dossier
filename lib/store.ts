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
  AIPersona,
  Item,
  SigintChannel,
  InterrogationSubject,
  InterrogationTactic,
  CampaignCity,
  SentryUnit
} from './schemas'
import { generateMissionBlueprint } from './missions/generator'
import { resolveTest } from './engine/tests'
import { determineHitLocation, calculateCombatDamage, updateWoundState } from './engine/combat'
import { adjustAlertLevel, adjustChaseProgress, downgradeWound } from './engine/minisystems'
import { calculateMissionRewards } from './engine/advancement'
import { COLD_WAR_GADGETS, CAMPAIGN_CITIES } from './engine/gadgets'
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
  visitedSceneIds: string[]
  latestActionOutcome: { action: string; result: TestResult; response: string; timestamp: string } | null
  logs: LogEntry[]
  suggestedActions: string[]
  diceResult: TestResult | null
  isRollingDice: boolean
  allies: AIPersona[]
  rivals: AIPersona[]
  missionMode: 'solo' | 'ally' | 'rival' | 'mole'

  // 1. Dynamic Sentries
  sentries: SentryUnit[]

  // 2. SIGINT Decoder
  tunedFrequency: number
  sigintChannels: SigintChannel[]

  // 3. Armory & Gadgets
  availableGadgets: Item[]

  // 4. Polygraph Interrogation
  interrogationSubject: InterrogationSubject | null

  // 5. Global Campaign Atlas
  campaignCities: CampaignCity[]
  activeCityId: string

  // Debrief stats
  lastRewards: { merit: number; funds: number; clearanceAdvance: boolean } | null

  // Core Methods
  boot: () => void
  setPhase: (phase: GamePhase) => void
  setTheme: (theme: 'manila' | 'crt_green' | 'crt_amber' | 'night_ops') => void
  toggleCRT: () => void
  toggleGrain: () => void
  toggleSound: () => void

  startNewAgent: () => void
  saveAgent: (agent: Agent) => void
  launchMission: (seed?: string, era?: '1980s Cold War' | 'Modern Day', mode?: 'solo' | 'ally' | 'rival' | 'mole', city?: string) => void
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

  // Expansion Feature Actions
  neutralizeSentry: (sentryId: string) => void
  setTunedFrequency: (freq: number) => void
  decryptChannel: (channelId: string) => void
  buyGadget: (gadget: Item) => boolean
  conductInterrogation: (tactic: InterrogationTactic) => { success: boolean; text: string }
  selectCampaignCity: (cityId: string) => void
}

const DEFAULT_SIGINT_CHANNELS: SigintChannel[] = [
  {
    id: 'sig_patrol_walkie',
    name: 'Sentry Tactical Walkie-Talkie',
    frequencyMHz: 4.62,
    waveform: 'pulse',
    intelTitle: 'GUARD PATROL ROUTE & VAULT KEYCODE',
    intelContent: 'Intercepted Guard Audio: "Post 3 to Central. Guard rotation delayed. Vault primary bypass sequence is 8-4-9-2. Keep secondary alarm muted until relief arrives."',
    isDecrypted: false,
    requiredTuningTolerance: 0.15
  },
  {
    id: 'sig_numbers_station',
    name: 'Numbers Station G06 / "Lincolnshire Poacher"',
    frequencyMHz: 9.20,
    waveform: 'sine',
    intelTitle: 'DECRYPTED NUMBERS CABLE // DEFECTOR EXTRACTION',
    intelContent: 'Numbers Audio: "5-1-8-3-0 ... 5-1-8-3-0 ... Directive from Berlin: Asset double-agent has cached confidential microdot behind portrait in Mezzanine Salon. Confirm extraction."',
    isDecrypted: false,
    requiredTuningTolerance: 0.12
  },
  {
    id: 'sig_embassy_wiretap',
    name: 'Consular Telephone Wiretap',
    frequencyMHz: 14.85,
    waveform: 'sawtooth',
    intelTitle: 'SYNDICATE HIGH LIAISON CIPHER',
    intelContent: 'Consular Intercept: "Courier has arrived with the black ledger. The Directorate mole has supplied false transit papers. If compromised, initiate protocol Scorched Earth."',
    isDecrypted: false,
    requiredTuningTolerance: 0.15
  }
]

const DEFAULT_SENTRIES: SentryUnit[] = [
  {
    id: 'sentry_1',
    name: 'Sector B-1 Patrolling Guard',
    sectorId: 'scene_2_interior',
    x: 430,
    y: 330,
    facingAngle: 180,
    patrolRoute: [
      { x: 340, y: 330 },
      { x: 500, y: 330 }
    ],
    currentWaypoint: 0,
    status: 'patrolling',
    awareness: 0
  },
  {
    id: 'sentry_2',
    name: 'Sector C Vault Sentry',
    sectorId: 'scene_3_vault',
    x: 670,
    y: 230,
    facingAngle: 270,
    patrolRoute: [
      { x: 670, y: 190 },
      { x: 670, y: 280 }
    ],
    currentWaypoint: 0,
    status: 'patrolling',
    awareness: 0
  }
]

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
  visitedSceneIds: [],
  latestActionOutcome: null,
  logs: [],
  suggestedActions: [],
  diceResult: null,
  isRollingDice: false,
  allies: [],
  rivals: [],
  missionMode: 'solo',
  lastRewards: null,

  // 1. Sentries
  sentries: DEFAULT_SENTRIES,

  // 2. SIGINT
  tunedFrequency: 7.00,
  sigintChannels: DEFAULT_SIGINT_CHANNELS,

  // 3. Armory
  availableGadgets: COLD_WAR_GADGETS,

  // 4. Interrogation
  interrogationSubject: {
    id: 'subj_rostov',
    name: 'Victor Rostov',
    alias: 'GREY FOX',
    role: 'CINDER Operations Commander',
    allegiance: 'Syndicate High Command',
    currentBPM: 76,
    stress: 20,
    composure: 80,
    breakThreshold: 85,
    isBroken: false,
    secretRevealed: 'CONFESSION EXTRACTED: "The syndicate mainframe is hardwired to the Vienna telephone exchange. The double agent inside your Directorate is code-named RAVEN."'
  },

  // 5. Campaign Atlas
  campaignCities: CAMPAIGN_CITIES as CampaignCity[],
  activeCityId: 'city_vienna',

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

  launchMission: (seed, era = '1980s Cold War', mode = 'solo', city) => {
    const s = seed || Math.random().toString(36).substring(2, 9)
    const agent = get().agent
    const clearance = agent?.clearanceLevel || 1
    const blueprint = generateMissionBlueprint({
      seed: s,
      clearance,
      era,
      mode
    })

    if (city) {
      blueprint.city = city
    }

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
      visitedSceneIds: [startScene.id],
      latestActionOutcome: null,
      logs: [initialLog],
      missionMode: mode,
      sentries: DEFAULT_SENTRIES.map(s => ({ ...s, status: 'patrolling' })),
      sigintChannels: DEFAULT_SIGINT_CHANNELS.map(c => ({ ...c, isDecrypted: false })),
      suggestedActions: [
        'Inspect outer security perimeter with night optics',
        'Attempt to compromise service entrance lock',
        'Radio inside informant for distraction'
      ]
    })
  },

  moveToScene: (sceneId) => {
    const { blueprint, logs, visitedSceneIds, sentries, alertLevel } = get()
    if (!blueprint) return
    const next = blueprint.scenes.find((s) => s.id === sceneId)
    if (!next) return

    sound.playRadarPing()

    // Sentry Detection Check: Check if an active sentry is in destination room
    const hostilesInRoom = sentries.filter(s => s.sectorId === sceneId && s.status === 'patrolling')
    let addedAlert = 0
    let hostileWarning = ''

    if (hostilesInRoom.length > 0) {
      addedAlert = 1
      sound.playAlarm()
      hostileWarning = `\n[TACTICAL ALERT: Active sentry detected in ${next.venueName.toUpperCase()}! Flashlight cone sweeping corridor.]`
    }

    const sceneLog: LogEntry = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      speaker: 'HANDLER',
      text: `TRANSITION TO ${next.title.toUpperCase()}\n${next.description}${hostileWarning}`,
      type: 'narrative'
    }

    const suggestions = next.type === 'extraction'
      ? ['Signal extraction vehicle', 'Lay suppressive fire against pursuers', 'Deploy smoke grenade canister']
      : next.type === 'climax'
      ? ['Confront primary target directly', 'Override central security console', 'Rig timed explosive charge']
      : hostilesInRoom.length > 0
      ? ['Execute silent takedown on patrolling sentry', 'Conceal in shadows behind steam pipes', 'Toss distraction coin into far corner']
      : ['Search for surveillance clues', 'Conceal behind cover', 'Initiate quiet radio relay']

    set({
      currentScene: next,
      alertLevel: Math.min(5, alertLevel + addedAlert),
      visitedSceneIds: [...new Set([...visitedSceneIds, sceneId])],
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
    } else if (lower.includes('sneak') || lower.includes('hide') || lower.includes('shadow') || lower.includes('quiet') || lower.includes('takedown')) {
      skillToCheck = 'Stealth'
    } else if (lower.includes('lock') || lower.includes('pick') || lower.includes('bypass') || lower.includes('door') || lower.includes('acid')) {
      skillToCheck = 'Lockpicking'
    } else if (lower.includes('hack') || lower.includes('terminal') || lower.includes('code') || lower.includes('data') || lower.includes('sigint')) {
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
      revealedClues: newRevealed,
      latestActionOutcome: {
        action: actionText,
        result,
        response: handlerResponse,
        timestamp: new Date().toLocaleTimeString()
      }
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
      const reTest = get().executeSkillCheck(diceResult.skill, diceResult.modifier, 'Edge Point Reroll')
      set({ agent: updatedAgent, diceResult: reTest })
      return true
    } else {
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
  },

  // 1. Sentry Neutralization Action
  neutralizeSentry: (sentryId) => {
    const { sentries, logs } = get()
    sound.playSilencedShot()
    const updated = sentries.map(s => s.id === sentryId ? { ...s, status: 'neutralized' as const } : s)
    const log: LogEntry = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      speaker: 'SYSTEM',
      text: `TACTICAL TAKEDOWN: Sentry neutralized with silent takedown. Corridor secured.`,
      type: 'action'
    }
    set({ sentries: updated, logs: [...logs, log] })
  },

  // 2. SIGINT Actions
  setTunedFrequency: (freq) => {
    sound.playRadioStatic()
    set({ tunedFrequency: freq })
  },

  decryptChannel: (channelId) => {
    const { sigintChannels, revealedClues, logs } = get()
    sound.playMorseBeep(850, 0.15)
    setTimeout(() => sound.playMorseBeep(650, 0.1), 180)
    setTimeout(() => sound.playMorseBeep(950, 0.2), 320)

    const ch = sigintChannels.find(c => c.id === channelId)
    if (!ch) return

    const updatedChannels = sigintChannels.map(c => c.id === channelId ? { ...c, isDecrypted: true } : c)
    const newClues = revealedClues.includes(ch.intelContent) ? revealedClues : [...revealedClues, ch.intelContent]

    const interceptLog: LogEntry = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      speaker: 'SIGINT DECRYPTOR',
      text: `[SIGNAL LOCKED: ${ch.frequencyMHz} MHz] — ${ch.intelTitle}\n${ch.intelContent}`,
      type: 'clue'
    }

    set({
      sigintChannels: updatedChannels,
      revealedClues: newClues,
      logs: [...logs, interceptLog],
      alertLevel: Math.max(0, get().alertLevel - 1) // Signal intel reduces alert!
    })
  },

  // 3. Armory Gadget Purchase & Equip
  buyGadget: (gadget) => {
    const { agent, logs } = get()
    if (!agent) return false
    if (agent.funds < gadget.cost) return false

    sound.playGadgetSnap()
    const updatedAgent: Agent = {
      ...agent,
      funds: agent.funds - gadget.cost,
      inventory: [...agent.inventory, gadget]
    }

    const buyLog: LogEntry = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      speaker: 'QUARTERMASTER',
      text: `ATTACHÉ REQUISITION: ${gadget.name} slotted into field briefcase. (-$${gadget.cost})`,
      type: 'system'
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('black_dossier_agent', JSON.stringify(updatedAgent))
    }

    set({ agent: updatedAgent, logs: [...logs, buyLog] })
    return true
  },

  // 4. Polygraph Interrogation Confrontation
  conductInterrogation: (tactic) => {
    const { interrogationSubject, logs, revealedClues } = get()
    if (!interrogationSubject) return { success: false, text: 'No subject in interrogation chair.' }

    sound.playHeartbeat()
    setTimeout(() => sound.playHeartbeat(), 250)

    let stressDelta = 15
    let responseText = ''

    if (tactic === 'Cold Logic') {
      stressDelta = 18
      responseText = `Rostov shifts uncomfortably. His heart rate climbs to ${interrogationSubject.currentBPM + 14} BPM. "Your legal claims mean nothing in neutral territory, agent."`
    } else if (tactic === 'Ideological Pressure') {
      stressDelta = 22
      responseText = `The needle jerks violently on the drum. "You think your Directorate is any cleaner? We all serve the same masters!"`
    } else if (tactic === 'Blackmail Threat') {
      stressDelta = 28
      responseText = `Rostov turns pale. Polygraph Galvanic needle spikes off the chart. "How... how do you have those Swiss bank ledger numbers?!"`
    } else if (tactic === 'Bribery & Safe Passage') {
      stressDelta = 12
      responseText = `Rostov looks at the door. Heart rate stabilizes briefly. "If I talk, my family in Dresden needs a Western extraction window."`
    } else {
      stressDelta = 32
      responseText = `Rostov slams his palms on the steel table. The heart monitor alarms at 155 BPM! "Do your worst! You will find nothing in the vault!"`
    }

    const newStress = Math.min(100, interrogationSubject.stress + stressDelta)
    const newComposure = Math.max(0, interrogationSubject.composure - Math.floor(stressDelta * 0.8))
    const isNowBroken = newStress >= interrogationSubject.breakThreshold

    let updatedSubject: InterrogationSubject = {
      ...interrogationSubject,
      currentBPM: Math.min(170, interrogationSubject.currentBPM + Math.floor(stressDelta * 0.7)),
      stress: newStress,
      composure: newComposure,
      isBroken: isNowBroken
    }

    if (isNowBroken && !interrogationSubject.isBroken) {
      sound.playStamp()
      responseText += `\n\n[SUBJECT BREAKS UNDER PRESSURE]: ${interrogationSubject.secretRevealed}`
      if (!revealedClues.includes(interrogationSubject.secretRevealed)) {
        set({ revealedClues: [...revealedClues, interrogationSubject.secretRevealed] })
      }
    }

    const dialogueLog: LogEntry = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      speaker: 'INTERROGATION CONSOLE',
      text: `[TACTIC: ${tactic.toUpperCase()}] (Polygraph Stress: ${newStress}%)\n${responseText}`,
      type: 'dialogue'
    }

    set({ interrogationSubject: updatedSubject, logs: [...logs, dialogueLog] })
    return { success: true, text: responseText }
  },

  // 5. Global Campaign City Selection
  selectCampaignCity: (cityId) => {
    const { campaignCities } = get()
    sound.playRadarPing()
    const city = campaignCities.find(c => c.id === cityId)
    if (!city) return

    set({ activeCityId: cityId })
    get().launchMission(undefined, '1980s Cold War', 'solo', city.name)
  }
}))
