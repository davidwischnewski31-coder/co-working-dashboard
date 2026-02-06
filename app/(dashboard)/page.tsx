import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { KanbanSquare, FolderOpen, Lightbulb, BookOpen } from 'lucide-react'

export default function OverviewPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Tasks"
          value="12"
          description="3 in progress"
          icon={KanbanSquare}
          href="/kanban"
        />
        <StatCard
          title="Projects"
          value="17"
          description="Synced from davidai"
          icon={FolderOpen}
          href="/projects"
        />
        <StatCard
          title="Ideas"
          value="8"
          description="2 in research"
          icon={Lightbulb}
          href="/ideas"
        />
        <StatCard
          title="Articles"
          value="23"
          description="15 unread"
          icon={BookOpen}
          href="/reading"
        />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <p className="text-gray-500 text-sm">Activity log will appear here</p>
      </div>
    </div>
  )
}

function StatCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  href 
}: { 
  title: string
  value: string
  description: string
  icon: any
  href: string
}) {
  return (
    <Link href={href}>
      <div className="rounded-lg border border-gray-200 bg-white p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <Icon className="h-5 w-5 text-gray-400" />
        </div>
        <div className="space-y-1">
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
    </Link>
  )
}
