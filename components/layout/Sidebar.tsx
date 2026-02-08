'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  KanbanSquare,
  FolderOpen,
  Lightbulb,
  BookOpen,
  Activity,
  Zap
} from 'lucide-react'

const navigation = [
  { name: 'Overview', href: '/', icon: LayoutDashboard },
  { name: 'V2 Dashboard', href: '/v2', icon: Zap },
  { name: 'Kanban', href: '/kanban', icon: KanbanSquare },
  { name: 'Projects', href: '/projects', icon: FolderOpen },
  { name: 'Ideas', href: '/ideas', icon: Lightbulb },
  { name: 'Reading', href: '/reading', icon: BookOpen },
  { name: 'Activity', href: '/activity', icon: Activity },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col bg-gray-50 border-r border-gray-200">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-900">Co-Working</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-sm font-medium text-white">
            D
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">David</p>
            <p className="text-xs text-gray-500">david@example.com</p>
          </div>
        </div>
      </div>
    </div>
  )
}
