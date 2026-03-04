'use client'

import { useMemo } from 'react'
import { Bot, Clock3, Play, Timer } from 'lucide-react'
import { useWorkspace } from '@/components/providers/WorkspaceProvider'
import { formatDateTime } from '@/lib/utils'

const SCHEDULE_HOURS = [7, 12, 15, 17, 20]
const AGENT_TZ = 'Europe/Vienna'

function getViennaParts(date: Date): { year: number; month: number; day: number; hour: number; minute: number } {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: AGENT_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  const parts = formatter.formatToParts(date)
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? '0')

  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
  }
}

function nextRunLabel(now: Date): string {
  const parts = getViennaParts(now)
  const currentMinutes = parts.hour * 60 + parts.minute

  for (const hour of SCHEDULE_HOURS) {
    if (hour * 60 > currentMinutes) {
      return `${hour.toString().padStart(2, '0')}:00 ${AGENT_TZ}`
    }
  }

  return `${SCHEDULE_HOURS[0].toString().padStart(2, '0')}:00 ${AGENT_TZ} (tomorrow)`
}

export default function AgentLogPage() {
  const { data, runAgentSweep } = useWorkspace()

  const runs = useMemo(() => data.agentRuns.filter((run) => run.board === 'a'), [data.agentRuns])
  const pendingInbox = data.inbox.filter((item) => item.board === 'a' && item.status === 'new').length
  const backlogCount = data.tasks.filter((task) => task.status === 'backlog').length

  const runTypeCount = useMemo(() => {
    return {
      manual: runs.filter((run) => run.run_type === 'manual').length,
      scheduled: runs.filter((run) => run.run_type === 'scheduled').length,
    }
  }, [runs])

  return (
    <div className="space-y-6 variant-page">
      <section className="rounded-2xl border border-[#E8E2D8] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#1C1714] sm:text-2xl">Agent Log</h1>
            <p className="mt-1 text-sm text-[#7A6F65]">
              Transparent run history for Board A. Scheduled sweeps check inbox and move items into backlog.
            </p>
          </div>
          <button
            onClick={() => runAgentSweep({ board: 'a', run_type: 'manual' })}
            className="inline-flex items-center gap-2 rounded-xl bg-[#C8620A] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#A04D06]"
          >
            <Play className="h-4 w-4" />
            Run Sweep Now
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <Metric label="Pending Inbox" value={pendingInbox} />
          <Metric label="Backlog" value={backlogCount} />
          <Metric label="Scheduled Runs" value={runTypeCount.scheduled} />
          <Metric label="Manual Runs" value={runTypeCount.manual} />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-2xl border border-[#E8E2D8] bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-base font-semibold text-[#1C1714]">Run Schedule (CET)</h2>
          <p className="mt-1 text-sm text-[#7A6F65]">Agent checks Board A inbox at fixed times.</p>

          <div className="mt-4 space-y-2">
            {SCHEDULE_HOURS.map((hour) => (
              <div key={hour} className="flex items-center justify-between rounded-lg border border-[#E8E2D8] bg-[#FAFAF9] px-3 py-2">
                <p className="text-sm font-medium text-[#1C1714]">{hour.toString().padStart(2, '0')}:00</p>
                <span className="text-xs text-[#7A6F65]">{AGENT_TZ}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-lg border border-[#E8E2D8] bg-white px-3 py-2 text-sm text-[#1C1714]">
            <p className="inline-flex items-center gap-1.5 font-medium">
              <Clock3 className="h-4 w-4 text-[#C8620A]" />
              Next scheduled run
            </p>
            <p className="mt-1 text-xs text-[#7A6F65]">{nextRunLabel(new Date())}</p>
          </div>
        </article>

        <article className="rounded-2xl border border-[#E8E2D8] bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#1C1714]">Recent Runs</h2>
            <span className="rounded-full bg-[#F5F4F2] px-2.5 py-1 text-xs font-semibold text-[#7A6F65]">{runs.length}</span>
          </div>

          {runs.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#E8E2D8] bg-[#FAFAF9] px-3 py-8 text-center">
              <Bot className="mx-auto h-5 w-5 text-[#7A6F65]" />
              <p className="mt-2 text-sm text-[#7A6F65]">No runs yet.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {runs.slice(0, 20).map((run) => (
                <li key={run.id} className="rounded-xl border border-[#E8E2D8] bg-[#FAFAF9] p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#7A6F65]">
                      {run.run_type}
                    </span>
                    {run.scheduled_for ? (
                      <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-[#7A6F65]">
                        {run.scheduled_for}
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-2 text-sm font-medium text-[#1C1714]">{run.summary}</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-[#7A6F65]">
                    <Timer className="h-3.5 w-3.5" />
                    {formatDateTime(run.timestamp)}
                  </p>

                  {run.actions.length > 0 ? (
                    <ul className="mt-2 space-y-1">
                      {run.actions.slice(0, 3).map((action) => (
                        <li key={action} className="text-xs text-[#7A6F65]">
                          • {action}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[#E8E2D8] bg-[#FAFAF9] px-3 py-3">
      <p className="text-xs uppercase tracking-[0.14em] text-[#7A6F65]">{label}</p>
      <p className="mt-1 text-xl font-semibold text-[#1C1714]">{value}</p>
    </div>
  )
}
