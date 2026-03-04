'use client'

import Link from 'next/link'
import { ArrowRight, CheckCircle2, Clock3, Scale } from 'lucide-react'
import { useWorkspace } from '@/components/providers/WorkspaceProvider'
import { formatDateTime, formatDaysInStatus } from '@/lib/utils'

export default function DecisionsPage() {
  const { data } = useWorkspace()

  const pendingDecisions = data.inbox
    .filter((item) => item.board === 'a' && item.type === 'decision_needed' && item.status === 'new')
    .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())

  const processedDecisions = data.inbox
    .filter((item) => item.board === 'a' && item.type === 'decision_needed' && item.status === 'processed')
    .sort((left, right) => new Date(right.processed_at ?? right.created_at).getTime() - new Date(left.processed_at ?? left.created_at).getTime())

  const linksByDecisionId = new Map(
    processedDecisions.map((decision) => [
      decision.id,
      data.tasks.filter(
        (task) =>
          task.tags.includes('decision') &&
          Boolean(task.description?.includes(`Decision for: ${decision.title}`))
      ),
    ])
  )

  const linkedTaskCount = Array.from(linksByDecisionId.values()).reduce((total, tasks) => total + tasks.length, 0)

  return (
    <div className="space-y-6 variant-page">
      <section className="rounded-3xl border border-[#CBD4E1] bg-[#F8FBFF] p-6 shadow-sm sm:p-8">
        <p className="inline-flex items-center gap-2 rounded-full border border-[#CBD4E1] bg-white px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#506079]">
          <Scale className="h-3.5 w-3.5" />
          Board A - Decision Journal
        </p>
        <h1 className="mt-3 text-2xl font-semibold leading-tight text-[#1A2433] sm:text-3xl">
          Keep decision history visible after inbox processing.
        </h1>
        <p className="mt-2 text-sm text-[#5E6B82]">
          Processed decisions stay searchable with linked execution tasks.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Pending Decisions" value={pendingDecisions.length} icon={<Clock3 className="h-4 w-4" />} />
        <MetricCard label="Processed Decisions" value={processedDecisions.length} icon={<CheckCircle2 className="h-4 w-4" />} />
        <MetricCard label="Linked Tasks" value={linkedTaskCount} icon={<ArrowRight className="h-4 w-4" />} />
      </section>

      {pendingDecisions.length > 0 ? (
        <section className="rounded-2xl border border-[#E8E2D8] bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#1A2433]">Pending</h2>
            <Link href="/inbox" className="text-xs font-semibold text-[#2453A6] hover:underline">
              Open Inbox
            </Link>
          </div>
          <ul className="space-y-2">
            {pendingDecisions.slice(0, 8).map((item) => (
              <li key={item.id} className="rounded-lg border border-[#D7E0EB] bg-[#F8FBFF] px-3 py-2.5">
                <p className="text-sm font-semibold text-[#1A2433]">{item.title}</p>
                <p className="mt-1 text-xs text-[#5E6B82]">{item.body ?? 'No context provided.'}</p>
                <p className="mt-1 text-[11px] text-[#6A7892]">Captured {formatDateTime(item.created_at)}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-2xl border border-[#E8E2D8] bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#1A2433]">Processed</h2>
          <Link href="/kanban" className="text-xs font-semibold text-[#2453A6] hover:underline">
            Open Kanban
          </Link>
        </div>

        {processedDecisions.length === 0 ? (
          <p className="rounded-lg border border-dashed border-[#CBD4E1] bg-[#F8FBFF] px-3 py-4 text-sm text-[#6A7892]">
            No processed decision items yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {processedDecisions.map((item) => {
              const linked = linksByDecisionId.get(item.id) ?? []
              return (
                <li key={item.id} className="rounded-lg border border-[#D7E0EB] bg-[#F8FBFF] p-3">
                  <p className="text-sm font-semibold text-[#1A2433]">{item.title}</p>
                  {item.body ? <p className="mt-1 text-xs text-[#5E6B82]">{item.body}</p> : null}
                  <p className="mt-1 text-[11px] text-[#6A7892]">
                    Processed {item.processed_at ? formatDateTime(item.processed_at) : formatDateTime(item.created_at)}
                  </p>

                  {linked.length > 0 ? (
                    <div className="mt-2 rounded-md border border-[#CBD4E1] bg-white p-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6A7892]">Linked tasks</p>
                      <ul className="mt-1 space-y-1">
                        {linked.map((task) => (
                          <li key={task.id} className="text-xs text-[#415069]">
                            {task.title} · {task.status} · {formatDaysInStatus(task.updated_at)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="mt-2 text-[11px] text-[#6A7892]">No linked decision task found.</p>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}

function MetricCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#CBD4E1] bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-2 inline-flex rounded-lg bg-[#EEF3FA] p-2 text-[#415069]">{icon}</div>
      <p className="text-sm font-medium text-[#5E6B82]">{label}</p>
      <p className="mt-1 text-4xl font-semibold text-[#1A2433] font-[family-name:var(--font-dashboard-mono)] tabular-nums">{value}</p>
    </div>
  )
}
