'use client'

import { ArrowRight, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  getDashboardTheme,
  getDashboardVariant,
  getVariantJourney,
  type DashboardPage,
} from '@/lib/dashboardVariant'

export function JourneyPanel({
  page,
  className,
}: {
  page: DashboardPage
  className?: string
}) {
  const variant = getDashboardVariant()
  if (variant === 'middle') {
    return null
  }

  const theme = getDashboardTheme(variant)
  const journey = getVariantJourney(page, variant)

  return (
    <section className={cn('variant-panel rounded-3xl p-6 sm:p-7', className)}>
      <p className="variant-pill inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]">
        <Sparkles className="h-3.5 w-3.5" />
        {theme.shortName}
      </p>
      <h1 className="mt-3 text-2xl font-semibold leading-tight sm:text-3xl">{journey.title}</h1>
      <p className="mt-3 max-w-4xl text-sm text-slate-600 sm:text-base">{journey.summary}</p>

      <div className="variant-flow mt-4 grid gap-2 sm:grid-cols-3">
        {journey.flow.map((step) => (
          <div
            key={step}
            className="variant-flow-step rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em]"
          >
            {step}
          </div>
        ))}
      </div>

      <p className="mt-4 inline-flex items-center gap-2 text-sm text-slate-700">
        <ArrowRight className="h-4 w-4" />
        <span className="font-semibold">Experimental edge:</span> {journey.experimental}
      </p>
    </section>
  )
}
