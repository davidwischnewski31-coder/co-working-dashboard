'use client'

import { useState, useEffect } from 'react'
import { IdeaCard } from '@/components/ideas/IdeaCard'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import type { Idea } from '@/lib/validations'

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetchIdeas()
  }, [])

  async function fetchIdeas() {
    try {
      const response = await fetch('/api/ideas')
      const data = await response.json()
      setIdeas(data)
    } catch (error) {
      console.error('Failed to fetch ideas:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function createIdea() {
    try {
      const response = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'New Idea',
          owner: 'David',
          owner_type: 'human',
          status: 'brainstorm',
        }),
      })
      await fetchIdeas()
    } catch (error) {
      console.error('Failed to create idea:', error)
    }
  }

  const filteredIdeas = filter === 'all' 
    ? ideas 
    : ideas.filter(idea => idea.status === filter)

  const statusCounts = {
    brainstorm: ideas.filter(i => i.status === 'brainstorm').length,
    research: ideas.filter(i => i.status === 'research').length,
    in_progress: ideas.filter(i => i.status === 'in_progress').length,
    shipped: ideas.filter(i => i.status === 'shipped').length,
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Loading ideas...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Ideas</h2>
          <p className="text-sm text-gray-500 mt-1">
            {ideas.length} total ideas
          </p>
        </div>
        <Button onClick={createIdea}>
          <Plus className="h-4 w-4 mr-2" />
          New Idea
        </Button>
      </div>

      {/* Status filters */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-gray-900 text-white'
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          All ({ideas.length})
        </button>
        <button
          onClick={() => setFilter('brainstorm')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filter === 'brainstorm'
              ? 'bg-gray-900 text-white'
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          Brainstorm ({statusCounts.brainstorm})
        </button>
        <button
          onClick={() => setFilter('research')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filter === 'research'
              ? 'bg-gray-900 text-white'
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          Research ({statusCounts.research})
        </button>
        <button
          onClick={() => setFilter('in_progress')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filter === 'in_progress'
              ? 'bg-gray-900 text-white'
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          In Progress ({statusCounts.in_progress})
        </button>
        <button
          onClick={() => setFilter('shipped')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filter === 'shipped'
              ? 'bg-gray-900 text-white'
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          Shipped ({statusCounts.shipped})
        </button>
      </div>

      {/* Ideas grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredIdeas.map((idea) => (
          <IdeaCard key={idea.id} idea={idea} />
        ))}
      </div>

      {filteredIdeas.length === 0 && (
        <div className="flex items-center justify-center py-12 text-gray-500">
          No ideas in this status
        </div>
      )}
    </div>
  )
}
