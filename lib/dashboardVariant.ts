export type DashboardVariant = 'middle' | 'v1' | 'v2' | 'v3' | 'v4' | 'v5' | 'v6'

export type DashboardPage = 'overview' | 'kanban' | 'projects' | 'ideas' | 'reading' | 'activity'

type NavKey = DashboardPage

export interface DashboardTheme {
  id: DashboardVariant
  name: string
  shortName: string
  modeLabel: string
  modeDescription: string
  navLabels: Record<NavKey, string>
}

export interface JourneyCopy {
  title: string
  summary: string
  flow: [string, string, string]
  experimental: string
}

const DEFAULT_VARIANT: DashboardVariant = 'v1'

const THEMES: Record<DashboardVariant, DashboardTheme> = {
  middle: {
    id: 'middle',
    name: 'In-Between Dashboard',
    shortName: 'Control Center',
    modeLabel: 'Balanced execution',
    modeDescription: 'Same core dashboard model with improved visual clarity and faster workflows.',
    navLabels: {
      overview: 'Overview',
      kanban: 'Kanban',
      projects: 'Projects',
      ideas: 'Ideas',
      reading: 'Reading',
      activity: 'Activity',
    },
  },
  v6: {
    id: 'v6',
    name: 'Version 6: The Command',
    shortName: 'The Command',
    modeLabel: 'Focus and orbit',
    modeDescription: 'Two-mode command center for decisive execution and system awareness.',
    navLabels: {
      overview: 'Overview',
      kanban: 'Kanban',
      projects: 'Projects',
      ideas: 'Ideas',
      reading: 'Reading',
      activity: 'Activity',
    },
  },
  v1: {
    id: 'v1',
    name: 'Version 1: Command Grid',
    shortName: 'Command Grid',
    modeLabel: 'Mission tempo first',
    modeDescription: 'High-clarity execution cockpit for rapid decision cycles.',
    navLabels: {
      overview: 'Situation',
      kanban: 'Missions',
      projects: 'Programs',
      ideas: 'Signals',
      reading: 'Intel',
      activity: 'Logbook',
    },
  },
  v2: {
    id: 'v2',
    name: 'Version 2: Flow Atelier',
    shortName: 'Flow Atelier',
    modeLabel: 'Momentum ritual',
    modeDescription: 'Built around focus blocks, pacing, and sustainable energy.',
    navLabels: {
      overview: 'Pulse',
      kanban: 'Flow Board',
      projects: 'Tracks',
      ideas: 'Sketches',
      reading: 'Inputs',
      activity: 'Session Feed',
    },
  },
  v3: {
    id: 'v3',
    name: 'Version 3: Story OS',
    shortName: 'Story OS',
    modeLabel: 'Narrative system',
    modeDescription: 'Everything is a signal-to-story-to-proof pipeline.',
    navLabels: {
      overview: 'Narrative Brief',
      kanban: 'Scene Board',
      projects: 'Arcs',
      ideas: 'Thesis Vault',
      reading: 'Source Feed',
      activity: 'Chronicle',
    },
  },
  v4: {
    id: 'v4',
    name: 'Version 4: Orbit Field',
    shortName: 'Orbit Field',
    modeLabel: 'Systems mapping',
    modeDescription: 'Spatial relationship view for dependencies and handoffs.',
    navLabels: {
      overview: 'Control Orbit',
      kanban: 'Node Queue',
      projects: 'Constellations',
      ideas: 'Signal Cloud',
      reading: 'Satellite Feed',
      activity: 'Pulse Stream',
    },
  },
  v5: {
    id: 'v5',
    name: 'Version 5: Capital Desk',
    shortName: 'Capital Desk',
    modeLabel: 'Portfolio decisions',
    modeDescription: 'Execution as investment: score, allocate, review.',
    navLabels: {
      overview: 'Portfolio',
      kanban: 'Deal Board',
      projects: 'Positions',
      ideas: 'Options',
      reading: 'Market Tape',
      activity: 'Trade Journal',
    },
  },
}

const JOURNEY: Record<DashboardVariant, Record<DashboardPage, JourneyCopy>> = {
  middle: {
    overview: {
      title: 'Run your day from one clean overview.',
      summary: 'Keep the original dashboard structure, but with clearer hierarchy and stronger action affordances.',
      flow: ['Scan status', 'Pick focus', 'Move work'],
      experimental: 'Prioritizes practical clarity over conceptual reframing.',
    },
    kanban: {
      title: 'Move tasks through the same board, faster.',
      summary: 'Preserves the familiar kanban flow while improving scannability and quick actions.',
      flow: ['Capture task', 'Prioritize', 'Progress state'],
      experimental: 'Keeps the legacy model and improves execution speed.',
    },
    projects: {
      title: 'Track project health with less friction.',
      summary: 'Maintain the same project entities, but make risk and progress easier to read.',
      flow: ['Check load', 'Spot blockers', 'Adjust plan'],
      experimental: 'Refines function and layout without changing core objects.',
    },
    ideas: {
      title: 'Keep idea flow tied to delivery.',
      summary: 'Use the same idea pipeline and advance concepts with clearer action paths.',
      flow: ['Capture idea', 'Validate', 'Promote'],
      experimental: 'Preserves the original pipeline semantics.',
    },
    reading: {
      title: 'Process reading inputs as action support.',
      summary: 'Maintain existing reading lists while improving quick triage and status updates.',
      flow: ['Collect', 'Triage', 'Mark'],
      experimental: 'Stays close to the legacy reading workflow.',
    },
    activity: {
      title: 'Review activity as execution feedback.',
      summary: 'Use the same activity stream with better signal-to-noise and visual rhythm.',
      flow: ['Review log', 'Spot drift', 'Correct'],
      experimental: 'Improves readability without changing behavior.',
    },
  },
  v6: {
    overview: {
      title: 'Command your day through two modes: Focus and Orbit.',
      summary: 'Focus on the next move, then switch to orbit to reason about system-wide dependencies.',
      flow: ['Focus task', 'Switch to orbit', 'Return to execute'],
      experimental: 'Synthesis of V1-V5 into one product.',
    },
    kanban: {
      title: 'Kanban is available, but command happens in Focus mode first.',
      summary: 'Keep board interactions tight and use command palette for quick actions.',
      flow: ['Queue work', 'Promote key task', 'Close loops'],
      experimental: 'Board is secondary to command workflow.',
    },
    projects: {
      title: 'Projects become clusters in orbit and context in focus.',
      summary: 'Project health is tracked through active load, blockers, and dependency risk.',
      flow: ['Inspect clusters', 'Find blockers', 'Act in focus'],
      experimental: 'Unifies project and dependency reasoning.',
    },
    ideas: {
      title: 'Ideas stay connected to projects and execution.',
      summary: 'Promote ideas only when they can influence current delivery decisions.',
      flow: ['Capture', 'Link to project', 'Advance deliberately'],
      experimental: 'Removes detached idea parking lots.',
    },
    reading: {
      title: 'Reading context follows the active task.',
      summary: 'In focus mode, related reading is surfaced beside execution.',
      flow: ['Collect', 'Attach context', 'Execute'],
      experimental: 'Context integrated directly into action view.',
    },
    activity: {
      title: 'Activity remains the execution ledger.',
      summary: 'Use the timeline to validate momentum and detect drift.',
      flow: ['Review', 'Compare momentum', 'Correct'],
      experimental: 'Shared ledger across both modes.',
    },
  },
  v1: {
    overview: {
      title: 'Run the daily command brief before you touch execution.',
      summary: 'Front-load clarity: surface risk, lock priorities, and choose one decisive path.',
      flow: ['Scan status', 'Choose mission', 'Commit command'],
      experimental: 'Biases toward hard sequencing and explicit escalation.',
    },
    kanban: {
      title: 'Operate the mission queue with strict launch discipline.',
      summary: 'Treat every task as an operational mission with explicit state changes.',
      flow: ['Stack queue', 'Launch mission', 'Close objective'],
      experimental: 'Single-click launch/close behavior to reduce drag.',
    },
    projects: {
      title: 'Track program health like an ops room.',
      summary: 'Programs are monitored by active load, blockage, and completion pressure.',
      flow: ['Check program', 'Locate friction', 'Assign intervention'],
      experimental: 'Programs are evaluated by operational risk, not just progress.',
    },
    ideas: {
      title: 'Promote signals only when they earn execution budget.',
      summary: 'Ideas stay in signal mode until they can support near-term mission value.',
      flow: ['Capture signal', 'Qualify urgency', 'Promote to mission'],
      experimental: 'Deliberately constrains idea promotion to force sharper choices.',
    },
    reading: {
      title: 'Process intel as decision fuel, not passive reading.',
      summary: 'Reading is routed through immediate action relevance.',
      flow: ['Collect intel', 'Tag decision', 'Mark action'],
      experimental: 'Every read item should map to an execution question.',
    },
    activity: {
      title: 'Use the logbook to audit operating discipline.',
      summary: 'The timeline is treated as an operational record for process quality.',
      flow: ['Review events', 'Spot drift', 'Correct routine'],
      experimental: 'Frames activity as governance, not history.',
    },
  },
  v2: {
    overview: {
      title: 'Start with your momentum pulse and energy map.',
      summary: 'Prioritize based on flow quality and cognitive load, not just urgency labels.',
      flow: ['Check energy', 'Pick focus', 'Start sprint'],
      experimental: 'Uses rhythm-first planning for better throughput sustainability.',
    },
    kanban: {
      title: 'Shape work into flow lanes with interruption control.',
      summary: 'Work-in-progress is constrained to protect focus continuity.',
      flow: ['Limit WIP', 'Run block', 'Recover fast'],
      experimental: 'Optimizes for flow completion rather than queue throughput.',
    },
    projects: {
      title: 'Manage projects as pacing tracks.',
      summary: 'Each track has tempo expectations and explicit recovery windows.',
      flow: ['Set pace', 'Watch slippage', 'Rebalance load'],
      experimental: 'Makes pacing a first-class project metric.',
    },
    ideas: {
      title: 'Use idea sketches to feed the next sprint cycle.',
      summary: 'Ideas are staged by near-term sprint relevance.',
      flow: ['Draft sketch', 'Score fit', 'Queue for sprint'],
      experimental: 'Connects ideation directly to focus sprints.',
    },
    reading: {
      title: 'Curate inputs that preserve momentum.',
      summary: 'Reading is batched around sprint boundaries to avoid attention fragmentation.',
      flow: ['Batch input', 'Extract note', 'Resume flow'],
      experimental: 'Restricts intake windows for deeper output periods.',
    },
    activity: {
      title: 'Review session feed for focus integrity.',
      summary: 'Activity is interpreted through interruption patterns and recovery quality.',
      flow: ['Trace sessions', 'Find breaks', 'Tune ritual'],
      experimental: 'Makes interruption cost visible in daily review.',
    },
  },
  v3: {
    overview: {
      title: 'Lead with narrative context before execution.',
      summary: 'Summarize the current chapter: stakes, thesis, and expected proof.',
      flow: ['Read chapter', 'State thesis', 'Define proof'],
      experimental: 'Unifies planning language across product, content, and ops.',
    },
    kanban: {
      title: 'Treat tasks as scenes in a story arc.',
      summary: 'Scene progress matters only if it advances the narrative thesis.',
      flow: ['Select scene', 'Execute beat', 'Publish proof'],
      experimental: 'Reframes task movement around narrative outcomes.',
    },
    projects: {
      title: 'Projects are arcs with rising stakes.',
      summary: 'Each arc tracks unresolved tension, progress, and delivered evidence.',
      flow: ['Define arc', 'Escalate stakes', 'Resolve chapter'],
      experimental: 'Encourages outcome storytelling for strategic clarity.',
    },
    ideas: {
      title: 'Evolve ideas into thesis statements, not loose concepts.',
      summary: 'Every idea must articulate an evidence path to survive.',
      flow: ['Capture thesis', 'Design test', 'Advance or kill'],
      experimental: 'Adds high narrative rigor to idea triage.',
    },
    reading: {
      title: 'Ingest source feed as narrative evidence.',
      summary: 'Reading is mapped to thesis support or contradiction.',
      flow: ['Read source', 'Extract claim', 'Attach evidence'],
      experimental: 'Turns reading into narrative architecture work.',
    },
    activity: {
      title: 'Chronicle the story evolution over time.',
      summary: 'The timeline becomes a ledger of narrative decisions.',
      flow: ['Review chapter', 'Spot inflection', 'Write next move'],
      experimental: 'Improves retrospective quality with story framing.',
    },
  },
  v4: {
    overview: {
      title: 'Orient on system state before local optimization.',
      summary: 'View dependency health and node pressure before deciding action.',
      flow: ['Map field', 'Find pressure', 'Stabilize node'],
      experimental: 'Pushes systems thinking into daily execution.',
    },
    kanban: {
      title: 'Move work as node transitions through a network.',
      summary: 'Task flow is treated as state transitions in an interconnected graph.',
      flow: ['Choose node', 'Advance state', 'Update links'],
      experimental: 'Highlights hidden coupling between tasks.',
    },
    projects: {
      title: 'Manage projects as constellations, not silos.',
      summary: 'Project health includes incoming/outgoing dependency quality.',
      flow: ['Inspect constellation', 'Bridge gaps', 'Lock handoff'],
      experimental: 'Makes cross-project coordination visible by default.',
    },
    ideas: {
      title: 'Cluster signals by adjacency and gravity.',
      summary: 'Ideas are grouped by system relevance, not category labels alone.',
      flow: ['Cluster signal', 'Find anchor', 'Inject into node'],
      experimental: 'Uses proximity logic to improve idea placement.',
    },
    reading: {
      title: 'Treat reading as satellite telemetry.',
      summary: 'Input is triaged by which system node it can influence.',
      flow: ['Pull telemetry', 'Assign node', 'Trigger update'],
      experimental: 'Maps research to dependency impact.',
    },
    activity: {
      title: 'Monitor pulse stream for unstable links.',
      summary: 'Timeline review focuses on oscillation and handoff failures.',
      flow: ['Trace pulse', 'Detect oscillation', 'Stabilize route'],
      experimental: 'Optimizes for system stability over local speed.',
    },
  },
  v5: {
    overview: {
      title: 'Open with portfolio state and conviction levels.',
      summary: 'Review where execution capital is allocated and whether conviction still holds.',
      flow: ['Check positions', 'Reprice bets', 'Commit capital'],
      experimental: 'Turns daily planning into explicit investment decisions.',
    },
    kanban: {
      title: 'Run the board as a deal pipeline.',
      summary: 'Tasks are managed as opportunities with score, urgency, and expected return.',
      flow: ['Price deal', 'Approve move', 'Realize return'],
      experimental: 'Adds pricing logic directly into execution flow.',
    },
    projects: {
      title: 'Treat projects as positions in a strategy portfolio.',
      summary: 'Project attention is weighted by upside, risk, and capital lock.',
      flow: ['Size position', 'Manage risk', 'Reallocate'],
      experimental: 'Forces portfolio-level tradeoffs to stay visible.',
    },
    ideas: {
      title: 'Manage ideas as options with expiry pressure.',
      summary: 'Ideas must justify option value or be closed quickly.',
      flow: ['Price option', 'Exercise or pass', 'Log thesis'],
      experimental: 'Improves idea quality through market-style discipline.',
    },
    reading: {
      title: 'Use market tape to update conviction.',
      summary: 'Reading updates bet confidence and execution sizing decisions.',
      flow: ['Read signal', 'Update conviction', 'Reweight plan'],
      experimental: 'Connects external input to immediate allocation changes.',
    },
    activity: {
      title: 'Review trade journal for decision quality.',
      summary: 'Timeline is interpreted as a record of allocation quality.',
      flow: ['Audit trades', 'Measure edge', 'Adjust model'],
      experimental: 'Improves process through post-trade analysis.',
    },
  },
}

export function resolveDashboardVariant(input: string | undefined): DashboardVariant {
  if (!input) {
    return DEFAULT_VARIANT
  }

  const normalized = input.trim().toLowerCase()

  if (
    normalized === 'middle' ||
    normalized === 'v1' ||
    normalized === 'v2' ||
    normalized === 'v3' ||
    normalized === 'v4' ||
    normalized === 'v5' ||
    normalized === 'v6'
  ) {
    return normalized
  }

  return DEFAULT_VARIANT
}

export function getDashboardVariant(): DashboardVariant {
  return resolveDashboardVariant(process.env.NEXT_PUBLIC_DASHBOARD_VARIANT)
}

export function getDashboardTheme(variant: DashboardVariant = getDashboardVariant()): DashboardTheme {
  return THEMES[variant]
}

export function getVariantJourney(
  page: DashboardPage,
  variant: DashboardVariant = getDashboardVariant()
): JourneyCopy {
  return JOURNEY[variant][page]
}
