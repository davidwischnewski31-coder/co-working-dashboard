'use client'

import { ArrowRight } from 'lucide-react'

export function MorningBrief({
  title,
  dateLabel,
  sentence,
  stats,
  actionLabel,
  onAction,
  className = '',
}: {
  title: string
  dateLabel: string
  sentence: string
  stats: Array<{ label: string; value: number }>
  actionLabel?: string
  onAction?: () => void
  className?: string
}) {
  return (
    <section className={`rounded-3xl px-6 py-7 sm:px-8 sm:py-9 ${className}`}>
      <p className="text-xs uppercase tracking-[0.18em] opacity-70">{dateLabel}</p>
      <h1 className="mt-2 text-3xl font-semibold leading-tight sm:text-4xl">{title}</h1>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {stats.map((stat) => (
          <span
            key={stat.label}
            className="inline-flex items-center gap-2 rounded-full border border-current/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em]"
          >
            <span>{stat.value}</span>
            <span className="opacity-70">{stat.label}</span>
          </span>
        ))}
      </div>
      <p className="mt-4 max-w-3xl text-sm opacity-90 sm:text-base">{sentence}</p>
      {actionLabel && onAction ? (
        <button
          onClick={onAction}
          className="mt-5 inline-flex items-center gap-2 rounded-full border border-current/25 px-4 py-2 text-sm font-semibold"
        >
          {actionLabel}
          <ArrowRight className="h-4 w-4" />
        </button>
      ) : null}
    </section>
  )
}
