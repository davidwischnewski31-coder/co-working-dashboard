'use client'

import { getDashboardVariant } from '@/lib/dashboardVariant'
import { BriefDashboard } from '@/components/variants/v1/BriefDashboard'
import { CockpitDashboard } from '@/components/variants/v2/CockpitDashboard'
import { StudioDashboard } from '@/components/variants/v3/StudioDashboard'
import { MapDashboard } from '@/components/variants/v4/MapDashboard'
import { PulseDashboard } from '@/components/variants/v5/PulseDashboard'
import { CommandDashboard } from '@/components/variants/v6/CommandDashboard'

export function VariantDashboardRoot() {
  const variant = getDashboardVariant()

  if (variant === 'v1') {
    return <BriefDashboard />
  }

  if (variant === 'v2') {
    return <CockpitDashboard />
  }

  if (variant === 'v3') {
    return <StudioDashboard />
  }

  if (variant === 'v4') {
    return <MapDashboard />
  }

  if (variant === 'v6') {
    return <CommandDashboard />
  }

  return <PulseDashboard />
}
