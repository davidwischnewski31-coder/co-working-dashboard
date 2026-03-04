'use client'

import type { WorkspaceData } from '@/lib/workspace'
import { calculateMomentumScore } from '@/components/variants/shared/variantData'

export function MomentumScore({ data }: { data: WorkspaceData }) {
  const { score, delta } = calculateMomentumScore(data)

  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-[0.16em] opacity-70">Momentum Score</p>
      <div className="flex items-end gap-2">
        <span className="text-5xl font-semibold leading-none tabular-nums">{score}</span>
        <span className="pb-1 text-sm opacity-70">/ 100</span>
      </div>
      <p className="text-sm opacity-80">
        {delta >= 0 ? 'Up' : 'Down'} {Math.abs(delta)} vs last week
      </p>
    </div>
  )
}
