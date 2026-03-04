'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Minus, Plus, Search } from 'lucide-react'
import { useWorkspace } from '@/components/providers/WorkspaceProvider'
import { getProjectById, isRecent, isStale, isTaskOverdue } from '@/components/variants/shared/variantData'

const WORLD_WIDTH = 2200
const WORLD_HEIGHT = 1500

interface MapNode {
  id: string
  kind: 'project' | 'task' | 'idea'
  entityId: string
  projectId: string | null
  x: number
  y: number
  label: string
  color: string
  overdue?: boolean
  stale?: boolean
  recent?: boolean
}

interface MapEdge {
  id: string
  from: string
  to: string
  kind: 'blocking' | 'related'
}

type ZoomLevel = 'portfolio' | 'cluster' | 'task'

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function getZoomLevel(zoom: number): ZoomLevel {
  if (zoom < 0.6) return 'portfolio'
  if (zoom <= 1.2) return 'cluster'
  return 'task'
}

function nodeRadius(node: MapNode, zoomLevel: ZoomLevel): number {
  if (zoomLevel === 'portfolio') {
    if (node.kind === 'project') return 54
    return 0
  }

  if (zoomLevel === 'cluster') {
    if (node.kind === 'project') return 36
    if (node.kind === 'task') return 17
    return 10
  }

  if (node.kind === 'project') return 28
  if (node.kind === 'task') return 22
  return 12
}

function normalize(value: string | null | undefined): string {
  return (value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function findProjectIdForIdea(ideaTitle: string, ideaCategory: string, projectNames: Array<{ id: string; name: string }>): string | null {
  const normalizedCategory = normalize(ideaCategory)
  const normalizedTitle = normalize(ideaTitle)

  for (const project of projectNames) {
    const normalizedProject = normalize(project.name)
    if (!normalizedProject) continue

    const directCategoryMatch =
      normalizedCategory.length >= 4 &&
      (normalizedProject.includes(normalizedCategory) || normalizedCategory.includes(normalizedProject))
    const directTitleMatch =
      normalizedTitle.length >= 4 &&
      (normalizedTitle.includes(normalizedProject) || normalizedProject.includes(normalizedTitle))
    const tokenMatch = normalizedProject
      .split(' ')
      .filter((token) => token.length >= 4)
      .some((token) => normalizedCategory.includes(token) || normalizedTitle.includes(token))

    if (directCategoryMatch || directTitleMatch || tokenMatch) {
      return project.id
    }
  }

  return null
}

export function MapDashboard() {
  const { data, createTask, moveTask } = useWorkspace()

  const [zoom, setZoom] = useState(0.78)
  const [targetZoom, setTargetZoom] = useState(0.78)
  const [pan, setPan] = useState({ x: -340, y: -220 })
  const [showTasks, setShowTasks] = useState(true)
  const [showIdeas, setShowIdeas] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [dragAnchor, setDragAnchor] = useState<{ x: number; y: number } | null>(null)

  const viewportRef = useRef<HTMLDivElement | null>(null)
  const miniMapRef = useRef<SVGSVGElement | null>(null)

  useEffect(() => {
    if (Math.abs(targetZoom - zoom) < 0.001) {
      if (zoom !== targetZoom) {
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
        return current + delta * 0.2
      })
    }

    frame = window.requestAnimationFrame(animate)
    return () => window.cancelAnimationFrame(frame)
  }, [targetZoom, zoom])

  const graph = useMemo(() => {
    const projectNodes: MapNode[] = data.projects.map((project, index) => {
      const angle = (index / Math.max(1, data.projects.length)) * Math.PI * 2
      const radius = 420
      return {
        id: `node-project-${project.id}`,
        kind: 'project',
        entityId: project.id,
        projectId: project.id,
        x: WORLD_WIDTH / 2 + Math.cos(angle) * radius,
        y: WORLD_HEIGHT / 2 + Math.sin(angle) * radius,
        label: project.name,
        color: project.color,
        stale: isStale(project.updated_at),
        recent: isRecent(project.updated_at),
      }
    })

    const projectNodeById = new Map(projectNodes.map((node) => [node.projectId, node]))

    const taskNodes: MapNode[] = []

    for (const project of data.projects) {
      const clusterCenter = projectNodeById.get(project.id)
      if (!clusterCenter) {
        continue
      }

      const tasks = data.tasks.filter((task) => task.project_id === project.id)
      tasks.forEach((task, index) => {
        const angle = (index / Math.max(1, tasks.length)) * Math.PI * 2
        const radius = 120 + (task.status === 'blocked' ? 20 : 0)
        taskNodes.push({
          id: `node-task-${task.id}`,
          kind: 'task',
          entityId: task.id,
          projectId: project.id,
          x: clusterCenter.x + Math.cos(angle) * radius,
          y: clusterCenter.y + Math.sin(angle) * radius,
          label: task.title,
          color: project.color,
          overdue: isTaskOverdue(task),
          stale: isStale(task.updated_at),
          recent: isRecent(task.updated_at),
        })
      })
    }

    const ideaNodes: MapNode[] = data.ideas.map((idea, index) => {
      const linkedProjectId = findProjectIdForIdea(
        idea.title,
        idea.category,
        data.projects.map((project) => ({ id: project.id, name: project.name }))
      )
      const project = linkedProjectId ? data.projects.find((entry) => entry.id === linkedProjectId) : null
      const clusterCenter = linkedProjectId ? projectNodeById.get(linkedProjectId) : undefined
      const angle = ((index + 1) / Math.max(1, data.ideas.length + 1)) * Math.PI * 2
      const radius = linkedProjectId ? 180 : 120 + (index % 5) * 26

      return {
        id: `node-idea-${idea.id}`,
        kind: 'idea',
        entityId: idea.id,
        projectId: linkedProjectId,
        x: (clusterCenter?.x ?? WORLD_WIDTH / 2) + Math.cos(angle) * radius,
        y: (clusterCenter?.y ?? WORLD_HEIGHT / 2) + Math.sin(angle) * radius,
        label: idea.title,
        color: project?.color ?? '#9ca3af',
        stale: isStale(idea.updated_at),
        recent: isRecent(idea.updated_at),
      }
    })

    const edges: MapEdge[] = []

    // Project-level relationship edges.
    for (let index = 0; index < projectNodes.length; index += 1) {
      const current = projectNodes[index]
      const next = projectNodes[(index + 1) % projectNodes.length]
      if (!next) continue

      edges.push({
        id: `edge-project-${current.entityId}-${next.entityId}`,
        from: current.id,
        to: next.id,
        kind: 'related',
      })
    }

    // Blocking edges inside project clusters.
    for (const task of data.tasks.filter((item) => item.status === 'blocked' && item.project_id)) {
      const blockerNode = taskNodes.find((node) => node.entityId === task.id)
      const candidate = data.tasks.find(
        (item) => item.project_id === task.project_id && item.id !== task.id && item.status !== 'blocked'
      )
      const candidateNode = candidate ? taskNodes.find((node) => node.entityId === candidate.id) : null

      if (blockerNode && candidateNode) {
        edges.push({
          id: `edge-block-${task.id}-${candidateNode.entityId}`,
          from: blockerNode.id,
          to: candidateNode.id,
          kind: 'blocking',
        })
      }
    }

    return {
      nodes: [...projectNodes, ...taskNodes, ...ideaNodes],
      edges,
    }
  }, [data.ideas, data.projects, data.tasks])

  const zoomLevel = getZoomLevel(zoom)

  const nodeById = useMemo(() => new Map(graph.nodes.map((node) => [node.id, node])), [graph.nodes])
  const selectedNode = selectedNodeId ? nodeById.get(selectedNodeId) ?? null : null
  const selectedTaskNode = selectedNode?.kind === 'task' ? selectedNode : null
  const focusedProjectId = selectedTaskNode?.projectId ?? null

  const visibleNodes = useMemo(() => {
    const q = search.trim().toLowerCase()
    return graph.nodes.filter((node) => {
      if (!showTasks && node.kind === 'task') return false
      if (!showIdeas && node.kind === 'idea') return false
      if (zoomLevel === 'portfolio' && node.kind !== 'project') return false

      if (zoomLevel === 'task' && focusedProjectId) {
        if (node.id === selectedTaskNode?.id) return true
        if (node.projectId === focusedProjectId) return true
        if (node.kind === 'project' && node.entityId === focusedProjectId) return true
        return false
      }

      if (!q) return true
      return node.label.toLowerCase().includes(q)
    })
  }, [focusedProjectId, graph.nodes, search, selectedTaskNode?.id, showIdeas, showTasks, zoomLevel])

  const visibleSet = useMemo(() => new Set(visibleNodes.map((node) => node.id)), [visibleNodes])
  const visibleEdges = useMemo(
    () => graph.edges.filter((edge) => visibleSet.has(edge.from) && visibleSet.has(edge.to)),
    [graph.edges, visibleSet]
  )

  const linkedToHovered = useMemo(() => {
    if (!hoveredNodeId) {
      return new Set<string>()
    }

    const linked = new Set<string>([hoveredNodeId])
    for (const edge of visibleEdges) {
      if (edge.from === hoveredNodeId) linked.add(edge.to)
      if (edge.to === hoveredNodeId) linked.add(edge.from)
    }

    return linked
  }, [hoveredNodeId, visibleEdges])

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

  function toWorld(clientX: number, clientY: number) {
    const bounds = viewportRef.current?.getBoundingClientRect()
    if (!bounds) {
      return { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 }
    }

    return {
      x: (clientX - bounds.left - pan.x) / zoom,
      y: (clientY - bounds.top - pan.y) / zoom,
    }
  }

  function nearestProjectNode(worldX: number, worldY: number): MapNode | null {
    const projects = graph.nodes.filter((node) => node.kind === 'project')
    if (projects.length === 0) {
      return null
    }

    let closest: MapNode = projects[0]
    let bestDistance = Number.POSITIVE_INFINITY

    for (const node of projects) {
      const dx = node.x - worldX
      const dy = node.y - worldY
      const distance = dx * dx + dy * dy
      if (distance < bestDistance) {
        bestDistance = distance
        closest = node
      }
    }

    return closest
  }

  function centerOnNode(node: MapNode, nextZoom = targetZoom) {
    setPan({
      x: viewportSize.width / 2 - node.x * nextZoom,
      y: viewportSize.height / 2 - node.y * nextZoom,
    })
  }

  const selectedTask = selectedTaskNode ? data.tasks.find((task) => task.id === selectedTaskNode.entityId) ?? null : null
  const selectedTaskProject = selectedTask ? getProjectById(data, selectedTask.project_id) : null
  const taskDetailPosition = selectedTaskNode
    ? {
        left: clamp(pan.x + selectedTaskNode.x * zoom + 28, 16, Math.max(16, viewportSize.width - 360)),
        top: clamp(pan.y + selectedTaskNode.y * zoom - 96, 16, Math.max(16, viewportSize.height - 240)),
      }
    : null

  return (
    <div className="relative h-screen overflow-hidden bg-[#1c1c1e] text-[#f3f4f6]">
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
          const nextZoom = clamp(zoom * (event.deltaY < 0 ? 1.08 : 0.92), 0.45, 2.4)
          setTargetZoom(nextZoom)
        }}
        onDoubleClick={(event) => {
          const target = event.target as HTMLElement
          if (target.dataset.node === 'true') {
            return
          }

          const world = toWorld(event.clientX, event.clientY)
          const nearest = nearestProjectNode(world.x, world.y)

          createTask({
            title: `New map task ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
            project_id: nearest?.projectId ?? null,
            owner_type: 'human',
            priority: 'medium',
          })
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
            {visibleEdges.map((edge) => {
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
                  strokeWidth={edge.kind === 'blocking' ? 2.5 : 1.2}
                />
              )
            })}

            {visibleNodes
              .filter((node) => zoomLevel !== 'portfolio' || node.kind === 'project')
              .map((node) => {
                const active = selectedNodeId === node.id
                const shouldDim =
                  hoveredNodeId
                    ? !linkedToHovered.has(node.id)
                    : zoomLevel === 'task' && focusedProjectId
                      ? node.kind === 'project'
                        ? node.entityId !== focusedProjectId
                        : node.projectId !== focusedProjectId
                      : false
                const radius = nodeRadius(node, zoomLevel)

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    data-node="true"
                    onMouseEnter={() => setHoveredNodeId(node.id)}
                    onMouseLeave={() => setHoveredNodeId(null)}
                    onClick={(event) => {
                      event.stopPropagation()
                      setSelectedNodeId(node.id)

                      if (node.kind === 'task') {
                        const nextZoom = Math.max(targetZoom, 1.35)
                        setTargetZoom(nextZoom)
                        centerOnNode(node, nextZoom)
                        return
                      }

                      if (node.kind === 'project' && zoomLevel === 'portfolio') {
                        const nextZoom = 0.9
                        setTargetZoom(nextZoom)
                        centerOnNode(node, nextZoom)
                      }
                    }}
                    style={{
                      cursor: 'pointer',
                      opacity: shouldDim ? 0.2 : 1,
                    }}
                  >
                    <circle
                      r={radius}
                      fill={node.kind === 'project' ? node.color : `${node.color}CC`}
                      stroke={
                        node.overdue
                          ? '#f87171'
                          : active
                            ? '#ffffff'
                            : node.stale
                              ? 'rgba(255,255,255,0.24)'
                              : 'rgba(255,255,255,0.4)'
                      }
                      strokeWidth={active ? 3 : 1.2}
                      filter={node.recent ? 'drop-shadow(0 0 12px rgba(255,255,255,0.35))' : 'none'}
                    />
                    {zoom >= 0.62 ? (
                      <text
                        y={radius + 18}
                        textAnchor="middle"
                        fill="rgba(255,255,255,0.86)"
                        fontSize={zoomLevel === 'portfolio' ? 15 : node.kind === 'project' ? 13 : 11}
                        fontFamily="'Space Grotesk', ui-sans-serif, system-ui"
                      >
                        {node.label.length > 32 ? `${node.label.slice(0, 32)}…` : node.label}
                      </text>
                    ) : null}
                  </g>
                )
              })}
          </svg>
        </div>
      </div>

      <div className="absolute left-1/2 top-4 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/15 bg-black/35 px-3 py-2 backdrop-blur">
        <Search className="h-3.5 w-3.5 text-white/65" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search nodes"
          className="w-56 bg-transparent text-xs outline-none placeholder:text-white/50"
        />
      </div>

      <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/15 bg-black/35 px-3 py-2 text-xs uppercase tracking-[0.12em] backdrop-blur">
        <button onClick={() => setTargetZoom((value) => clamp(value + 0.12, 0.45, 2.4))} className="rounded border border-white/20 p-1">
          <Plus className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => setTargetZoom((value) => clamp(value - 0.12, 0.45, 2.4))} className="rounded border border-white/20 p-1">
          <Minus className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => setTargetZoom(0.78)} className="rounded border border-white/20 px-2 py-1">reset zoom</button>
        <span className="rounded border border-cyan-300/50 px-2 py-1 text-[10px] text-cyan-200">
          {zoomLevel}
        </span>
        <button onClick={() => setShowTasks((value) => !value)} className={`rounded border px-2 py-1 ${showTasks ? 'border-cyan-300/70 text-cyan-200' : 'border-white/20 text-white/70'}`}>
          tasks
        </button>
        <button onClick={() => setShowIdeas((value) => !value)} className={`rounded border px-2 py-1 ${showIdeas ? 'border-cyan-300/70 text-cyan-200' : 'border-white/20 text-white/70'}`}>
          ideas
        </button>
      </div>

      <svg
        ref={miniMapRef}
        viewBox={`0 0 ${WORLD_WIDTH} ${WORLD_HEIGHT}`}
        className="absolute bottom-4 right-4 z-20 h-36 w-56 cursor-pointer rounded-xl border border-white/20 bg-black/50"
        onClick={(event) => {
          const bounds = miniMapRef.current?.getBoundingClientRect()
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
            <circle key={node.id} cx={node.x} cy={node.y} r={18} fill={node.color} fillOpacity={0.8} />
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

      {selectedTaskNode && selectedTask && taskDetailPosition && zoomLevel === 'task' ? (
        <article
          className="absolute z-30 w-[340px] rounded-2xl border border-white/20 bg-black/60 p-4 text-sm backdrop-blur"
          style={{
            left: taskDetailPosition.left,
            top: taskDetailPosition.top,
          }}
        >
          <p className="text-xs uppercase tracking-[0.16em] text-white/60">Task Focus</p>
          <h3 className="mt-2 text-lg font-semibold">{selectedTask.title}</h3>
          <p className="mt-1 text-xs text-white/70">
            {selectedTaskProject?.name ?? 'Unassigned'} · {selectedTask.priority} · {selectedTask.status}
          </p>
          <p className="mt-3 text-xs text-white/80">{selectedTask.description || 'No description yet.'}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.12em]">
            <button onClick={() => moveTask(selectedTask.id, 'in_progress')} className="rounded-full border border-white/30 px-3 py-1">
              start
            </button>
            <button onClick={() => moveTask(selectedTask.id, 'blocked')} className="rounded-full border border-white/30 px-3 py-1">
              block
            </button>
            <button onClick={() => moveTask(selectedTask.id, 'done')} className="rounded-full border border-white/30 px-3 py-1">
              done
            </button>
          </div>
          <button
            onClick={() => setSelectedNodeId(null)}
            className="mt-4 text-xs uppercase tracking-[0.12em] text-white/65"
          >
            close
          </button>
        </article>
      ) : null}
    </div>
  )
}
