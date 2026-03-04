'use client'

import Link from 'next/link'
import {
  ArrowRight,
  ChartNoAxesCombined,
  Crosshair,
  GitBranchPlus,
  Orbit,
  Sparkles,
} from 'lucide-react'

const concepts = [
  {
    href: '/experiments/mission-control',
    title: 'Version 1: Mission Control',
    summary: 'High-pressure ops cockpit with launch queues, blocker drills, and command log.',
    journey: 'Triage -> launch critical mission -> clear blockers -> close day',
    coverage: 'Tasks, projects, ideas, reading, activity',
    icon: Crosshair,
    tone: 'from-[#0f172a] via-[#1e293b] to-[#164e63] text-slate-100',
  },
  {
    href: '/experiments/focus-sprint',
    title: 'Version 2: Focus Sprint Studio',
    summary: 'Sprint ritual with timer, momentum board, friction capture, and recovery feed.',
    journey: 'Pick one mission -> sprint -> debrief -> queue next action',
    coverage: 'Tasks, projects, ideas, reading, activity',
    icon: Sparkles,
    tone: 'from-[#fff5db] via-[#ffe7c2] to-[#ffd1b8] text-slate-900',
  },
  {
    href: '/experiments/story-engine',
    title: 'Version 3: Story Engine',
    summary: 'Narrative operating system from market signal to thesis to shipped proof.',
    journey: 'Distill signals -> forge thesis -> run scenes -> publish proof',
    coverage: 'Tasks, projects, ideas, reading, activity',
    icon: GitBranchPlus,
    tone: 'from-[#f5f3ff] via-[#ede9fe] to-[#dbeafe] text-slate-900',
  },
  {
    href: '/experiments/orbit-map',
    title: 'Version 4: Orbit Map',
    summary: 'Spatial workspace that maps project gravity, dependencies, and pulse events.',
    journey: 'Scan orbit -> inspect node -> bridge gaps -> stabilize flow',
    coverage: 'Tasks, projects, ideas, reading, activity',
    icon: Orbit,
    tone: 'from-[#ecfeff] via-[#cffafe] to-[#d9f99d] text-slate-900',
  },
  {
    href: '/experiments/betting-desk',
    title: 'Version 5: Betting Desk',
    summary: 'Portfolio desk that prices tasks and projects, then commits execution capital.',
    journey: 'Price bets -> compare upside -> commit top plays -> review tape',
    coverage: 'Tasks, projects, ideas, reading, activity',
    icon: ChartNoAxesCombined,
    tone: 'from-[#fff1f2] via-[#ffe4e6] to-[#fef3c7] text-slate-900',
  },
]

export default function ExperimentsHubPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-[#e5d9c3] bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-700">UX Lab</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl">
          Five full-dashboard versions, each with a different operating model.
        </h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-600 sm:text-base">
          These are complete prototypes, not isolated widgets. Each version gives you a different workflow for decisions, execution,
          and review using the same underlying workspace data.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {concepts.map((concept) => (
          <Link
            key={concept.href}
            href={concept.href}
            className={`group rounded-2xl border border-transparent bg-gradient-to-br p-[1px] shadow-sm transition hover:shadow-lg ${concept.tone}`}
          >
            <article className="h-full rounded-2xl bg-black/5 p-5 backdrop-blur-sm">
              <div className="mb-4 inline-flex rounded-lg border border-white/30 p-2">
                <concept.icon className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold">{concept.title}</h2>
              <p className="mt-2 text-sm opacity-90">{concept.summary}</p>
              <p className="mt-4 rounded-lg bg-white/30 px-3 py-2 text-xs font-medium">
                Journey: {concept.journey}
              </p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.1em] opacity-85">
                Full-surface coverage: {concept.coverage}
              </p>
              <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold">
                Open version
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </div>
            </article>
          </Link>
        ))}
      </section>
    </div>
  )
}
