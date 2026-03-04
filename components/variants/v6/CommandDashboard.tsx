'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle,
  Check,
  Clock3,
  Command,
  Minus,
  Pause,
  Play,
  Plus,
  Search,
  Sparkles,
  Target,
  X,
} from 'lucide-react'
import { useWorkspace } from '@/components/providers/WorkspaceProvider'
import { CommandPalette, type CommandAction } from '@/components/variants/shared/CommandPalette'
import { MorningBrief } from '@/components/variants/shared/MorningBrief'
import { MomentumScore } from '@/components/variants/shared/MomentumScore'
import {
  getGlobalSparkline,
  getMostUrgentTask,
  getProjectById,
  isRecent,
  isStale,
  isTaskOverdue,
  sortTasksByUrgency,
  summarizeMorningBrief,
} from '@/components/variants/shared/variantData'
import { SparklineChart } from '@/components/variants/shared/SparklineChart'
import { formatDate } from '@/lib/utils'
import type { WorkspaceData, WorkspaceTask, TaskStatus } from '@/lib/workspace'

type CommandMode = 'focus' | 'orbit'
type ZoomLevel = 'portfolio' | 'cluster' | 'detail'

type InputKind = 'task' | 'idea' | 'project'

interface InlineInputState {
  kind: InputKind
  title: string
  placeholder: string
  value: string
  projectId: string | null
}

interface OrbitNode {
  id: string
  kind: 'project' | 'task' | 'idea'
  entityId: string
  projectId: string | null
  x: number
  y: number
  label: string
  color: string
  stale: boolean
  recent: boolean
  overdue: boolean
  status: TaskStatus | null
}

interface OrbitEdge {
  id: string
  from: string
  to: string
  kind: 'blocking' | 'related'
}

const WORLD_WIDTH = 2400
const WORLD_HEIGHT = 1600
const ACCENT = '#F5A623'

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function getZoomLevel(zoom: number): ZoomLevel {
  if (zoom < 0.65) return 'portfolio'
  if (zoom < 1.3) return 'cluster'
  return 'detail'
}

function normalize(text: string | null | undefined): string {
  return (text ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function mapIdeaProjectId(data: WorkspaceData, ideaTitle: string, ideaCategory: string): string | null {
  const normalizedTitle = normalize(ideaTitle)
  const normalizedCategory = normalize(ideaCategory)

  for (const project of data.projects) {
    const projectName = normalize(project.name)
    if (!projectName) continue

    const direct =
      normalizedTitle.includes(projectName) ||
      normalizedCategory.includes(projectName) ||
      projectName.includes(normalizedCategory)

    const tokenMatch = projectName
      .split(' ')
      .filter((token) => token.length >= 4)
      .some((token) => normalizedTitle.includes(token) || normalizedCategory.includes(token))

    if (direct || tokenMatch) {
      return project.id
    }
  }

  return null
}

function buildAdaptiveTaskOrder(tasks: WorkspaceTask[]): WorkspaceTask[] {
  const sorted = sortTasksByUrgency(tasks)
  const urgent = sorted.filter((task) => task.priority === 'urgent')
  const blocked = sorted.filter((task) => task.status === 'blocked' && task.priority !== 'urgent')
  const rest = sorted.filter((task) => task.priority !== 'urgent' && task.status !== 'blocked')
  return [...urgent, ...blocked, ...rest]
}

function nodeRadius(node: OrbitNode, zoomLevel: ZoomLevel): number {
  if (zoomLevel === 'portfolio') {
    if (node.kind === 'project') return 52
    if (node.kind === 'idea') return 8
    return 0
  }

  if (zoomLevel === 'cluster') {
    if (node.kind === 'project') return 32
    if (node.kind === 'task') return 16
    return 10
  }

  if (node.kind === 'project') return 28
  if (node.kind === 'task') return 18
  return 9
}

function runOrbitLayout(data: WorkspaceData): { nodes: OrbitNode[]; edges: OrbitEdge[] } {
  const projectNodes: OrbitNode[] = data.projects.map((project, index) => {
    const angle = (index / Math.max(1, data.projects.length)) * Math.PI * 2
    const radius = 420

    return {
      id: `project-${project.id}`,
      kind: 'project',
      entityId: project.id,
      projectId: project.id,
      x: WORLD_WIDTH / 2 + Math.cos(angle) * radius,
      y: WORLD_HEIGHT / 2 + Math.sin(angle) * radius,
      label: project.name,
      color: project.color,
      stale: isStale(project.updated_at),
      recent: isRecent(project.updated_at),
      overdue: false,
      status: null,
    }
  })

  const projectNodeById = new Map(projectNodes.map((node) => [node.projectId, node]))

  const taskNodes: OrbitNode[] = []

  for (const project of data.projects) {
    const center = projectNodeById.get(project.id)
    if (!center) continue

    const projectTasks = data.tasks.filter((task) => task.project_id === project.id && task.status !== 'done')

    projectTasks.forEach((task, index) => {
      const angle = (index / Math.max(1, projectTasks.length)) * Math.PI * 2
      const regionShiftX =
        task.status === 'backlog'
          ? -64
          : task.status === 'done'
            ? 64
            : 0
      const regionShiftY = task.status === 'blocked' ? 52 : 0

      taskNodes.push({
        id: `task-${task.id}`,
        kind: 'task',
        entityId: task.id,
        projectId: project.id,
        x: center.x + Math.cos(angle) * 116 + regionShiftX,
        y: center.y + Math.sin(angle) * 108 + regionShiftY,
        label: task.title,
        color: project.color,
        stale: isStale(task.updated_at),
        recent: isRecent(task.updated_at),
        overdue: isTaskOverdue(task),
        status: task.status,
      })
    })
  }

  const ideaNodes: OrbitNode[] = data.ideas.map((idea, index) => {
    const projectId = mapIdeaProjectId(data, idea.title, idea.category)
    const center = projectId ? projectNodeById.get(projectId) : null
    const angle = ((index + 1) / Math.max(1, data.ideas.length + 1)) * Math.PI * 2
    const radius = projectId ? 168 : 86 + (index % 5) * 24

    return {
      id: `idea-${idea.id}`,
      kind: 'idea',
      entityId: idea.id,
      projectId,
      x: (center?.x ?? WORLD_WIDTH / 2) + Math.cos(angle) * radius,
      y: (center?.y ?? WORLD_HEIGHT / 2) + Math.sin(angle) * radius,
      label: idea.title,
      color: center?.color ?? '#9ca3af',
      stale: isStale(idea.updated_at),
      recent: isRecent(idea.updated_at),
      overdue: false,
      status: null,
    }
  })

  const nodes = [...projectNodes, ...taskNodes, ...ideaNodes]

  // Lightweight force pass: repulse projects, pull children to project centers, and resolve collisions.
  const positions = new Map(nodes.map((node) => [node.id, { x: node.x, y: node.y, vx: 0, vy: 0 }]))

  for (let tick = 0; tick < 220; tick += 1) {
    for (let i = 0; i < projectNodes.length; i += 1) {
      for (let j = i + 1; j < projectNodes.length; j += 1) {
        const a = projectNodes[i]
        const b = projectNodes[j]
        const pa = positions.get(a.id)
        const pb = positions.get(b.id)
        if (!pa || !pb) continue

        const dx = pa.x - pb.x
        const dy = pa.y - pb.y
        const distSq = Math.max(1, dx * dx + dy * dy)
        const repulse = 6200 / distSq

        pa.vx += (dx / Math.sqrt(distSq)) * repulse
        pa.vy += (dy / Math.sqrt(distSq)) * repulse
        pb.vx -= (dx / Math.sqrt(distSq)) * repulse
        pb.vy -= (dy / Math.sqrt(distSq)) * repulse
      }
    }

    for (const node of nodes) {
      if (node.kind === 'project' || !node.projectId) continue
      const center = projectNodeById.get(node.projectId)
      const pNode = positions.get(node.id)
      const pCenter = center ? positions.get(center.id) : null
      if (!pNode || !pCenter) continue

      const pull = node.kind === 'task' ? 0.065 : 0.035
      pNode.vx += (pCenter.x - pNode.x) * pull
      pNode.vy += (pCenter.y - pNode.y) * pull
    }

    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const a = nodes[i]
        const b = nodes[j]
        const pa = positions.get(a.id)
        const pb = positions.get(b.id)
        if (!pa || !pb) continue

        const dx = pa.x - pb.x
        const dy = pa.y - pb.y
        const distance = Math.max(1, Math.sqrt(dx * dx + dy * dy))
        const minDistance =
          (a.kind === 'project' ? 56 : a.kind === 'task' ? 24 : 18) +
          (b.kind === 'project' ? 56 : b.kind === 'task' ? 24 : 18)

        if (distance >= minDistance) continue

        const overlap = (minDistance - distance) * 0.02
        const nx = dx / distance
        const ny = dy / distance
        pa.vx += nx * overlap
        pa.vy += ny * overlap
        pb.vx -= nx * overlap
        pb.vy -= ny * overlap
      }
    }

    for (const node of nodes) {
      const point = positions.get(node.id)
      if (!point) continue

      point.vx *= 0.82
      point.vy *= 0.82
      point.x = clamp(point.x + point.vx, 84, WORLD_WIDTH - 84)
      point.y = clamp(point.y + point.vy, 84, WORLD_HEIGHT - 84)
    }
  }

  const settledNodes = nodes.map((node) => {
    const settled = positions.get(node.id)
    if (!settled) return node

    return {
      ...node,
      x: settled.x,
      y: settled.y,
    }
  })

  const edges: OrbitEdge[] = []

  for (let index = 0; index < projectNodes.length; index += 1) {
    const current = projectNodes[index]
    const next = projectNodes[(index + 1) % Math.max(1, projectNodes.length)]
    if (!next || next.id === current.id) continue

    edges.push({
      id: `related-${current.id}-${next.id}`,
      from: current.id,
      to: next.id,
      kind: 'related',
    })
  }

  for (const blocked of data.tasks.filter((task) => task.status === 'blocked' && task.project_id)) {
    const blockedNode = settledNodes.find((node) => node.kind === 'task' && node.entityId === blocked.id)
    const candidate = data.tasks.find(
      (task) => task.project_id === blocked.project_id && task.status !== 'blocked' && task.id !== blocked.id
    )
    const candidateNode = candidate
      ? settledNodes.find((node) => node.kind === 'task' && node.entityId === candidate.id)
      : null

    if (!blockedNode || !candidateNode) continue

    edges.push({
      id: `blocking--`,
      from: blockedNode.id,
      to: candidateNode.id,
      kind: 'blocking',
    })
  }

  return { nodes: settledNodes, edges }
}

function shouldIgnoreKeyEvent(event: KeyboardEvent): boolean {
  const target = event.target as HTMLElement | null
  if (!target) return false

  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return true
  if (target.isContentEditable) return true
  return false
}

function getInitialMode(): CommandMode {
  return new Date().getHours() >= 18 ? 'orbit' : 'focus'
}

export function CommandDashboard() {
  const {
    data,
    createIdea,
    createProject,
    createTask,
    moveTask,
  } = useWorkspace()

  const [mode, setMode] = useState<CommandMode>(getInitialMode)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [inputOverlay, setInputOverlay] = useState<InlineInputState | null>(null)

  const [primaryTaskId, setPrimaryTaskId] = useState<string | null>(null)
  const [briefCollapsed, setBriefCollapsed] = useState(false)

  const [timerMinutes, setTimerMinutes] = useState(25)
  const [secondsLeft, setSecondsLeft] = useState(25 * 60)
  const [timerRunning, setTimerRunning] = useState(false)

  const [orbitSearch, setOrbitSearch] = useState('')
  const [showTasks, setShowTasks] = useState(true)
  const [showIdeas, setShowIdeas] = useState(true)
  const [zoom, setZoom] = useState(0.74)
  const [targetZoom, setTargetZoom] = useState(0.74)
  const [pan, setPan] = useState({ x: -320, y: -220 })
  const [dragAnchor, setDragAnchor] = useState<{ x: number; y: number } | null>(null)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [selectedTaskNodeId, setSelectedTaskNodeId] = useState<string | null>(null)
  const [clock, setClock] = useState(() => new Date())

  const viewportRef = useRef<HTMLDivElement | null>(null)
  const minimapRef = useRef<SVGSVGElement | null>(null)

  const activeTasks = useMemo(
    () => buildAdaptiveTaskOrder(data.tasks.filter((task) => task.status !== 'done')),
    [data.tasks]
  )

  useEffect(() => {
    if (activeTasks.length === 0) {
      setPrimaryTaskId(null)
      return
    }

    const currentExists = activeTasks.some((task) => task.id === primaryTaskId)
    if (currentExists) return

    setPrimaryTaskId(activeTasks[0]?.id ?? null)
  }, [activeTasks, primaryTaskId])

  const primaryTask = useMemo(
    () => activeTasks.find((task) => task.id === primaryTaskId) ?? activeTasks[0] ?? null,
    [activeTasks, primaryTaskId]
  )

  const nextUp = useMemo(
    () => activeTasks.filter((task) => task.id !== primaryTask?.id).slice(0, 3),
    [activeTasks, primaryTask?.id]
  )

  const relatedArticles = useMemo(() => {
    if (!primaryTask?.project_id) {
      return data.articles.filter((article) => article.status !== 'archived').slice(0, 3)
    }

    const projectIndex = data.projects.findIndex((project) => project.id === primaryTask.project_id)
    if (projectIndex < 0 || data.readingLists.length === 0) {
      return data.articles.filter((article) => article.status !== 'archived').slice(0, 3)
    }

    const list = data.readingLists[projectIndex % data.readingLists.length]
    return data.articles
      .filter((article) => article.reading_list_id === list.id && article.status !== 'archived')
      .slice(0, 3)
  }, [data.articles, data.projects, data.readingLists, primaryTask?.project_id])

  const morningBrief = useMemo(() => summarizeMorningBrief(data), [data])
  const urgentTask = useMemo(() => getMostUrgentTask(data), [data])

  const statusStats = useMemo(() => {
    const active = data.tasks.filter((task) => task.status !== 'done').length
    const blocked = data.tasks.filter((task) => task.status === 'blocked').length
    const urgent = data.tasks.filter((task) => task.status !== 'done' && task.priority === 'urgent').length
    const ideas = data.ideas.filter((idea) => idea.status !== 'shipped').length
    const unread = data.articles.filter((article) => article.status === 'unread').length
    return { active, blocked, urgent, ideas, unread }
  }, [data.articles, data.ideas, data.tasks])

  const momentum = useMemo(() => {
    const trend = getGlobalSparkline(data)
    const score = Math.round(
      (statusStats.active > 0 ? (data.tasks.filter((task) => task.status === 'done').length / data.tasks.length) * 60 : 30) +
      Math.max(0, 28 - statusStats.blocked * 6) +
      Math.max(0, 12 - statusStats.unread * 2)
    )

    const half = Math.max(1, Math.floor(trend.length / 2))
    const prev = trend.slice(0, half).reduce((sum, value) => sum + value, 0)
    const curr = trend.slice(half).reduce((sum, value) => sum + value, 0)
    const direction: 'up' | 'flat' | 'down' = curr > prev ? 'up' : curr < prev ? 'down' : 'flat'

    return {
      score: clamp(score, 0, 100),
      direction,
      trend,
    }
  }, [data, statusStats.active, statusStats.blocked, statusStats.unread])

  const digest = useMemo(() => {
    return `# Daily Command Digest\n\n- Active tasks: ${statusStats.active}\n- Blocked tasks: ${statusStats.blocked}\n- Urgent tasks: ${statusStats.urgent}\n- Ideas open: ${statusStats.ideas}\n- Unread articles: ${statusStats.unread}\n- Current focus: ${primaryTask?.title ?? 'None'}\n`
  }, [primaryTask?.title, statusStats])

  const queueDots = useMemo(() => activeTasks.slice(0, 8), [activeTasks])

  const graph = useMemo(
    () => (mode === 'orbit' ? runOrbitLayout(data) : { nodes: [], edges: [] }),
    [data, mode]
  )
  const nodeById = useMemo(() => new Map(graph.nodes.map((node) => [node.id, node])), [graph.nodes])
  const zoomLevel = getZoomLevel(zoom)

  const selectedTaskNode = selectedTaskNodeId ? nodeById.get(selectedTaskNodeId) ?? null : null
  const selectedTask = selectedTaskNode?.kind === 'task'
    ? data.tasks.find((task) => task.id === selectedTaskNode.entityId) ?? null
    : null

  const orbitNodes = useMemo(() => {
    const query = orbitSearch.trim().toLowerCase()

    return graph.nodes.filter((node) => {
      if (!showTasks && node.kind === 'task') return false
      if (!showIdeas && node.kind === 'idea') return false

      if (zoomLevel === 'portfolio' && node.kind === 'task') return false

      if (query && !node.label.toLowerCase().includes(query)) {
        return false
      }

      return true
    })
  }, [graph.nodes, orbitSearch, showIdeas, showTasks, zoomLevel])

  const orbitVisibleSet = useMemo(() => new Set(orbitNodes.map((node) => node.id)), [orbitNodes])

  const orbitEdges = useMemo(
    () => graph.edges.filter((edge) => orbitVisibleSet.has(edge.from) && orbitVisibleSet.has(edge.to)),
    [graph.edges, orbitVisibleSet]
  )

  const linkedToHovered = useMemo(() => {
    if (!hoveredNodeId) return new Set<string>()

    const linked = new Set<string>([hoveredNodeId])

    for (const edge of orbitEdges) {
      if (edge.from === hoveredNodeId) linked.add(edge.to)
      if (edge.to === hoveredNodeId) linked.add(edge.from)
    }

    const hovered = nodeById.get(hoveredNodeId)
    if (hovered?.projectId) {
      for (const node of orbitNodes) {
        if (node.projectId === hovered.projectId) {
          linked.add(node.id)
        }
      }
    }

    return linked
  }, [hoveredNodeId, nodeById, orbitEdges, orbitNodes])

  const viewportSize = {
    width: viewportRef.current?.clientWidth ?? 1,
    height: viewportRef.current?.clientHeight ?? 1,
  }

  const viewportWorld = {
    x: -pan.x / zoom,
    y: -pan.y / zoom,
    width: viewportSize.width / zoom,
    height: viewportSize.height / zoom,
  }

  const toWorld = useCallback(
    (clientX: number, clientY: number) => {
      const bounds = viewportRef.current?.getBoundingClientRect()
      if (!bounds) {
        return { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 }
      }

      return {
        x: (clientX - bounds.left - pan.x) / zoom,
        y: (clientY - bounds.top - pan.y) / zoom,
      }
    },
    [pan.x, pan.y, zoom]
  )

  const nearestProjectNode = useCallback(
    (worldX: number, worldY: number): OrbitNode | null => {
      const projects = graph.nodes.filter((node) => node.kind === 'project')
      if (projects.length === 0) return null

      let closest = projects[0]
      let best = Number.POSITIVE_INFINITY

      for (const node of projects) {
        const dx = node.x - worldX
        const dy = node.y - worldY
        const distance = dx * dx + dy * dy
        if (distance < best) {
          best = distance
          closest = node
        }
      }

      return closest
    },
    [graph.nodes]
  )

  useEffect(() => {
    const interval = window.setInterval(() => setClock(new Date()), 60000)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!timerRunning) return

    const interval = window.setInterval(() => {
      setSecondsLeft((seconds) => {
        if (seconds <= 1) {
          setTimerRunning(false)
          return 0
        }

        return seconds - 1
      })
    }, 1000)

    return () => window.clearInterval(interval)
  }, [timerRunning])

  useEffect(() => {
    setTimerRunning(false)
    setSecondsLeft(timerMinutes * 60)
  }, [timerMinutes, primaryTask?.id])

  useEffect(() => {
    if (briefCollapsed) return

    const timer = window.setTimeout(() => setBriefCollapsed(true), 30000)
    return () => window.clearTimeout(timer)
  }, [briefCollapsed])

  useEffect(() => {
    if (mode !== 'orbit') {
      return
    }

    if (Math.abs(targetZoom - zoom) < 0.001) {
      if (targetZoom !== zoom) {
        setZoom(targetZoom)
      }
      return
    }

    let frame = 0

    const animate = () => {
      setZoom((current) => {
        const delta = targetZoom - current
        if (Math.abs(delta) < 0.001) {
          return targetZoom
        }

        frame = window.requestAnimationFrame(animate)
        return current + delta * 0.24
      })
    }

    frame = window.requestAnimationFrame(animate)
    return () => window.cancelAnimationFrame(frame)
  }, [mode, targetZoom, zoom])

  useEffect(() => {
    if (mode !== 'orbit') {
      return
    }

    if (zoomLevel !== 'detail') {
      return
    }

    if (hoveredNodeId) {
      const hovered = nodeById.get(hoveredNodeId)
      if (hovered?.kind === 'task') {
        setSelectedTaskNodeId(hovered.id)
        return
      }
    }

    if (!selectedTaskNodeId) {
      const firstTask = orbitNodes.find((node) => node.kind === 'task')
      if (firstTask) {
        setSelectedTaskNodeId(firstTask.id)
      }
    }
  }, [hoveredNodeId, mode, nodeById, orbitNodes, selectedTaskNodeId, zoomLevel])

  const openInputOverlay = useCallback(
    (kind: InputKind, title: string, placeholder: string, projectId: string | null = null) => {
      setInputOverlay({
        kind,
        title,
        placeholder,
        projectId,
        value: '',
      })
    },
    []
  )

  const submitInputOverlay = useCallback(() => {
    if (!inputOverlay) return

    const text = inputOverlay.value.trim()
    if (!text) return

    if (inputOverlay.kind === 'task') {
      createTask({
        title: text,
        project_id: inputOverlay.projectId,
        owner_type: 'human',
        priority: 'medium',
      })
    }

    if (inputOverlay.kind === 'idea') {
      createIdea({
        title: text,
        owner_type: 'human',
      })
    }

    if (inputOverlay.kind === 'project') {
      createProject({
        name: text,
        status: 'active',
      })
    }

    setInputOverlay(null)
  }, [createIdea, createProject, createTask, inputOverlay])

  const commandActions = useMemo<CommandAction[]>(() => {
    const taskActions: CommandAction[] = data.tasks.slice(0, 20).flatMap((task) => {
      const actions: CommandAction[] = [
        {
          id: `start-${task.id}`,
          label: `Start ${task.title}`,
          description: 'Mark task in progress',
          keywords: ['task', 'start', task.priority],
          run: () => moveTask(task.id, 'in_progress'),
        },
        {
          id: `done-${task.id}`,
          label: `Mark ${task.title} done`,
          description: 'Close task',
          keywords: ['task', 'done', task.priority],
          run: () => moveTask(task.id, 'done'),
        },
      ]

      return actions
    })

    const searchRows = [
      ...data.tasks.map((task) => ({
        id: `search-task-${task.id}`,
        label: task.title,
        meta: `Task · ${task.status}`,
        run: () => {
          setMode('focus')
          setPrimaryTaskId(task.id)
        },
      })),
      ...data.projects.map((project) => ({
        id: `search-project-${project.id}`,
        label: project.name,
        meta: `Project · ${project.status}`,
        run: () => setMode('orbit'),
      })),
      ...data.ideas.map((idea) => ({
        id: `search-idea-${idea.id}`,
        label: idea.title,
        meta: `Idea · ${idea.status}`,
        run: () => setMode('orbit'),
      })),
      ...data.articles.map((article) => ({
        id: `search-article-${article.id}`,
        label: article.title,
        meta: `Article · ${article.status}`,
        run: () => setMode('focus'),
      })),
    ]

    return [
      {
        id: 'mode-focus',
        label: 'Switch to Focus mode',
        run: () => setMode('focus'),
      },
      {
        id: 'mode-orbit',
        label: 'Switch to Orbit mode',
        run: () => setMode('orbit'),
      },
      {
        id: 'create-task',
        label: 'Create task',
        description: 'Open inline task capture',
        keywords: ['create', 'task'],
        run: () => openInputOverlay('task', 'Create Task', 'Task title', primaryTask?.project_id ?? null),
      },
      {
        id: 'create-idea',
        label: 'Create idea',
        description: 'Open inline idea capture',
        keywords: ['create', 'idea'],
        run: () => openInputOverlay('idea', 'Capture Idea', 'Idea title'),
      },
      {
        id: 'create-project',
        label: 'Create project',
        description: 'Open inline project capture',
        keywords: ['create', 'project'],
        run: () => openInputOverlay('project', 'Create Project', 'Project name'),
      },
      {
        id: 'digest-copy',
        label: 'Share daily digest',
        description: 'Copy markdown summary to clipboard',
        keywords: ['digest', 'share', 'markdown'],
        run: async () => {
          try {
            await navigator.clipboard.writeText(digest)
          } catch {
            // Clipboard unsupported.
          }
        },
      },
      ...taskActions,
      ...searchRows.map((row) => ({
        id: row.id,
        label: row.label,
        description: row.meta,
        keywords: ['search', row.meta],
        run: row.run,
      })),
    ]
  }, [data.articles, data.ideas, data.projects, data.tasks, digest, moveTask, openInputOverlay, primaryTask?.project_id])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (shouldIgnoreKeyEvent(event)) {
        return
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setPaletteOpen((open) => !open)
        return
      }

      if (event.key === '?') {
        event.preventDefault()
        setShowShortcuts((open) => !open)
        return
      }

      if (event.key === 'Tab') {
        event.preventDefault()
        setMode((current) => (current === 'focus' ? 'orbit' : 'focus'))
        return
      }

      if (inputOverlay) {
        if (event.key === 'Escape') {
          event.preventDefault()
          setInputOverlay(null)
        }
        return
      }

      if (paletteOpen) {
        return
      }

      if (mode === 'focus') {
        if (event.code === 'Space') {
          event.preventDefault()
          setTimerRunning((running) => !running)
          return
        }

        if (event.key === 'Enter' && primaryTask) {
          event.preventDefault()
          moveTask(primaryTask.id, 'in_progress')
          return
        }

        if (event.key.toLowerCase() === 'd' && primaryTask) {
          event.preventDefault()
          moveTask(primaryTask.id, 'done')
          return
        }

        if (event.key.toLowerCase() === 'b' && primaryTask) {
          event.preventDefault()
          moveTask(primaryTask.id, 'blocked')
          return
        }

        if (event.key.toLowerCase() === 'j' && nextUp.length > 0) {
          event.preventDefault()
          setPrimaryTaskId(nextUp[0].id)
          return
        }
      }

      if (mode === 'orbit' && event.key === 'Escape' && selectedTaskNodeId) {
        event.preventDefault()
        setSelectedTaskNodeId(null)
        setTargetZoom(1.2)
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [inputOverlay, mode, moveTask, nextUp, paletteOpen, primaryTask, selectedTaskNodeId])

  const timerLabel = `${Math.floor(secondsLeft / 60)
    .toString()
    .padStart(2, '0')}:${(secondsLeft % 60).toString().padStart(2, '0')}`

  return (
    <div
      className={`relative h-screen overflow-hidden [font-family:var(--font-body)] ${mode === 'focus' ? 'bg-[#F7EFE3] text-[#2A1F1A]' : 'bg-[#1C1C1E] text-[#E0E0E0]'}`}
    >
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        actions={commandActions}
        title="The Command"
        placeholder="Switch modes, create, search, or run actions"
      />

      <main className="absolute inset-0 pb-20">
        <AnimatePresence mode="wait">
          {mode === 'focus' && (
            <motion.section
              key="focus"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="h-full w-full p-5 sm:p-8"
            >
              <div className="mx-auto flex h-full max-w-7xl flex-col gap-4">
            <div
              className={`overflow-hidden rounded-3xl border border-[rgba(42,31,26,0.12)] bg-white/80 backdrop-blur transition-all duration-300 ${briefCollapsed ? 'max-h-[72px]' : 'max-h-[360px]'}`}
            >
              <div className="p-4 sm:p-6">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="text-xl [font-family:var(--font-editorial)] sm:text-3xl">Morning Brief</h2>
                  <button
                    onClick={() => setBriefCollapsed((collapsed) => !collapsed)}
                    className="rounded-full border border-[rgba(42,31,26,0.2)] px-3 py-1 text-xs uppercase tracking-[0.12em]"
                  >
                    {briefCollapsed ? 'Expand' : 'Collapse'}
                  </button>
                </div>

                {!briefCollapsed ? (
                  <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                    <MorningBrief
                      title={new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                      dateLabel="The Command"
                      sentence={morningBrief.sentence}
                      stats={morningBrief.stats}
                      actionLabel={urgentTask ? `Start with ${urgentTask.title}` : undefined}
                      onAction={() => {
                        if (urgentTask) {
                          setPrimaryTaskId(urgentTask.id)
                        }
                        setBriefCollapsed(true)
                      }}
                      className="rounded-2xl border border-[rgba(42,31,26,0.12)] bg-[#fffaf3]"
                    />

                    <div className="rounded-2xl border border-[rgba(42,31,26,0.12)] bg-[#fffdf8] p-4">
                      <MomentumScore data={data} />
                      <div className="mt-3">
                        <p className="text-xs uppercase tracking-[0.14em] [font-family:var(--font-data)] text-[rgba(42,31,26,0.7)]">
                          Trend
                        </p>
                        <SparklineChart points={momentum.trend} stroke={ACCENT} className="mt-2 h-10 w-full" />
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
              <article className="relative min-h-0 rounded-3xl border border-[rgba(42,31,26,0.12)] bg-white/80 p-6 backdrop-blur">
                {primaryTask ? (
                  <>
                    <p className="text-xs uppercase tracking-[0.16em] [font-family:var(--font-editorial)] text-[rgba(42,31,26,0.7)]">
                      Primary Task
                    </p>
                    <h1 className="mt-3 text-4xl leading-tight [font-family:var(--font-display)] sm:text-5xl">{primaryTask.title}</h1>
                    <p className="mt-3 max-w-3xl text-sm text-[rgba(42,31,26,0.75)] sm:text-base">
                      {primaryTask.description || 'No description yet.'}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.12em] [font-family:var(--font-data)] text-[rgba(42,31,26,0.74)]">
                      <span className="rounded-full border border-[rgba(42,31,26,0.2)] px-3 py-1">
                        {getProjectById(data, primaryTask.project_id)?.name ?? 'Unassigned'}
                      </span>
                      <span className="rounded-full border border-[rgba(42,31,26,0.2)] px-3 py-1">{primaryTask.priority}</span>
                      <span className="rounded-full border border-[rgba(42,31,26,0.2)] px-3 py-1">
                        {primaryTask.due_date ? `Due ${formatDate(primaryTask.due_date)}` : 'No due date'}
                      </span>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2 text-sm">
                      <button
                        onClick={() => moveTask(primaryTask.id, 'in_progress')}
                        className="rounded-full border border-[rgba(42,31,26,0.2)] px-4 py-2 transition-colors hover:border-[#F5A623]"
                      >
                        Start
                      </button>
                      <button
                        onClick={() => moveTask(primaryTask.id, 'done')}
                        className="rounded-full border border-[rgba(42,31,26,0.2)] px-4 py-2 transition-colors hover:border-[#F5A623]"
                      >
                        Mark Done
                      </button>
                      <button
                        onClick={() => moveTask(primaryTask.id, 'blocked')}
                        className="rounded-full border border-[rgba(42,31,26,0.2)] px-4 py-2 transition-colors hover:border-[#F5A623]"
                      >
                        I'm Blocked
                      </button>
                    </div>

                    <div className="mt-7 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-[rgba(42,31,26,0.15)] bg-white/70 p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-xs uppercase tracking-[0.16em] text-[rgba(42,31,26,0.62)] [font-family:var(--font-editorial)]">
                            Focus Timer
                          </p>
                          <button
                            onClick={() => setTimerRunning((running) => !running)}
                            className="rounded-full border border-[rgba(42,31,26,0.2)] p-2 transition-colors hover:border-[#F5A623]"
                            aria-label={timerRunning ? 'Pause timer' : 'Start timer'}
                          >
                            {timerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </button>
                        </div>
                        <p className="mt-3 text-3xl [font-family:var(--font-data)]">{timerLabel}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {[15, 25, 45].map((minutes) => (
                            <button
                              key={minutes}
                              onClick={() => setTimerMinutes(minutes)}
                              className={`rounded-full border px-3 py-1 text-xs [font-family:var(--font-data)] ${timerMinutes === minutes ? 'border-[#F5A623] text-[#a16207]' : 'border-[rgba(42,31,26,0.2)]'}`}
                            >
                              {minutes}m
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-[rgba(42,31,26,0.15)] bg-white/70 p-4">
                        <p className="text-xs uppercase tracking-[0.16em] text-[rgba(42,31,26,0.62)] [font-family:var(--font-editorial)]">
                          Queue Depth
                        </p>
                        <div className="mt-3 flex items-center gap-2">
                          {queueDots.map((task) => (
                            <button
                              key={task.id}
                              onClick={() => setPrimaryTaskId(task.id)}
                              className={`h-2.5 w-2.5 rounded-full transition-all ${task.id === primaryTask.id ? 'scale-125 bg-[#F5A623]' : 'bg-[rgba(42,31,26,0.32)]'}`}
                              aria-label={`Focus ${task.title}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-[rgba(42,31,26,0.2)] bg-white/60">
                    <p className="text-sm text-[rgba(42,31,26,0.62)]">No active tasks. Create one with ⌘K.</p>
                  </div>
                )}
              </article>

              <aside className="min-h-0 space-y-4">
                <article className="rounded-3xl border border-[rgba(42,31,26,0.12)] bg-white/80 p-4 backdrop-blur">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm uppercase tracking-[0.16em] [font-family:var(--font-editorial)] text-[rgba(42,31,26,0.65)]">
                      Next Up
                    </h3>
                    <Target className="h-4 w-4 text-[rgba(42,31,26,0.55)]" />
                  </div>
                  <div className="space-y-2">
                    {nextUp.length === 0 ? <p className="text-sm text-[rgba(42,31,26,0.55)]">Queue is clear.</p> : null}
                    {nextUp.map((task) => (
                      <button
                        key={task.id}
                        onClick={() => setPrimaryTaskId(task.id)}
                        className="w-full rounded-xl border border-[rgba(42,31,26,0.14)] bg-white/80 px-3 py-2 text-left text-sm transition-colors hover:border-[#F5A623]"
                      >
                        <p className="font-medium">{task.title}</p>
                        <p className="mt-1 text-[11px] uppercase tracking-[0.12em] [font-family:var(--font-data)] text-[rgba(42,31,26,0.58)]">
                          {task.priority}
                        </p>
                      </button>
                    ))}
                  </div>
                </article>

                <article className="rounded-3xl border border-[rgba(42,31,26,0.12)] bg-white/80 p-4 backdrop-blur">
                  <h3 className="text-sm uppercase tracking-[0.16em] [font-family:var(--font-editorial)] text-[rgba(42,31,26,0.65)]">
                    Related Reading
                  </h3>
                  <div className="mt-3 space-y-2">
                    {relatedArticles.length === 0 ? <p className="text-sm text-[rgba(42,31,26,0.55)]">No related items.</p> : null}
                    {relatedArticles.map((article) => (
                      <article key={article.id} className="rounded-xl border border-[rgba(42,31,26,0.14)] bg-white/80 px-3 py-2 text-sm">
                        <p className="line-clamp-2 font-medium">{article.title}</p>
                        <p className="mt-1 text-[11px] uppercase tracking-[0.12em] [font-family:var(--font-data)] text-[rgba(42,31,26,0.55)]">
                          {article.status}
                        </p>
                      </article>
                    ))}
                  </div>
                </article>
              </aside>
            </div>
              </div>
            </motion.section>
          )}

          {mode === 'orbit' && (
            <motion.section
              key="orbit"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="absolute inset-0"
            >
              <div className="absolute inset-0 bg-[#1C1C1E]">
            <div className="absolute left-1/2 top-4 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full border border-[#2b2b2b] bg-[#111111]/85 px-3 py-2 backdrop-blur">
              <Search className="h-3.5 w-3.5 text-[#888888]" />
              <input
                value={orbitSearch}
                onChange={(event) => setOrbitSearch(event.target.value)}
                placeholder="Search nodes"
                className="w-56 bg-transparent text-xs text-[#E0E0E0] outline-none placeholder:text-[#666666]"
              />
            </div>

            <div
              ref={viewportRef}
              className="absolute inset-0 cursor-grab"
              onMouseDown={(event) => {
                const target = event.target as HTMLElement
                if (target.dataset.node === 'true') {
                  return
                }

                setDragAnchor({ x: event.clientX - pan.x, y: event.clientY - pan.y })
              }}
              onMouseMove={(event) => {
                if (!dragAnchor) return
                setPan({ x: event.clientX - dragAnchor.x, y: event.clientY - dragAnchor.y })
              }}
              onMouseUp={() => setDragAnchor(null)}
              onMouseLeave={() => setDragAnchor(null)}
              onWheel={(event) => {
                event.preventDefault()
                const nextZoom = clamp(targetZoom * (event.deltaY < 0 ? 1.08 : 0.92), 0.42, 2.2)
                setTargetZoom(nextZoom)
              }}
              onDoubleClick={(event) => {
                const target = event.target as HTMLElement
                if (target.dataset.node === 'true') {
                  return
                }

                const world = toWorld(event.clientX, event.clientY)
                const nearestProject = nearestProjectNode(world.x, world.y)
                openInputOverlay('task', 'Create Task', 'Task title', nearestProject?.projectId ?? null)
              }}
            >
              <div
                className="absolute left-0 top-0"
                style={{
                  width: WORLD_WIDTH,
                  height: WORLD_HEIGHT,
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: '0 0',
                }}
              >
                <svg width={WORLD_WIDTH} height={WORLD_HEIGHT} className="overflow-visible">
                  {orbitEdges.map((edge) => {
                    const from = nodeById.get(edge.from)
                    const to = nodeById.get(edge.to)
                    if (!from || !to) return null

                    return (
                      <line
                        key={edge.id}
                        x1={from.x}
                        y1={from.y}
                        x2={to.x}
                        y2={to.y}
                        stroke={edge.kind === 'blocking' ? 'rgba(248,113,113,0.8)' : 'rgba(255,255,255,0.18)'}
                        strokeWidth={edge.kind === 'blocking' ? 2.4 : 1.2}
                      />
                    )
                  })}

                  {orbitNodes.map((node) => {
                    const radius = nodeRadius(node, zoomLevel)
                    if (radius <= 0) return null

                    const active = selectedTaskNodeId === node.id
                    const shouldDim = hoveredNodeId ? !linkedToHovered.has(node.id) : false

                    return (
                      <g
                        key={node.id}
                        transform={`translate(${node.x}, ${node.y})`}
                        data-node="true"
                        onMouseEnter={() => setHoveredNodeId(node.id)}
                        onMouseLeave={() => setHoveredNodeId(null)}
                        onClick={(event) => {
                          event.stopPropagation()
                          if (node.kind === 'task') {
                            setSelectedTaskNodeId(node.id)
                            setTargetZoom(Math.max(targetZoom, 1.32))
                          }
                        }}
                        style={{
                          cursor: node.kind === 'task' ? 'pointer' : 'default',
                          opacity: shouldDim ? 0.2 : 1,
                          transition: 'opacity 150ms ease',
                        }}
                      >
                        <circle
                          r={radius}
                          fill={node.kind === 'project' ? node.color : `${node.color}CC`}
                          stroke={
                            node.overdue
                              ? '#f87171'
                              : active
                                ? ACCENT
                                : node.stale
                                  ? 'rgba(255,255,255,0.24)'
                                  : 'rgba(255,255,255,0.4)'
                          }
                          strokeWidth={active ? 3 : 1.2}
                          filter={node.recent ? 'drop-shadow(0 0 8px rgba(255,255,255,0.38))' : 'none'}
                        />

                        {zoomLevel !== 'portfolio' || node.kind !== 'task' ? (
                          <text
                            y={radius + 18}
                            textAnchor="middle"
                            fill="rgba(224,224,224,0.9)"
                            fontFamily="var(--font-editorial)"
                            fontSize={zoomLevel === 'portfolio' ? 13 : 11}
                          >
                            {node.label.length > 28 ? `${node.label.slice(0, 28)}…` : node.label}
                          </text>
                        ) : null}
                      </g>
                    )
                  })}
                </svg>
              </div>
            </div>

            <div className="absolute bottom-20 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full border border-[#2b2b2b] bg-[#111111]/85 px-3 py-2 text-xs uppercase tracking-[0.12em] text-[#E0E0E0] backdrop-blur">
              <button
                onClick={() => setTargetZoom((value) => clamp(value + 0.12, 0.42, 2.2))}
                className="rounded border border-[#2c2c2c] p-1 transition-colors hover:border-[#F5A623]"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setTargetZoom((value) => clamp(value - 0.12, 0.42, 2.2))}
                className="rounded border border-[#2c2c2c] p-1 transition-colors hover:border-[#F5A623]"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setTargetZoom(0.74)}
                className="rounded border border-[#2c2c2c] px-2 py-1 transition-colors hover:border-[#F5A623]"
              >
                reset
              </button>
              <button
                onClick={() => setShowTasks((value) => !value)}
                className={`rounded border px-2 py-1 transition-colors ${showTasks ? 'border-[#F5A623] text-[#F5A623]' : 'border-[#2c2c2c] text-[#888]'}`}
              >
                tasks
              </button>
              <button
                onClick={() => setShowIdeas((value) => !value)}
                className={`rounded border px-2 py-1 transition-colors ${showIdeas ? 'border-[#F5A623] text-[#F5A623]' : 'border-[#2c2c2c] text-[#888]'}`}
              >
                ideas
              </button>
              <span className="rounded border border-[#2c2c2c] px-2 py-1 text-[#888]">{zoomLevel}</span>
            </div>

            <svg
              ref={minimapRef}
              viewBox={`0 0 ${WORLD_WIDTH} ${WORLD_HEIGHT}`}
              className="absolute bottom-20 right-4 z-30 h-36 w-56 cursor-pointer rounded-xl border border-[#2b2b2b] bg-[#111111]/85"
              onClick={(event) => {
                const bounds = minimapRef.current?.getBoundingClientRect()
                if (!bounds) return

                const x = ((event.clientX - bounds.left) / bounds.width) * WORLD_WIDTH
                const y = ((event.clientY - bounds.top) / bounds.height) * WORLD_HEIGHT

                setPan({
                  x: viewportSize.width / 2 - x * zoom,
                  y: viewportSize.height / 2 - y * zoom,
                })
              }}
            >
              {graph.nodes
                .filter((node) => node.kind === 'project')
                .map((node) => (
                  <circle key={node.id} cx={node.x} cy={node.y} r={16} fill={node.color} fillOpacity={0.86} />
                ))}
              <rect
                x={viewportWorld.x}
                y={viewportWorld.y}
                width={viewportWorld.width}
                height={viewportWorld.height}
                fill="none"
                stroke="rgba(255,255,255,0.9)"
                strokeWidth={8}
              />
            </svg>

            <div className={`pointer-events-none absolute inset-0 z-20 transition-opacity ${zoomLevel === 'detail' && selectedTask ? 'opacity-100' : 'opacity-0'}`}>
              <div className="absolute inset-0 bg-black/35" />
            </div>

            <div
              className={`absolute inset-x-0 bottom-20 z-40 mx-auto w-full max-w-4xl px-4 transition-all duration-300 ${zoomLevel === 'detail' && selectedTask ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-full opacity-0'}`}
            >
              {selectedTask ? (
                <article className="rounded-3xl border border-[#2b2b2b] bg-[#141414] p-6 text-[#E0E0E0] shadow-2xl">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] [font-family:var(--font-editorial)] text-[#888]">Task detail</p>
                      <h2 className="mt-2 text-4xl leading-tight [font-family:var(--font-display)]">{selectedTask.title}</h2>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedTaskNodeId(null)
                        setTargetZoom(1.2)
                      }}
                      className="rounded-full border border-[#2c2c2c] p-2 text-[#aaa] transition-colors hover:border-[#F5A623] hover:text-[#F5A623]"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <p className="mt-3 max-w-3xl text-sm text-[#aaaaaa]">{selectedTask.description || 'No description yet.'}</p>

                  <div className="mt-4 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.12em] [font-family:var(--font-data)] text-[#9ca3af]">
                    <span className="rounded-full border border-[#2c2c2c] px-3 py-1">
                      {getProjectById(data, selectedTask.project_id)?.name ?? 'Unassigned'}
                    </span>
                    <span className="rounded-full border border-[#2c2c2c] px-3 py-1">{selectedTask.priority}</span>
                    <span className="rounded-full border border-[#2c2c2c] px-3 py-1">{selectedTask.status}</span>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2 text-sm">
                    <button onClick={() => moveTask(selectedTask.id, 'in_progress')} className="rounded-full border border-[#2c2c2c] px-4 py-2 transition-colors hover:border-[#F5A623]">
                      Start
                    </button>
                    <button onClick={() => moveTask(selectedTask.id, 'done')} className="rounded-full border border-[#2c2c2c] px-4 py-2 transition-colors hover:border-[#F5A623]">
                      Done
                    </button>
                    <button onClick={() => moveTask(selectedTask.id, 'blocked')} className="rounded-full border border-[#2c2c2c] px-4 py-2 transition-colors hover:border-[#F5A623]">
                      Block
                    </button>
                  </div>

                  <div className="mt-5">
                    <p className="text-xs uppercase tracking-[0.16em] [font-family:var(--font-editorial)] text-[#888]">Related tasks</p>
                    <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                      {data.tasks
                        .filter((task) => task.project_id === selectedTask.project_id && task.id !== selectedTask.id && task.status !== 'done')
                        .slice(0, 6)
                        .map((task) => (
                          <button
                            key={task.id}
                            onClick={() => {
                              const next = graph.nodes.find((node) => node.kind === 'task' && node.entityId === task.id)
                              if (next) {
                                setSelectedTaskNodeId(next.id)
                              }
                            }}
                            className="rounded-full border border-[#2c2c2c] px-3 py-1 text-xs transition-colors hover:border-[#F5A623]"
                          >
                            {task.title.length > 28 ? `${task.title.slice(0, 28)}…` : task.title}
                          </button>
                        ))}
                    </div>
                  </div>
                </article>
              ) : null}
            </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      <StatusBar mode={mode} stats={statusStats} momentum={momentum.score} clock={clock} />

      <FloatingDock
        mode={mode}
        onModeChange={setMode}
        onPaletteOpen={() => setPaletteOpen(true)}
        suggestion={mode === 'focus' ? 'Tip: Tab to orbit for dependency scan' : 'Tip: Tab to return and execute'}
      />

      {inputOverlay ? (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/45 px-4" onClick={() => setInputOverlay(null)}>
          <form
            onClick={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault()
              submitInputOverlay()
            }}
            className={`w-full max-w-lg rounded-2xl border p-4 shadow-2xl ${mode === 'focus' ? 'border-[rgba(42,31,26,0.2)] bg-[#fffaf3] text-[#2A1F1A]' : 'border-[#2b2b2b] bg-[#141414] text-[#E0E0E0]'}`}
          >
            <p className="text-xs uppercase tracking-[0.16em] [font-family:var(--font-editorial)] opacity-70">{inputOverlay.title}</p>
            <input
              autoFocus
              value={inputOverlay.value}
              onChange={(event) => setInputOverlay((current) => (current ? { ...current, value: event.target.value } : null))}
              placeholder={inputOverlay.placeholder}
              className={`mt-3 w-full rounded-xl border px-4 py-3 text-sm outline-none ${mode === 'focus' ? 'border-[rgba(42,31,26,0.2)] bg-white/85' : 'border-[#2b2b2b] bg-black/30'}`}
            />
            <div className="mt-3 flex items-center justify-end gap-2 text-xs uppercase tracking-[0.12em]">
              <button type="button" onClick={() => setInputOverlay(null)} className="rounded-full border border-current/30 px-3 py-1.5 opacity-75">
                cancel
              </button>
              <button type="submit" className="rounded-full border border-[#F5A623] px-3 py-1.5 text-[#F5A623]">
                create
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {showShortcuts ? (
        <div className="fixed right-4 top-4 z-[125] w-80 rounded-2xl border border-black/20 bg-black/85 p-4 text-xs text-white shadow-2xl">
          <p className="mb-2 text-sm [font-family:var(--font-editorial)] text-[#F5A623]">Keyboard</p>
          <ul className="space-y-1 text-white/80">
            <li>Cmd/Ctrl + K: command palette</li>
            <li>Tab: switch Focus / Orbit</li>
            <li>?: toggle this overlay</li>
            <li>Space (Focus): timer play/pause</li>
            <li>Enter (Focus): start primary task</li>
            <li>D (Focus): mark primary task done</li>
            <li>B (Focus): mark primary task blocked</li>
            <li>J (Focus): promote next task</li>
            <li>Escape (Orbit detail): close detail card</li>
          </ul>
        </div>
      ) : null}
    </div>
  )
}

function StatusBar({
  mode,
  stats,
  momentum,
  clock,
}: {
  mode: CommandMode
  stats: { active: number; blocked: number; urgent: number; ideas: number; unread: number }
  momentum: number
  clock: Date
}) {
  return (
    <footer
      className={`absolute inset-x-0 bottom-0 z-50 flex h-8 items-center justify-between border-t px-4 text-[10px] uppercase tracking-[0.14em] [font-family:var(--font-data)] ${mode === 'focus' ? 'border-[rgba(42,31,26,0.18)] bg-[rgba(42,31,26,0.08)] text-[rgba(42,31,26,0.82)]' : 'border-[#222] bg-[#111111] text-[#9e9e9e]'}`}
    >
      <p>
        Active {stats.active} | Blocked {stats.blocked} | Urgent {stats.urgent} | Ideas {stats.ideas} | Unread {stats.unread} | Momentum {momentum}
      </p>
      <p>{clock.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
    </footer>
  )
}

function FloatingDock({
  mode,
  onModeChange,
  onPaletteOpen,
  suggestion,
}: {
  mode: CommandMode
  onModeChange: (mode: CommandMode) => void
  onPaletteOpen: () => void
  suggestion: string
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-9 z-50 flex flex-col items-center gap-2">
      <p className="rounded-full border border-[rgba(245,166,35,0.35)] bg-black/40 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-[#f7cc83] [font-family:var(--font-data)]">
        {suggestion}
      </p>
      <div className="pointer-events-auto inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/55 p-1 backdrop-blur">
        <button
          onClick={() => onModeChange('focus')}
          className={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.14em] transition-colors ${mode === 'focus' ? 'text-[#F5A623]' : 'text-white/60'}`}
        >
          FOCUS
        </button>
        <button
          onClick={() => onModeChange('orbit')}
          className={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.14em] transition-colors ${mode === 'orbit' ? 'text-[#F5A623]' : 'text-white/60'}`}
        >
          ORBIT
        </button>
        <button
          onClick={onPaletteOpen}
          className="inline-flex items-center gap-1 rounded-full border border-white/15 px-3 py-2 text-xs uppercase tracking-[0.14em] text-white/75 transition-colors hover:border-[#F5A623] hover:text-[#F5A623]"
        >
          <Command className="h-3.5 w-3.5" />
          K
        </button>
      </div>
    </div>
  )
}
