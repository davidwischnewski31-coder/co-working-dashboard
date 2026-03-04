import { WorkspaceProvider } from '@/components/providers/WorkspaceProvider'
import { VariantDashboardRoot } from '@/components/variants/VariantDashboardRoot'

export default function HomePage() {
  return (
    <WorkspaceProvider>
      <VariantDashboardRoot />
    </WorkspaceProvider>
  )
}
