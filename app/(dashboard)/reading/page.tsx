'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, ExternalLink } from 'lucide-react'

interface ReadingList {
  id: string
  name: string
  description: string | null
  article_count: number
  unread_count: number
}

interface Article {
  id: string
  url: string
  title: string | null
  status: string
  added_at: string
}

export default function ReadingPage() {
  const [lists, setLists] = useState<ReadingList[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [selectedList, setSelectedList] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchLists()
  }, [])

  useEffect(() => {
    if (selectedList) {
      fetchArticles(selectedList)
    }
  }, [selectedList])

  async function fetchLists() {
    try {
      const response = await fetch('/api/reading-lists')
      const data = await response.json()
      setLists(data)
      if (data.length > 0 && !selectedList) {
        setSelectedList(data[0].id)
      }
    } catch (error) {
      console.error('Failed to fetch lists:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function fetchArticles(listId: string) {
    try {
      const response = await fetch(`/api/articles?reading_list_id=${listId}`)
      const data = await response.json()
      setArticles(data)
    } catch (error) {
      console.error('Failed to fetch articles:', error)
    }
  }

  async function createList() {
    try {
      await fetch('/api/reading-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'New Reading List',
        }),
      })
      await fetchLists()
    } catch (error) {
      console.error('Failed to create list:', error)
    }
  }

  async function addArticle() {
    if (!selectedList) return
    
    const url = prompt('Enter article URL:')
    if (!url) return

    try {
      await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reading_list_id: selectedList,
          url,
          title: new URL(url).hostname,
        }),
      })
      await fetchArticles(selectedList)
    } catch (error) {
      console.error('Failed to add article:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Loading reading lists...</p>
      </div>
    )
  }

  const currentList = lists.find(l => l.id === selectedList)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Reading Lists</h2>
          <p className="text-sm text-gray-500 mt-1">
            {lists.length} lists, {lists.reduce((sum, l) => sum + l.article_count, 0)} articles
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={createList}>
            <Plus className="h-4 w-4 mr-2" />
            New List
          </Button>
          <Button onClick={addArticle} disabled={!selectedList}>
            <Plus className="h-4 w-4 mr-2" />
            Add Article
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Lists sidebar */}
        <div className="col-span-3 space-y-2">
          {lists.map((list) => (
            <button
              key={list.id}
              onClick={() => setSelectedList(list.id)}
              className={`w-full text-left rounded-lg p-4 transition-colors ${
                selectedList === list.id
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <h3 className="font-medium">{list.name}</h3>
              <p className={`text-sm mt-1 ${selectedList === list.id ? 'text-gray-300' : 'text-gray-500'}`}>
                {list.article_count} articles ({list.unread_count} unread)
              </p>
            </button>
          ))}
        </div>

        {/* Articles */}
        <div className="col-span-9">
          {currentList && (
            <div className="rounded-lg border border-gray-200 bg-white">
              <div className="border-b border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900">{currentList.name}</h3>
                {currentList.description && (
                  <p className="text-sm text-gray-500 mt-1">{currentList.description}</p>
                )}
              </div>
              <div className="divide-y divide-gray-200">
                {articles.map((article) => (
                  <div key={article.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-gray-900 hover:text-blue-600 flex items-center gap-2"
                        >
                          {article.title || article.url}
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        <p className="text-sm text-gray-500 mt-1">{article.url}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${
                        article.status === 'read'
                          ? 'bg-green-100 text-green-800'
                          : article.status === 'reading'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {article.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {articles.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  No articles yet. Click "Add Article" to get started.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
