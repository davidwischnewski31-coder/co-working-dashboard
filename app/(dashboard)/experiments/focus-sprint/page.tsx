'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlarmClockCheck, Flame, Pause, Play, Plus, RotateCcw } from 'lucide-react'
import { useWorkspace } from '@/components/providers/WorkspaceProvider'
import { formatDateTime } from '@/lib/utils'
import type { IdeaStatus } from '@/lib/workspace'

const sprintOptions = [20, 45, 75]

const nextIdeaStatus: Record<IdeaStatus, IdeaStatus> = {
  brainstorm: 'research',
  research: 'in_progress',
  in_progress: 'shipped',
  shipped: 'shipped',
  archived: 'archived',
}

function formatDuration(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export default function FocusSprintPage() {
  const { data, createTask, moveTask, updateArticleStatus, updateIdeaStatus } = useWorkspace()
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [selectedDuration, setSelectedDuration] = useState(45)
  const [secondsRemaining, setSecondsRemaining] = useState(0)
  const [running, setRunning] = useState(false)
  const [sessionNote, setSessionNote] = useState('')

  const activeTasks = data.tasks.filter((task) => task.status !== 'done')
  const selectedTask = activeTasks.find((task) => task.id === selectedTaskId) ?? activeTasks[0] ?? null

  const ideaParkingLot = data.ideas.filter((idea) => idea.status !== 'shipped').slice(0, 6)
  const readingQueue = data.articles.filter((article) => article.status === 'unread' || article.status === 'reading').slice(0, 6)
  const timeline = data.activities.slice(0, 8)

  const projectMomentum = useMemo(() => {
    return data.projects.map((project) => {
      const tasks = data.tasks.filter((task) => task.project_id === project.id)
      const doneCount = tasks.filter((task) => task.status === 'done').length
      const activeCount = tasks.filter((task) => task.status !== 'done').length
      const progress = tasks.length === 0 ? 0 : Math.round((doneCount / tasks.length) * 100)

      return {
        project,
        activeCount,
        doneCount,
        progress,
      }
    })
  }, [data.projects, data.tasks])

  useEffect(() => {
    if (!running || secondsRemaining <= 0) {
      return
    }

    const interval = window.setInterval(() => {
      setSecondsRemaining((current) => {
        if (current <= 1) {
          setRunning(false)
          return 0
        }

        return current - 1
      })
    }, 1000)

    return () => window.clearInterval(interval)
  }, [running, secondsRemaining])

  const completedByHuman = data.tasks.filter((task) => task.status === 'done' && task.owner_type === 'human').length
  const focusScore = completedByHuman * 3 + (sessionNote.trim() ? 2 : 0) + (running ? 2 : 0)

  function startSprint(minutes: number) {
    setSelectedDuration(minutes)
    setSecondsRemaining(minutes * 60)
    setRunning(true)
  }

  function toggleRunState() {
    if (secondsRemaining === 0) {
      setSecondsRemaining(selectedDuration * 60)
    }

    setRunning((current) => !current)
  }

  function resetSprint() {
    setRunning(false)
    setSecondsRemaining(0)
  }

  function completeFocusedTask() {
    if (!selectedTask) {
      return
    }

    moveTask(selectedTask.id, 'done')
    setRunning(false)
    setSecondsRemaining(0)
  }

  function captureFriction() {
    const note = sessionNote.trim()
    if (!note) {
      return
    }

    createTask({
      title: `Unblock: ${note.slice(0, 70)}`,
      description: 'Captured from Focus Sprint debrief.',
      priority: 'high',
      owner_type: 'human',
      tags: ['focus-friction'],
    })
    setSessionNote('')
  }

  return (
    <div className="space-y-6 rounded-3xl bg-gradient-to-br from-[#fff5db] via-[#ffe9c7] to-[#ffd4be] p-4 sm:p-6 lg:p-8">
      <section className="rounded-2xl border border-amber-300/60 bg-white/70 p-6 backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">Version 2</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Focus Sprint Studio</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-700">
          Full execution environment built around sprints. Pick one mission, run hard focus blocks, then roll outcomes back into the
          wider system.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Focus Score" value={String(focusScore)} note="Ritual health" />
        <MetricCard label="Active Tasks" value={String(activeTasks.length)} note="Immediate queue" />
        <MetricCard label="Open Ideas" value={String(ideaParkingLot.length)} note="Parking lot" />
        <MetricCard label="Unread Intel" value={String(readingQueue.filter((item) => item.status === 'unread').length)} note="Recovery reading" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_1fr]">
        <article className="rounded-2xl border border-amber-300/60 bg-white/80 p-5">
          <h2 className="text-lg font-semibold text-slate-900">Sprint Console</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {sprintOptions.map((minutes) => (
              <button
                key={minutes}
                onClick={() => startSprint(minutes)}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                <Play className="h-4 w-4" />
                {minutes} min
              </button>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-amber-300/60 bg-gradient-to-r from-[#fff8e8] to-[#ffeddc] p-6 text-center">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Time Remaining</p>
            <p className="mt-2 text-5xl font-semibold text-slate-900">{formatDuration(secondsRemaining)}</p>
            <p className="mt-2 text-sm text-slate-600">{running ? 'Sprint live' : 'Ready to run'}</p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={toggleRunState}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
            >
              {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {running ? 'Pause' : 'Resume'}
            </button>
            <button
              onClick={resetSprint}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>
        </article>

        <article className="rounded-2xl border border-amber-300/60 bg-white/80 p-5">
          <h2 className="text-lg font-semibold text-slate-900">Focus Target</h2>
          <p className="mt-1 text-sm text-slate-600">Choose one task and protect it from context switching.</p>

          <select
            value={selectedTask?.id ?? ''}
            onChange={(event) => setSelectedTaskId(event.target.value)}
            className="mt-3 w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-slate-700"
          >
            {activeTasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.title}
              </option>
            ))}
          </select>

          {selectedTask ? (
            <div className="mt-4 rounded-xl bg-[#fff9ec] p-4">
              <p className="text-sm font-semibold text-slate-900">{selectedTask.title}</p>
              <p className="mt-1 text-xs text-slate-600">{selectedTask.description ?? 'No details.'}</p>
              <p className="mt-2 text-xs text-slate-500">Owner: {selectedTask.owner}</p>
            </div>
          ) : (
            <div className="mt-4 rounded-xl bg-[#fff9ec] p-4 text-sm text-slate-600">No active tasks available.</div>
          )}

          <button
            onClick={completeFocusedTask}
            disabled={!selectedTask}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            <AlarmClockCheck className="h-4 w-4" />
            Complete Focused Task
          </button>

          <div className="mt-4 space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Debrief Note</label>
            <textarea
              value={sessionNote}
              onChange={(event) => setSessionNote(event.target.value)}
              placeholder="What slowed or accelerated this sprint?"
              className="h-24 w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm text-slate-700"
            />
            <button
              onClick={captureFriction}
              className="inline-flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-800"
            >
              <Plus className="h-4 w-4" />
              Capture Friction as Task
            </button>
          </div>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-amber-300/60 bg-white/80 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-700">Project Momentum</h2>
          <ul className="mt-3 space-y-3">
            {projectMomentum.map(({ project, activeCount, doneCount, progress }) => (
              <li key={project.id} className="rounded-lg bg-[#fff8ea] p-3">
                <p className="text-sm font-semibold text-slate-900">{project.name}</p>
                <p className="mt-1 text-xs text-slate-600">
                  {activeCount} active • {doneCount} done
                </p>
                <div className="mt-2 h-2 rounded-full bg-amber-100">
                  <div className="h-2 rounded-full bg-amber-500" style={{ width: `${progress}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border border-amber-300/60 bg-white/80 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-700">Idea Parking Lot</h2>
          <ul className="mt-3 space-y-2">
            {ideaParkingLot.length === 0 ? (
              <li className="rounded-lg bg-[#fff8ea] px-3 py-3 text-xs text-slate-600">No parked ideas.</li>
            ) : null}
            {ideaParkingLot.map((idea) => (
              <li key={idea.id} className="rounded-lg bg-[#fff8ea] px-3 py-2">
                <p className="text-sm font-semibold text-slate-900">{idea.title}</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-600">{idea.status.replace('_', ' ')}</span>
                  <button
                    onClick={() => updateIdeaStatus(idea.id, nextIdeaStatus[idea.status])}
                    disabled={idea.status === 'shipped'}
                    className="rounded-md border border-amber-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 disabled:opacity-40"
                  >
                    Advance
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border border-amber-300/60 bg-white/80 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-700">Reading Recovery</h2>
          <ul className="mt-3 space-y-2">
            {readingQueue.length === 0 ? (
              <li className="rounded-lg bg-[#fff8ea] px-3 py-3 text-xs text-slate-600">No queued reading.</li>
            ) : null}
            {readingQueue.map((article) => (
              <li key={article.id} className="rounded-lg bg-[#fff8ea] px-3 py-2">
                <p className="line-clamp-2 text-sm font-semibold text-slate-900">{article.title}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    onClick={() => updateArticleStatus(article.id, 'reading')}
                    className="rounded-md border border-amber-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
                  >
                    Reading
                  </button>
                  <button
                    onClick={() => updateArticleStatus(article.id, 'read')}
                    className="rounded-md border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800"
                  >
                    Done
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="rounded-2xl border border-amber-300/60 bg-white/80 p-4">
        <h2 className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-slate-700">
          <Flame className="h-4 w-4 text-orange-600" />
          Session Timeline
        </h2>
        <ul className="mt-3 grid gap-2 md:grid-cols-2">
          {timeline.map((entry) => (
            <li key={entry.id} className="rounded-lg bg-[#fff8ea] px-3 py-2">
              <p className="text-xs font-medium text-slate-800">{entry.message}</p>
              <p className="mt-1 text-[11px] text-slate-500">{formatDateTime(entry.timestamp)}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function MetricCard({
  label,
  value,
  note,
}: {
  label: string
  value: string
  note: string
}) {
  return (
    <div className="rounded-2xl border border-amber-300/60 bg-white/80 p-4">
      <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{note}</p>
    </div>
  )
}
